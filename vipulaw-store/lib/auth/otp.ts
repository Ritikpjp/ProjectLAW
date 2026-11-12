import { db } from "../db";
import { hmac, randomOtp, safeEqualHex } from "../crypto";
import { rateLimit } from "../ratelimit";
import { getOtpProvider } from "./otp-provider";

const TTL_MS = 5 * 60_000;
const MAX_ATTEMPTS = 5;

export type SendResult = { ok: true } | { ok: false; error: string };

export async function sendOtp(mobile: string, ip: string): Promise<SendResult> {
  // 1 per 45s and 5 per hour per number; 20 per hour per IP.
  if (!(await rateLimit(`otp:cool:${mobile}`, 1, 45))) return { ok: false, error: "Please wait a little before requesting another code." };
  if (!(await rateLimit(`otp:hr:${mobile}`, 5, 3600))) return { ok: false, error: "Too many codes requested. Try again in an hour." };
  if (!(await rateLimit(`otp:ip:${ip}`, 20, 3600))) return { ok: false, error: "Too many requests from your network. Try later." };

  const code = randomOtp();
  await db.otpCode.deleteMany({ where: { mobile } });
  await db.otpCode.create({
    data: { mobile, codeHash: hmac(`${mobile}:${code}`, "otp"), expiresAt: new Date(Date.now() + TTL_MS) },
  });
  try {
    await getOtpProvider().send(mobile, code);
  } catch (e) {
    console.error("OTP send failed", e);
    return { ok: false, error: "Could not send the WhatsApp code. Please try again." };
  }
  return { ok: true };
}

export async function verifyOtp(mobile: string, code: string, ip: string): Promise<boolean> {
  if (!(await rateLimit(`otpv:ip:${ip}`, 30, 900))) return false;
  const row = await db.otpCode.findFirst({ where: { mobile, consumedAt: null }, orderBy: { createdAt: "desc" } });
  if (!row || row.expiresAt < new Date() || row.attempts >= MAX_ATTEMPTS) return false;
  // Count the attempt first so parallel guesses cannot exceed the limit.
  const bumped = await db.otpCode.updateMany({
    where: { id: row.id, attempts: { lt: MAX_ATTEMPTS }, consumedAt: null },
    data: { attempts: { increment: 1 } },
  });
  if (bumped.count !== 1) return false;
  if (!safeEqualHex(row.codeHash, hmac(`${mobile}:${code}`, "otp"))) return false;
  const used = await db.otpCode.updateMany({ where: { id: row.id, consumedAt: null }, data: { consumedAt: new Date() } });
  return used.count === 1;
}
