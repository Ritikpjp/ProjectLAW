import { createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { env } from "./env";

export function hmac(data: string, purpose: string): string {
  return createHmac("sha256", env.appSecret).update(`${purpose}:${data}`).digest("hex");
}

export function safeEqualHex(a: string, b: string): boolean {
  const x = Buffer.from(a, "hex");
  const y = Buffer.from(b, "hex");
  return x.length === y.length && x.length > 0 && timingSafeEqual(x, y);
}

export const randomToken = () => randomBytes(32).toString("base64url");
export const randomOtp = () => String(randomInt(0, 1_000_000)).padStart(6, "0");
export const newLicenceId = () => "VL-" + randomBytes(5).toString("hex").toUpperCase();
