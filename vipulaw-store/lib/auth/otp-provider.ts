import { env } from "../env";

export interface OtpProvider {
  send(mobileE164: string, code: string): Promise<void>;
}

/** Dev: prints the code in the server console so you are not blocked on WhatsApp approval. */
const consoleProvider: OtpProvider = {
  async send(mobile, code) {
    console.log(`[OTP:dev] ${mobile} -> ${code}`);
  },
};

const adminOnlyConsoleProvider: OtpProvider = {
  async send(mobile, code) {
    if (!env.adminMobiles.includes(mobile)) throw new Error("Sign-ups are not open yet");
    console.log(`[OTP:admin-preview] ${mobile} -> ${code}`);
  },
};

/** Meta WhatsApp Cloud API using an approved *authentication* template. */
const metaProvider: OtpProvider = {
  async send(mobile, code) {
    const id = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const token = process.env.WHATSAPP_TOKEN;
    const template = process.env.WHATSAPP_OTP_TEMPLATE;
    if (!id || !token || !template) throw new Error("WhatsApp env vars not configured");
    const res = await fetch(`https://graph.facebook.com/v21.0/${id}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: mobile.replace("+", ""),
        type: "template",
        template: {
          name: template,
          language: { code: process.env.WHATSAPP_OTP_LANG ?? "en" },
          components: [
            { type: "body", parameters: [{ type: "text", text: code }] },
            { type: "button", sub_type: "url", index: "0", parameters: [{ type: "text", text: code }] },
          ],
        },
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) throw new Error(`WhatsApp send failed (${res.status})`);
  },
};

export function getOtpProvider(): OtpProvider {
  if (env.otpProvider === "meta") return metaProvider;
  if (env.isProd) {
    // Pre-launch only: before WhatsApp is approved, admins can still log in (codes appear in the server log).
    // Customers get no code, so nobody else can sign up until a real provider is configured.
    if (process.env.ALLOW_CONSOLE_OTP_FOR_ADMINS === "true") return adminOnlyConsoleProvider;
    throw new Error("OTP_PROVIDER must be a real provider in production");
  }
  return consoleProvider;
}
