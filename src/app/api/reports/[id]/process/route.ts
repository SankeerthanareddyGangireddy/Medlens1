import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { handleRouteError, jsonError } from "@/lib/api";
import { processMedicalDocument } from "@/lib/services/pipeline";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const document = await prisma.medicalDocument.findUnique({ include: { patient: true }, where: { id } });
    if (!document || document.patient.ownerId !== user.id) return jsonError("You do not have access to this record.", 403);
    const processed = await processMedicalDocument(id, user.id);
    return NextResponse.json({ document: processed });
  } catch (error) {
    return handleRouteError(error);
  }
}
