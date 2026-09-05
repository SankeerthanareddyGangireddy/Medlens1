import { describe, expect, it } from "vitest";
import { prisma } from "../src/lib/db";
import { getStorageService } from "../src/lib/services/storage";
import { processMedicalDocument } from "../src/lib/services/pipeline";

describe("pipeline image processing", () => {
  it("processes an image end-to-end", async () => {
    const patient = await prisma.patient.findFirst();
    expect(patient).not.toBeNull();
    if (!patient) return;

    const dummyPng = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
      0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
      0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae,
      0x42, 0x60, 0x82,
    ]);

    const stored = await getStorageService().save({
      filename: "test_blood_panel.png",
      buffer: dummyPng,
      mimeType: "image/png",
    });

    const doc = await prisma.medicalDocument.create({
      data: {
        patientId: patient.id,
        filename: "test_blood_panel.png",
        storedKey: stored.key,
        mimeType: "image/png",
        sizeBytes: dummyPng.length,
        documentType: "Blood Panel",
      },
    });

    try {
      const processed = await processMedicalDocument(doc.id, patient.ownerId);
      expect(processed).not.toBeNull();
      expect(processed?.processingStatus).toBe("READY_FOR_REVIEW");
      expect(processed?.tests.length).toBeGreaterThan(0);
      console.log("SUCCESSFULLY EXTRACTED TESTS:", processed?.tests.map((t) => t.testName));
    } finally {
      await prisma.medicalDocument.delete({ where: { id: doc.id } });
    }
  }, 45000);
});
