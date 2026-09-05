import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { handleRouteError } from "@/lib/api";

export async function GET() {
  try {
    const user = await requireUser();
    const [patients, reports, pendingTests, flagged, recentPatients, recentReports, conflicts, clarifications] =
      await Promise.all([
        prisma.patient.count({ where: { ownerId: user.id } }),
        prisma.medicalDocument.count({ where: { patient: { ownerId: user.id } } }),
        prisma.medicalTest.count({
          where: { patient: { ownerId: user.id }, verificationStatus: { in: ["PENDING", "FLAGGED"] } },
        }),
        prisma.medicalDocument.count({
          where: { patient: { ownerId: user.id }, processingStatus: "FAILED" },
        }),
        prisma.patient.findMany({
          where: { ownerId: user.id },
          orderBy: { updatedAt: "desc" },
          take: 5,
        }),
        prisma.medicalDocument.findMany({
          where: { patient: { ownerId: user.id } },
          orderBy: { createdAt: "desc" },
          take: 5,
          include: { patient: true },
        }),
        prisma.conflict.findMany({
          where: { patient: { ownerId: user.id }, status: "OPEN" },
          orderBy: { createdAt: "desc" },
          take: 6,
          include: { patient: true },
        }),
        prisma.clarification.count({
          where: { patient: { ownerId: user.id }, status: "OPEN" },
        }),
      ]);

    return NextResponse.json({
      stats: {
        patients,
        reports,
        awaitingVerification: pendingTests,
        extractionIssues: flagged,
        itemsNeedReview: pendingTests + clarifications,
      },
      recentPatients,
      recentReports,
      conflicts,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
