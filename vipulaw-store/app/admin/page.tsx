import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getUser, requireAdmin } from "@/lib/auth/session";
import { PRODUCT_TYPES, rupees, typeLabel } from "@/lib/catalog";
import AdminUploadForm from "@/components/AdminUploadForm";
import ProductAdminRow from "@/components/ProductAdminRow";
import SectionManager from "@/components/SectionManager";

export const metadata = { title: "Admin", robots: { index: false } };

const when = (d: Date | null) =>
  d ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }).format(d) : "";

export default async function Admin() {
  if (!(await requireAdmin())) {
    if (!(await getUser())) redirect("/admin/login");
    notFound(); // logged in as a customer: nothing to see here
  }
  const [exams, products, sales, users, orders] = await Promise.all([
    db.exam.findMany({ orderBy: { sortOrder: "asc" }, include: { sections: { orderBy: { sortOrder: "asc" } } } }),
    db.product.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        exam: true, section: true,
        files: { orderBy: { sortOrder: "asc" }, select: { id: true, label: true, pageCount: true } },
        _count: { select: { orders: true } },
      },
    }),
    db.order.aggregate({ where: { status: "PAID" }, _sum: { amountPaise: true }, _count: true }),
    db.user.count(),
    db.order.findMany({
      where: { status: "PAID" }, orderBy: { paidAt: "desc" }, take: 25,
      include: { user: { select: { name: true, mobile: true, email: true } }, product: { select: { title: true } } },
    }),
  ]);

  return (
    <main>
    <section className="mx-auto max-w-5xl px-4 pt-10 sm:pt-14">
      <h1 className="font-serif text-3xl text-navy sm:text-4xl">Upload</h1>
      <p className="mt-1 text-sm text-muted">Add titles, set prices, publish, and follow orders.</p>
    </section>
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8">
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ["Paid orders", String(sales._count)],
          ["Revenue", rupees(sales._sum.amountPaise ?? 0)],
          ["Registered users", String(users)],
        ].map(([k, v]) => (
          <div key={k} className="rounded-lg border border-line bg-white p-4">
            <p className="text-xs uppercase tracking-wide text-muted">{k}</p>
            <p className="mt-1 font-serif text-2xl text-navy">{v}</p>
          </div>
        ))}
      </div>

      <AdminUploadForm
        exams={exams.map((e) => ({ id: e.id, name: e.name, stateWise: e.stateWise, sections: e.sections.map((s) => ({ id: s.id, name: s.name })) }))}
        types={Object.entries(PRODUCT_TYPES) as [string, string][]}
      />
      <SectionManager exams={exams.map((e) => ({ id: e.id, name: e.name, sections: e.sections.map((s) => ({ id: s.id, name: s.name })) }))} />

      <section>
        <h2 className="font-serif text-xl text-navy">Your uploaded products</h2>
        <ul className="mt-3 space-y-3">
          {products.map((p) => (
            <ProductAdminRow key={p.id} id={p.id} slug={p.slug} title={p.title} description={p.description} status={p.status}
              price={p.pricePaise / 100} files={p.files} hasOrders={p._count.orders > 0} state={p.state} stateWise={p.exam.stateWise}
              meta={`${p.exam.name}${p.section ? " › " + p.section.name : ""} · ${typeLabel(p.type)} · ${p.files.length} file(s) · ${p._count.orders} order(s)`} />
          ))}
          {products.length === 0 && <li className="text-muted">No products yet.</li>}
        </ul>
      </section>

      <section>
        <h2 className="font-serif text-xl text-navy">Recent paid orders</h2>
        {orders.length === 0 ? (
          <p className="mt-3 text-muted">No paid orders yet.</p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-2xl border border-line bg-white">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-line bg-paper text-xs uppercase tracking-wide text-muted">
                <tr><th className="px-4 py-2">When</th><th className="px-4 py-2">Buyer</th><th className="px-4 py-2">Product</th><th className="px-4 py-2">Amount</th><th className="px-4 py-2">Licence</th></tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-b border-line last:border-0">
                    <td className="whitespace-nowrap px-4 py-2">{when(o.paidAt)}</td>
                    <td className="px-4 py-2"><span className="font-medium">{o.user.name}</span><br /><span className="text-xs text-muted">{o.user.mobile} · {o.user.email}</span></td>
                    <td className="px-4 py-2">{o.product.title}</td>
                    <td className="whitespace-nowrap px-4 py-2">{rupees(o.amountPaise)}</td>
                    <td className="whitespace-nowrap px-4 py-2 font-mono text-xs">{o.licenceId}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
    </main>
  );
}
