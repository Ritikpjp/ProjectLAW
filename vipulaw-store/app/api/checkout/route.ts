import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { newLicenceId } from "@/lib/crypto";
import { randomBytes } from "node:crypto";
import { getUser, sameOrigin } from "@/lib/auth/session";
import { rateLimit } from "@/lib/ratelimit";
import { createGatewayOrder, isFakeGateway } from "@/lib/payments/razorpay";

const body = z.object({ productId: z.string().min(1).max(40) });

export async function POST(req: Request) {
  if (!(await sameOrigin())) return NextResponse.json({ error: "Bad origin" }, { status: 403 });
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Please log in first." }, { status: 401 });
  if (user.role === "ADMIN") return NextResponse.json({ error: "Admin accounts cannot buy. Use a student account to test a purchase." }, { status: 403 });
  if (!(await rateLimit(`checkout:${user.id}`, 20, 3600))) return NextResponse.json({ error: "Too many attempts." }, { status: 429 });

  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  // Price comes from the database. The browser never supplies an amount.
  const product = await db.product.findFirst({ where: { id: parsed.data.productId, status: "PUBLISHED" } });
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  const owned = await db.order.findFirst({ where: { userId: user.id, productId: product.id, status: "PAID" } });
  if (owned) return NextResponse.json({ error: "You already own this. Find it in My library." }, { status: 409 });

  const licenceId = newLicenceId();

  // Free title: no payment. The order is created already paid so the stamped download works unchanged.
  if (product.pricePaise === 0) {
    const order = await db.order.create({
      data: {
        userId: user.id, productId: product.id, amountPaise: 0, status: "PAID", paidAt: new Date(),
        razorpayOrderId: `free_${randomBytes(10).toString("hex")}`, licenceId,
      },
    });
    return NextResponse.json({ free: true, orderId: order.id });
  }
  let razorpayOrderId: string;
  try {
    razorpayOrderId = await createGatewayOrder(product.pricePaise, licenceId);
  } catch (e) {
    console.error("Razorpay order failed", e);
    return NextResponse.json({ error: "Payment service unavailable. Try again shortly." }, { status: 502 });
  }
  const order = await db.order.create({
    data: { userId: user.id, productId: product.id, amountPaise: product.pricePaise, razorpayOrderId, licenceId },
  });

  return NextResponse.json({
    orderId: order.id,
    razorpayOrderId,
    keyId: env.razorpayKeyId,
    amount: product.pricePaise,
    name: product.title,
    fake: isFakeGateway(),
    prefill: { name: user.name, email: user.email, contact: user.mobile },
  });
}
