"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Exam = { id: string; name: string; sections: { id: string; name: string }[] };

export default function SectionManager({ exams }: { exams: Exam[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [names, setNames] = useState<Record<string, string>>({});

  async function call(method: "POST" | "DELETE", body: object) {
    setBusy(true); setMsg("");
    try {
      const res = await fetch("/api/admin/sections", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) setMsg(j.error ?? "Something went wrong."); else router.refresh();
      return res.ok;
    } catch { setMsg("Network error."); return false; } finally { setBusy(false); }
  }

  return (
    <details className="rounded-lg border border-line bg-white p-5">
      <summary className="cursor-pointer font-serif text-xl text-navy">Exam sections</summary>
      <p className="mt-2 text-sm text-muted">Sections split an exam into parts such as Prelims and Mains, or Paper 1 and Paper 2.</p>
      <ul className="mt-4 space-y-4">
        {exams.map((e) => (
          <li key={e.id}>
            <p className="text-sm font-semibold">{e.name}</p>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {e.sections.length === 0 && <span className="text-sm text-muted">No sections</span>}
              {e.sections.map((s) => (
                <span key={s.id} className="inline-flex items-center gap-1.5 rounded-full bg-gold-soft px-3 py-1 text-sm">
                  {s.name}
                  <button disabled={busy} aria-label={`Remove ${s.name}`} onClick={() => confirm(`Remove section "${s.name}"?`) && call("DELETE", { sectionId: s.id })} className="text-red-700">×</button>
                </span>
              ))}
            </div>
            <form className="mt-2 flex gap-2" onSubmit={async (ev) => { ev.preventDefault(); if (await call("POST", { examId: e.id, name: names[e.id] ?? "" })) setNames({ ...names, [e.id]: "" }); }}>
              <input aria-label={`New section for ${e.name}`} placeholder="New section name" maxLength={60} value={names[e.id] ?? ""} onChange={(ev) => setNames({ ...names, [e.id]: ev.target.value })}
                className="min-w-0 flex-1 rounded-lg border border-line px-3 py-2 text-base outline-none focus:border-gold" />
              <button disabled={busy || (names[e.id] ?? "").trim().length < 2} className="rounded-lg border border-navy px-4 py-2 text-sm font-semibold text-navy disabled:opacity-40">Add</button>
            </form>
          </li>
        ))}
      </ul>
      {msg && <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{msg}</p>}
    </details>
  );
}
