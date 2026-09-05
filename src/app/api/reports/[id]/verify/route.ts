import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { handleRouteError, jsonError } from "@/lib/api";
import { writeAudit } from "@/lib/services/audit";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const document = await prisma.medicalDocument.findUnique({ include: { patient: true, tests: true }, where: { id } });
    if (!document || document.patient.ownerId !== user.id) return jsonError("You do not have access to this record.", 403);
    const pending = document.tests.filter((t) => t.verificationStatus === "PENDING" || t.verificationStatus === "FLAGGED");
    if (pending.length) return jsonError("Some fields require manual verification.", 400);
    const updated = await prisma.medicalDocument.update({
      where: { id },
      data: { processingStatus: "VERIFIED" },
    });
    await writeAudit({
      patientId: document.patientId,
      userId: user.id,
      action: "REPORT_VERIFIED",
      details: "Report marked verified",
    });
    return NextResponse.json({ document: updated });
  } catch (error) {
    return handleRouteError(error);
  }
}
