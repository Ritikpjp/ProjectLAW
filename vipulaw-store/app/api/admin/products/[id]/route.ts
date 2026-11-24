import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin, sameOrigin } from "@/lib/auth/session";
import { deleteFile } from "@/lib/storage";
import { STATE_SLUGS } from "@/lib/states";

const patch = z.object({
  status: z.enum(["DRAFT", "PUBLISHED"]).optional(),
  priceRupees: z.number().int().min(0).max(100000).optional(),
  title: z.string().trim().min(3).max(140).optional(),
  description: z.string().trim().max(2000).optional(),
  state: z.union([z.literal(""), z.enum(STATE_SLUGS)]).optional(),
});

async function guard() {
  if (!(await sameOrigin())) return NextResponse.json({ error: "Bad origin" }, { status: 403 });
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return null;
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = await guard();
  if (denied) return denied;
  const parsed = patch.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const { id } = await ctx.params;
  const { status, priceRupees, title, description, state } = parsed.data;
  try {
    await db.product.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(priceRupees !== undefined && { pricePaise: priceRupees * 100 }),
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(state !== undefined && { state: state || null }),
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

// A product that has ever been ordered cannot be deleted (buyers keep access); unpublish it instead.
export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = await guard();
  if (denied) return denied;
  const { id } = await ctx.params;
  const product = await db.product.findUnique({ where: { id }, include: { files: true, _count: { select: { orders: true } } } });
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (product._count.orders > 0) {
    return NextResponse.json({ error: "This product has orders, so it cannot be deleted. Unpublish it instead." }, { status: 409 });
  }
  await db.product.delete({ where: { id } });
  await Promise.all(product.files.flatMap((f) => [deleteFile("orig", f.storageKey), deleteFile("preview", f.previewKey)]));
  return NextResponse.json({ ok: true });
}
