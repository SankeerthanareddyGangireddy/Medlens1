import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { prisma } from "@/lib/db";
import { requireOwnedPatient, requireUser } from "@/lib/auth";
import { handleRouteError, jsonError } from "@/lib/api";
import { calculateAge, formatDate } from "@/lib/utils";
import { formatReferenceRange } from "@/lib/services/reference-range";
import { writeAudit } from "@/lib/services/audit";
import { SAFETY_FOOTER } from "@/lib/services/ai/types";

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get("patientId");
    if (!patientId) return jsonError("patientId is required.", 400);
    await requireOwnedPatient(user.id, patientId);
    const patient = await prisma.patient.findUniqueOrThrow({
      where: { id: patientId },
      include: {
        conditions: true,
        allergies: true,
        medications: true,
        tests: { include: { document: true } },
        summaries: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });

    const pdf = await PDFDocument.create();
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
    let page = pdf.addPage([612, 792]);
    let y = 760;
    const draw = (text: string, size = 11, isBold = false) => {
      if (y < 48) {
        page = pdf.addPage([612, 792]);
        y = 760;
      }
      page.drawText(text.slice(0, 110), {
        x: 48,
        y,
        size,
        font: isBold ? bold : font,
        color: rgb(0.1, 0.14, 0.2),
      });
      y -= size + 8;
    };

    draw("MedLens Patient Summary", 18, true);
    draw("From medical documents to meaningful, traceable records.");
    y -= 6;
    draw(`${patient.fullName}  •  ${patient.medicalRecordNumber}`, 13, true);
    draw(`DOB ${formatDate(patient.dateOfBirth)}  •  Age ${calculateAge(patient.dateOfBirth)}  •  ${patient.sex}`);
    draw(`Conditions: ${patient.conditions.map((c) => c.name).join(", ") || "None documented"}`);
    draw(`Allergies: ${patient.allergies.map((c) => c.name).join(", ") || "None documented"}`);
    draw(`Medications: ${patient.medications.map((c) => c.name).join(", ") || "None documented"}`);
    y -= 4;
    draw("Laboratory results", 13, true);
    for (const t of patient.tests) {
      draw(
        `${t.testName}: ${t.value ?? "—"} ${t.unit ?? ""} | ${formatReferenceRange(t)} | ${t.labStatus} | ${t.document.filename} | ${t.verificationStatus}`,
        9,
      );
    }
    y -= 8;
    draw("AI summary", 13, true);
    const summary = patient.summaries[0]?.content ?? "No summary generated.";
    for (const line of summary.split(/\n+/)) {
      draw(line, 10);
    }
    y -= 10;
    draw(SAFETY_FOOTER, 9);

    const bytes = await pdf.save();
    await writeAudit({
      patientId,
      userId: user.id,
      action: "EXPORT_GENERATED",
      details: "Patient summary PDF exported",
    });
    return new NextResponse(Buffer.from(bytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=medlens-patient-summary.pdf",
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
