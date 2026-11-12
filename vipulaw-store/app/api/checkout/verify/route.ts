import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getUser, sameOrigin } from "@/lib/auth/session";
import { markPaid, verifyPaymentSignature } from "@/lib/payments/razorpay";

const body = z.object({
  razorpay_order_id: z.string().min(1).max(60),
  razorpay_payment_id: z.string().min(1).max(60),
  razorpay_signature: z.string().min(1).max(200),
});

export async function POST(req: Request) {
  if (!(await sameOrigin())) return NextResponse.json({ error: "Bad origin" }, { status: 403 });
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Please log in." }, { status: 401 });
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const d = parsed.data;

  const order = await db.order.findUnique({ where: { razorpayOrderId: d.razorpay_order_id } });
  if (!order || order.userId !== user.id) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (!verifyPaymentSignature(d.razorpay_order_id, d.razorpay_payment_id, d.razorpay_signature)) {
    return NextResponse.json({ error: "Payment could not be verified." }, { status: 400 });
  }
  const ok = await markPaid(order.razorpayOrderId, d.razorpay_payment_id, order.amountPaise);
  return ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "Could not confirm payment." }, { status: 409 });
}
