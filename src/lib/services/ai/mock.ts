import type { StructuredMedicalReport } from "@/lib/schemas/extraction";
import { structuredMedicalReportSchema } from "@/lib/schemas/extraction";
import type {
  AIProvider,
  ExtractMedicalReportInput,
  GenerateSummaryInput,
  GeneratedClarification,
} from "@/lib/services/ai/types";
import { SAFETY_FOOTER } from "@/lib/services/ai/types";

function byFilename(filename: string): StructuredMedicalReport | null {
  const lower = filename.toLowerCase();
  if (lower.includes("cbc")) return cbcReport();
  if (lower.includes("metabolic") || lower.includes("cmp") || lower.includes("bmp")) {
    return metabolicReport();
  }
  if (lower.includes("vitamin")) return vitaminReport();
  if (lower.includes("previous") || lower.includes("historical") || lower.includes("june")) {
    return previousLabReport();
  }
  return null;
}

function fromTextHints(text: string): StructuredMedicalReport {
  const lower = text.toLowerCase();
  if (
    lower.includes("hemoglobin") ||
    lower.includes("wbc") ||
    lower.includes("platelet") ||
    lower.includes("cbc") ||
    lower.includes("blood") ||
    lower.includes("hematology")
  ) {
    return cbcReport();
  }
  if (
    lower.includes("glucose") ||
    lower.includes("creatinine") ||
    lower.includes("metabolic") ||
    lower.includes("sugar") ||
    lower.includes("alt") ||
    lower.includes("ast") ||
    lower.includes("lipid") ||
    lower.includes("cholesterol")
  ) {
    return metabolicReport();
  }
  if (
    lower.includes("vitamin") ||
    lower.includes("b12") ||
    lower.includes("folate") ||
    lower.includes("iron") ||
    lower.includes("ferritin")
  ) {
    return vitaminReport();
  }
  if (lower.includes("historical") || lower.includes("june 2026") || lower.includes("previous")) {
    return previousLabReport();
  }
  return genericReport(text);
}

function cbcReport(): StructuredMedicalReport {
  return structuredMedicalReportSchema.parse({
    metadata: {
      documentType: "CBC Report",
      reportDate: "2026-09-01",
      facility: "Northbridge Diagnostic Centre",
      patientName: "Ananya Rao",
      patientAge: 42,
      patientSex: "Female",
      pageCount: 2,
    },
    labTests: [
      {
        testName: "Hemoglobin",
        value: 12.4,
        unit: "g/dL",
        referenceLow: 12,
        referenceHigh: 16,
        referenceText: "12–16 g/dL",
        observation: null,
        reportDate: "2026-09-01",
        sourcePage: 2,
        sourceText: "Hemoglobin 12.4 g/dL (Ref: 12–16 g/dL)",
        confidence: 0.97,
        sourceType: "REPORT_EXTRACTED",
      },
      {
        testName: "WBC",
        value: 11.8,
        unit: "10^3/uL",
        referenceLow: 4.0,
        referenceHigh: 11.0,
        referenceText: "4.0–11.0 10^3/uL",
        observation: "Above the reference range printed on the report.",
        reportDate: "2026-09-01",
        sourcePage: 2,
        sourceText: "WBC 11.8 x10^3/uL (4.0–11.0)",
        confidence: 0.94,
        sourceType: "REPORT_EXTRACTED",
      },
      {
        testName: "Platelets",
        value: 142,
        unit: "10^3/uL",
        referenceLow: 150,
        referenceHigh: 450,
        referenceText: "150–450 10^3/uL",
        observation: "Below the reference range printed on the report.",
        reportDate: "2026-09-01",
        sourcePage: 2,
        sourceText: "Platelets 142 x10^3/uL (150–450)",
        confidence: 0.93,
        sourceType: "REPORT_EXTRACTED",
      },
      {
        testName: "RBC",
        value: 4.4,
        unit: "10^6/uL",
        referenceLow: 3.8,
        referenceHigh: 5.2,
        referenceText: "3.8–5.2 10^6/uL",
        observation: null,
        reportDate: "2026-09-01",
        sourcePage: 1,
        sourceText: "RBC 4.4 x10^6/uL (3.8–5.2)",
        confidence: 0.91,
        sourceType: "REPORT_EXTRACTED",
      },
      {
        testName: "Hematocrit",
        value: 37.2,
        unit: "%",
        referenceLow: 36,
        referenceHigh: 46,
        referenceText: "36–46 %",
        observation: null,
        reportDate: "2026-09-01",
        sourcePage: 1,
        sourceText: "Hematocrit 37.2 % (36–46)",
        confidence: 0.9,
        sourceType: "REPORT_EXTRACTED",
      },
    ],
    medications: [
      {
        name: "Atorvastatin",
        notes: "Listed under current medications on the report header.",
        sourcePage: 1,
        sourceText: "Current medications: Atorvastatin 20 mg",
        confidence: 0.88,
      },
    ],
    clinicalNotes: ["CBC panel documented at Northbridge Diagnostic Centre."],
    overallConfidence: 0.93,
  });
}

function metabolicReport(): StructuredMedicalReport {
  return structuredMedicalReportSchema.parse({
    metadata: {
      documentType: "Metabolic Panel",
      reportDate: "2026-06-12",
      facility: "Northbridge Diagnostic Centre",
      patientName: "Ananya Rao",
      patientAge: 42,
      patientSex: "Female",
      pageCount: 2,
    },
    labTests: [
      {
        testName: "Glucose",
        value: 108,
        unit: "mg/dL",
        referenceLow: 70,
        referenceHigh: 99,
        referenceText: "70–99 mg/dL",
        observation: "Above the reference range printed on the report.",
        reportDate: "2026-06-12",
        sourcePage: 1,
        sourceText: "Glucose (fasting) 108 mg/dL (70–99)",
        confidence: 0.95,
        sourceType: "REPORT_EXTRACTED",
      },
      {
        testName: "Creatinine",
        value: 0.8,
        unit: "mg/dL",
        referenceLow: 0.5,
        referenceHigh: 1.1,
        referenceText: "0.5–1.1 mg/dL",
        observation: null,
        reportDate: "2026-06-12",
        sourcePage: 1,
        sourceText: "Creatinine 0.8 mg/dL (0.5–1.1)",
        confidence: 0.92,
        sourceType: "REPORT_EXTRACTED",
      },
      {
        testName: "ALT",
        value: 22,
        unit: "U/L",
        referenceLow: 7,
        referenceHigh: 35,
        referenceText: "7–35 U/L",
        observation: null,
        reportDate: "2026-06-12",
        sourcePage: 1,
        sourceText: "ALT 22 U/L (7–35)",
        confidence: 0.9,
        sourceType: "REPORT_EXTRACTED",
      },
      {
        testName: "Sodium",
        value: 139,
        unit: "mmol/L",
        referenceLow: 136,
        referenceHigh: 145,
        referenceText: "136–145 mmol/L",
        observation: null,
        reportDate: "2026-06-12",
        sourcePage: 2,
        sourceText: "Sodium 139 mmol/L (136–145)",
        confidence: 0.91,
        sourceType: "REPORT_EXTRACTED",
      },
    ],
    overallConfidence: 0.92,
  });
}

function vitaminReport(): StructuredMedicalReport {
  return structuredMedicalReportSchema.parse({
    metadata: {
      documentType: "Vitamin Panel",
      reportDate: "2026-03-18",
      facility: "Lakeside Pathology",
      patientName: "Ananya Rao",
      patientAge: 42,
      patientSex: "Female",
      pageCount: 1,
    },
    labTests: [
      {
        testName: "Vitamin D (25-OH)",
        value: 28,
        unit: "ng/mL",
        referenceLow: 30,
        referenceHigh: 100,
        referenceText: "30–100 ng/mL",
        observation: "Below the reference range printed on the report.",
        reportDate: "2026-03-18",
        sourcePage: 1,
        sourceText: "25-OH Vitamin D 28 ng/mL (30–100)",
        confidence: 0.89,
        sourceType: "REPORT_EXTRACTED",
      },
      {
        testName: "Vitamin B12",
        value: 412,
        unit: "pg/mL",
        referenceLow: 200,
        referenceHigh: 900,
        referenceText: "200–900 pg/mL",
        observation: null,
        reportDate: "2026-03-18",
        sourcePage: 1,
        sourceText: "Vitamin B12 412 pg/mL (200–900)",
        confidence: 0.86,
        sourceType: "REPORT_EXTRACTED",
      },
      {
        testName: "Folate",
        value: 9.4,
        unit: "ng/mL",
        referenceLow: null,
        referenceHigh: null,
        referenceText: null,
        observation: "No reference range was printed for this test.",
        reportDate: "2026-03-18",
        sourcePage: 1,
        sourceText: "Folate 9.4 ng/mL",
        confidence: 0.42,
        sourceType: "REPORT_EXTRACTED",
        needsReview: true,
      },
    ],
    overallConfidence: 0.72,
  });
}

function previousLabReport(): StructuredMedicalReport {
  return structuredMedicalReportSchema.parse({
    metadata: {
      documentType: "Previous Laboratory Report",
      reportDate: "2026-01-20",
      facility: "Northbridge Diagnostic Centre",
      patientName: "Ananya Rao",
      patientAge: 41,
      patientSex: "Female",
      pageCount: 2,
    },
    labTests: [
      {
        testName: "Glucose",
        value: 95,
        unit: "mg/dL",
        referenceLow: 70,
        referenceHigh: 99,
        referenceText: "70–99 mg/dL",
        observation: null,
        reportDate: "2026-01-20",
        sourcePage: 1,
        sourceText: "Glucose 95 mg/dL (70–99)",
        confidence: 0.94,
        sourceType: "REPORT_EXTRACTED",
      },
      {
        testName: "Hemoglobin",
        value: 12.8,
        unit: "g/dL",
        referenceLow: 12,
        referenceHigh: 16,
        referenceText: "12–16 g/dL",
        observation: null,
        reportDate: "2026-01-20",
        sourcePage: 1,
        sourceText: "Hemoglobin 12.8 g/dL (12–16)",
        confidence: 0.93,
        sourceType: "REPORT_EXTRACTED",
      },
    ],
    overallConfidence: 0.93,
  });
}

function parseLabTestsFromText(text: string) {
  const tests: any[] = [];
  const lines = text.split(/[\r\n]+/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length < 3) continue;
    const match = trimmed.match(
      /^([A-Za-z0-9\s\(\)\-\/\+]+?)[:\s\t]+([0-9]+(?:\.[0-9]+)?)\s*([a-zA-Z%\/\^0-9\-_]+)?(?:\s*[\(\[]?([0-9]+(?:\.[0-9]+)?)\s*[-–—to]\s*([0-9]+(?:\.[0-9]+)?)[\]\)]?)?/
    );
    if (match && match[1] && match[2]) {
      const name = match[1].trim();
      const num = parseFloat(match[2]);
      if (
        name.length > 1 &&
        !/^(page|date|patient|id|mrn|name|age|sex|doctor|hospital|centre|center|report|time)$/i.test(name)
      ) {
        tests.push({
          testName: name,
          value: num,
          unit: match[3] || null,
          referenceLow: match[4] ? parseFloat(match[4]) : null,
          referenceHigh: match[5] ? parseFloat(match[5]) : null,
          referenceText: match[4] && match[5] ? `${match[4]}–${match[5]}` : null,
          observation: null,
          reportDate: null,
          sourcePage: 1,
          sourceText: trimmed,
          confidence: 0.85,
          sourceType: "REPORT_EXTRACTED",
        });
      }
    }
  }
  return tests;
}

function genericReport(text: string): StructuredMedicalReport {
  const snippet = text.slice(0, 180).replace(/\s+/g, " ");
  const parsedTests = parseLabTestsFromText(text);

  const labTests =
    parsedTests.length > 0
      ? parsedTests
      : [
          {
            testName: "Hemoglobin",
            value: 13.1,
            unit: "g/dL",
            referenceLow: 12,
            referenceHigh: 16,
            referenceText: "12–16 g/dL",
            observation: null,
            reportDate: null,
            sourcePage: 1,
            sourceText: snippet || "Hemoglobin 13.1 g/dL",
            confidence: 0.88,
            sourceType: "REPORT_EXTRACTED",
          },
          {
            testName: "WBC",
            value: 7.4,
            unit: "x10^3/uL",
            referenceLow: 4.0,
            referenceHigh: 11.0,
            referenceText: "4.0–11.0 x10^3/uL",
            observation: null,
            reportDate: null,
            sourcePage: 1,
            sourceText: snippet || "WBC 7.4 x10^3/uL",
            confidence: 0.86,
            sourceType: "REPORT_EXTRACTED",
          },
          {
            testName: "Platelets",
            value: 245,
            unit: "x10^3/uL",
            referenceLow: 150,
            referenceHigh: 450,
            referenceText: "150–450 x10^3/uL",
            observation: null,
            reportDate: null,
            sourcePage: 1,
            sourceText: snippet || "Platelets 245 x10^3/uL",
            confidence: 0.84,
            sourceType: "REPORT_EXTRACTED",
          },
        ];

  return structuredMedicalReportSchema.parse({
    metadata: {
      documentType: "Clinical Laboratory Report",
      reportDate: new Date().toISOString().slice(0, 10),
      pageCount: 1,
    },
    labTests,
    observations: snippet
      ? [
          {
            category: "Extracted text",
            content: snippet,
            sourcePage: 1,
            sourceText: snippet,
            confidence: 0.82,
          },
        ]
      : [],
    clinicalNotes: ["Laboratory results extracted successfully from image document."],
    overallConfidence: 0.85,
  });
}

function marchGlucose(): StructuredMedicalReport {
  return structuredMedicalReportSchema.parse({
    metadata: {
      documentType: "Laboratory report",
      reportDate: "2026-03-18",
      pageCount: 1,
    },
    labTests: [
      {
        testName: "Glucose",
        value: 102,
        unit: "mg/dL",
        referenceLow: 70,
        referenceHigh: 99,
        referenceText: "70–99 mg/dL",
        observation: "Above the reference range printed on the report.",
        reportDate: "2026-03-18",
        sourcePage: 1,
        sourceText: "Glucose 102 mg/dL (70–99)",
        confidence: 0.9,
        sourceType: "REPORT_EXTRACTED",
      },
    ],
    overallConfidence: 0.9,
  });
}

export class MockAIProvider implements AIProvider {
  async extractMedicalReport(input: ExtractMedicalReportInput): Promise<StructuredMedicalReport> {
    const named = byFilename(input.filename);
    if (named) return named;
    if (input.text.toLowerCase().includes("glucose 102")) return marchGlucose();
    return fromTextHints(input.text);
  }

  async generateSummary(input: GenerateSummaryInput): Promise<string> {
    const verified = input.tests.filter((t) => t.verified);
    const notable = verified.filter((t) => t.labStatus === "HIGH" || t.labStatus === "LOW");
    const missingRange = verified.filter((t) => t.labStatus === "NOT_ASSESSED");
    const uncertain = input.tests.filter((t) => t.confidence < 0.7);

    const lines: string[] = [];
    lines.push(
      `The uploaded reports contain documented laboratory and clinical information for ${input.patientName}, recorded as a ${input.age}-year-old ${input.sex.toLowerCase()}.`,
    );

    if (input.userProvided.conditions.length) {
      lines.push(
        `Patient-provided records list the following documented conditions: ${input.userProvided.conditions.join(", ")}.`,
      );
    }
    if (input.userProvided.medications.length) {
      lines.push(
        `Patient-provided medication names on file: ${input.userProvided.medications.join(", ")}.`,
      );
    }
    if (input.userProvided.allergies.length) {
      lines.push(`Patient-provided allergy information: ${input.userProvided.allergies.join(", ")}.`);
    }

    if (verified.length) {
      lines.push(
        `The reports record ${verified.length} verified laboratory value${verified.length === 1 ? "" : "s"}.`,
      );
    }

    for (const test of notable.slice(0, 6)) {
      const range = test.referenceText ?? "the reference interval printed on the report";
      const direction = test.labStatus === "HIGH" ? "above" : "below";
      lines.push(
        `The report records ${test.testName} as ${test.value ?? "—"} ${test.unit ?? ""}. This value is ${direction} ${range}. Source: ${test.sourceFilename}.`,
      );
    }

    if (missingRange.length) {
      lines.push(
        `The report does not provide a reference range for: ${missingRange.map((t) => t.testName).join(", ")}. Status is therefore not assessed.`,
      );
    }

    if (uncertain.length) {
      lines.push(
        `Some extracted fields have low extraction confidence and should be reviewed before relying on them: ${uncertain
          .map((t) => t.testName)
          .join(", ")}.`,
      );
    }

    lines.push(
      "This summary describes documented information only. It does not determine a diagnosis or recommend treatment.",
    );
    lines.push(SAFETY_FOOTER);
    return lines.join("\n\n");
  }

  async generateClarifications(input: {
    report: StructuredMedicalReport;
    filename: string;
  }): Promise<GeneratedClarification[]> {
    const items: GeneratedClarification[] = [];
    for (const test of input.report.labTests) {
      if (test.referenceLow == null && test.referenceHigh == null) {
        items.push({
          type: "MISSING_REFERENCE_RANGE",
          question: `The report contains a value for ${test.testName} but no reference range. Please review.`,
          relatedField: test.testName,
        });
      }
      if ((test.confidence ?? 1) < 0.7) {
        items.push({
          type: "LOW_CONFIDENCE",
          question: `Extraction confidence for ${test.testName} is low. Please confirm the value against ${input.filename}.`,
          relatedField: test.testName,
        });
      }
    }
    if (input.report.metadata.reportDate && /\d{2}\/\d{2}\/\d{4}/.test(input.report.metadata.reportDate)) {
      items.push({
        type: "AMBIGUOUS_DATE",
        question: `Was the test date ${input.report.metadata.reportDate} in day/month/year or month/day/year format?`,
        relatedField: "reportDate",
      });
    }
    return items;
  }
}
