import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { handleRouteError } from "@/lib/api";
import { loadDemoPatient } from "@/lib/services/demo";

export async function POST() {
  try {
    const user = await requireUser();
    const patient = await loadDemoPatient(user.id);
    return NextResponse.json({ patient });
  } catch (error) {
    return handleRouteError(error);
  }
}
