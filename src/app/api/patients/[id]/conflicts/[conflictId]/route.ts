import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireOwnedPatient, requireUser } from "@/lib/auth";
import { handleRouteError, jsonError } from "@/lib/api";
import { conflictActionSchema } from "@/lib/schemas/api";
import { writeAudit } from "@/lib/services/audit";

export async function POST(request: Request, { params }: { params: Promise<{ id: string; conflictId: string }> }) {
  try {
    const user = await requireUser();
    const { id, conflictId } = await params;
    await requireOwnedPatient(user.id, id);
    const parsed = conflictActionSchema.safeParse(await request.json());
    if (!parsed.success) return jsonError("Invalid conflict action.", 400);
    const conflict = await prisma.conflict.findFirst({ where: { id: conflictId, patientId: id } });
    if (!conflict) return jsonError("Conflict not found.", 404);
    const resolution =
      parsed.data.resolution ||
      (parsed.data.action === "KEEP_A"
        ? "Kept source A; no automatic clinical decision was made."
        : parsed.data.action === "KEEP_B"
          ? "Kept source B; no automatic clinical decision was made."
          : "Marked resolved after human review.");
    const updated = await prisma.conflict.update({
      where: { id: conflictId },
      data: { status: "RESOLVED", resolution },
    });
    await writeAudit({
      patientId: id,
      userId: user.id,
      action: "CONFLICT_RESOLVED",
      details: "Conflict marked resolved",
    });
    return NextResponse.json({ conflict: updated });
  } catch (error) {
    return handleRouteError(error);
  }
}
