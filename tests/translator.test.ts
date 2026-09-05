import { describe, expect, it } from "vitest";
import { translateMedicalText, getLocalizedJargon } from "../src/lib/services/translator";

describe("Medical Translator (Telugu and Hindi)", () => {
  it("translates clinical laboratory tests into Telugu", async () => {
    const input = "Hemoglobin is 9.2 g/dL. Total Cholesterol is 240 mg/dL.";
    const result = await translateMedicalText(input, "te");
    expect(result).toContain("హీమోగ్లోబిన్");
    expect(result).toContain("మొత్తం కొలెస్ట్రాల్");
  });

  it("translates clinical laboratory tests into Hindi", async () => {
    const input = "Hemoglobin is 9.2 g/dL. Total Cholesterol is 240 mg/dL.";
    const result = await translateMedicalText(input, "hi");
    expect(result).toContain("हीमोग्लोबिन");
    expect(result).toContain("कुल कोलेस्ट्रॉल");
  });

  it("returns authentic localized medical jargon in Telugu and Hindi", () => {
    const teJargon = getLocalizedJargon("te");
    expect(teJargon.length).toBeGreaterThan(0);
    const teRbc = teJargon.find((j) => j.term === "RBC");
    expect(teRbc?.fullName).toContain("ఎర్ర రక్త కణాలు");

    const hiJargon = getLocalizedJargon("hi");
    expect(hiJargon.length).toBeGreaterThan(0);
    const hiHdl = hiJargon.find((j) => j.term === "HDL");
    expect(hiHdl?.fullName).toContain("अच्छा कोलेस्ट्रॉल");
  });

  it("preserves English text when target is en", async () => {
    const input = "Hemoglobin is 9.2 g/dL.";
    const result = await translateMedicalText(input, "en");
    expect(result).toBe(input);
  });
});
