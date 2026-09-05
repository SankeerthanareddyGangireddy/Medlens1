import { NextResponse } from "next/server";
import { z } from "zod";
import { createSession, DEMO_EMAIL, DEMO_PASSWORD, ensureDemoUser, getSessionUser, hashPassword } from "@/lib/auth";
import { handleRouteError, jsonError } from "@/lib/api";
import { prisma } from "@/lib/db";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function GET() {
  const user = await getSessionUser();
  if (!user) return jsonError("Unauthenticated", 401);
  return NextResponse.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role } });
}

export async function POST(request: Request) {
  try {
    const body = loginSchema.parse(await request.json());
    const isDemo =
      body.email.toLowerCase() === DEMO_EMAIL.toLowerCase() && body.password === DEMO_PASSWORD;

    try {
      await ensureDemoUser();
      const user = await prisma.user.findUnique({ where: { email: body.email.toLowerCase() } });
      if (user && user.passwordHash === hashPassword(body.password)) {
        await createSession(user.id);
        return NextResponse.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role } });
      }
    } catch (dbError) {
      console.warn("Database error during login; checking demo credentials:", dbError);
      if (isDemo) {
        await createSession("demo-user-id");
        return NextResponse.json({
          user: { id: "demo-user-id", email: DEMO_EMAIL, name: "Demo Clinician", role: "REVIEWER" },
        });
      }
      return jsonError("Unable to connect to database server. Please verify your DATABASE_URL.", 503);
    }

    if (isDemo) {
      const demo = await ensureDemoUser();
      const demoId = demo?.id || "demo-user-id";
      await createSession(demoId);
      return NextResponse.json({
        user: { id: demoId, email: DEMO_EMAIL, name: "Demo Clinician", role: "REVIEWER" },
      });
    }

    return jsonError("Invalid email or password.", 401);
  } catch (error) {
    if (error instanceof z.ZodError) return jsonError("Invalid login payload.", 400);
    return handleRouteError(error);
  }
}
