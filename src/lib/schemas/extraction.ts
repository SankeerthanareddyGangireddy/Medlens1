import { z } from "zod";

export const labResultSchema = z.object({
  testName: z.string().min(1),
  value: z.union([z.number(), z.string(), z.null()]).optional().default(null),
  unit: z.string().nullable().optional().default(null),
  referenceLow: z.number().nullable().optional().default(null),
  referenceHigh: z.number().nullable().optional().default(null),
  referenceText: z.string().nullable().optional().default(null),
  observation: z.string().nullable().optional().default(null),
  reportDate: z.string().nullable().optional().default(null),
  sourcePage: z.number().int().nullable().optional().default(null),
  sourceText: z.string().nullable().optional().default(null),
  confidence: z.number().min(0).max(1),
  sourceType: z.literal("REPORT_EXTRACTED").default("REPORT_EXTRACTED"),
  needsReview: z.boolean().optional().default(false),
});

export const observationSchema = z.object({
  category: z.string().min(1),
  content: z.string().min(1),
  sourcePage: z.number().int().nullable().optional().default(null),
  sourceText: z.string().nullable().optional().default(null),
  confidence: z.number().min(0).max(1).default(0.8),
});

export const namedRecordSchema = z.object({
  name: z.string().min(1),
  notes: z.string().nullable().optional().default(null),
  sourcePage: z.number().int().nullable().optional().default(null),
  sourceText: z.string().nullable().optional().default(null),
  confidence: z.number().min(0).max(1).default(0.8),
});

export const vitalSchema = z.object({
  name: z.string().min(1),
  value: z.union([z.number(), z.string(), z.null()]).optional().default(null),
  unit: z.string().nullable().optional().default(null),
  sourcePage: z.number().int().nullable().optional().default(null),
  sourceText: z.string().nullable().optional().default(null),
  confidence: z.number().min(0).max(1).default(0.8),
});

export const imagingFindingSchema = z.object({
  finding: z.string().min(1),
  location: z.string().nullable().optional().default(null),
  sourcePage: z.number().int().nullable().optional().default(null),
  sourceText: z.string().nullable().optional().default(null),
  confidence: z.number().min(0).max(1).default(0.8),
});

export const reportMetadataSchema = z.object({
  documentType: z.string().nullable().optional().default(null),
  reportDate: z.string().nullable().optional().default(null),
  facility: z.string().nullable().optional().default(null),
  patientName: z.string().nullable().optional().default(null),
  patientAge: z.number().nullable().optional().default(null),
  patientSex: z.string().nullable().optional().default(null),
  pageCount: z.number().int().nullable().optional().default(null),
});

export const defaultReportMetadata = {
  documentType: null,
  reportDate: null,
  facility: null,
  patientName: null,
  patientAge: null,
  patientSex: null,
  pageCount: null,
};

export const structuredMedicalReportSchema = z.object({
  metadata: reportMetadataSchema.default(defaultReportMetadata),
  labTests: z.array(labResultSchema).default([]),
  observations: z.array(observationSchema).default([]),
  medications: z.array(namedRecordSchema).default([]),
  conditions: z.array(namedRecordSchema).default([]),
  symptoms: z.array(namedRecordSchema).default([]),
  vitals: z.array(vitalSchema).default([]),
  imagingFindings: z.array(imagingFindingSchema).default([]),
  clinicalNotes: z.array(z.string()).default([]),
  overallConfidence: z.number().min(0).max(1).default(0.8),
});

export type LabResultExtraction = z.infer<typeof labResultSchema>;
export type StructuredMedicalReport = z.infer<typeof structuredMedicalReportSchema>;

export function normalizeStructuredReport(raw: unknown): {
  report: StructuredMedicalReport;
  rejectedFields: string[];
} {
  const rejectedFields: string[] = [];
  if (!raw || typeof raw !== "object") {
    return {
      report: structuredMedicalReportSchema.parse({}),
      rejectedFields: ["root"],
    };
  }

  const candidate = raw as Record<string, unknown>;
  const labTestsIn = Array.isArray(candidate.labTests) ? candidate.labTests : [];
  const labTests: LabResultExtraction[] = [];

  labTestsIn.forEach((item, index) => {
    const parsed = labResultSchema.safeParse(item);
    if (parsed.success) {
      labTests.push(parsed.data);
      return;
    }
    const asObj = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
    const rescued = labResultSchema.safeParse({
      testName: typeof asObj.testName === "string" ? asObj.testName : `Unknown test ${index + 1}`,
      value: asObj.value ?? null,
      unit: asObj.unit ?? null,
      referenceLow: typeof asObj.referenceLow === "number" ? asObj.referenceLow : null,
      referenceHigh: typeof asObj.referenceHigh === "number" ? asObj.referenceHigh : null,
      referenceText: typeof asObj.referenceText === "string" ? asObj.referenceText : null,
      observation: typeof asObj.observation === "string" ? asObj.observation : null,
      reportDate: typeof asObj.reportDate === "string" ? asObj.reportDate : null,
      sourcePage: typeof asObj.sourcePage === "number" ? asObj.sourcePage : null,
      sourceText: typeof asObj.sourceText === "string" ? asObj.sourceText : null,
      confidence: typeof asObj.confidence === "number" ? Math.min(1, Math.max(0, asObj.confidence)) : 0.4,
      needsReview: true,
    });
    if (rescued.success) {
      labTests.push({ ...rescued.data, needsReview: true });
      rejectedFields.push(`labTests[${index}]`);
    } else {
      rejectedFields.push(`labTests[${index}]`);
    }
  });

  const report = structuredMedicalReportSchema.parse({
    ...candidate,
    labTests,
  });

  return { report, rejectedFields };
}
