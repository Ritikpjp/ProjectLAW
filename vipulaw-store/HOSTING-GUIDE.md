# Hosting Vipulaw: free server + GoDaddy domain

## Recommendation

**Oracle Cloud "Always Free" VM + Docker + Caddy (free HTTPS) + your GoDaddy domain.**

Why this one: the app needs (a) Python for the PDF stamping, (b) a disk that keeps your uploaded PDFs and database, (c) no sleeping. Most "free" hosts fail one of these:

| Option | Python | Keeps files/DB | Sleeps | Verdict |
|---|---|---|---|---|
| Vercel / Netlify | no | no | - | Cannot run this app |
| Render free | yes | **no** (disk wiped on restart) | yes | Loses PDFs and users |
| Fly.io / Railway | yes | yes | - | No longer free |
| **Oracle Always Free VM** | yes | **yes** (up to 200 GB) | no | **Best free option** |

Cost: server Rs 0 forever (if you stay inside Always Free), domain about Rs 700-1,200/year at GoDaddy. Nothing else.

Honest caveats:
- Oracle asks for a credit/debit card at signup (verification only, Rs 0 charged on Always Free). Some cards get rejected; try another card. Region: pick **Mumbai** or Hyderabad (cannot be changed later).
- ARM "Ampere" instances are sometimes "out of capacity". Retry later, or use the free AMD micro VM (1 GB RAM, add 2 GB swap; slower builds but works).
- It is a server you look after: updates and backups are yours (steps below).

If you would rather pay a little for less hassle later, a Rs 400-600/month VPS (Hetzner, DigitalOcean, Hostinger) works with exactly the same files.

## One-time steps

### 1. Buy the domain (GoDaddy)
Buy `yourname.in` or `.com`. Skip add-ons (hosting, email, privacy upsells are optional). Razorpay and Meta both want a business email on the domain later; GoDaddy sells it, or use free Zoho Mail on the domain.

### 2. Create the Oracle VM
1. Sign up at cloud.oracle.com, home region Mumbai.
2. Compute > Instances > Create. Image **Ubuntu 22.04**, shape **VM.Standard.A1.Flex** (2 OCPU, 12 GB) marked "Always Free".
3. Paste your SSH public key (or let it generate one and download it).
4. Networking: allow ingress **TCP 80 and 443** in the subnet's Security List (0.0.0.0/0). Port 22 is already open.
5. Note the **public IP**.
6. On the VM also open the OS firewall:
   ```
   sudo iptables -I INPUT 6 -p tcp --dport 80 -j ACCEPT
   sudo iptables -I INPUT 6 -p tcp --dport 443 -j ACCEPT
   sudo netfilter-persistent save
   ```

### 3. Point the domain to the VM
GoDaddy > My Products > DNS for your domain:
- **A** record, name `@`, value = the VM public IP.
- **A** record, name `www`, value = the same IP.
- Delete GoDaddy's default "parked" A record if present.

Takes 5-60 minutes. Caddy then fetches a free HTTPS certificate on its own.

### 4. Install Docker on the VM
```
ssh ubuntu@<VM-IP>
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER && exit      # log in again
```

### 5. Put the code on the VM
Push the project to a **private** GitHub repo, then on the VM:
```
git clone https://github.com/<you>/<repo>.git app && cd app/vipulaw-store
```
(Or copy the `vipulaw-store` folder with WinSCP/`scp`. Do not copy `node_modules`, `.next`, `storage`, `.env`.)

### 6. Configure
```
cp .env.production.example .env.production
nano .env.production
```
Fill in:
- `APP_SECRET`: run `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` on your PC and paste.
- `APP_URL=https://yourdomain.in` and `VERIFY_BASE_URL=https://yourdomain.in/v/`
- `ADMIN_MOBILES` = your real mobile in +91 format.
- Leave Razorpay fields empty for now and keep `ALLOW_CONSOLE_OTP_FOR_ADMINS=true` (see "Chicken-and-egg" below).

Then create the file `.env` in the same folder with one line:
```
DOMAIN=yourdomain.in
```

### 7. Start
```
docker compose up -d --build
docker compose logs -f app      # wait for "Ready"
```
Open `https://yourdomain.in`. Your data lives in the Docker volume `app-data`, so rebuilding or restarting never deletes it.

## Chicken-and-egg: Meta and Razorpay need the live site

The site is now live, so you can start both verifications. Until they finish, the app stays safe by design:
- **Login:** production refuses console codes. For the waiting period `.env.production` has `ALLOW_CONSOLE_OTP_FOR_ADMINS=true`: only the numbers in `ADMIN_MOBILES` can log in, and their code appears in `docker compose logs app`. Customers cannot sign up yet. Remove that line once WhatsApp works.
- **Payments:** with no Razorpay keys, checkout simply does not work in production (the fake checkout only exists on a developer's PC). Nobody gets files free. Reviewers can still see your catalogue, previews and the Terms, Privacy and Refund pages.
- Put real business name, address and support email in those three policy pages before applying; Razorpay and Meta reject sites without them. Have a lawyer review the text.
- Upload a few real titles so the site does not look empty to reviewers.

When approved: put the keys into `.env.production`, set `OTP_PROVIDER=meta` (+ the WhatsApp variables from SETUP-GUIDE.md), delete `ALLOW_CONSOLE_OTP_FOR_ADMINS`, then `docker compose up -d`. Add the Razorpay webhook URL `https://yourdomain.in/api/webhooks/razorpay` in the Razorpay dashboard. Run `docker compose exec app npm run check-env` to confirm nothing is missing.

## Updating the site later
```
cd ~/app/vipulaw-store && git pull && docker compose up -d --build
```

## Backups (do this, free servers can vanish)
Weekly copy of the database and PDFs to your own PC:
```
docker compose exec -T app tar czf - /data > backup-$(date +%F).tar.gz
```
Run it from the VM, then `scp` the file to your PC (or schedule with cron). Without a backup, losing the VM loses every upload and customer.

## Keeping Oracle Always Free alive
Oracle can reclaim idle Always Free VMs. Keep the site running (traffic counts) and stay within the free limits; do not upgrade to paid by accident (the console shows "Always Free" badges).

## When you outgrow SQLite
SQLite on one VM is fine for thousands of customers. Move to managed Postgres when you need more than one server; that is a `provider` change in `prisma/schema.prisma` plus a migration, not a rewrite.
