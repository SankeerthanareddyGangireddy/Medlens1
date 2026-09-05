import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { handleRouteError } from "@/lib/api";

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim() ?? "";
    const type = searchParams.get("type") ?? "";
    const reports = await prisma.medicalDocument.findMany({
      where: {
        patient: { ownerId: user.id },
        ...(q ? { filename: { contains: q, mode: "insensitive" } } : {}),
        ...(type ? { documentType: { contains: type, mode: "insensitive" } } : {}),
      },
      include: { patient: true, _count: { select: { tests: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ reports });
  } catch (error) {
    return handleRouteError(error);
  }
}
