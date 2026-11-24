"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

declare global {
  interface Window {
    Razorpay?: new (opts: Record<string, unknown>) => { open(): void; on(e: string, cb: () => void): void };
  }
}

function loadCheckout(): Promise<boolean> {
  if (window.Razorpay) return Promise.resolve(true);
  return new Promise((resolve) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export default function PayButton({ productId, label, loggedIn }: { productId: string; label: string; loggedIn: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function post(url: string, body: object) {
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    return { res, j: await res.json().catch(() => ({})) };
  }

  async function buy() {
    if (!loggedIn) { router.push(`/login?next=${encodeURIComponent(location.pathname)}`); return; }
    setBusy(true); setError("");
    try {
      const { res, j } = await post("/api/checkout", { productId });
      if (!res.ok) { setError(j.error ?? "Could not start payment."); setBusy(false); return; }

      const done = () => { router.push("/library?paid=1"); router.refresh(); };
      if (j.free) { router.push("/library?free=1"); router.refresh(); return; }

      if (j.fake) { // local development only
        await post("/api/checkout/dev-pay", { razorpayOrderId: j.razorpayOrderId });
        done();
        return;
      }
      if (!(await loadCheckout()) || !window.Razorpay) { setError("Could not load the payment window. Check your connection."); setBusy(false); return; }
      const rz = new window.Razorpay({
        key: j.keyId, amount: j.amount, currency: "INR", name: "Vipulaw", description: j.name, order_id: j.razorpayOrderId,
        prefill: j.prefill, theme: { color: "#0f1f3d" },
        handler: async (r: Record<string, string>) => {
          const v = await post("/api/checkout/verify", r);
          if (v.res.ok) done();
          else { setError("Payment received but not confirmed yet. It will appear in My library shortly."); setBusy(false); }
        },
        modal: { ondismiss: () => setBusy(false) },
      });
      rz.on("payment.failed", () => { setError("Payment failed. You were not charged. Please try again."); setBusy(false); });
      rz.open();
    } catch {
      setError("Network problem. Please try again."); setBusy(false);
    }
  }

  return (
    <div>
      <button onClick={buy} disabled={busy} className="w-full rounded-md bg-gold px-6 py-4 text-lg font-bold text-white shadow transition hover:brightness-110 disabled:opacity-60">
        {busy ? "Please wait…" : label}
      </button>
      {error && <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
    </div>
  );
}
