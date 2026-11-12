import Link from "next/link";
import { db } from "@/lib/db";
import { PRODUCT_TYPES, SELLABLE_TYPES, typeLabel } from "@/lib/catalog";
import Icon from "@/components/Icons";
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
    `whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition ${active ? "border-navy bg-navy text-white" : "border-line bg-white text-navy hover:border-gold"}`;

  return (
    <main>
      <section className="hero-bg bg-navy relative overflow-hidden text-white">
        <div className="dot-grid absolute inset-0" aria-hidden />
        <div className="relative mx-auto max-w-6xl px-4 py-10 sm:py-14">
          <h1 className="font-serif text-3xl sm:text-4xl">Search study material</h1>
          <form action="/search" className="mt-5 flex max-w-2xl overflow-hidden rounded-2xl bg-white p-1.5 shadow-xl shadow-black/30">
            {type && <input type="hidden" name="type" value={type} />}
            <span className="flex items-center pl-3 text-muted"><Icon name="search" /></span>
            <input name="q" defaultValue={q} minLength={2} maxLength={80} placeholder="e.g. jurisprudence, CPC, PYQ" aria-label="Search material"
              className="min-w-0 flex-1 bg-transparent px-3 py-3 text-base text-ink outline-none" />
            <button className="rounded-xl bg-navy px-5 py-3 text-sm font-semibold text-white hover:bg-navy-soft">Search</button>
          </form>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Material type">
          <Link href={href()} className={chip(!type)}>All types</Link>
          {(Object.keys(PRODUCT_TYPES) as (keyof typeof PRODUCT_TYPES)[]).map((t) => (
            <Link key={t} href={href(t)} className={chip(type === t)}>{typeLabel(t)}</Link>
          ))}
        </div>

        {!searching ? (
          <p className="mt-10 rounded-2xl border border-dashed border-line bg-white p-10 text-center text-muted">
            Type at least two letters, or pick a material type above. Or <Link href="/" className="font-semibold text-navy underline">browse by exam</Link>.
          </p>
        ) : products.length === 0 ? (
          <p className="mt-10 rounded-2xl border border-dashed border-line bg-white p-10 text-center text-muted">
            Nothing matches{q ? <> &ldquo;{q}&rdquo;</> : ""}{type ? <> in {typeLabel(type)}</> : ""}. <Link href="/" className="font-semibold text-navy underline">Browse by exam</Link>
          </p>
        ) : (
          <>
            <p className="mt-6 text-sm text-muted">{products.length} {products.length === 1 ? "title" : "titles"} found</p>
            <ul className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{products.map((p) => <li key={p.id}><ProductCard p={p} /></li>)}</ul>
          </>
        )}
      </div>
    </main>
  );
}
