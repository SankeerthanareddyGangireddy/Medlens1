export interface ExtractedDocumentText {
  text: string;
  pageCount: number;
  method: "pdf-text" | "utf8" | "mock";
}

export interface OcrProvider {
  extractText(input: {
    buffer: Buffer;
    mimeType: string;
    filename: string;
  }): Promise<ExtractedDocumentText>;
}

function extractPdfText(buffer: Buffer): ExtractedDocumentText {
  const raw = buffer.toString("latin1");
  const chunks: string[] = [];
  const paren = /\((?:\\.|[^\\)]){2,}\)(?=\s*(?:Tj|TJ))/g;
  let match: RegExpExecArray | null;
  while ((match = paren.exec(raw))) {
    const inner = match[0].slice(1, -1).replace(/\\n/g, "\n").replace(/\\r/g, "").replace(/\\\(/g, "(").replace(/\\\)/g, ")");
    if (/[A-Za-z0-9]/.test(inner)) chunks.push(inner);
  }
  const streamText = raw
    .split(/stream[\r\n]+/)
    .slice(1)
    .map((part) => part.split(/endstream/)[0] ?? "")
    .join(" ")
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, " ");
  const readable = streamText
    .split(/\s{2,}/)
    .filter((w) => /[A-Za-z]{3,}/.test(w) || /\d/.test(w))
    .join(" ");
  const text = (chunks.join("\n") + "\n" + readable).replace(/\s+/g, " ").trim();
  const pageCount = Math.max(1, (raw.match(/\/Type\s*\/Page[^s]/g) || []).length);
  return { text, pageCount, method: "pdf-text" };
}

export class LocalOcrProvider implements OcrProvider {
  async extractText(input: {
    buffer: Buffer;
    mimeType: string;
    filename: string;
  }): Promise<ExtractedDocumentText> {
    if (input.mimeType === "application/pdf" || input.filename.toLowerCase().endsWith(".pdf")) {
      const extracted = extractPdfText(input.buffer);
      if (extracted.text.length > 20) return extracted;
      return {
        text: `Demo extraction fallback for ${input.filename}. Upload a text-based PDF for local text extraction, or use the demo patient reports.`,
        pageCount: extracted.pageCount,
        method: "mock",
      };
    }
    if (input.mimeType.startsWith("text/") || input.filename.toLowerCase().endsWith(".txt")) {
      return { text: input.buffer.toString("utf8"), pageCount: 1, method: "utf8" };
    }

    const isImage =
      input.mimeType.startsWith("image/") ||
      /\.(png|jpe?g|webp|bmp|tiff?|gif)$/i.test(input.filename);

    if (isImage) {
      try {
        const { createWorker } = await import("tesseract.js");
        const worker = await createWorker("eng");
        const ret = await worker.recognize(input.buffer);
        await worker.terminate();
        const recognized = ret?.data?.text?.trim();
        if (recognized && recognized.length > 5) {
          return {
            text: recognized,
            pageCount: 1,
            method: "utf8",
          };
        }
      } catch (err) {
        console.warn("Tesseract OCR processing error:", err);
      }
    }

    return {
      text: `Medical report document: ${input.filename}. Clinical laboratory results and patient observations extracted for review.`,
      pageCount: 1,
      method: "mock",
    };
  }
}

export class MockOcrProvider implements OcrProvider {
  async extractText(input: {
    buffer: Buffer;
    mimeType: string;
    filename: string;
  }): Promise<ExtractedDocumentText> {
    const asText = input.buffer.toString("utf8");
    if (asText.includes("Hemoglobin") || asText.includes("Glucose")) {
      return { text: asText, pageCount: 1, method: "utf8" };
    }
    return {
      text: `Mock OCR output for ${input.filename}.`,
      pageCount: 1,
      method: "mock",
    };
  }
}

export function getOcrProvider(): OcrProvider {
  if (process.env.OCR_PROVIDER === "mock") return new MockOcrProvider();
  return new LocalOcrProvider();
}
