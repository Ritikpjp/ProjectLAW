"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Exam = { slug: string; name: string };
type Variant = "customer" | "admin";
const PROFESSIONS = ["Law student", "Practising advocate", "Judicial aspirant", "Working professional", "Other"];
const YEARS = ["1st year", "2nd year", "3rd year", "4th year", "5th year", "Graduated", "Postgraduate"];

const field = "w-full rounded-xl border border-line bg-white px-3.5 py-3 text-base outline-none transition focus:border-gold focus:ring-4 focus:ring-gold/15";
const label = "block text-sm font-medium text-ink";

export default function AuthForm({
  mode, exams, next, variant = "customer",
}: { mode: "login" | "signup"; exams: Exam[]; next: string; variant?: Variant }) {
  const router = useRouter();
  const admin = variant === "admin";
  const [step, setStep] = useState<"details" | "code">("details");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [code, setCode] = useState("");
  const [f, setF] = useState({
    name: "", email: "", mobile: "", profession: PROFESSIONS[0], examTarget: exams[0]?.slug ?? "", yearOfStudy: YEARS[0],
  });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF({ ...f, [k]: e.target.value });

  const payload = () => (mode === "login" ? { mode, mobile: f.mobile, ...(admin && { portal: "admin" }) } : { mode, ...f });

  async function call(url: string, body: object) {
    setBusy(true); setError("");
    try {
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) { setError(j.error ?? "Something went wrong. Please try again."); return false; }
      return true;
    } catch {
      setError("Network problem. Check your connection and retry.");
      return false;
    } finally { setBusy(false); }
  }

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    if (await call("/api/auth/send-otp", payload())) setStep("code");
  }
  async function verify(e: React.FormEvent) {
    e.preventDefault();
    if (await call("/api/auth/verify", { ...payload(), code })) { router.push(next); router.refresh(); }
  }

  const primary = admin
    ? "bg-gold text-[#0a1529] hover:bg-[#d9b566]"
    : "bg-navy text-white hover:bg-navy-soft";
  const title = admin ? "Admin sign in" : mode === "login" ? "Welcome back" : "Create your account";
  const sub = admin
    ? "Enter your authorised mobile number. We will send a one-time code."
    : mode === "login"
      ? "Log in with your mobile number. We will send you a one-time code."
      : "Takes a minute. Your mobile is verified with a one-time code, so there is no password to remember.";

  return (
    <div className="w-full">
      <h1 className="font-serif text-3xl text-navy">{title}</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">{sub}</p>

      {step === "details" ? (
        <form onSubmit={sendCode} className="mt-7 space-y-4">
          {mode === "signup" && !admin && (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className={label}>Full name
                <input className={field + " mt-1.5"} required minLength={2} maxLength={80} autoComplete="name" value={f.name} onChange={set("name")} placeholder="As you want it printed on PDFs" />
              </label>
              <label className={label}>Email
                <input className={field + " mt-1.5"} type="email" required maxLength={120} autoComplete="email" value={f.email} onChange={set("email")} placeholder="you@example.com" />
              </label>
            </div>
          )}
          <label className={label}>Mobile number
            <div className="mt-1.5 flex">
              <span className="flex items-center rounded-l-xl border border-r-0 border-line bg-gold-soft px-3.5 text-sm font-medium text-navy">+91</span>
              <input className={field + " rounded-l-none"} inputMode="numeric" required autoComplete="tel-national" placeholder="98765 43210" value={f.mobile} onChange={set("mobile")} />
            </div>
          </label>
          {mode === "signup" && !admin && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className={label}>Profession
                  <select className={field + " mt-1.5"} value={f.profession} onChange={set("profession")}>
                    {PROFESSIONS.map((p) => <option key={p}>{p}</option>)}
                  </select>
                </label>
                <label className={label}>Year of study
                  <select className={field + " mt-1.5"} value={f.yearOfStudy} onChange={set("yearOfStudy")}>
                    {YEARS.map((y) => <option key={y}>{y}</option>)}
                  </select>
                </label>
              </div>
              <label className={label}>Exam you are targeting
                <select className={field + " mt-1.5"} value={f.examTarget} onChange={set("examTarget")}>
                  {exams.map((x) => <option key={x.slug} value={x.slug}>{x.name}</option>)}
                </select>
              </label>
              <p className="rounded-xl bg-gold-soft/70 px-3.5 py-2.5 text-xs leading-relaxed text-navy/80">
                Your name, mobile and a licence ID are printed on every PDF you buy, with a small QR code that proves the copy is yours.
              </p>
            </>
          )}
          {error && <p role="alert" className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700">{error}</p>}
          <button disabled={busy} className={`w-full rounded-xl px-4 py-3.5 font-semibold transition disabled:opacity-60 ${primary}`}>
            {busy ? "Sending…" : admin ? "Send admin code" : "Send code"}
          </button>
        </form>
      ) : (
        <form onSubmit={verify} className="mt-7 space-y-4">
          <p className="text-sm">Enter the 6-digit code sent to <b>+91 {f.mobile.replace(/\D/g, "").slice(-10)}</b>.</p>
          <input className={field + " text-center text-2xl tracking-[0.5em]"} inputMode="numeric" autoComplete="one-time-code" maxLength={6} required autoFocus value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} aria-label="One-time code" />
          {error && <p role="alert" className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700">{error}</p>}
          <button disabled={busy || code.length !== 6} className={`w-full rounded-xl px-4 py-3.5 font-semibold transition disabled:opacity-60 ${primary}`}>
            {busy ? "Checking…" : admin ? "Open admin console" : mode === "login" ? "Log in" : "Create account"}
          </button>
          <button type="button" className="w-full text-sm text-muted underline" onClick={() => { setStep("details"); setCode(""); setError(""); }}>
            Change number or resend code
          </button>
        </form>
      )}

      <p className="mt-7 border-t border-line pt-5 text-center text-sm text-muted">
        {admin ? (
          <>Not an administrator? <Link className="font-semibold text-navy underline" href="/login">Student login</Link></>
        ) : mode === "login" ? (
          <>New here? <Link className="font-semibold text-navy underline" href="/signup">Create a free account</Link></>
        ) : (
          <>Already registered? <Link className="font-semibold text-navy underline" href="/login">Log in</Link></>
        )}
      </p>
    </div>
  );
}
