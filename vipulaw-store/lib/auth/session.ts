import { cookies, headers } from "next/headers";
import { db } from "../db";
import { hmac, randomToken } from "../crypto";
import { env } from "../env";

const COOKIE = "vl_session";
const TTL_DAYS = 30;

export async function createSession(userId: string) {
  const token = randomToken();
  await db.session.create({
    data: { tokenHash: hmac(token, "session"), userId, expiresAt: new Date(Date.now() + TTL_DAYS * 864e5) },
  });
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: env.isProd,
    sameSite: "lax",
    path: "/",
    maxAge: TTL_DAYS * 86400,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) await db.session.deleteMany({ where: { tokenHash: hmac(token, "session") } });
  jar.delete(COOKIE);
}

export async function getUser() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const s = await db.session.findUnique({ where: { tokenHash: hmac(token, "session") }, include: { user: true } });
  if (!s || s.expiresAt < new Date()) return null;
  return s.user;
}

export async function requireAdmin() {
  const u = await getUser();
  if (!u || u.role !== "ADMIN") return null;
  return u;
}

export async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}

/** CSRF defence for cookie-authenticated POSTs: Origin must match our host. */
export async function sameOrigin(): Promise<boolean> {
  const h = await headers();
  const origin = h.get("origin");
  if (!origin) return false;
  try { return new URL(origin).host === h.get("host"); } catch { return false; }
}
