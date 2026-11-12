# Vipulaw store

PDF notes shop for law aspirants. Next.js 16, Prisma, Razorpay, WhatsApp OTP login, per-buyer stamped PDFs.

## Run locally

```bash
npm install
npx prisma db push && npm run seed
pip install pymupdf numpy        # QR placement analysis at upload time
npm run dev
```

Dev mode needs no accounts: the OTP is printed in the server console, and a fake gateway replaces Razorpay.
Open the site, sign up with the mobile listed in `ADMIN_MOBILES` (`.env`) to get the Admin page.
`node tests/e2e.mjs http://localhost:3000 <dev log file> <some.pdf>` runs the end-to-end checks.

## Structure

- Exams (5) and their sections (Paper 1/2, Prelims/Mains...) are rows in the DB, editable without code.
- Product types: Bare Acts, Practice Books, PYQs, Syllabus, Notes. `MOCK_TEST` is reserved in the schema; no UI yet.
- A product can hold several PDFs (bundles). One purchase unlocks all of them.
- Admin (`/admin`): upload products and bundles, edit title/description/price, publish or unpublish, add or remove PDFs, delete unsold products, manage exam sections, see revenue and recent paid orders with buyer details.
- Buyers: sign up with a mobile code, search, preview, pay, download from My library, edit profile (name and mobile are locked because they are printed on PDFs).
- Upload: original goes to private storage, a 3-page preview is cut, QR slots per page are computed once (`tools/analyze_slots.py`).
- Download: the original is stamped for the buyer on request (header or footer line + small QR per page, cover left clean) and cached per order.
- The QR holds `VERIFY_BASE_URL/<licence>.<page>`. `/v/...` shows validity to the public and the buyer's identity to admins only.

## Before going live (checklist)

1. **Database:** change `provider` in `prisma/schema.prisma` to `postgresql`, set a Postgres `DATABASE_URL` (Supabase/Neon), `prisma db push`.
2. **Storage:** `lib/storage.ts` writes to local disk. Swap for S3/R2/Supabase Storage (private bucket) if the host has no persistent disk.
3. **Hosting needs Python** (PyMuPDF + numpy) for upload analysis. Use a VPS or Docker host (Render, Railway, Fly), not plain serverless.
4. **Secrets:** a random `APP_SECRET` (32+ bytes), `NODE_ENV=production`. The app refuses dev defaults in production.
5. **Razorpay:** live keys, and a webhook to `/api/webhooks/razorpay` with events `payment.captured`, `order.paid`, `payment.failed`; set `RAZORPAY_WEBHOOK_SECRET`.
6. **WhatsApp OTP:** `OTP_PROVIDER=meta` with `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_TOKEN`, `WHATSAPP_OTP_TEMPLATE` (an approved authentication template), or add an MSG91/Gupshup provider in `lib/auth/otp-provider.ts`.
7. **HTTPS and a reverse proxy** that sets `X-Forwarded-For` (rate limits key off it). Set `APP_URL` and `VERIFY_BASE_URL` to the real domain.
8. **Legal pages** (`/terms`, `/privacy`, `/refund-policy`) are drafts. Have them reviewed and add business details. Razorpay requires them.
9. **Backups** of the database and the storage bucket.

## Security measures in place

- Passwordless login: 6-digit WhatsApp OTP, HMAC-hashed at rest, 5-minute expiry, 5 attempts, per-number and per-IP rate limits.
- Sessions: random 256-bit token in an HttpOnly, SameSite=Lax cookie (Secure in production); only the hash is stored.
- CSRF: every state-changing endpoint requires a same-origin `Origin` header.
- Prices come only from the database. Payments are verified by HMAC signature (callback and webhook), amount-matched, and idempotent.
- Originals never leave private storage. Downloads require a paid order owned by the session user, are rate-limited, capped at 10 per file, and logged.
- Admin routes check the role server-side; non-admins get a 404 on `/admin`.
- Uploads: PDF magic bytes + parse check, 100 MB cap, server-generated storage keys (no user-controlled paths).
- Input validation with zod everywhere; security headers and a CSP (production) allowing only Razorpay as third party.

## Known limits

- A buyer can still screenshot or re-print pages. Stamping makes leaks traceable, not impossible.
- Names with non-Latin characters print as `?` in the stamp (standard PDF font). Embed a Unicode font if you need Hindi names.
- The footer stamp position is tuned for the practice-book template (gold rule at ~775pt from the top).
