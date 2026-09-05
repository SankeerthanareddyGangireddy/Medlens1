import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireOwnedPatient, requireUser } from "@/lib/auth";
import { handleRouteError, jsonError } from "@/lib/api";
import { formatReferenceRange } from "@/lib/services/reference-range";
import { writeAudit } from "@/lib/services/audit";

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get("patientId");
    if (!patientId) return jsonError("patientId is required.", 400);
    await requireOwnedPatient(user.id, patientId);
    const tests = await prisma.medicalTest.findMany({
      where: { patientId },
      include: { document: true },
      orderBy: { reportDate: "asc" },
    });
    const header = [
      "testName",
      "value",
      "unit",
      "referenceRange",
      "status",
      "reportDate",
      "source",
      "page",
      "verification",
      "confidence",
    ];
    const rows = tests.map((t) =>
      [
        t.testName,
        t.value ?? "",
        t.unit ?? "",
        formatReferenceRange(t),
        t.labStatus,
        t.reportDate ? t.reportDate.toISOString().slice(0, 10) : "",
        t.document.filename,
        t.sourcePage ?? "",
        t.verificationStatus,
        t.confidence,
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(","),
    );
    await writeAudit({
      patientId,
      userId: user.id,
      action: "EXPORT_GENERATED",
      details: "Lab results CSV exported",
    });
    return new NextResponse([header.join(","), ...rows].join("\n"), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": "attachment; filename=medlens-lab-results.csv",
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
