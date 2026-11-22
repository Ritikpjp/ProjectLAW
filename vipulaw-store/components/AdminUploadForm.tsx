"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { STATES } from "@/lib/states";

type Exam = { id: string; name: string; stateWise: boolean; sections: { id: string; name: string }[] };

const input = "mt-1 w-full rounded-lg border border-line bg-white px-3 py-2.5 text-base outline-none focus:border-gold";

export default function AdminUploadForm({ exams, types }: { exams: Exam[]; types: [string, string][] }) {
  const router = useRouter();
  const [examId, setExamId] = useState(exams[0]?.id ?? "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const current = exams.find((e) => e.id === examId);
  const sections = current?.sections ?? [];

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true); setMsg(null);
    const form = e.currentTarget;
    try {
      const res = await fetch("/api/admin/products", { method: "POST", body: new FormData(form) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) { setMsg({ ok: false, text: j.error ?? "Upload failed" }); return; }
      setMsg({ ok: true, text: "Saved." + (j.warnings?.length ? " Warnings: " + j.warnings.join(" ") : "") });
      form.reset(); router.refresh();
    } catch {
      setMsg({ ok: false, text: "Network error during upload." });
    } finally { setBusy(false); }
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-lg border border-line bg-white p-5">
      <h2 className="font-serif text-xl text-navy">Upload a new title</h2>
      <label className="block text-sm font-medium">Title<input name="title" required minLength={3} maxLength={140} className={input} /></label>
      <label className="block text-sm font-medium">Description<textarea name="description" rows={3} maxLength={2000} className={input} /></label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium">Exam
          <select name="examId" value={examId} onChange={(e) => setExamId(e.target.value)} className={input}>
            {exams.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
          </select>
        </label>
        <label className="block text-sm font-medium">Section (optional)
          <select name="sectionId" className={input} key={examId} defaultValue="">
            <option value="">None</option>
            {sections.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </label>
        {current?.stateWise && (
          <label className="block text-sm font-medium">State (optional)
            <select name="state" className={input} key={`state-${examId}`} defaultValue="">
              <option value="">General (not state-specific)</option>
              {STATES.map((s) => <option key={s.slug} value={s.slug}>{s.name}</option>)}
            </select>
          </label>
        )}
        <label className="block text-sm font-medium">Type
          <select name="type" className={input}>{types.map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        </label>
        <label className="block text-sm font-medium">Price (₹)
          <input name="priceRupees" type="number" min={1} max={100000} step={1} required className={input} />
        </label>
        <label className="block text-sm font-medium">Buyer details placement
          <select name="stampProfile" className={input}>
            <option value="HEADER">Header (top of each page)</option>
            <option value="FOOTER">Footer (above the gold line)</option>
          </select>
        </label>
      </div>
      <label className="block text-sm font-medium">PDF file(s). Select several for a bundle.
        <input name="files" type="file" accept="application/pdf" multiple required className={input} />
      </label>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="publish" /> Publish immediately</label>
      {msg && <p role="status" className={`rounded-lg px-3 py-2 text-sm ${msg.ok ? "bg-green-50 text-green-800" : "bg-red-50 text-red-700"}`}>{msg.text}</p>}
      <button disabled={busy} className="rounded-lg bg-navy px-5 py-3 font-semibold text-white hover:bg-navy-soft disabled:opacity-60">
        {busy ? "Uploading and analysing… (can take a minute)" : "Upload"}
      </button>
    </form>
  );
}
