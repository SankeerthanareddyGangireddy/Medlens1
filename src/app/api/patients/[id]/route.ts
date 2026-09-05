import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireOwnedPatient, requireUser } from "@/lib/auth";
import { handleRouteError, jsonError } from "@/lib/api";
import { updatePatientSchema } from "@/lib/schemas/api";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    await requireOwnedPatient(user.id, id);
    const patient = await prisma.patient.findUnique({
      where: { id },
      include: {
        symptoms: true,
        conditions: true,
        allergies: true,
        medications: true,
        documents: { orderBy: { createdAt: "desc" } },
        tests: { include: { document: true }, orderBy: { reportDate: "desc" } },
        conflicts: { orderBy: { createdAt: "desc" } },
        clarifications: { orderBy: { createdAt: "desc" } },
        summaries: { orderBy: { createdAt: "desc" }, take: 1 },
        auditLogs: { orderBy: { createdAt: "desc" }, take: 50 },
        timelineEvents: { orderBy: { occurredAt: "desc" } },
        observations: true,
        medicationRecords: true,
        conditionRecords: true,
      },
    });
    return NextResponse.json({ patient });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    await requireOwnedPatient(user.id, id);
    const parsed = updatePatientSchema.safeParse(await request.json());
    if (!parsed.success) return jsonError("Invalid patient update.", 400);
    const data = parsed.data;
    const patient = await prisma.patient.update({
      where: { id },
      data: {
        fullName: data.fullName,
        medicalRecordNumber: data.medicalRecordNumber,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
        sex: data.sex,
        email: data.email,
        phone: data.phone,
        notes: data.notes,
      },
    });
    return NextResponse.json({ patient });
  } catch (error) {
    return handleRouteError(error);
  }
}
