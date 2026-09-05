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
    await ensureDemoUser();
    const user = await prisma.user.findUnique({ where: { email: body.email.toLowerCase() } });
    if (!user || user.passwordHash !== hashPassword(body.password)) {
      if (body.email.toLowerCase() === DEMO_EMAIL && body.password === DEMO_PASSWORD) {
        const demo = await ensureDemoUser();
        await createSession(demo.id);
        return NextResponse.json({ user: { id: demo.id, email: demo.email, name: demo.name } });
      }
      return jsonError("Invalid email or password.", 401);
    }
    await createSession(user.id);
    return NextResponse.json({ user: { id: user.id, email: user.email, name: user.name } });
  } catch (error) {
    if (error instanceof z.ZodError) return jsonError("Invalid login payload.", 400);
    return handleRouteError(error);
  }
}
