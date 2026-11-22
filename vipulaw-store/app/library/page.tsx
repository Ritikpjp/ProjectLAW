import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getUser } from "@/lib/auth/session";
import { rupees, typeLabel } from "@/lib/catalog";
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
    <main className="mx-auto max-w-3xl px-4 pb-10 pt-10 sm:pt-14">
      <h1 className="font-serif text-3xl text-navy sm:text-4xl">My library</h1>
      {justPaid && <p className="mt-5 rounded-md bg-green-50 px-4 py-3 text-sm text-green-800">Payment successful. Your download is ready below.</p>}

      {orders.length === 0 ? (
        <p className="mt-10 text-muted">Nothing here yet. <Link href="/#exams" className="text-navy underline">Browse exams</Link></p>
      ) : (
        <ul className="mt-8 space-y-4">
          {orders.map((o) => (
            <li key={o.id} className="rounded-xl border border-line bg-white p-5 shadow-sm">
              <p className="text-xs text-muted">{o.product.exam.name} · {typeLabel(o.product.type)}</p>
              <h2 className="mt-1 font-serif text-lg text-navy">{o.product.title}</h2>
              <p className="mt-1 text-xs text-muted">Bought {day(o.paidAt)} · {rupees(o.amountPaise)} · Licence <span className="font-mono">{o.licenceId}</span></p>
              <ul className="mt-4 space-y-2">
                {o.product.files.map((f) => (
                  <li key={f.id} className="flex items-center justify-between gap-3 rounded-lg bg-paper px-3 py-2.5">
                    <span className="min-w-0 truncate text-sm">{f.label}</span>
                    <a href={`/api/download/${o.id}/${f.id}`} className="flex shrink-0 items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-sm text-navy transition hover:border-gold">
                      <Icon name="download" className="h-4 w-4" /> Download
                    </a>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
