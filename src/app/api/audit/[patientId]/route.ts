import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireOwnedPatient, requireUser } from "@/lib/auth";
import { handleRouteError } from "@/lib/api";

export async function GET(_request: Request, { params }: { params: Promise<{ patientId: string }> }) {
  try {
    const user = await requireUser();
    const { patientId } = await params;
    await requireOwnedPatient(user.id, patientId);
    const logs = await prisma.auditLog.findMany({
      where: { patientId },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return NextResponse.json({ logs });
  } catch (error) {
    return handleRouteError(error);
  }
}
