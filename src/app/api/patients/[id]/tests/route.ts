import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireOwnedPatient, requireUser } from "@/lib/auth";
import { handleRouteError } from "@/lib/api";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    await requireOwnedPatient(user.id, id);
    const { searchParams } = new URL(request.url);
    const testName = searchParams.get("testName") ?? undefined;
    const status = searchParams.get("status") ?? undefined;
    const verification = searchParams.get("verification") ?? undefined;
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const tests = await prisma.medicalTest.findMany({
      where: {
        patientId: id,
        ...(testName ? { testName: { contains: testName, mode: "insensitive" } } : {}),
        ...(status ? { labStatus: status as never } : {}),
        ...(verification ? { verificationStatus: verification as never } : {}),
        ...(from || to
          ? {
              reportDate: {
                gte: from ? new Date(from) : undefined,
                lte: to ? new Date(to) : undefined,
              },
            }
          : {}),
      },
      include: { document: true },
      orderBy: [{ reportDate: "desc" }, { testName: "asc" }],
    });
    return NextResponse.json({ tests });
  } catch (error) {
    return handleRouteError(error);
  }
}
