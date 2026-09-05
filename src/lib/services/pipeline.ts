import { Prisma, ProcessingStatus, SourceType, VerificationStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { parseNumeric } from "@/lib/utils";
import { getAIProvider, getAIProviderName } from "@/lib/services/ai";
import { writeAudit } from "@/lib/services/audit";
import { detectConflicts } from "@/lib/services/conflicts";
import { getOcrProvider } from "@/lib/services/ocr";
import { classifyLabStatus } from "@/lib/services/reference-range";
import { getStorageService } from "@/lib/services/storage";
import { calculateAge } from "@/lib/utils";
import { LOW_CONFIDENCE_THRESHOLD } from "@/lib/services/confidence";
import { normalizeStructuredReport } from "@/lib/schemas/extraction";

export async function processMedicalDocument(documentId: string, userId?: string | null) {
  const document = await prisma.medicalDocument.findUnique({
    where: { id: documentId },
    include: { patient: { include: { medications: true } } },
  });
  if (!document) throw new Error("DOCUMENT_NOT_FOUND");

  const run = await prisma.extractionRun.create({
    data: {
      patientId: document.patientId,
      documentId,
      provider: getAIProviderName(),
      status: "STARTED",
    },
  });

  const mark = async (status: ProcessingStatus, failedStep?: string, errorMessage?: string) => {
    await prisma.medicalDocument.update({
      where: { id: documentId },
      data: { processingStatus: status, failedStep, errorMessage },
    });
  };

  try {
    await mark("PROCESSING");
    const storage = getStorageService();
    const buffer = await storage.read(document.storedKey);

    await mark("EXTRACTING");
    const ocr = getOcrProvider();
    const extracted = await ocr.extractText({
      buffer,
      mimeType: document.mimeType,
      filename: document.filename,
    });

    await prisma.medicalDocument.update({
      where: { id: documentId },
      data: {
        extractedText: extracted.text,
        pageCount: extracted.pageCount,
      },
    });

    const ai = getAIProvider();
    const raw = await ai.extractMedicalReport({
      text: extracted.text,
      filename: document.filename,
      documentType: document.documentType,
      patientContext: {
        fullName: document.patient.fullName,
        age: calculateAge(document.patient.dateOfBirth),
        sex: document.patient.sex,
        medications: document.patient.medications.map((m) => m.name),
        conditions: [],
      },
    });
    const { report, rejectedFields } = normalizeStructuredReport(raw);

    await mark("VALIDATING");
    const reportDate = report.metadata.reportDate ? new Date(report.metadata.reportDate) : document.reportDate;

    await prisma.medicalDocument.update({
      where: { id: documentId },
      data: {
        documentType: report.metadata.documentType || document.documentType,
        reportDate: reportDate && !Number.isNaN(reportDate.getTime()) ? reportDate : document.reportDate,
        extractionConfidence: report.overallConfidence,
        pageCount: report.metadata.pageCount ?? extracted.pageCount,
      },
    });

    await prisma.medicalTest.deleteMany({ where: { documentId } });
    await prisma.observation.deleteMany({ where: { documentId } });
    await prisma.medicationRecord.deleteMany({ where: { documentId } });
    await prisma.conditionRecord.deleteMany({ where: { documentId } });

    for (const test of report.labTests) {
      const numericValue = parseNumeric(test.value ?? null);
      const labStatus = classifyLabStatus({
        value: numericValue,
        referenceLow: test.referenceLow ?? null,
        referenceHigh: test.referenceHigh ?? null,
      });
      const needsReview = Boolean(test.needsReview) || test.confidence < LOW_CONFIDENCE_THRESHOLD;
      await prisma.medicalTest.create({
        data: {
          patientId: document.patientId,
          documentId,
          testName: test.testName,
          value: test.value === null || test.value === undefined ? null : String(test.value),
          numericValue,
          unit: test.unit,
          referenceLow: test.referenceLow,
          referenceHigh: test.referenceHigh,
          referenceText: test.referenceText,
          observation: test.observation,
          reportDate: test.reportDate ? new Date(test.reportDate) : reportDate,
          sourcePage: test.sourcePage,
          sourceText: test.sourceText,
          confidence: test.confidence,
          sourceType: SourceType.REPORT_EXTRACTED,
          labStatus,
          verificationStatus: needsReview ? VerificationStatus.PENDING : VerificationStatus.PENDING,
          originalExtraction: test as object,
        },
      });
    }

    for (const obs of report.observations) {
      await prisma.observation.create({
        data: {
          patientId: document.patientId,
          documentId,
          category: obs.category,
          content: obs.content,
          sourcePage: obs.sourcePage,
          sourceText: obs.sourceText,
          confidence: obs.confidence,
          sourceType: SourceType.REPORT_EXTRACTED,
        },
      });
    }

    for (const med of report.medications) {
      await prisma.medicationRecord.create({
        data: {
          patientId: document.patientId,
          documentId,
          name: med.name,
          notes: med.notes,
          sourcePage: med.sourcePage,
          sourceText: med.sourceText,
          confidence: med.confidence,
          sourceType: SourceType.REPORT_EXTRACTED,
        },
      });
    }

    for (const condition of report.conditions) {
      await prisma.conditionRecord.create({
        data: {
          patientId: document.patientId,
          documentId,
          name: condition.name,
          notes: condition.notes,
          sourcePage: condition.sourcePage,
          sourceText: condition.sourceText,
          confidence: condition.confidence,
          sourceType: SourceType.REPORT_EXTRACTED,
        },
      });
    }

    const clarifications = await ai.generateClarifications({
      report,
      filename: document.filename,
    });
    for (const item of clarifications) {
      await prisma.clarification.create({
        data: {
          patientId: document.patientId,
          type: item.type,
          question: item.question,
          relatedField: item.relatedField,
        },
      });
    }
    if (rejectedFields.length) {
      await prisma.clarification.create({
        data: {
          patientId: document.patientId,
          type: "SCHEMA_NORMALIZATION",
          question: `Some extracted fields did not fully match the schema and were marked for review (${rejectedFields.length}).`,
          relatedField: rejectedFields.join(", "),
        },
      });
    }

    const tests = await prisma.medicalTest.findMany({
      where: { patientId: document.patientId },
      include: { document: true },
    });
    const reportMeds = await prisma.medicationRecord.findMany({
      where: { patientId: document.patientId },
    });
    const drafts = detectConflicts({
      patientAge: calculateAge(document.patient.dateOfBirth),
      reportAge: report.metadata.patientAge,
      userMedications: document.patient.medications.map((m) => m.name),
      reportMedications: reportMeds.map((m) => m.name),
      tests: tests.map((t) => ({
        testName: t.testName,
        value: t.value,
        unit: t.unit,
        reportDate: t.reportDate ? t.reportDate.toISOString().slice(0, 10) : null,
        documentId: t.documentId,
        filename: t.document.filename,
      })),
    });

    for (const draft of drafts) {
      const existing = await prisma.conflict.findFirst({
        where: {
          patientId: document.patientId,
          type: draft.type,
          status: "OPEN",
          description: draft.description,
        },
      });
      if (!existing) {
        await prisma.conflict.create({
          data: {
            patientId: document.patientId,
            type: draft.type,
            severity: draft.severity,
            description: draft.description,
            sourceA: draft.sourceA as unknown as Prisma.InputJsonValue,
            sourceB: draft.sourceB as unknown as Prisma.InputJsonValue,
          },
        });
      }
    }

    await prisma.timelineEvent.create({
      data: {
        patientId: document.patientId,
        documentId,
        title: `${document.filename} processed`,
        detail: `${report.labTests.length} laboratory values extracted`,
        occurredAt: new Date(),
      },
    });

    await mark("READY_FOR_REVIEW");
    await prisma.extractionRun.update({
      where: { id: run.id },
      data: { status: "COMPLETED", completedAt: new Date() },
    });
    await writeAudit({
      patientId: document.patientId,
      userId: userId ?? null,
      action: "EXTRACTION_COMPLETED",
      details: `Extraction completed for ${document.filename}`,
    });

    return prisma.medicalDocument.findUnique({
      where: { id: documentId },
      include: { tests: true },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "PROCESSING_FAILED";
    await mark("FAILED", "pipeline", "Unable to finish processing this document.");
    await prisma.extractionRun.update({
      where: { id: run.id },
      data: { status: "FAILED", failedStep: "pipeline", errorMessage: message, completedAt: new Date() },
    });
    throw error;
  }
}
