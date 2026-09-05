import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { hashPassword, ensureDemoUser, DEMO_EMAIL, DEMO_PASSWORD } from "@/lib/users";

export { hashPassword, ensureDemoUser, DEMO_EMAIL, DEMO_PASSWORD };

const COOKIE = "medlens_session";

function secret() {
  return process.env.SESSION_SECRET || "medlens-dev-secret-change-me";
}

function sign(payload: string) {
  const hmac = createHmac("sha256", secret()).update(payload).digest("base64url");
  return `${payload}.${hmac}`;
}

function verify(token: string) {
  const idx = token.lastIndexOf(".");
  if (idx < 0) return null;
  const payload = token.slice(0, idx);
  const sig = token.slice(idx + 1);
  const expected = createHmac("sha256", secret()).update(payload).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      sub: string;
      exp: number;
    };
  } catch {
    return null;
  }
}

export async function createSession(userId: string) {
  const payload = Buffer.from(
    JSON.stringify({ sub: userId, exp: Date.now() + 1000 * 60 * 60 * 24 * 7, nonce: randomBytes(8).toString("hex") }),
  ).toString("base64url");
  const token = sign(payload);
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function getSessionUser() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  const payload = verify(token);
  if (!payload || payload.exp < Date.now()) return null;
  return prisma.user.findUnique({ where: { id: payload.sub } });
}

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) {
    const error = new Error("UNAUTHORIZED");
    error.name = "UNAUTHORIZED";
    throw error;
  }
  return user;
}

export async function getOwnedPatient(userId: string, patientId: string) {
  return prisma.patient.findFirst({ where: { id: patientId, ownerId: userId } });
}

export async function requireOwnedPatient(userId: string, patientId: string) {
  const patient = await getOwnedPatient(userId, patientId);
  if (!patient) {
    const error = new Error("FORBIDDEN");
    error.name = "FORBIDDEN";
    throw error;
  }
  return patient;
}
