import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { handleRouteError } from "@/lib/api";

export async function GET() {
  try {
    const user = await requireUser();
    const tests = await prisma.medicalTest.findMany({
      where: {
        patient: { ownerId: user.id },
        OR: [
          { verificationStatus: { in: ["PENDING", "FLAGGED"] } },
          { confidence: { lt: 0.7 } },
        ],
      },
      include: { document: true, patient: true },
      orderBy: { confidence: "asc" },
      take: 50,
    });
    const clarifications = await prisma.clarification.findMany({
      where: { patient: { ownerId: user.id }, status: "OPEN" },
      include: { patient: true },
      take: 50,
    });
    return NextResponse.json({ tests, clarifications });
  } catch (error) {
    return handleRouteError(error);
  }
}
