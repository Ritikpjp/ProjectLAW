import { createHash } from "node:crypto";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { clientIp, getUser } from "@/lib/auth/session";
import { rateLimit } from "@/lib/ratelimit";
import { getCached, getFile, putCached } from "@/lib/storage";
import { stampPdf, type Profile } from "@/lib/pdf/stamp";
import type { Slot } from "@/lib/pdf/analyze";

const MAX_DOWNLOADS_PER_FILE = 10;
const deny = (status: number, msg: string) => new Response(msg, { status, headers: { "Cache-Control": "no-store" } });

export async function GET(_: Request, ctx: { params: Promise<{ orderId: string; fileId: string }> }) {
  const { orderId, fileId } = await ctx.params;
  const user = await getUser();
  if (!user) return deny(401, "Please log in.");

  // Ownership is enforced in the query itself: someone else's order id simply does not match.
  const order = await db.order.findFirst({
    where: { id: orderId, userId: user.id, status: "PAID" },
    include: { product: true },
  });
  const file = order && (await db.productFile.findFirst({ where: { id: fileId, productId: order.productId } }));
  if (!order || !file) return deny(404, "Not found");

  if (!(await rateLimit(`dl:${order.id}`, 30, 3600))) return deny(429, "Too many downloads. Try again later.");
  const used = await db.download.count({ where: { orderId: order.id, fileId: file.id } });
  if (used >= MAX_DOWNLOADS_PER_FILE) return deny(429, "Download limit reached. Contact support if you need help.");

  const cacheName = `${order.id}:${file.id}`;
  let out = await getCached(cacheName);
  if (!out) {
    const original = await getFile("orig", file.storageKey);
    const stamped = await stampPdf(
      original,
      { name: user.name, mobile: user.mobile, email: user.email, licenceId: order.licenceId },
      order.product.stampProfile as Profile,
      JSON.parse(file.slotsJson) as Slot[],
      env.verifyBase,
    );
    await putCached(cacheName, stamped);
    out = Buffer.from(stamped);
  }

  await db.download.create({
    data: { orderId: order.id, fileId: file.id, ipHash: createHash("sha256").update(await clientIp()).digest("hex").slice(0, 16) },
  });

  const safeName = `${file.label}`.replace(/[^\w\- ]+/g, "").trim().slice(0, 80) || "notes";
  return new Response(new Uint8Array(out), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${safeName}.pdf"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
