import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireOwnedPatient, requireUser } from "@/lib/auth";
import { handleRouteError, jsonError } from "@/lib/api";
import { getAIProvider, getAIProviderName } from "@/lib/services/ai";
import { calculateAge } from "@/lib/utils";
import { writeAudit } from "@/lib/services/audit";
import { SAFETY_FOOTER } from "@/lib/services/ai/types";

const schema = z.object({ patientId: z.string().min(1) });

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return jsonError("patientId is required.", 400);
    await requireOwnedPatient(user.id, parsed.data.patientId);
    const patient = await prisma.patient.findUniqueOrThrow({
      where: { id: parsed.data.patientId },
      include: {
        symptoms: true,
        conditions: true,
        allergies: true,
        medications: true,
        tests: { include: { document: true } },
        documents: true,
        summaries: { orderBy: { version: "desc" }, take: 1 },
      },
    });
    const ai = getAIProvider();
    const content = await ai.generateSummary({
      patientName: patient.fullName,
      age: calculateAge(patient.dateOfBirth),
      sex: patient.sex,
      userProvided: {
        symptoms: patient.symptoms.map((s) => s.name),
        conditions: patient.conditions.map((s) => s.name),
        allergies: patient.allergies.map((s) => s.name),
        medications: patient.medications.map((s) => s.name),
        notes: patient.notes,
      },
      tests: patient.tests.map((t) => ({
        testName: t.testName,
        value: t.value,
        unit: t.unit,
        referenceText: t.referenceText,
        labStatus: t.labStatus,
        reportDate: t.reportDate ? t.reportDate.toISOString().slice(0, 10) : null,
        sourceFilename: t.document.filename,
        verified: t.verificationStatus === "VERIFIED" || t.verificationStatus === "EDITED",
        confidence: t.confidence,
      })),
      documentIds: patient.documents.map((d) => d.id),
    });
    const version = (patient.summaries[0]?.version ?? 0) + 1;
    const summary = await prisma.aISummary.create({
      data: {
        patientId: patient.id,
        content: content.includes("does not provide medical diagnosis") ? content : `${content}\n\n${SAFETY_FOOTER}`,
        model: process.env.OPENAI_MODEL || "mock-extractor",
        provider: getAIProviderName(),
        version,
        sourceDocumentIds: patient.documents.map((d) => d.id),
      },
    });
    await writeAudit({
      patientId: patient.id,
      userId: user.id,
      action: "SUMMARY_GENERATED",
      details: "AI summary generated",
    });
    await prisma.timelineEvent.create({
      data: {
        patientId: patient.id,
        title: "AI summary generated",
        occurredAt: new Date(),
      },
    });
    return NextResponse.json({ summary });
  } catch (error) {
    return handleRouteError(error);
  }
}
