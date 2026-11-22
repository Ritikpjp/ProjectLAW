// Reports which integrations are configured. Run: npm run check-env
import { readFileSync, existsSync } from "node:fs";

const file = existsSync(".env.production") ? ".env.production" : existsSync(".env") ? ".env" : "(container environment)";
const env = { ...Object.fromEntries(
  (existsSync(file) ? readFileSync(file, "utf8") : "").split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1).replace(/^"|"$/g, "")]; })), ...process.env };

const has = (...k) => k.every((x) => env[x]);
const rows = [
  ["App secret (strong, not dev)", has("APP_SECRET") && env.APP_SECRET.length >= 32 && !env.APP_SECRET.startsWith("dev-only")],
  ["WhatsApp OTP: provider = meta", env.OTP_PROVIDER === "meta"],
  ["WhatsApp OTP: phone id, token, template", has("WHATSAPP_PHONE_NUMBER_ID", "WHATSAPP_TOKEN", "WHATSAPP_OTP_TEMPLATE")],
  ["Razorpay: key id + secret", has("RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET")],
  ["Razorpay: webhook secret", has("RAZORPAY_WEBHOOK_SECRET")],
  ["Razorpay key is live (rzp_live_)", (env.RAZORPAY_KEY_ID ?? "").startsWith("rzp_live_")],
  ["APP_URL is https", (env.APP_URL ?? "").startsWith("https://")],
  ["VERIFY_BASE_URL is https", (env.VERIFY_BASE_URL ?? "").startsWith("https://")],
  ["Admin mobile set (not the placeholder)", has("ADMIN_MOBILES") && !env.ADMIN_MOBILES.includes("9999999999")],
];
console.log(`Checked ${file}\n`);
for (const [name, ok] of rows) console.log(`${ok ? "OK     " : "MISSING"}  ${name}`);
