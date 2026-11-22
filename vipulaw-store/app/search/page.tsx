import Link from "next/link";
import { db } from "@/lib/db";
import { PRODUCT_TYPES, SELLABLE_TYPES, typeLabel } from "@/lib/catalog";
import ProductCard from "@/components/ProductCard";

export const metadata = { title: "Search" };

export default async function Search({ searchParams }: { searchParams: Promise<{ q?: string; type?: string }> }) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().slice(0, 80);
  const type = SELLABLE_TYPES.find((t) => t === sp.type);
  const searching = q.length >= 2 || !!type;

  const products = !searching ? [] : await db.product.findMany({
    where: {
      status: "PUBLISHED",
      ...(type && { type }),
      ...(q.length >= 2 && { OR: [{ title: { contains: q } }, { description: { contains: q } }, { exam: { name: { contains: q } } }] }),
    },
    orderBy: { createdAt: "desc" },
    take: 48,
    include: { section: { select: { name: true } }, exam: { select: { name: true } }, files: { select: { pageCount: true } } },
  });

  const href = (t?: string) => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (t) p.set("type", t);
    const s = p.toString();
    return `/search${s ? `?${s}` : ""}`;
  };
  const chip = (active: boolean) =>
    `whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm transition ${active ? "border-navy bg-navy text-white" : "border-line bg-white text-navy hover:border-gold"}`;

  return (
    <main className="mx-auto max-w-5xl px-4 pb-10 pt-10 sm:pt-14">
      <h1 className="font-serif text-3xl text-navy sm:text-4xl">Search</h1>
      <div className="mt-6 rounded-xl border border-line bg-white p-5 shadow-sm">
        <form action="/search" className="flex max-w-lg gap-2">
          {type && <input type="hidden" name="type" value={type} />}
          <input name="q" defaultValue={q} minLength={2} maxLength={80} placeholder="Subject, act or topic" aria-label="Search material"
            className="min-w-0 flex-1 rounded-md border border-line bg-white px-4 py-3 text-base outline-none focus:border-gold" />
          <button className="rounded-md bg-navy px-5 py-3 text-sm font-medium text-white hover:bg-navy-soft">Search</button>
        </form>
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Material type">
          <Link href={href()} className={chip(!type)}>All types</Link>
          {(Object.keys(PRODUCT_TYPES) as (keyof typeof PRODUCT_TYPES)[]).map((t) => (
            <Link key={t} href={href(t)} className={chip(type === t)}>{typeLabel(t)}</Link>
          ))}
        </div>
      </div>

      {!searching ? (
        <p className="mt-4 rounded-xl border border-dashed border-line bg-white p-10 text-center text-muted">Type at least two letters, or pick a type above.</p>
      ) : products.length === 0 ? (
        <p className="mt-4 rounded-xl border border-dashed border-line bg-white p-10 text-center text-muted">
          Nothing matches{q ? <> &ldquo;{q}&rdquo;</> : ""}{type ? <> in {typeLabel(type)}</> : ""}. <Link href="/" className="text-navy underline">Browse by exam</Link>
        </p>
      ) : (
        <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{products.map((p) => <li key={p.id}><ProductCard p={p} /></li>)}</ul>
      )}
    </main>
  );
}
