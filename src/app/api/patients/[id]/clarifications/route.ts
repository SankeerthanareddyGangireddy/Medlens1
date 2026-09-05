import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireOwnedPatient, requireUser } from "@/lib/auth";
import { handleRouteError, jsonError } from "@/lib/api";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    await requireOwnedPatient(user.id, id);
    const clarifications = await prisma.clarification.findMany({
      where: { patientId: id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ clarifications });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    await requireOwnedPatient(user.id, id);
    const body = (await request.json()) as { clarificationId?: string; answer?: string; status?: "ANSWERED" | "DISMISSED" };
    if (!body.clarificationId) return jsonError("clarificationId is required.", 400);
    const updated = await prisma.clarification.update({
      where: { id: body.clarificationId },
      data: {
        answer: body.answer,
        status: body.status ?? "ANSWERED",
      },
    });
    return NextResponse.json({ clarification: updated });
  } catch (error) {
    return handleRouteError(error);
  }
}
