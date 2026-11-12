import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getUser, sameOrigin } from "@/lib/auth/session";
import { isFakeGateway, markPaid } from "@/lib/payments/razorpay";

/** Local-development stand-in for Razorpay. Disabled whenever real keys exist or NODE_ENV=production. */
export async function POST(req: Request) {
  if (!isFakeGateway()) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!(await sameOrigin())) return NextResponse.json({ error: "Bad origin" }, { status: 403 });
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Please log in." }, { status: 401 });
  const parsed = z.object({ razorpayOrderId: z.string().max(60) }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const order = await db.order.findUnique({ where: { razorpayOrderId: parsed.data.razorpayOrderId } });
  if (!order || order.userId !== user.id) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  await markPaid(order.razorpayOrderId, `pay_dev_${order.id}`, order.amountPaise);
  return NextResponse.json({ ok: true });
}
