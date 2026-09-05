import { createHash } from "crypto";
import { prisma } from "@/lib/db";

export const DEMO_EMAIL = "demo@medlens.local";
export const DEMO_PASSWORD = "demo";

export function hashPassword(password: string) {
  return createHash("sha256").update(password).digest("hex");
}

export async function ensureDemoUser() {
  const passwordHash = hashPassword(DEMO_PASSWORD);
  try {
    return await prisma.user.upsert({
      where: { email: DEMO_EMAIL },
      update: { passwordHash, name: "Demo Clinician" },
      create: {
        email: DEMO_EMAIL,
        name: "Demo Clinician",
        passwordHash,
        role: "REVIEWER",
      },
    });
  } catch (error) {
    console.warn("Database unavailable in ensureDemoUser; falling back to memory demo user:", error);
    return {
      id: "demo-user-id",
      email: DEMO_EMAIL,
      name: "Demo Clinician",
      passwordHash,
      role: "REVIEWER" as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}

