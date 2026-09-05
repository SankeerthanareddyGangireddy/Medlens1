export type ConflictDraft = {
  type: string;
  severity: "LOW" | "MEDIUM" | "HIGH";
  description: string;
  sourceA: Record<string, unknown>;
  sourceB: Record<string, unknown>;
};

function normalizeName(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function detectConflicts(input: {
  patientAge: number;
  reportAge?: number | null;
  userMedications: string[];
  reportMedications: string[];
  tests: Array<{
    testName: string;
    value: string | null;
    unit: string | null;
    reportDate: string | null;
    documentId: string;
    filename: string;
  }>;
}): ConflictDraft[] {
  const conflicts: ConflictDraft[] = [];

  if (input.reportAge != null && Math.abs(input.reportAge - input.patientAge) >= 1) {
    conflicts.push({
      type: "AGE_MISMATCH",
      severity: "MEDIUM",
      description: `Patient information lists age ${input.patientAge}, while a report lists age ${input.reportAge}.`,
      sourceA: { kind: "PATIENT_PROFILE", age: input.patientAge },
      sourceB: { kind: "REPORT", age: input.reportAge },
    });
  }

  const userMeds = input.userMedications.map(normalizeName).filter(Boolean);
  const reportMeds = input.reportMedications.map(normalizeName).filter(Boolean);
  for (const reportMed of reportMeds) {
    if (userMeds.length && !userMeds.includes(reportMed)) {
      conflicts.push({
        type: "MEDICATION_MISMATCH",
        severity: "HIGH",
        description:
          "Medication information differs between patient-provided data and an uploaded report.",
        sourceA: { kind: "USER_PROVIDED", medications: input.userMedications },
        sourceB: { kind: "REPORT_EXTRACTED", medications: input.reportMedications },
      });
      break;
    }
  }

  const grouped = new Map<string, typeof input.tests>();
  for (const test of input.tests) {
    if (!test.reportDate) continue;
    const key = `${normalizeName(test.testName)}|${test.unit ?? ""}|${test.reportDate}`;
    const list = grouped.get(key) ?? [];
    list.push(test);
    grouped.set(key, list);
  }
  for (const [, list] of grouped) {
    const values = new Set(list.map((t) => (t.value ?? "").trim()));
    if (values.size > 1) {
      conflicts.push({
        type: "SAME_DATE_VALUE_MISMATCH",
        severity: "HIGH",
        description: `Two reports contain different values for ${list[0].testName} on ${list[0].reportDate}.`,
        sourceA: {
          documentId: list[0].documentId,
          filename: list[0].filename,
          value: list[0].value,
        },
        sourceB: {
          documentId: list[1].documentId,
          filename: list[1].filename,
          value: list[1].value,
        },
      });
    }
  }

  return conflicts;
}
