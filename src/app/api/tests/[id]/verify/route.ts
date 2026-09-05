import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { handleRouteError, jsonError } from "@/lib/api";
import { writeAudit } from "@/lib/services/audit";
import { SourceType, VerificationStatus } from "@prisma/client";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const body = (await request.json().catch(() => ({}))) as { action?: "VERIFY" | "FLAG" | "REVERT" };
    const test = await prisma.medicalTest.findUnique({ include: { patient: true }, where: { id } });
    if (!test || test.patient.ownerId !== user.id) return jsonError("You do not have access to this record.", 403);

    if (body.action === "FLAG") {
      const updated = await prisma.medicalTest.update({
        where: { id },
        data: { verificationStatus: VerificationStatus.FLAGGED },
      });
      await writeAudit({
        patientId: test.patientId,
        userId: user.id,
        action: "FIELD_FLAGGED",
        details: "A laboratory field was flagged for follow-up",
      });
      return NextResponse.json({ test: updated });
    }

    if (body.action === "REVERT") {
      const original = (test.originalExtraction ?? null) as Record<string, unknown> | null;
      const updated = await prisma.medicalTest.update({
        where: { id },
        data: {
          testName: typeof original?.testName === "string" ? original.testName : test.testName,
          value: original?.value != null ? String(original.value) : test.value,
          unit: typeof original?.unit === "string" ? original.unit : test.unit,
          verificationStatus: VerificationStatus.PENDING,
          sourceType: SourceType.REPORT_EXTRACTED,
          correctedValue: null,
        },
      });
      await writeAudit({
        patientId: test.patientId,
        userId: user.id,
        action: "FIELD_REVERTED",
        details: "A laboratory field was reverted to original extraction",
      });
      return NextResponse.json({ test: updated });
    }

    const updated = await prisma.medicalTest.update({
      where: { id },
      data: {
        verificationStatus: VerificationStatus.VERIFIED,
        sourceType: SourceType.USER_VERIFIED,
      },
    });
    await writeAudit({
      patientId: test.patientId,
      userId: user.id,
      action: "FIELD_VERIFIED",
      details: "A laboratory field was verified",
    });
    return NextResponse.json({ test: updated });
  } catch (error) {
    return handleRouteError(error);
  }
}
