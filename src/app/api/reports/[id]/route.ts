import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { handleRouteError, jsonError } from "@/lib/api";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const document = await prisma.medicalDocument.findUnique({
      where: { id },
      include: { patient: true, tests: true },
    });
    if (!document || document.patient.ownerId !== user.id) {
      return jsonError("You do not have access to this record.", 403);
    }
    return NextResponse.json({
      document: {
        id: document.id,
        filename: document.filename,
        documentType: document.documentType,
        processingStatus: document.processingStatus,
        extractedText: document.extractedText,
        pageCount: document.pageCount,
        extractionConfidence: document.extractionConfidence,
        reportDate: document.reportDate,
        tests: document.tests,
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
