import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin, sameOrigin } from "@/lib/auth/session";

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
const add = z.object({ examId: z.string().min(1).max(40), name: z.string().trim().min(2).max(60) });
const remove = z.object({ sectionId: z.string().min(1).max(40) });

async function guard() {
  if (!(await sameOrigin())) return NextResponse.json({ error: "Bad origin" }, { status: 403 });
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return null;
}

export async function POST(req: Request) {
  const denied = await guard();
  if (denied) return denied;
  const p = add.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "Enter a section name (2 to 60 characters)." }, { status: 400 });
  const slug = slugify(p.data.name);
  if (!slug) return NextResponse.json({ error: "Use letters or numbers in the name." }, { status: 400 });
  const exam = await db.exam.findUnique({ where: { id: p.data.examId }, include: { _count: { select: { sections: true } } } });
  if (!exam) return NextResponse.json({ error: "Unknown exam" }, { status: 400 });
  if (await db.section.findUnique({ where: { examId_slug: { examId: exam.id, slug } } })) {
    return NextResponse.json({ error: "That section already exists." }, { status: 409 });
  }
  await db.section.create({ data: { examId: exam.id, slug, name: p.data.name, sortOrder: exam._count.sections } });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const denied = await guard();
  if (denied) return denied;
  const p = remove.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const section = await db.section.findUnique({ where: { id: p.data.sectionId }, include: { _count: { select: { products: true } } } });
  if (!section) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (section._count.products > 0) return NextResponse.json({ error: "Products still use this section. Move or delete them first." }, { status: 409 });
  await db.section.delete({ where: { id: section.id } });
  return NextResponse.json({ ok: true });
}
