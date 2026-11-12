"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Exam = { slug: string; name: string };
type Initial = { name?: string; email: string; profession: string; examTarget: string; yearOfStudy: string };
const PROFESSIONS = ["Law student", "Practising advocate", "Judicial aspirant", "Working professional", "Other"];
const YEARS = ["1st year", "2nd year", "3rd year", "4th year", "5th year", "Graduated", "Postgraduate"];
const field = "mt-1 w-full rounded-lg border border-line bg-white px-3 py-3 text-base outline-none focus:border-gold";

export default function ProfileForm({ exams, initial, admin = false }: { exams: Exam[]; initial: Initial; admin?: boolean }) {
  const router = useRouter();
  const [f, setF] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const set = (k: keyof Initial) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setMsg(null);
    try {
      const res = await fetch("/api/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
      const j = await res.json().catch(() => ({}));
      setMsg(res.ok ? { ok: true, text: "Saved." } : { ok: false, text: j.error ?? "Could not save." });
      if (res.ok) router.refresh();
    } catch {
      setMsg({ ok: false, text: "Network problem. Please retry." });
    } finally { setBusy(false); }
  }

  return (
    <form onSubmit={save} className="space-y-4">
      {admin && (
        <label className="block text-sm font-medium">Display name (shown as &ldquo;Admin · name&rdquo; in the header)
          <input className={field} required minLength={2} maxLength={80} value={f.name ?? ""} onChange={set("name")} />
        </label>
      )}
      <label className="block text-sm font-medium">Email
        <input className={field} type="email" required maxLength={120} value={f.email} onChange={set("email")} />
      </label>
      <label className="block text-sm font-medium">Profession
        <select className={field} value={f.profession} onChange={set("profession")}>{PROFESSIONS.map((p) => <option key={p}>{p}</option>)}</select>
      </label>
      <label className="block text-sm font-medium">Exam you are targeting
        <select className={field} value={f.examTarget} onChange={set("examTarget")}>{exams.map((x) => <option key={x.slug} value={x.slug}>{x.name}</option>)}</select>
      </label>
      <label className="block text-sm font-medium">Year of study
        <select className={field} value={f.yearOfStudy} onChange={set("yearOfStudy")}>{YEARS.map((y) => <option key={y}>{y}</option>)}</select>
      </label>
      {msg && <p role="status" className={`rounded-lg px-3 py-2 text-sm ${msg.ok ? "bg-green-50 text-green-800" : "bg-red-50 text-red-700"}`}>{msg.text}</p>}
      <button disabled={busy} className="rounded-lg bg-navy px-5 py-3 font-semibold text-white hover:bg-navy-soft disabled:opacity-60">{busy ? "Saving…" : "Save changes"}</button>
    </form>
  );
}
