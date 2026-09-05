import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { handleRouteError, jsonError } from "@/lib/api";
import { patchTestSchema } from "@/lib/schemas/api";
import { parseNumeric } from "@/lib/utils";
import { classifyLabStatus } from "@/lib/services/reference-range";
import { writeAudit } from "@/lib/services/audit";
import { SourceType, VerificationStatus } from "@prisma/client";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const test = await prisma.medicalTest.findUnique({ include: { patient: true }, where: { id } });
    if (!test || test.patient.ownerId !== user.id) return jsonError("You do not have access to this record.", 403);
    const parsed = patchTestSchema.safeParse(await request.json());
    if (!parsed.success) return jsonError("Invalid test update.", 400);
    const data = parsed.data;
    const nextValue = data.value !== undefined ? data.value : test.value;
    const numericValue = parseNumeric(nextValue);
    const referenceLow = data.referenceLow !== undefined ? data.referenceLow : test.referenceLow;
    const referenceHigh = data.referenceHigh !== undefined ? data.referenceHigh : test.referenceHigh;
    const updated = await prisma.medicalTest.update({
      where: { id },
      data: {
        testName: data.testName ?? test.testName,
        value: nextValue,
        numericValue,
        unit: data.unit !== undefined ? data.unit : test.unit,
        referenceLow,
        referenceHigh,
        referenceText: data.referenceText !== undefined ? data.referenceText : test.referenceText,
        observation: data.observation !== undefined ? data.observation : test.observation,
        reportDate: data.reportDate ? new Date(data.reportDate) : test.reportDate,
        correctedValue: nextValue,
        correctedById: user.id,
        verificationStatus: VerificationStatus.EDITED,
        sourceType: SourceType.USER_VERIFIED,
        labStatus: classifyLabStatus({ value: numericValue, referenceLow, referenceHigh }),
        originalExtraction: test.originalExtraction ?? {
          testName: test.testName,
          value: test.value,
          unit: test.unit,
          referenceLow: test.referenceLow,
          referenceHigh: test.referenceHigh,
        },
      },
    });
    await writeAudit({
      patientId: test.patientId,
      userId: user.id,
      action: "FIELD_EDITED",
      details: "A laboratory field was edited; original extraction was preserved.",
    });
    return NextResponse.json({ test: updated });
  } catch (error) {
    return handleRouteError(error);
  }
}
