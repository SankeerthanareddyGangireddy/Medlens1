import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { handleRouteError } from "@/lib/api";

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
    if (!q) return NextResponse.json({ patients: [], reports: [] });
    const patients = await prisma.patient.findMany({
      where: {
        ownerId: user.id,
        OR: [
          { fullName: { contains: q, mode: "insensitive" } },
          { medicalRecordNumber: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 8,
    });
    const reports = await prisma.medicalDocument.findMany({
      where: {
        patient: { ownerId: user.id },
        OR: [
          { filename: { contains: q, mode: "insensitive" } },
          { documentType: { contains: q, mode: "insensitive" } },
        ],
      },
      include: { patient: true },
      take: 8,
    });
    return NextResponse.json({ patients, reports });
  } catch (error) {
    return handleRouteError(error);
  }
}
