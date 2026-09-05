import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireOwnedPatient, requireUser } from "@/lib/auth";
import { handleRouteError, jsonError } from "@/lib/api";
import { getStorageService } from "@/lib/services/storage";
import { processMedicalDocument } from "@/lib/services/pipeline";
import { writeAudit } from "@/lib/services/audit";
import { sanitizeFilename } from "@/lib/utils";


export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    await requireOwnedPatient(user.id, id);
    const reports = await prisma.medicalDocument.findMany({
      where: { patientId: id },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { tests: true } } },
    });
    return NextResponse.json({ reports });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    await requireOwnedPatient(user.id, id);
    const form = await request.formData();
    const file = form.get("file");
    const documentType = String(form.get("documentType") || "Clinical document");
    if (!(file instanceof File)) return jsonError("A file is required.", 400);
    const mime = file.type || "application/octet-stream";
    const name = sanitizeFilename(file.name);
    const buffer = Buffer.from(await file.arrayBuffer());
    const stored = await getStorageService().save({ filename: name, buffer, mimeType: mime });
    const document = await prisma.medicalDocument.create({
      data: {
        patientId: id,
        filename: file.name,
        storedKey: stored.key,
        mimeType: mime,
        sizeBytes: file.size,
        documentType,
        source: "UPLOAD",
      },
    });
    await writeAudit({
      patientId: id,
      userId: user.id,
      action: "REPORT_UPLOADED",
      details: "Report uploaded",
    });
    const processed = await processMedicalDocument(document.id, user.id);
    return NextResponse.json({ document: processed });
  } catch (error) {
    console.error("Reports POST error:", error);
    return handleRouteError(error);
  }
}
