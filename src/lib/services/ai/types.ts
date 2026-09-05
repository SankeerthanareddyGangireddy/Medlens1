import type { StructuredMedicalReport } from "@/lib/schemas/extraction";

export interface ExtractMedicalReportInput {
  text: string;
  filename: string;
  documentType?: string | null;
  patientContext?: {
    fullName: string;
    age: number;
    sex: string;
    medications: string[];
    conditions: string[];
  };
}

export interface GenerateSummaryInput {
  patientName: string;
  age: number;
  sex: string;
  userProvided: {
    symptoms: string[];
    conditions: string[];
    allergies: string[];
    medications: string[];
    notes?: string | null;
  };
  tests: Array<{
    testName: string;
    value: string | null;
    unit: string | null;
    referenceText: string | null;
    labStatus: string;
    reportDate: string | null;
    sourceFilename: string;
    verified: boolean;
    confidence: number;
  }>;
  documentIds: string[];
}

export interface GeneratedClarification {
  type: string;
  question: string;
  relatedField?: string | null;
}

export interface AIProvider {
  extractMedicalReport(input: ExtractMedicalReportInput): Promise<StructuredMedicalReport>;
  generateSummary(input: GenerateSummaryInput): Promise<string>;
  generateClarifications(input: {
    report: StructuredMedicalReport;
    filename: string;
  }): Promise<GeneratedClarification[]>;
}

export const SAFETY_FOOTER =
  "MedLens provides organization and explanation of documented medical information. It does not provide medical diagnosis or treatment advice.";
