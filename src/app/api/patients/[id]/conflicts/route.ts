import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireOwnedPatient, requireUser } from "@/lib/auth";
import { handleRouteError } from "@/lib/api";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    await requireOwnedPatient(user.id, id);
    const conflicts = await prisma.conflict.findMany({
      where: { patientId: id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ conflicts });
  } catch (error) {
    return handleRouteError(error);
  }
}
