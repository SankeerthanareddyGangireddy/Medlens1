export type LabStatus = "LOW" | "NORMAL" | "HIGH" | "NOT_ASSESSED";

export function classifyLabStatus(input: {
  value: number | null;
  referenceLow: number | null;
  referenceHigh: number | null;
}): LabStatus {
  const { value, referenceLow, referenceHigh } = input;
  if (value === null || referenceLow === null || referenceHigh === null) {
    return "NOT_ASSESSED";
  }
  if (value < referenceLow) return "LOW";
  if (value > referenceHigh) return "HIGH";
  return "NORMAL";
}

export function formatReferenceRange(input: {
  referenceLow: number | null;
  referenceHigh: number | null;
  referenceText: string | null;
  unit?: string | null;
}) {
  if (input.referenceText && input.referenceText.trim()) {
    return input.referenceText.trim();
  }
  if (input.referenceLow !== null && input.referenceHigh !== null) {
    const unit = input.unit ? ` ${input.unit}` : "";
    return `${input.referenceLow}–${input.referenceHigh}${unit}`;
  }
  return "Not provided";
}
