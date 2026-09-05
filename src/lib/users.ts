import { createHash } from "crypto";
import { prisma } from "@/lib/db";

export const DEMO_EMAIL = "demo@medlens.local";
export const DEMO_PASSWORD = "demo";

export function hashPassword(password: string) {
  return createHash("sha256").update(password).digest("hex");
}

export async function ensureDemoUser() {
  const passwordHash = hashPassword(DEMO_PASSWORD);
  return prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: { passwordHash, name: "Demo Clinician" },
    create: {
      email: DEMO_EMAIL,
      name: "Demo Clinician",
      passwordHash,
      role: "REVIEWER",
    },
  });
}
