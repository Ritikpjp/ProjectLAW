import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getUser, sameOrigin } from "@/lib/auth/session";
import { PROFESSIONS, YEARS } from "@/lib/validation";

// Name and mobile are deliberately not editable for buyers: they are printed on purchased PDFs and tie them to the buyer.
// Admins never buy, so an admin may set the display name shown in the header badge.
const schema = z.object({
  name: z.string().trim().min(2).max(80).regex(/^[\p{L}][\p{L}\s.'-]*$/u).optional(),
  email: z.string().trim().toLowerCase().email().max(120),
  profession: z.enum(PROFESSIONS),
  examTarget: z.string().trim().min(1).max(40),
  yearOfStudy: z.enum(YEARS),
});

export async function PATCH(req: Request) {
  if (!(await sameOrigin())) return NextResponse.json({ error: "Bad origin" }, { status: 403 });
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Please log in" }, { status: 401 });
  const p = schema.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "Please check the details and try again." }, { status: 400 });
  if (!(await db.exam.findFirst({ where: { slug: p.data.examTarget, active: true } }))) {
    return NextResponse.json({ error: "Unknown exam" }, { status: 400 });
  }
  try {
    const { name, ...rest } = p.data;
    await db.user.update({ where: { id: user.id }, data: { ...rest, ...(name && user.role === "ADMIN" && { name }) } });
  } catch {
    return NextResponse.json({ error: "That email is already used by another account." }, { status: 409 });
  }
  return NextResponse.json({ ok: true });
}
