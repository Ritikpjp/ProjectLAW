function req(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var ${name}`);
  return v;
}

export const env = {
  get appSecret() {
    const s = req("APP_SECRET");
    if (process.env.NODE_ENV === "production" && (s.length < 32 || s.startsWith("dev-only")))
      throw new Error("APP_SECRET must be a strong random value in production");
    return s;
  },
  get appUrl() { return process.env.APP_URL ?? "http://localhost:3000"; },
  get otpProvider() { return process.env.OTP_PROVIDER ?? "console"; },
  get razorpayKeyId() { return process.env.RAZORPAY_KEY_ID ?? ""; },
  get razorpayKeySecret() { return process.env.RAZORPAY_KEY_SECRET ?? ""; },
  get razorpayWebhookSecret() { return process.env.RAZORPAY_WEBHOOK_SECRET ?? ""; },
  get adminMobiles() {
    return (process.env.ADMIN_MOBILES ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  },
  get verifyBase() { return process.env.VERIFY_BASE_URL ?? "http://localhost:3000/v/"; },
  get isProd() { return process.env.NODE_ENV === "production"; },
};
