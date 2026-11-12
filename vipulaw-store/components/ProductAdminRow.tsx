"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type FileRow = { id: string; label: string; pageCount: number };
type Props = {
  id: string; slug: string; title: string; description: string; status: string; price: number;
  meta: string; files: FileRow[]; hasOrders: boolean;
};

const input = "w-full rounded-lg border border-line bg-white px-3 py-2 text-base outline-none focus:border-gold";

export default function ProductAdminRow(p: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [price, setPrice] = useState(String(p.price));
  const [title, setTitle] = useState(p.title);
  const [description, setDescription] = useState(p.description);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function call(url: string, init: RequestInit, okText?: string) {
    setBusy(true); setMsg(null);
    try {
      const res = await fetch(url, init);
      const j = await res.json().catch(() => ({}));
      if (!res.ok) { setMsg({ ok: false, text: j.error ?? "Something went wrong." }); return false; }
      const text = [okText, ...(j.warnings ?? [])].filter(Boolean).join(" ");
      setMsg(text ? { ok: true, text } : null);
      router.refresh();
      return true;
    } catch {
      setMsg({ ok: false, text: "Network error." });
      return false;
    } finally { setBusy(false); }
  }
  const patch = (body: object, okText?: string) =>
    call(`/api/admin/products/${p.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }, okText);

  async function addFiles(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    if (await call(`/api/admin/products/${p.id}/files`, { method: "POST", body: new FormData(form) }, "Files added.")) form.reset();
  }
  async function removeFile(f: FileRow) {
    if (confirm(`Remove "${f.label}" from this product?`)) await call(`/api/admin/products/${p.id}/files/${f.id}`, { method: "DELETE" }, "File removed.");
  }
  async function deleteProduct() {
    if (confirm(`Delete "${p.title}" permanently? This cannot be undone.`)) await call(`/api/admin/products/${p.id}`, { method: "DELETE" });
  }

  return (
    <li className="rounded-xl border border-line bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium">{p.title}</p>
          <p className="text-xs text-muted">{p.meta}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm">₹</span>
          <input aria-label="Price in rupees" inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value.replace(/\D/g, ""))} className="w-24 rounded-lg border border-line px-2 py-1.5" />
          <button disabled={busy || !price || Number(price) === p.price} onClick={() => patch({ priceRupees: Number(price) }, "Price saved.")} className="rounded-lg border border-navy px-3 py-1.5 text-sm text-navy disabled:opacity-40">Save price</button>
          <button disabled={busy} onClick={() => patch({ status: p.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED" })}
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold text-white ${p.status === "PUBLISHED" ? "bg-green-700" : "bg-slate-500"}`}>
            {p.status === "PUBLISHED" ? "Live · unpublish" : "Draft · publish"}
          </button>
          <button onClick={() => setOpen(!open)} aria-expanded={open} className="rounded-lg border border-line px-3 py-1.5 text-sm">{open ? "Close" : "Manage"}</button>
        </div>
      </div>

      {open && (
        <div className="mt-4 space-y-5 border-t border-line pt-4">
          <div className="space-y-3">
            <label className="block text-sm font-medium">Title<input className={input} value={title} maxLength={140} onChange={(e) => setTitle(e.target.value)} /></label>
            <label className="block text-sm font-medium">Description<textarea className={input} rows={3} maxLength={2000} value={description} onChange={(e) => setDescription(e.target.value)} /></label>
            <div className="flex flex-wrap gap-2">
              <button disabled={busy || title.trim().length < 3 || (title === p.title && description === p.description)}
                onClick={() => patch({ title, description }, "Details saved.")} className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">Save details</button>
              <Link href={`/p/${p.slug}`} className="rounded-lg border border-line px-4 py-2 text-sm">View product page</Link>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold">Files in this product</h3>
            <ul className="mt-2 space-y-1.5">
              {p.files.map((f) => (
                <li key={f.id} className="flex items-center justify-between gap-3 rounded-lg bg-paper px-3 py-2 text-sm">
                  <span className="min-w-0 truncate">{f.label} <span className="text-muted">· {f.pageCount} pages</span></span>
                  {!p.hasOrders && p.files.length > 1 && <button disabled={busy} onClick={() => removeFile(f)} className="shrink-0 text-red-700 underline">Remove</button>}
                </li>
              ))}
            </ul>
            <form onSubmit={addFiles} className="mt-3 flex flex-wrap items-center gap-2">
              <input name="files" type="file" accept="application/pdf" multiple required className="min-w-0 flex-1 rounded-lg border border-line bg-white px-3 py-2 text-sm" />
              <button disabled={busy} className="rounded-lg border border-navy px-4 py-2 text-sm font-semibold text-navy disabled:opacity-40">{busy ? "Working…" : "Add PDFs"}</button>
            </form>
            {p.hasOrders && <p className="mt-2 text-xs text-muted">Files cannot be removed once the product has orders. You can still add more.</p>}
          </div>

          <div>
            <button disabled={busy || p.hasOrders} onClick={deleteProduct} className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 disabled:opacity-40">Delete product</button>
            {p.hasOrders && <span className="ml-3 text-xs text-muted">Has orders: unpublish instead.</span>}
          </div>
        </div>
      )}
      {msg && <p role="status" className={`mt-3 rounded-lg px-3 py-2 text-sm ${msg.ok ? "bg-green-50 text-green-800" : "bg-red-50 text-red-700"}`}>{msg.text}</p>}
    </li>
  );
}
