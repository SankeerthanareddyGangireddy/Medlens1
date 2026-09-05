import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { handleRouteError, jsonError } from "@/lib/api";
import { createPatientSchema } from "@/lib/schemas/api";
import { SourceType } from "@prisma/client";
import { writeAudit } from "@/lib/services/audit";

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim() ?? "";
    const patients = await prisma.patient.findMany({
      where: {
        ownerId: user.id,
        ...(q
          ? {
              OR: [
                { fullName: { contains: q, mode: "insensitive" } },
                { medicalRecordNumber: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: { updatedAt: "desc" },
      include: {
        _count: { select: { documents: true, tests: true, conflicts: true, clarifications: true } },
      },
    });
    return NextResponse.json({ patients });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const parsed = createPatientSchema.safeParse(await request.json());
    if (!parsed.success) return jsonError("Invalid patient information.", 400);
    const data = parsed.data;
    const patient = await prisma.patient.create({
      data: {
        ownerId: user.id,
        fullName: data.fullName,
        medicalRecordNumber: data.medicalRecordNumber,
        dateOfBirth: new Date(data.dateOfBirth),
        sex: data.sex,
        email: data.email || null,
        phone: data.phone || null,
        notes: data.notes || null,
        symptoms: {
          create: (data.symptoms ?? []).filter(Boolean).map((name) => ({
            name,
            sourceType: SourceType.USER_PROVIDED,
          })),
        },
        conditions: {
          create: (data.conditions ?? []).filter(Boolean).map((name) => ({
            name,
            sourceType: SourceType.USER_PROVIDED,
          })),
        },
        allergies: {
          create: (data.allergies ?? []).filter(Boolean).map((name) => ({
            name,
            sourceType: SourceType.USER_PROVIDED,
          })),
        },
        medications: {
          create: (data.medications ?? []).filter(Boolean).map((name) => ({
            name,
            sourceType: SourceType.USER_PROVIDED,
          })),
        },
      },
    });
    await writeAudit({
      patientId: patient.id,
      userId: user.id,
      action: "PATIENT_CREATED",
      details: "Patient record created",
    });
    return NextResponse.json({ patient });
  } catch (error) {
    return handleRouteError(error);
  }
}
