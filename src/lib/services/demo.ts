import { SourceType, VerificationStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { ensureDemoUser } from "@/lib/users";
import { writeAudit } from "@/lib/services/audit";
import { getStorageService } from "@/lib/services/storage";
import { processMedicalDocument } from "@/lib/services/pipeline";
import { getAIProvider, getAIProviderName } from "@/lib/services/ai";
import { SAFETY_FOOTER } from "@/lib/services/ai/types";
import { calculateAge } from "@/lib/utils";

const DEMO_MRN = "ML-ANANYA-042";

const CBC_TEXT = `Northbridge Diagnostic Centre
CBC Report
Patient: Ananya Rao  Age: 42  Sex: Female  Date: 01 Sep 2026
Current medications: Atorvastatin 20 mg

Page 1
RBC 4.4 x10^6/uL (3.8–5.2)
Hematocrit 37.2 % (36–46)

Page 2
Hemoglobin 12.4 g/dL (Ref: 12–16 g/dL)
WBC 11.8 x10^3/uL (4.0–11.0)
Platelets 142 x10^3/uL (150–450)
`;

const METABOLIC_TEXT = `Northbridge Diagnostic Centre
Metabolic Panel
Patient: Ananya Rao  Date: 12 Jun 2026

Glucose (fasting) 108 mg/dL (70–99)
Creatinine 0.8 mg/dL (0.5–1.1)
ALT 22 U/L (7–35)
Sodium 139 mmol/L (136–145)
`;

const VITAMIN_TEXT = `Lakeside Pathology
Vitamin Panel
Patient: Ananya Rao  Date: 18 Mar 2026

25-OH Vitamin D 28 ng/mL (30–100)
Vitamin B12 412 pg/mL (200–900)
Folate 9.4 ng/mL
`;

const PREVIOUS_TEXT = `Northbridge Diagnostic Centre
Previous Laboratory Report
Patient: Ananya Rao  Age: 41  Date: 20 Jan 2026

Glucose 95 mg/dL (70–99)
Hemoglobin 12.8 g/dL (12–16)
`;

const MARCH_GLUCOSE_TEXT = `Lakeside Pathology
Laboratory report
Patient: Ananya Rao  Date: 18 Mar 2026
Glucose 102 mg/dL (70–99)
`;

export async function loadDemoPatient(userId?: string) {
  const user = userId ? await prisma.user.findUnique({ where: { id: userId } }) : await ensureDemoUser();
  if (!user) throw new Error("USER_NOT_FOUND");

  const existing = await prisma.patient.findUnique({ where: { medicalRecordNumber: DEMO_MRN } });
  if (existing && existing.ownerId === user.id) {
    return existing;
  }
  if (existing && existing.ownerId !== user.id) {
    await prisma.patient.delete({ where: { id: existing.id } });
  }

  const patient = await prisma.patient.create({
    data: {
      ownerId: user.id,
      medicalRecordNumber: DEMO_MRN,
      fullName: "Ananya Rao",
      dateOfBirth: new Date("1984-03-14"),
      sex: "Female",
      email: "ananya.rao.demo@example.com",
      phone: "+91 90000 00018",
      notes: "Synthetic demo record for hackathon walkthrough. Not a real patient.",
      isDemo: true,
      symptoms: {
        create: [
          { name: "Occasional fatigue", notes: "Patient-reported during intake", sourceType: SourceType.USER_PROVIDED },
        ],
      },
      conditions: {
        create: [
          { name: "Seasonal allergic rhinitis", sourceType: SourceType.USER_PROVIDED },
        ],
      },
      allergies: {
        create: [{ name: "Penicillin", notes: "Rash, per patient report", sourceType: SourceType.USER_PROVIDED }],
      },
      medications: {
        create: [
          { name: "Medicine A", notes: "Patient-provided current medication name", sourceType: SourceType.USER_PROVIDED },
        ],
      },
    },
  });

  const storage = getStorageService();
  const files = [
    { filename: "CBC_Report.pdf", type: "CBC Report", text: CBC_TEXT, date: new Date("2026-09-01") },
    { filename: "Metabolic_Panel.pdf", type: "Metabolic Panel", text: METABOLIC_TEXT, date: new Date("2026-06-12") },
    { filename: "Vitamin_Panel.pdf", type: "Vitamin Panel", text: VITAMIN_TEXT, date: new Date("2026-03-18") },
    { filename: "Previous_Laboratory_Report.pdf", type: "Previous Laboratory Report", text: PREVIOUS_TEXT, date: new Date("2026-01-20") },
    { filename: "March_Laboratory_Report.pdf", type: "Laboratory report", text: MARCH_GLUCOSE_TEXT, date: new Date("2026-03-18") },
  ];

  for (const file of files) {
    const stored = await storage.save({
      filename: file.filename,
      buffer: Buffer.from(file.text, "utf8"),
      mimeType: "text/plain",
    });
    const document = await prisma.medicalDocument.create({
      data: {
        patientId: patient.id,
        filename: file.filename,
        storedKey: stored.key,
        mimeType: "text/plain",
        sizeBytes: Buffer.byteLength(file.text),
        documentType: file.type,
        reportDate: file.date,
        source: "DEMO",
        processingStatus: "UPLOADED",
        extractedText: file.text,
      },
    });
    await writeAudit({
      patientId: patient.id,
      userId: user.id,
      action: "REPORT_UPLOADED",
      details: `${file.filename} uploaded`,
    });
    await prisma.timelineEvent.create({
      data: {
        patientId: patient.id,
        documentId: document.id,
        title: `${file.type} uploaded`,
        detail: file.filename,
        occurredAt: file.date,
      },
    });
    await processMedicalDocument(document.id, user.id);
  }

  const tests = await prisma.medicalTest.findMany({
    where: { patientId: patient.id },
    include: { document: true },
  });
  const highConfidence = tests.filter((t) => t.confidence >= 0.7 && t.testName !== "Folate");
  await prisma.medicalTest.updateMany({
    where: { id: { in: highConfidence.map((t) => t.id) } },
    data: { verificationStatus: VerificationStatus.VERIFIED, sourceType: SourceType.USER_VERIFIED },
  });
  await writeAudit({
    patientId: patient.id,
    userId: user.id,
    action: "FIELD_VERIFIED",
    details: `${highConfidence.length} values verified`,
  });
  await prisma.timelineEvent.create({
    data: {
      patientId: patient.id,
      title: `${highConfidence.length} values verified`,
      occurredAt: new Date("2026-09-02T10:00:00Z"),
    },
  });

  const folate = tests.find((t) => t.testName === "Folate");
  if (folate) {
    await prisma.medicalTest.update({
      where: { id: folate.id },
      data: { verificationStatus: VerificationStatus.PENDING, confidence: 0.42 },
    });
  }

  const ai = getAIProvider();
  const content = await ai.generateSummary({
    patientName: patient.fullName,
    age: calculateAge(patient.dateOfBirth),
    sex: patient.sex,
    userProvided: {
      symptoms: ["Occasional fatigue"],
      conditions: ["Seasonal allergic rhinitis"],
      allergies: ["Penicillin"],
      medications: ["Medicine A"],
      notes: patient.notes,
    },
    tests: tests.map((t) => ({
      testName: t.testName,
      value: t.value,
      unit: t.unit,
      referenceText: t.referenceText,
      labStatus: t.labStatus,
      reportDate: t.reportDate ? t.reportDate.toISOString().slice(0, 10) : null,
      sourceFilename: t.document.filename,
      verified: t.testName !== "Folate",
      confidence: t.confidence,
    })),
    documentIds: files.map(() => patient.id),
  });

  const docs = await prisma.medicalDocument.findMany({ where: { patientId: patient.id } });
  await prisma.aISummary.create({
    data: {
      patientId: patient.id,
      content: content.includes(SAFETY_FOOTER) ? content : `${content}\n\n${SAFETY_FOOTER}`,
      model: process.env.OPENAI_MODEL || "mock-extractor",
      provider: getAIProviderName(),
      version: 1,
      sourceDocumentIds: docs.map((d) => d.id),
    },
  });
  await writeAudit({
    patientId: patient.id,
    userId: user.id,
    action: "SUMMARY_GENERATED",
    details: "Demo AI summary generated",
  });
  await prisma.timelineEvent.create({
    data: {
      patientId: patient.id,
      title: "AI summary generated",
      detail: "Patient-friendly explanation of documented information",
      occurredAt: new Date("2026-09-02T11:00:00Z"),
    },
  });

  return prisma.patient.findUniqueOrThrow({ where: { id: patient.id } });
}
