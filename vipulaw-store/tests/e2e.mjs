// End-to-end smoke test against a running dev server (fake gateway + console OTP).
// Usage: node tests/e2e.mjs <baseUrl> <devLogPath> <pdfPath>
import { readFileSync, writeFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const [base, logPath, pdfPath] = process.argv.slice(2);
const origin = new URL(base).origin;
let failures = 0;
const check = (name, ok, extra = "") => { console.log(`${ok ? "PASS" : "FAIL"}  ${name} ${extra}`); if (!ok) failures++; };

class Client {
  jar = new Map();
  async req(path, { method = "GET", json, form, headers = {} } = {}) {
    const h = { Origin: origin, ...headers, Cookie: [...this.jar].map(([k, v]) => `${k}=${v}`).join("; ") };
    let body;
    if (json) { body = JSON.stringify(json); h["Content-Type"] = "application/json"; }
    if (form) body = form;
    const res = await fetch(base + path, { method, headers: h, body, redirect: "manual" });
    for (const c of res.headers.getSetCookie?.() ?? []) {
      const [kv] = c.split(";"); const i = kv.indexOf("="); const k = kv.slice(0, i), v = kv.slice(i + 1);
      if (/Max-Age=0|Expires=Thu, 01 Jan 1970/i.test(c)) this.jar.delete(k); else this.jar.set(k, v);
    }
    return res;
  }
}

const lastOtp = (mobile) => {
  const m = [...readFileSync(logPath, "utf8").matchAll(new RegExp(`\\[OTP:dev\\] \\${mobile} -> (\\d{6})`, "g"))];
  return m.at(-1)?.[1];
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function signup(c, mobile, name, email) {
  const body = { mode: "signup", name, email, mobile, profession: "Law student", examTarget: "judiciary", yearOfStudy: "3rd year" };
  const r1 = await c.req("/api/auth/send-otp", { method: "POST", json: body });
  if (r1.status !== 200) return { r1: r1.status, err: await r1.text() };
  await sleep(300);
  const r2 = await c.req("/api/auth/verify", { method: "POST", json: { ...body, code: lastOtp(mobile) } });
  return { r1: r1.status, r2: r2.status };
}

await prisma.rateLimit.deleteMany();
const rnd = Math.floor(Math.random() * 1e6);
const adminMobile = "+919999999999";

// --- admin
const admin = new Client();
let s = await signup(admin, adminMobile, "Site Admin", `admin${rnd}@example.com`);
if (s.r1 === 409) { // already registered from an earlier run: log in instead
  await admin.req("/api/auth/send-otp", { method: "POST", json: { mode: "login", mobile: adminMobile } });
  await sleep(300);
  s = { r2: (await admin.req("/api/auth/verify", { method: "POST", json: { mode: "login", mobile: adminMobile, code: lastOtp(adminMobile) } })).status };
}
check("admin login via OTP", s.r2 === 200, JSON.stringify(s));

const exams = await (await fetch(base + "/")).text();
check("homepage lists 4 exams", ["Judiciary", "APO / ADPO / ADA / APP", "Law Officer", "UGC NET / JRF"].every((n) => exams.includes(n.replace("/", "/"))));

// --- upload (needs exam id: read from admin page HTML)
const adminHtml = await (await admin.req("/admin")).text();
check("admin page visible to admin", adminHtml.includes("Upload a new title"));
const examId = (await prisma.exam.findUnique({ where: { slug: "judiciary" } })).id;
const form = new FormData();
form.set("title", `E2E Jurisprudence MCQs ${rnd}`);
form.set("description", "Test product");
form.set("examId", examId);
form.set("type", "PRACTICE_BOOK");
form.set("priceRupees", "199");
form.set("stampProfile", "HEADER");
form.set("publish", "on");
form.append("files", new Blob([readFileSync(pdfPath)], { type: "application/pdf" }), "Jurisprudence MCQs.pdf");
const up = await admin.req("/api/admin/products", { method: "POST", form });
const upj = await up.json();
check("admin upload ok", up.status === 200, JSON.stringify(upj));
const slug = upj.slug;

// non-PDF is rejected
const bad = new FormData();
for (const [k, v] of form.entries()) if (k !== "files") bad.set(k, v);
bad.append("files", new Blob(["hello not a pdf"], { type: "application/pdf" }), "x.pdf");
check("non-PDF upload rejected", (await admin.req("/api/admin/products", { method: "POST", form: bad })).status === 400);

// --- public preview
const page = await (await fetch(`${base}/p/${slug}`)).text();
const prod = await prisma.product.findUnique({ where: { slug }, include: { files: true } });
const fileId = prod.files[0].id;
const pv = await fetch(`${base}/api/preview/${fileId}`);
const pvBytes = Buffer.from(await pv.arrayBuffer());
check("preview served", pv.status === 200 && pv.headers.get("content-type") === "application/pdf");
writeFileSync("tests/_preview_out.pdf", pvBytes);

// --- buyer cannot access admin, unauthenticated cannot buy/download
const buyer = new Client();
const anon = new Client();
check("anonymous checkout refused", (await anon.req("/api/checkout", { method: "POST", json: { productId: "x" } })).status === 401);
check("anonymous download refused", (await anon.req("/api/download/a/b")).status === 401);
const bs = await signup(buyer, "+919876543210", "Asha Rao", `asha${rnd}@example.com`);
if (bs.r1 === 409) {
  await buyer.req("/api/auth/send-otp", { method: "POST", json: { mode: "login", mobile: "+919876543210" } });
  await sleep(300);
  await buyer.req("/api/auth/verify", { method: "POST", json: { mode: "login", mobile: "+919876543210", code: lastOtp("+919876543210") } });
}
check("buyer cannot open /admin", (await buyer.req("/admin")).status === 404);
check("buyer cannot upload", (await buyer.req("/api/admin/products", { method: "POST", form })).status === 403);

// wrong OTP
const w = new Client();
await w.req("/api/auth/send-otp", { method: "POST", json: { mode: "login", mobile: "+919876543210" } });
check("wrong OTP rejected", (await w.req("/api/auth/verify", { method: "POST", json: { mode: "login", mobile: "+919876543210", code: "000000" } })).status === 401);
// CSRF: foreign origin refused
check("foreign Origin refused", (await fetch(base + "/api/auth/send-otp", { method: "POST", headers: { Origin: "https://evil.example", "Content-Type": "application/json" }, body: "{}" })).status === 403);

// --- purchase
const pid = prod.id;
const co = await buyer.req("/api/checkout", { method: "POST", json: { productId: pid } });
const coj = await co.json();
check("checkout creates order at DB price", co.status === 200 && coj.amount === 19900 && coj.fake === true, JSON.stringify(coj).slice(0, 120));
// download before payment must fail
check("download before payment refused", (await buyer.req(`/api/download/${coj.orderId}/${fileId}`)).status === 404);
check("dev-pay", (await buyer.req("/api/checkout/dev-pay", { method: "POST", json: { razorpayOrderId: coj.razorpayOrderId } })).status === 200);
check("cannot buy twice", (await buyer.req("/api/checkout", { method: "POST", json: { productId: pid } })).status === 409);

// forged callback signature rejected (fake gateway has no key secret)
check("forged verify rejected", (await buyer.req("/api/checkout/verify", { method: "POST", json: { razorpay_order_id: coj.razorpayOrderId, razorpay_payment_id: "pay_x", razorpay_signature: "ab" } })).status === 400);
check("forged webhook rejected", (await fetch(base + "/api/webhooks/razorpay", { method: "POST", headers: { "x-razorpay-signature": "00" }, body: "{}" })).status === 400);

// --- download + isolation
const t0 = Date.now();
const dl = await buyer.req(`/api/download/${coj.orderId}/${fileId}`);
const dlBytes = Buffer.from(await dl.arrayBuffer());
check("buyer downloads stamped PDF", dl.status === 200 && dlBytes.subarray(0, 5).toString() === "%PDF-", `${Date.now() - t0}ms ${dlBytes.length}B`);
writeFileSync("tests/_stamped_out.pdf", dlBytes);
const dl2 = await buyer.req(`/api/download/${coj.orderId}/${fileId}`);
check("second download (cached) ok", dl2.status === 200);

const other = new Client();
const os = await signup(other, "+919123456780", "Other Person", `other${rnd}@example.com`);
if (os.r1 === 409) {
  await other.req("/api/auth/send-otp", { method: "POST", json: { mode: "login", mobile: "+919123456780" } });
  await sleep(300);
  await other.req("/api/auth/verify", { method: "POST", json: { mode: "login", mobile: "+919123456780", code: lastOtp("+919123456780") } });
}
check("other user is logged in", (await other.req("/library")).status === 200);
const o = await other.req(`/api/download/${coj.orderId}/${fileId}`);
check("another user cannot download my order", o.status === 404 || o.status === 401, String(o.status));

const lib = await (await buyer.req("/library")).text();
check("library shows download link", lib.includes(`/api/download/${coj.orderId}/${fileId}`));
check("verify page works", (await (await fetch(`${base}/v/${coj.orderId ? "VL-0000000000" : ""}`)).text()).includes("Licence not found"));

// --- profile, search, admin management (prototype features)
const jp = (c, path, method, json) => c.req(path, { method, json });
check("profile page loads for buyer", (await buyer.req("/profile")).status === 200);
check("buyer updates profile", (await jp(buyer, "/api/profile", "PATCH", { email: `asha${rnd}@example.com`, profession: "Practising advocate", examTarget: "ugc-net-jrf", yearOfStudy: "Graduated" })).status === 200);
check("profile rejects unknown exam", (await jp(buyer, "/api/profile", "PATCH", { email: `asha${rnd}@example.com`, profession: "Other", examTarget: "nope", yearOfStudy: "Graduated" })).status === 400);
check("anonymous profile update refused", (await jp(anon, "/api/profile", "PATCH", {})).status === 401);

const searchHit = await (await fetch(`${base}/search?q=${encodeURIComponent("E2E Jurisprudence")}`)).text();
check("search finds the product", searchHit.includes(`E2E Jurisprudence MCQs ${rnd}`));
check("search with no match says so", (await (await fetch(`${base}/search?q=zzzzqqq`)).text()).includes("Nothing matches"));

const secName = `Test Section ${rnd}`;
check("buyer cannot add section", (await jp(buyer, "/api/admin/sections", "POST", { examId, name: secName })).status === 403);
check("admin adds section", (await jp(admin, "/api/admin/sections", "POST", { examId, name: secName })).status === 200);
check("duplicate section refused", (await jp(admin, "/api/admin/sections", "POST", { examId, name: secName })).status === 409);
const sec = await prisma.section.findFirst({ where: { examId, name: secName } });
check("admin removes section", (await jp(admin, "/api/admin/sections", "DELETE", { sectionId: sec.id })).status === 200);

const addForm = new FormData();
addForm.append("files", new Blob([readFileSync(pdfPath)], { type: "application/pdf" }), "Second part.pdf");
check("buyer cannot add files", (await buyer.req(`/api/admin/products/${pid}/files`, { method: "POST", form: addForm })).status === 403);
const addRes = await admin.req(`/api/admin/products/${pid}/files`, { method: "POST", form: addForm });
check("admin adds a file to the bundle", addRes.status === 200, await addRes.clone().text());
const files2 = await prisma.productFile.findMany({ where: { productId: pid } });
check("bundle now has 2 files", files2.length === 2);
check("file removal blocked once ordered", (await admin.req(`/api/admin/products/${pid}/files/${files2[1].id}`, { method: "DELETE" })).status === 409);
check("product deletion blocked once ordered", (await admin.req(`/api/admin/products/${pid}`, { method: "DELETE" })).status === 409);
check("admin edits title and description", (await jp(admin, `/api/admin/products/${pid}`, "PATCH", { title: `E2E Jurisprudence MCQs ${rnd}`, description: "Edited" })).status === 200);

const form2 = new FormData();
for (const [k, v] of form.entries()) if (k !== "files" && k !== "title") form2.set(k, v);
form2.set("title", `E2E Disposable ${rnd}`);
form2.append("files", new Blob([readFileSync(pdfPath)], { type: "application/pdf" }), "Disposable.pdf");
const up2 = await (await admin.req("/api/admin/products", { method: "POST", form: form2 })).json();
const prod2 = await prisma.product.findUnique({ where: { slug: up2.slug }, include: { files: true } });
check("unordered product can be deleted", (await admin.req(`/api/admin/products/${prod2.id}`, { method: "DELETE" })).status === 200);
check("deleted product is gone from the DB", !(await prisma.product.findUnique({ where: { id: prod2.id } })));
check("admin page lists the buyer", (await (await admin.req("/admin")).text()).includes("Asha Rao"));


// --- free titles
const ff = new FormData();
for (const [k, v] of form.entries()) if (!["files", "title", "priceRupees"].includes(k)) ff.set(k, v);
ff.set("title", `E2E Free Notes ${rnd}`); ff.set("free", "on");
ff.append("files", new Blob([readFileSync(pdfPath)], { type: "application/pdf" }), "Free notes.pdf");
const fup = await (await admin.req("/api/admin/products", { method: "POST", form: ff })).json();
check("admin uploads a free title", !!fup.slug, JSON.stringify(fup));
const noPrice = new FormData();
for (const [k, v] of ff.entries()) if (k !== "free") noPrice.set(k, v);
check("no price and not free is rejected", (await admin.req("/api/admin/products", { method: "POST", form: noPrice })).status === 400);
const fprod = await prisma.product.findUnique({ where: { slug: fup.slug }, include: { files: true } });
check("free title stored at price 0", fprod?.pricePaise === 0);
check("product page shows Free", (await (await fetch(`${base}/p/${fup.slug}`)).text()).includes("Free with your account"));
const freeList = await (await fetch(`${base}/exam/judiciary?access=free`)).text();
const paidList = await (await fetch(`${base}/exam/judiciary?access=paid`)).text();
check("Free filter lists free, hides paid", freeList.includes(`E2E Free Notes ${rnd}`) && !freeList.includes(`E2E Jurisprudence MCQs ${rnd}`));
check("Paid filter lists paid, hides free", paidList.includes(`E2E Jurisprudence MCQs ${rnd}`) && !paidList.includes(`E2E Free Notes ${rnd}`));
check("anonymous cannot claim free", (await anon.req("/api/checkout", { method: "POST", json: { productId: fprod.id } })).status === 401);
check("admin cannot claim free", (await admin.req("/api/checkout", { method: "POST", json: { productId: fprod.id } })).status === 403);
const claim = await buyer.req("/api/checkout", { method: "POST", json: { productId: fprod.id } });
const claimJ = await claim.json();
check("student claims free title", claim.status === 200 && claimJ.free === true, JSON.stringify(claimJ));
check("cannot claim twice", (await buyer.req("/api/checkout", { method: "POST", json: { productId: fprod.id } })).status === 409);
const fdl = await buyer.req(`/api/download/${claimJ.orderId}/${fprod.files[0].id}`);
check("free file downloads stamped", fdl.status === 200 && Buffer.from(await fdl.arrayBuffer()).subarray(0, 5).toString() === "%PDF-");
check("free claim not counted in recent paid orders", !(await (await admin.req("/admin")).text()).includes(`E2E Free Notes ${rnd}</td>`));
check("admin makes a paid title free", (await jp(admin, `/api/admin/products/${pid}`, "PATCH", { priceRupees: 0 })).status === 200 && (await prisma.product.findUnique({ where: { id: pid } })).pricePaise === 0);
await jp(admin, `/api/admin/products/${pid}`, "PATCH", { priceRupees: 199 });

await prisma.$disconnect();
console.log(failures ? `\n${failures} FAILED` : "\nALL PASSED");
process.exit(failures ? 1 : 0);
