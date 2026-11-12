import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, sameOrigin } from "@/lib/auth/session";
import { deleteFile } from "@/lib/storage";

// Files that buyers may already hold (product has orders) or the last file of a product cannot be removed.
export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string; fileId: string }> }) {
  if (!(await sameOrigin())) return NextResponse.json({ error: "Bad origin" }, { status: 403 });
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id, fileId } = await ctx.params;
  const file = await db.productFile.findFirst({
    where: { id: fileId, productId: id },
    include: { product: { include: { _count: { select: { orders: true, files: true } } } } },
  });
  if (!file) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (file.product._count.orders > 0) return NextResponse.json({ error: "This product has orders, so its files cannot be removed." }, { status: 409 });
  if (file.product._count.files <= 1) return NextResponse.json({ error: "A product needs at least one file." }, { status: 409 });
  await db.productFile.delete({ where: { id: fileId } });
  await Promise.all([deleteFile("orig", file.storageKey), deleteFile("preview", file.previewKey)]);
  return NextResponse.json({ ok: true });
}
