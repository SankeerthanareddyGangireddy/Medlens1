import { prisma } from "@/lib/db";

export async function writeAudit(input: {
  patientId?: string | null;
  userId?: string | null;
  action: string;
  details: string;
}) {
  await prisma.auditLog.create({
    data: {
      patientId: input.patientId ?? null,
      userId: input.userId ?? null,
      action: input.action,
      details: input.details,
    },
  });
}
