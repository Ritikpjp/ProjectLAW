# Go-live guide: WhatsApp OTP and the Razorpay payment window

Written for Vipulaw. Follow the phases in order. Provider screens and policies change, so where a step says "check", confirm on the provider's own page before relying on it.

## 0. Do you need a domain first?

| Item | Needed before a domain? |
|---|---|
| Build and test everything on your own computer | No |
| Razorpay **test mode** keys and test payments | No. Checkout works on `localhost` |
| Razorpay **webhook** while testing | Optional. Needs a public URL: a free tunnel (ngrok or cloudflared) works. The checkout callback already confirms payments, so the webhook is a safety net |
| Razorpay **live** approval (KYC) | **Yes**. They review a website that shows what you sell, contact details, and Terms, Privacy and Refund pages |
| WhatsApp API **test number** | No. Meta gives a test number and a temporary token |
| WhatsApp **business verification** and real customers | **Yes**, a website on a domain and ideally an email on that domain |
| Final launch | Yes: domain, HTTPS, hosting |

Short answer: **I do not need your domain to start.** I only need keys in `.env`. The domain becomes necessary for the live KYC and for putting the site online.

## 1. Part A: WhatsApp OTP (Meta Cloud API)

### What you need
- A Facebook account (personal, in good standing).
- A **dedicated mobile number** for WhatsApp: not already on WhatsApp or WhatsApp Business. A new SIM that can receive one SMS or call for verification.
- Business details: legal name, address, phone, website, business email.
- Documents for verification: GST or Udyam or business PAN, plus proof of address or phone (bill or bank statement).
- A live website on your domain showing the same name and address (for verification).

### Step A1: try it with Meta's test number (no domain, no verification)
1. Go to developers.facebook.com, log in, **Create App**, choose type **Business**.
2. Add the **WhatsApp** product to the app.
3. Open **WhatsApp > API Setup**. You will see a test phone number, a **Phone number ID**, and a temporary access token (valid about 24 hours).
4. Add your own mobile as a recipient and confirm the code Meta sends. Test numbers can message only the recipients you add (a small number).
5. Send the sample message from the page to check it reaches you.
6. Check whether your own Authentication template can be used with the test number. If the dashboard does not allow it, use the sample template only to confirm delivery, and finish with your real number in step A3.

### Step A2: create the Meta business account and verify it
1. business.facebook.com > **Create account**. Enter business name and business email, and confirm the email.
2. **Business Settings > Security Center > Start verification** (the menu name may differ).
3. Enter legal name, address, phone and website exactly as in your documents. Upload documents.
4. Wait for approval, usually a few days, sometimes up to two weeks. If rejected, the reason appears in Business Settings. The usual cause is a name or address mismatch, or a website that does not show the business details.

### Step A3: set up your real WhatsApp number and template
1. In the app: **WhatsApp > API Setup > Add phone number**. Enter your dedicated number and verify with the code.
2. Set a display name (Meta reviews it).
3. **WhatsApp Manager > Message templates > Create template**:
   - Category: **Authentication**
   - Name: `login_otp`, language: English
   - Enable the **copy code** button. Meta supplies the standard wording ("123456 is your verification code").
4. Wait for approval, usually minutes.
5. Create a **permanent token**: Business Settings > Users > **System users** > Add. Assign the app with full control, then **Generate token** with the `whatsapp_business_messaging` and `whatsapp_business_management` permissions. Copy it once and store it safely.
6. Add a payment method in WhatsApp Manager so messages can be billed (Meta charges per authentication message; check the current India rate, roughly ₹0.1 to ₹0.15).

### Step A4: put it in `.env`
```
OTP_PROVIDER="meta"
WHATSAPP_PHONE_NUMBER_ID="<phone number id>"
WHATSAPP_TOKEN="<system user token>"
WHATSAPP_OTP_TEMPLATE="login_otp"
WHATSAPP_OTP_LANG="en"
```
Restart the server, run `npm run check-env`, then sign up with your own number. The code should arrive on WhatsApp.

### Step A5: test properly
- A wrong code is rejected. The right code logs you in.
- Asking for a second code within 45 seconds is blocked. More than 5 codes an hour is blocked.
- A code older than 5 minutes fails.
- If sending fails, the exact reason is in the **server terminal** (for example a template name mismatch, an unapproved template, or an expired token). Send me that line and I will adjust the code.

## 2. Part B: Razorpay payment window

### What you need
- An email and mobile for the Razorpay login.
- For **live** payments, usually: PAN (yours or the business's), a bank account in the same name, address proof, a description of what you sell, and a live website with contact details and the three policy pages. Razorpay may ask for more depending on your business type.

### Step B1: test mode (no domain, no KYC)
1. Sign up at razorpay.com and verify your email and mobile.
2. Stay in **Test Mode** (the toggle in the dashboard).
3. **Account & Settings > API Keys > Generate Test Key**. Copy the **Key ID** (`rzp_test_...`) and the **Key Secret** (shown once).
4. Put in `.env`:
```
RAZORPAY_KEY_ID="rzp_test_xxxxxxxx"
RAZORPAY_KEY_SECRET="<secret>"
RAZORPAY_WEBHOOK_SECRET="<any long random text you invent>"
```
5. Restart the server. With a key present, the fake payment window turns off and the real Razorpay window opens.

### Step B2: make a test payment
1. Log in as a **student** (admins cannot buy).
2. Open a published product and click Buy. The Razorpay window opens.
3. Pay with UPI id `success@razorpay` to simulate success, or use Razorpay's published test card numbers (see their "Test cards" documentation). Use their failure UPI id to see a failed payment.
4. After success you land in **My library** and the PDF downloads, stamped with the buyer's details.

### Step B3: webhook (optional until you have a domain)
1. Dashboard > **Settings > Webhooks > Add**.
2. URL: `https://<public-address>/api/webhooks/razorpay`. While testing locally, run a tunnel (for example `ngrok http 3000`) and use its https address.
3. Secret: the same text as `RAZORPAY_WEBHOOK_SECRET`.
4. Tick the events `payment.captured`, `order.paid` and `payment.failed`.
5. Make a test payment and confirm the order is marked paid even if you close the window early.

### Step B4: go live
1. Put the site online on your domain first (see Part C).
2. Dashboard > **Activate your account** (KYC): business type, PAN, bank account, address, website URL, product description. Make sure Terms, Privacy and Refund pages are live with your real business name, address and support email.
3. Wait for approval (usually a few days; they may ask follow-up questions).
4. Generate **Live keys** (`rzp_live_...`). Create a new webhook in **live mode** with the same URL and a new secret.
5. Replace the three Razorpay values in the production `.env`.
6. Make one real payment of the lowest price with your own card or UPI to confirm everything, then refund it from the dashboard.
7. Check the fee schedule on Razorpay's pricing page: it is roughly a percentage per transaction plus GST, and settlement takes a couple of working days.

## 3. Part C: domain, hosting and launch

### Step C1: domain
- Buy a domain (about ₹700 to ₹1,000 a year) from any registrar.
- Create a business email on it (for example `support@yourdomain.com`) through the registrar or an email provider. Use it for Meta, Razorpay and the policy pages.

### Step C2: hosting
- Pick a VPS or Docker host that can run **Python** (needed for the PDF analysis). Typical cost ₹400 to ₹1,500 a month.
- Database: a managed Postgres (Neon or Supabase free plans are enough to start).
- PDFs: a private bucket (Cloudflare R2 or S3), or the server's disk with backups.
- I will prepare the Postgres switch, the bucket storage and the Docker files when you are ready.

### Step C3: production `.env`
```
NODE_ENV=production
APP_URL="https://yourdomain.com"
VERIFY_BASE_URL="https://yourdomain.com/v/"
APP_SECRET="<64 random hex characters>"
DATABASE_URL="<postgres connection string>"
ADMIN_MOBILES="+91<your real number>"
OTP_PROVIDER="meta"
WHATSAPP_PHONE_NUMBER_ID="..."
WHATSAPP_TOKEN="..."
WHATSAPP_OTP_TEMPLATE="login_otp"
RAZORPAY_KEY_ID="rzp_live_..."
RAZORPAY_KEY_SECRET="..."
RAZORPAY_WEBHOOK_SECRET="..."
```
Generate the secret with:
```
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
In production the app refuses to start with the dev OTP console or a weak `APP_SECRET`.

### Step C4: HTTPS
Put the app behind HTTPS (the host usually provides it, or use Caddy or nginx with a free certificate). The proxy must pass the visitor's IP (`X-Forwarded-For`) so rate limits work.

### Step C5: pre-launch checklist
- [ ] `npm run check-env` shows nothing missing.
- [ ] Your admin number logs in at `/admin/login`; a random number is refused there.
- [ ] A student can sign up, receive a real WhatsApp code and log in.
- [ ] A real payment completes, the order appears in Admin, and the PDF downloads stamped.
- [ ] The QR on the PDF opens `https://yourdomain.com/v/...` and shows "valid".
- [ ] Terms, Privacy and Refund pages show your business name, address and support email.
- [ ] Database and PDF backups are on.
- [ ] Admins cannot buy; students cannot open `/admin`.

## 4. Timeline and order of work
1. **Day 1:** buy the domain, create Razorpay (test keys), create the Meta developer app, start Udyam/GST if you have none. I can test payments and a first WhatsApp message as soon as the keys are in.
2. **Days 1 to 7:** Meta business verification, template approval, and policy pages reviewed.
3. **Week 1 to 2:** hosting live on the domain, then Razorpay KYC.
4. **After approvals:** live keys, real-payment test, launch with one low-priced title as a trial.

## 5. What I need from you, and when
| When | What |
|---|---|
| Now | Nothing except your choice to start. No domain needed |
| After step B1 | Tell me the test keys are in `.env` (never paste the secret in chat). I test the payment window |
| After step A1 or A3 | Tell me WhatsApp values are in `.env`. I test a real code |
| Before launch | Domain name and hosting choice, so I can prepare Postgres, storage and Docker |
