import { promises as fs } from "fs";
import path from "path";
import os from "os";
import { randomUUID } from "crypto";
import { sanitizeFilename } from "@/lib/utils";

export interface StoredFile {
  key: string;
}

export interface StorageService {
  save(input: { filename: string; buffer: Buffer; mimeType: string }): Promise<StoredFile>;
  read(key: string): Promise<Buffer>;
}

class LocalStorageService implements StorageService {
  private dir() {
    if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
      return path.join(os.tmpdir(), "medlens-uploads");
    }
    const uploadDir = process.env.UPLOAD_DIR || "./uploads";
    if (path.isAbsolute(uploadDir)) return uploadDir;
    return path.resolve(/*turbopackIgnore: true*/ process.cwd(), uploadDir);
  }

  async save(input: { filename: string; buffer: Buffer }): Promise<StoredFile> {
    const dir = this.dir();
    await fs.mkdir(dir, { recursive: true });
    const key = `${randomUUID()}-${sanitizeFilename(input.filename)}`;
    await fs.writeFile(path.join(dir, key), input.buffer);
    return { key };
  }

  async read(key: string): Promise<Buffer> {
    if (key.includes("..") || key.includes("/") || key.includes("\\")) {
      throw new Error("INVALID_STORAGE_KEY");
    }
    return fs.readFile(path.join(this.dir(), key));
  }
}

export function getStorageService(): StorageService {
  return new LocalStorageService();
}
