import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, sameOrigin } from "@/lib/auth/session";
import { ingestPdfs } from "@/lib/pdf/ingest";

export const maxDuration = 300;

// Adds PDFs to an existing product (bundle). Existing buyers see the new files in their library.
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!(await sameOrigin())) return NextResponse.json({ error: "Bad origin" }, { status: 403 });
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await ctx.params;
  const product = await db.product.findUnique({ where: { id }, include: { _count: { select: { files: true } } } });
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const form = await req.formData().catch(() => null);
  const uploads = (form?.getAll("files") ?? []).filter((f): f is File => f instanceof File && f.size > 0);
  if (uploads.length === 0) return NextResponse.json({ error: "Attach at least one PDF." }, { status: 400 });
  if (product._count.files + uploads.length > 30) return NextResponse.json({ error: "At most 30 files per product." }, { status: 400 });

  try {
    const { created, warnings } = await ingestPdfs(uploads, product.stampProfile as "HEADER" | "FOOTER", product._count.files);
    await db.productFile.createMany({ data: created.map((c) => ({ ...c, productId: id })) });
    return NextResponse.json({ ok: true, warnings });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Upload failed" }, { status: 400 });
  }
}
