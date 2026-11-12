import test from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";

process.env.APP_SECRET = "test-secret-test-secret-test-secret-0000";
process.env.RAZORPAY_KEY_SECRET = "key_secret_for_tests";
process.env.RAZORPAY_WEBHOOK_SECRET = "webhook_secret_for_tests";

const { verifyPaymentSignature, verifyWebhookSignature } = await import("../lib/payments/razorpay");
const sign = (secret: string, data: string) => createHmac("sha256", secret).update(data).digest("hex");

test("checkout callback: valid signature accepted", () => {
  assert.equal(verifyPaymentSignature("order_1", "pay_1", sign("key_secret_for_tests", "order_1|pay_1")), true);
});
test("checkout callback: wrong payment id, wrong secret and garbage rejected", () => {
  const good = sign("key_secret_for_tests", "order_1|pay_1");
  assert.equal(verifyPaymentSignature("order_1", "pay_2", good), false);
  assert.equal(verifyPaymentSignature("order_1", "pay_1", sign("other", "order_1|pay_1")), false);
  assert.equal(verifyPaymentSignature("order_1", "pay_1", "zz"), false);
  assert.equal(verifyPaymentSignature("order_1", "pay_1", ""), false);
});
test("webhook: signature is over the exact raw body", () => {
  const body = '{"event":"payment.captured"}';
  assert.equal(verifyWebhookSignature(body, sign("webhook_secret_for_tests", body)), true);
  assert.equal(verifyWebhookSignature(body + " ", sign("webhook_secret_for_tests", body)), false);
});
