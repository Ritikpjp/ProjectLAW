# Going live: WhatsApp OTP and Razorpay

Only you can do the account steps below (they need your identity, business documents and bank account).
Everything on the code side is already wired. Fill the values into `.env`, then run `npm run check-env`.

## 1. WhatsApp OTP through Meta Cloud API

1. Create a **Meta Business account** at business.facebook.com and complete **Business Verification** (GST certificate, PAN or similar; takes a few days).
2. At developers.facebook.com create an app, type **Business**, and add the **WhatsApp** product.
3. Add a **dedicated phone number** that is not already on WhatsApp or WhatsApp Business. A cheap new SIM works. Verify it.
4. In WhatsApp Manager > Message templates, create a template:
   - Category: **Authentication**
   - Name: e.g. `login_otp`, language: English
   - Enable **copy code button**. Meta supplies the standard wording ("*123456* is your verification code").
   - Wait for approval (usually minutes).
5. Create a **permanent access token**: Business Settings > Users > System users > add a system user, assign the app, generate a token with `whatsapp_business_messaging` permission.
6. Put these in `.env` (never commit them):

```
OTP_PROVIDER="meta"
WHATSAPP_PHONE_NUMBER_ID="<from the WhatsApp > API Setup page>"
WHATSAPP_TOKEN="<system user token>"
WHATSAPP_OTP_TEMPLATE="login_otp"
WHATSAPP_OTP_LANG="en"
```

Cost is roughly ₹0.1 to 0.15 per OTP. Test with your own number first.
If template delivery fails with a parameter error, tell me the exact error and I will adjust the payload.

## 2. Razorpay

1. Sign up at razorpay.com with your business email. You can explore **Test Mode** immediately, before KYC.
2. **Test keys:** Dashboard > Account & Settings > API Keys > Generate Test Key. You get a Key ID (`rzp_test_...`) and a Key Secret (shown once).
3. **Webhook:** Settings > Webhooks > Add. URL: `https://YOUR-DOMAIN/api/webhooks/razorpay`. Choose a secret you invent. Tick `payment.captured`, `order.paid`, `payment.failed`.
   For local testing use a tunnel (ngrok or cloudflared) to expose your dev server.
4. Put in `.env`:

```
RAZORPAY_KEY_ID="rzp_test_xxxxxxxx"
RAZORPAY_KEY_SECRET="..."
RAZORPAY_WEBHOOK_SECRET="the secret you invented"
```

   With a key present, the fake gateway turns itself off and the real Razorpay window opens. Pay with Razorpay's test UPI id `success@razorpay` or test cards from their docs.
5. **Go live:** complete **KYC** (business PAN, bank account, website with the three policy pages live, product description). After approval generate **Live keys** (`rzp_live_...`) and add a live-mode webhook with the same URL.

## 3. Before real users

- Hosting that supports Python and a persistent disk or a cloud bucket (see README checklist).
- `NODE_ENV=production`, a random `APP_SECRET`, https `APP_URL` and `VERIFY_BASE_URL`.
- Policies reviewed by a lawyer, with your business name and support contact.

## Check your setup

```
npm run check-env
npm test
```
