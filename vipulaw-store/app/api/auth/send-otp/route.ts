import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { sendOtp } from "@/lib/auth/otp";
import { clientIp, sameOrigin } from "@/lib/auth/session";
import { mobileSchema, signupSchema } from "@/lib/validation";

// portal "admin" is the separate admin console login: only numbers listed in ADMIN_MOBILES may use it.
const loginBody = z.object({ mode: z.literal("login"), mobile: mobileSchema, portal: z.literal("admin").optional() });
const signupBody = signupSchema.extend({ mode: z.literal("signup") });
const body = z.discriminatedUnion("mode", [loginBody, signupBody]);

export async function POST(req: Request) {
  if (!(await sameOrigin())) return NextResponse.json({ error: "Bad origin" }, { status: 403 });
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid details" }, { status: 400 });
  }
  const data = parsed.data;

  const adminPortal = data.mode === "login" && data.portal === "admin";
  if (adminPortal && !env.adminMobiles.includes(data.mobile)) {
    return NextResponse.json({ error: "This number is not authorised for the admin console." }, { status: 403 });
  }

  const exists = await db.user.findUnique({ where: { mobile: data.mobile } });
  if (data.mode === "login" && !exists && !adminPortal) {
    return NextResponse.json({ error: "No account for this number. Please sign up first." }, { status: 404 });
  }
  if (data.mode === "signup") {
    if (exists) return NextResponse.json({ error: "This number is already registered. Please log in." }, { status: 409 });
    if (await db.user.findUnique({ where: { email: data.email } })) {
      return NextResponse.json({ error: "This email is already used by another account." }, { status: 409 });
    }
    if (!(await db.exam.findFirst({ where: { slug: data.examTarget, active: true } }))) {
      return NextResponse.json({ error: "Choose a valid exam." }, { status: 400 });
    }
  }

  const res = await sendOtp(data.mobile, await clientIp());
  if (!res.ok) return NextResponse.json({ error: res.error }, { status: 429 });
  return NextResponse.json({ ok: true });
}
