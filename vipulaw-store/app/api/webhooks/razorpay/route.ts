import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { markPaid, verifyWebhookSignature } from "@/lib/payments/razorpay";

/** Source of truth for payments: still works if the buyer closes the tab before the callback. */
export async function POST(req: Request) {
  const raw = await req.text(); // signature is over the exact raw body
  const sig = req.headers.get("x-razorpay-signature") ?? "";
  if (!verifyWebhookSignature(raw, sig)) return NextResponse.json({ error: "Bad signature" }, { status: 400 });

  const eventId = req.headers.get("x-razorpay-event-id");
  if (eventId && (await db.webhookEvent.findUnique({ where: { id: eventId } }))) {
    return NextResponse.json({ ok: true, duplicate: true }); // already processed
  }

  let evt: { event?: string; payload?: { payment?: { entity?: { id?: string; order_id?: string; amount?: number; status?: string } } } };
  try { evt = JSON.parse(raw); } catch { return NextResponse.json({ error: "Bad JSON" }, { status: 400 }); }

  const p = evt.payload?.payment?.entity;
  if ((evt.event === "payment.captured" || evt.event === "order.paid") && p?.id && p.order_id && typeof p.amount === "number") {
    await markPaid(p.order_id, p.id, p.amount);
  } else if (evt.event === "payment.failed" && p?.order_id) {
    await db.order.updateMany({ where: { razorpayOrderId: p.order_id, status: "CREATED" }, data: { status: "FAILED" } });
  }
  // Recorded only after success, so a failed attempt is retried by Razorpay. markPaid is idempotent anyway.
  if (eventId) await db.webhookEvent.create({ data: { id: eventId } }).catch(() => {});
  return NextResponse.json({ ok: true });
}
