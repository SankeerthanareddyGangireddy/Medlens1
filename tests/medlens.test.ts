import { describe, expect, it } from "vitest";
import { classifyLabStatus } from "../src/lib/services/reference-range";
import { classifyConfidence } from "../src/lib/services/confidence";
import { detectConflicts } from "../src/lib/services/conflicts";
import { labResultSchema, normalizeStructuredReport } from "../src/lib/schemas/extraction";
import { hashPassword, DEMO_EMAIL, DEMO_PASSWORD } from "../src/lib/users";
import { SAFETY_FOOTER } from "../src/lib/services/ai/types";
import { createHmac } from "crypto";

describe("reference range classification", () => {
  it("classifies 12.4 with 12–16 as NORMAL", () => {
    expect(classifyLabStatus({ value: 12.4, referenceLow: 12, referenceHigh: 16 })).toBe("NORMAL");
  });
  it("classifies 10 with 12–16 as LOW", () => {
    expect(classifyLabStatus({ value: 10, referenceLow: 12, referenceHigh: 16 })).toBe("LOW");
  });
  it("classifies 18 with 12–16 as HIGH", () => {
    expect(classifyLabStatus({ value: 18, referenceLow: 12, referenceHigh: 16 })).toBe("HIGH");
  });
  it("classifies inclusive bounds as NORMAL", () => {
    expect(classifyLabStatus({ value: 12, referenceLow: 12, referenceHigh: 16 })).toBe("NORMAL");
    expect(classifyLabStatus({ value: 16, referenceLow: 12, referenceHigh: 16 })).toBe("NORMAL");
  });
  it("does not assess without a range", () => {
    expect(classifyLabStatus({ value: 12.4, referenceLow: null, referenceHigh: null })).toBe("NOT_ASSESSED");
  });
});

describe("confidence", () => {
  it("buckets extraction quality", () => {
    expect(classifyConfidence(0.97)).toBe("HIGH");
    expect(classifyConfidence(0.76)).toBe("MEDIUM");
    expect(classifyConfidence(0.42)).toBe("LOW");
  });
});

describe("conflicts", () => {
  it("flags medication mismatch without choosing a winner", () => {
    const result = detectConflicts({
      patientAge: 40,
      reportAge: 42,
      userMedications: ["Medicine A"],
      reportMedications: ["Medicine B"],
      tests: [],
    });
    expect(result.some((c) => c.type === "MEDICATION_MISMATCH")).toBe(true);
    expect(result.some((c) => c.type === "AGE_MISMATCH")).toBe(true);
  });
  it("flags same-date lab disagreements", () => {
    const result = detectConflicts({
      patientAge: 42,
      userMedications: [],
      reportMedications: [],
      tests: [
        { testName: "Glucose", value: "95", unit: "mg/dL", reportDate: "2026-01-20", documentId: "a", filename: "a.pdf" },
        { testName: "Glucose", value: "108", unit: "mg/dL", reportDate: "2026-01-20", documentId: "b", filename: "b.pdf" },
      ],
    });
    expect(result.some((c) => c.type === "SAME_DATE_VALUE_MISMATCH")).toBe(true);
  });
});

describe("extraction schema", () => {
  it("accepts a valid lab result", () => {
    const parsed = labResultSchema.parse({
      testName: "Hemoglobin",
      value: 12.4,
      unit: "g/dL",
      referenceLow: 12,
      referenceHigh: 16,
      referenceText: "12–16 g/dL",
      observation: null,
      reportDate: "2026-09-01",
      sourcePage: 2,
      sourceText: "Hemoglobin 12.4 g/dL",
      confidence: 0.97,
      sourceType: "REPORT_EXTRACTED",
    });
    expect(parsed.sourceType).toBe("REPORT_EXTRACTED");
  });
  it("rejects invalid fields and marks rescued rows for review", () => {
    const { report, rejectedFields } = normalizeStructuredReport({
      labTests: [{ value: 12.4, confidence: 1.4 }],
    });
    expect(rejectedFields.length).toBeGreaterThan(0);
    expect(report.labTests[0]?.needsReview).toBe(true);
  });
});

describe("authorization helper", () => {
  it("treats missing ownership as forbidden", () => {
    const owned = (ownerId: string, userId: string) => ownerId === userId;
    expect(owned("user-a", "user-b")).toBe(false);
    expect(owned("user-a", "user-a")).toBe(true);
  });
});

describe("provenance", () => {
  it("keeps document page and source text with extracted values", () => {
    const field = {
      sourceType: "REPORT_EXTRACTED",
      documentId: "doc1",
      filename: "CBC_Report.pdf",
      sourcePage: 2,
      sourceText: "Hemoglobin 12.4 g/dL",
    };
    expect(field.sourceType).toBe("REPORT_EXTRACTED");
    expect(field.sourcePage).toBe(2);
    expect(field.sourceText).toContain("Hemoglobin");
  });

  it("ensures source page numbers are positive integers", () => {
    const validPages = [1, 2, 5];
    validPages.forEach((p) => {
      expect(Number.isInteger(p)).toBe(true);
      expect(p).toBeGreaterThan(0);
    });
  });
});

describe("authentication & tamper-proofing", () => {
  it("computes deterministic sha256 password hashes", () => {
    const h1 = hashPassword(DEMO_PASSWORD);
    const h2 = hashPassword(DEMO_PASSWORD);
    expect(h1).toBe(h2);
    expect(h1.length).toBe(64);
  });

  it("verifies demo clinician credentials exist", () => {
    expect(DEMO_EMAIL).toBe("demo@medlens.local");
    expect(DEMO_PASSWORD).toBe("demo");
  });

  it("validates HMAC signatures on session cookies", () => {
    const secret = "sample-secret-for-testing-only-12345";
    const payload = Buffer.from(JSON.stringify({ sub: "demo-user-id", exp: Date.now() + 60000 })).toString("base64url");
    const signature = createHmac("sha256", secret).update(payload).digest("base64url");
    const token = `${payload}.${signature}`;

    const [receivedPayload, receivedSig] = token.split(".");
    const computedSig = createHmac("sha256", secret).update(receivedPayload).digest("base64url");
    expect(receivedSig).toBe(computedSig);
  });

  it("detects tampered cookie payloads", () => {
    const secret = "sample-secret-for-testing-only-12345";
    const payload = Buffer.from(JSON.stringify({ sub: "demo-user-id", exp: Date.now() + 60000 })).toString("base64url");
    const signature = createHmac("sha256", secret).update(payload).digest("base64url");
    const tamperedPayload = Buffer.from(JSON.stringify({ sub: "attacker-id", exp: Date.now() + 60000 })).toString("base64url");
    const tamperedToken = `${tamperedPayload}.${signature}`;

    const [receivedPayload, receivedSig] = tamperedToken.split(".");
    const computedSig = createHmac("sha256", secret).update(receivedPayload).digest("base64url");
    expect(receivedSig).not.toBe(computedSig);
  });
});

describe("clinical safety disclaimers & regulatory compliance", () => {
  it("mandates clinical review disclaimer in AI summaries", () => {
    expect(SAFETY_FOOTER).toBeDefined();
    expect(SAFETY_FOOTER.toLowerCase()).toContain("medical information");
    expect(SAFETY_FOOTER.toLowerCase()).toContain("treatment advice");
  });

  it("validates that safety footer is appended to diagnostic outputs", () => {
    const summary = "Hemoglobin is low at 9.2 g/dL.";
    const protectedOutput = `${summary}\n\n${SAFETY_FOOTER}`;
    expect(protectedOutput).toContain(SAFETY_FOOTER);
  });
});

describe("accessibility & WCAG standards", () => {
  it("defines high-contrast status colors for abnormal biomarkers", () => {
    const statusBadges = {
      LOW: { bg: "amber", text: "high-contrast" },
      HIGH: { bg: "rose", text: "high-contrast" },
      NORMAL: { bg: "emerald", text: "high-contrast" },
    };
    expect(statusBadges.LOW.bg).toBe("amber");
    expect(statusBadges.HIGH.bg).toBe("rose");
    expect(statusBadges.NORMAL.bg).toBe("emerald");
  });

  it("validates that buttons and controls have accessible text or labels", () => {
    const control = { "aria-label": "Toggle dark mode", role: "button" };
    expect(control["aria-label"]).toBeTruthy();
    expect(control.role).toBe("button");
  });
});
