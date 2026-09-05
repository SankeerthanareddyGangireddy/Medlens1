export type ConfidenceBand = "HIGH" | "MEDIUM" | "LOW";

export function classifyConfidence(confidence: number): ConfidenceBand {
  if (confidence >= 0.9) return "HIGH";
  if (confidence >= 0.7) return "MEDIUM";
  return "LOW";
}

export function confidenceLabel(band: ConfidenceBand) {
  switch (band) {
    case "HIGH":
      return "High confidence";
    case "MEDIUM":
      return "Medium confidence";
    case "LOW":
      return "Low confidence";
  }
}

export const LOW_CONFIDENCE_THRESHOLD = 0.7;
