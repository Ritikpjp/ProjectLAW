import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin, sameOrigin } from "@/lib/auth/session";
import { SELLABLE_TYPES } from "@/lib/catalog";
import { ingestPdfs } from "@/lib/pdf/ingest";

export const maxDuration = 300;

const meta = z.object({
  title: z.string().trim().min(3).max(140),
  description: z.string().trim().max(2000).default(""),
  examId: z.string().min(1).max(40),
  sectionId: z.string().max(40).optional(),
  type: z.enum(SELLABLE_TYPES as [string, ...string[]]),
  priceRupees: z.coerce.number().int().min(1).max(100000),
  stampProfile: z.enum(["HEADER", "FOOTER"]),
  publish: z.enum(["on"]).optional(),
});

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);

export async function POST(req: Request) {
  if (!(await sameOrigin())) return NextResponse.json({ error: "Bad origin" }, { status: 403 });
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Invalid form" }, { status: 400 });
  const parsed = meta.safeParse(Object.fromEntries([...form.entries()].filter(([, v]) => typeof v === "string")));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid details" }, { status: 400 });
  const m = parsed.data;

  const uploads = form.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (uploads.length === 0) return NextResponse.json({ error: "Attach at least one PDF." }, { status: 400 });
  if (uploads.length > 30) return NextResponse.json({ error: "At most 30 files per product." }, { status: 400 });

  const exam = await db.exam.findUnique({ where: { id: m.examId } });
  if (!exam) return NextResponse.json({ error: "Unknown exam" }, { status: 400 });
  if (m.sectionId && !(await db.section.findFirst({ where: { id: m.sectionId, examId: exam.id } }))) {
    return NextResponse.json({ error: "Section does not belong to this exam" }, { status: 400 });
  }

  let ingested;
  try {
    ingested = await ingestPdfs(uploads, m.stampProfile);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Upload failed" }, { status: 400 });
  }

  const product = await db.product.create({
    data: {
      slug: `${slugify(m.title)}-${randomBytes(3).toString("hex")}`,
      title: m.title, description: m.description, examId: exam.id, sectionId: m.sectionId || null,
      type: m.type, pricePaise: m.priceRupees * 100, stampProfile: m.stampProfile,
      status: m.publish ? "PUBLISHED" : "DRAFT",
      files: { create: ingested.created },
    },
  });
  return NextResponse.json({ ok: true, slug: product.slug, warnings: ingested.warnings });
}
