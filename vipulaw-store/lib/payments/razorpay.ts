import Razorpay from "razorpay";
import { createHmac, randomBytes } from "node:crypto";
import { db } from "../db";
import { env } from "../env";
import { safeEqualHex } from "../crypto";

/** With no keys configured (local dev only) a fake gateway is used so the flow can be tested end to end. */
export const isFakeGateway = () => !env.isProd && !env.razorpayKeyId;

export async function createGatewayOrder(amountPaise: number, receipt: string): Promise<string> {
  if (isFakeGateway()) return `order_dev_${randomBytes(8).toString("hex")}`;
  const rz = new Razorpay({ key_id: env.razorpayKeyId, key_secret: env.razorpayKeySecret });
  const o = await rz.orders.create({ amount: amountPaise, currency: "INR", receipt });
  return o.id;
}

const hex = (secret: string, data: string | Buffer) => createHmac("sha256", secret).update(data).digest("hex");

/** Checkout callback: signature = HMAC_SHA256(order_id|payment_id, key_secret) */
export function verifyPaymentSignature(orderId: string, paymentId: string, signature: string): boolean {
  if (!env.razorpayKeySecret) return false;
  return safeEqualHex(hex(env.razorpayKeySecret, `${orderId}|${paymentId}`), signature);
}

/** Webhook: signature = HMAC_SHA256(raw body, webhook_secret) */
export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  if (!env.razorpayWebhookSecret) return false;
  return safeEqualHex(hex(env.razorpayWebhookSecret, rawBody), signature);
}

/**
 * Idempotent: safe to call from both the browser callback and the webhook.
 * The amount must match what we stored when the order was created.
 */
export async function markPaid(razorpayOrderId: string, paymentId: string, amountPaise: number): Promise<boolean> {
  const order = await db.order.findUnique({ where: { razorpayOrderId } });
  if (!order || order.amountPaise !== amountPaise) return false;
  if (order.status === "PAID") return true;
  const r = await db.order.updateMany({
    where: { id: order.id, status: { in: ["CREATED", "FAILED"] } },
    data: { status: "PAID", razorpayPaymentId: paymentId, paidAt: new Date() },
  });
  if (r.count === 1) return true;
  return (await db.order.findUnique({ where: { id: order.id } }))?.status === "PAID";
}
