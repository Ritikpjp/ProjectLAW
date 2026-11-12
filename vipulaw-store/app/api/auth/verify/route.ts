import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { verifyOtp } from "@/lib/auth/otp";
import { clientIp, createSession, sameOrigin } from "@/lib/auth/session";
import { mobileSchema, otpSchema, signupSchema } from "@/lib/validation";

const loginBody = z.object({ mode: z.literal("login"), mobile: mobileSchema, code: otpSchema, portal: z.literal("admin").optional() });
const signupBody = signupSchema.extend({ mode: z.literal("signup"), code: otpSchema });
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

  if (!(await verifyOtp(data.mobile, data.code, await clientIp()))) {
    return NextResponse.json({ error: "Wrong or expired code." }, { status: 401 });
  }

  const role = env.adminMobiles.includes(data.mobile) ? "ADMIN" : "USER";
  let user = await db.user.findUnique({ where: { mobile: data.mobile } });

  if (data.mode === "login") {
    if (!user && adminPortal) {
      // First sign-in of a configured admin number: create the admin account (edit the email later in Profile).
      const firstExam = await db.exam.findFirst({ orderBy: { sortOrder: "asc" }, select: { slug: true } });
      user = await db.user.create({
        data: {
          name: "Site Admin", email: `admin-${data.mobile.slice(-10)}@vipulaw.local`, mobile: data.mobile,
          profession: "Other", examTarget: firstExam?.slug ?? "judiciary", yearOfStudy: "Graduated", role: "ADMIN",
        },
      });
    }
    if (!user) return NextResponse.json({ error: "No account for this number." }, { status: 404 });
    if (role === "ADMIN" && user.role !== "ADMIN") user = await db.user.update({ where: { id: user.id }, data: { role } });
  } else if (!user) {
    try {
      user = await db.user.create({
        data: {
          name: data.name, email: data.email, mobile: data.mobile, profession: data.profession,
          examTarget: data.examTarget, yearOfStudy: data.yearOfStudy, role,
        },
      });
    } catch {
      return NextResponse.json({ error: "This email or number is already registered." }, { status: 409 });
    }
  }

  await createSession(user.id);
  return NextResponse.json({ ok: true });
}
