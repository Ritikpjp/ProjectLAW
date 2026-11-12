import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getUser } from "@/lib/auth/session";
import { rupees, typeLabel } from "@/lib/catalog";
import { typeStyle } from "@/lib/exam-meta";
import Icon from "@/components/Icons";

export const metadata = { title: "My library" };

const day = (d: Date | null) => (d ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeZone: "Asia/Kolkata" }).format(d) : "");

export default async function Library({ searchParams }: { searchParams: Promise<{ paid?: string }> }) {
  const user = await getUser();
  if (!user) redirect("/login?next=/library");
  const orders = await db.order.findMany({
    where: { userId: user.id, status: "PAID" },
    orderBy: { paidAt: "desc" },
    include: { product: { include: { exam: true, files: { orderBy: { sortOrder: "asc" } } } } },
  });
  const justPaid = (await searchParams).paid === "1";

  return (
    <main>
      <section className="hero-bg bg-navy relative overflow-hidden text-white">
        <div className="dot-grid absolute inset-0" aria-hidden />
        <div className="relative mx-auto flex max-w-4xl flex-wrap items-end justify-between gap-4 px-4 py-10 sm:py-12">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#d9b566]">Welcome, {user.name.split(" ")[0]}</p>
            <h1 className="mt-1 font-serif text-3xl sm:text-4xl">My library</h1>
            <p className="mt-2 text-sm text-white/70">{orders.length} {orders.length === 1 ? "title" : "titles"} · each copy is personalised with your details</p>
          </div>
          <Link href="/profile" className="rounded-xl border border-white/30 px-4 py-2.5 text-sm font-semibold hover:bg-white/10">My profile</Link>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4 py-8">
        {justPaid && (
          <p className="mb-6 flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50 px-5 py-4 text-green-800">
            <Icon name="check" className="h-5 w-5 shrink-0" /> Payment successful. Your download is ready below.
          </p>
        )}
        {orders.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-line bg-white p-12 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gold-soft text-gold"><Icon name="book" className="h-7 w-7" /></span>
            <p className="mt-4 font-serif text-xl text-navy">Your library is empty</p>
            <p className="mt-1 text-sm text-muted">Books you buy appear here, ready to download.</p>
            <Link href="/#exams" className="mt-5 inline-block rounded-xl bg-navy px-6 py-3 font-semibold text-white hover:bg-navy-soft">Browse exams</Link>
          </div>
        ) : (
          <ul className="space-y-5">
            {orders.map((o) => {
              const t = typeStyle(o.product.type);
              return (
                <li key={o.id} className="overflow-hidden rounded-3xl border border-line bg-white">
                  <div className="flex items-center gap-4 p-5">
                    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white" style={{ background: `linear-gradient(135deg, ${t.from}, ${t.to})` }}><Icon name={t.icon} className="h-7 w-7" /></span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-gold">{o.product.exam.name} · {typeLabel(o.product.type)}</p>
                      <h2 className="truncate font-serif text-xl text-navy">{o.product.title}</h2>
                      <p className="mt-0.5 text-xs text-muted">Bought {day(o.paidAt)} · {rupees(o.amountPaise)} · Licence <span className="font-mono">{o.licenceId}</span></p>
                    </div>
                  </div>
                  <ul className="space-y-2 border-t border-line bg-paper p-4">
                    {o.product.files.map((f) => (
                      <li key={f.id} className="flex items-center justify-between gap-3 rounded-xl bg-white px-4 py-3">
                        <span className="flex min-w-0 items-center gap-2.5"><Icon name="file" className="h-5 w-5 shrink-0 text-gold" /><span className="min-w-0 truncate text-sm font-medium">{f.label}</span><span className="hidden shrink-0 text-xs text-muted sm:inline">{f.pageCount} pages</span></span>
                        <a href={`/api/download/${o.id}/${f.id}`} className="flex shrink-0 items-center gap-1.5 rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-soft"><Icon name="download" className="h-4 w-4" /> Download</a>
                      </li>
                    ))}
                  </ul>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
