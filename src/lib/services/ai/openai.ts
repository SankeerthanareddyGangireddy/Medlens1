import { normalizeStructuredReport } from "@/lib/schemas/extraction";
import type { StructuredMedicalReport } from "@/lib/schemas/extraction";
import type {
  AIProvider,
  ExtractMedicalReportInput,
  GenerateSummaryInput,
  GeneratedClarification,
} from "@/lib/services/ai/types";
import { SAFETY_FOOTER } from "@/lib/services/ai/types";
import { MockAIProvider } from "@/lib/services/ai/mock";

const SYSTEM_EXTRACT = `You extract structured medical document information as JSON only.
Do not diagnose. Do not recommend treatment, medication changes, or dosages.
Never invent laboratory reference ranges. If a range is not printed, leave referenceLow, referenceHigh, and referenceText as null.
Use sourceType REPORT_EXTRACTED for extracted fields.
Return JSON matching:
{
  "metadata": {"documentType": string|null, "reportDate": string|null, "facility": string|null, "patientName": string|null, "patientAge": number|null, "patientSex": string|null, "pageCount": number|null},
  "labTests": [{"testName": string, "value": number|string|null, "unit": string|null, "referenceLow": number|null, "referenceHigh": number|null, "referenceText": string|null, "observation": string|null, "reportDate": string|null, "sourcePage": number|null, "sourceText": string|null, "confidence": number, "sourceType": "REPORT_EXTRACTED"}],
  "observations": [{"category": string, "content": string, "sourcePage": number|null, "sourceText": string|null, "confidence": number}],
  "medications": [{"name": string, "notes": string|null, "sourcePage": number|null, "sourceText": string|null, "confidence": number}],
  "conditions": [{"name": string, "notes": string|null, "sourcePage": number|null, "sourceText": string|null, "confidence": number}],
  "symptoms": [{"name": string, "notes": string|null, "sourcePage": number|null, "sourceText": string|null, "confidence": number}],
  "vitals": [{"name": string, "value": number|string|null, "unit": string|null, "sourcePage": number|null, "sourceText": string|null, "confidence": number}],
  "imagingFindings": [{"finding": string, "location": string|null, "sourcePage": number|null, "sourceText": string|null, "confidence": number}],
  "clinicalNotes": [string],
  "overallConfidence": number
}`;

const SYSTEM_SUMMARY = `Write a patient-friendly summary of documented medical information only.
Use phrases like "The uploaded report contains...", "The report records...", "The value is above the reference range shown on the report.", "The report does not provide a reference range for this test."
Do not diagnose. Do not prescribe. Do not recommend medication changes or dosages. Do not claim certainty when extraction confidence is low.
End with this exact footer:
${SAFETY_FOOTER}`;

export class OpenAIProvider implements AIProvider {
  constructor(
    private readonly apiKey: string,
    private readonly baseUrl: string,
    private readonly model: string,
    private readonly fallback = new MockAIProvider(),
  ) {}

  private async chat(system: string, user: string, json = true): Promise<string> {
    const res = await fetch(`${this.baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        temperature: 0,
        ...(json ? { response_format: { type: "json_object" } } : {}),
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });
    if (!res.ok) {
      throw new Error("AI_PROVIDER_ERROR");
    }
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    return data.choices?.[0]?.message?.content ?? "";
  }

  async extractMedicalReport(input: ExtractMedicalReportInput): Promise<StructuredMedicalReport> {
    try {
      const content = await this.chat(
        SYSTEM_EXTRACT,
        `Filename: ${input.filename}\nDocument type hint: ${input.documentType ?? "unknown"}\n\nDocument text:\n${input.text.slice(0, 20000)}`,
      );
      const parsed = JSON.parse(content) as unknown;
      return normalizeStructuredReport(parsed).report;
    } catch {
      return this.fallback.extractMedicalReport(input);
    }
  }

  async generateSummary(input: GenerateSummaryInput): Promise<string> {
    try {
      const content = await this.chat(SYSTEM_SUMMARY, JSON.stringify(input), false);
      if (!content.includes("does not provide medical diagnosis")) {
        return `${content.trim()}\n\n${SAFETY_FOOTER}`;
      }
      return content;
    } catch {
      return this.fallback.generateSummary(input);
    }
  }

  async generateClarifications(input: {
    report: StructuredMedicalReport;
    filename: string;
  }): Promise<GeneratedClarification[]> {
    return this.fallback.generateClarifications(input);
  }
}
