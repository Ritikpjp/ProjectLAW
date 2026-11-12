import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { PRODUCT_TYPES, SELLABLE_TYPES, typeLabel } from "@/lib/catalog";
import { examStyle } from "@/lib/exam-meta";
import Icon from "@/components/Icons";
import ProductCard from "@/components/ProductCard";

export default async function ExamPage({
  params, searchParams,
}: { params: Promise<{ slug: string }>; searchParams: Promise<{ section?: string; type?: string }> }) {
  const { slug } = await params;
  const { section, type } = await searchParams;
  const exam = await db.exam.findFirst({
    where: { slug, active: true },
    include: { sections: { orderBy: { sortOrder: "asc" } } },
  });
  if (!exam) notFound();

  const sec = exam.sections.find((s) => s.slug === section);
  const typ = SELLABLE_TYPES.find((t) => t === type);
  const [products, total] = await Promise.all([
    db.product.findMany({
      where: { examId: exam.id, status: "PUBLISHED", ...(sec && { sectionId: sec.id }), ...(typ && { type: typ }) },
      orderBy: { createdAt: "desc" },
      include: { section: { select: { name: true } }, files: { select: { pageCount: true } } },
    }),
    db.product.count({ where: { examId: exam.id, status: "PUBLISHED" } }),
  ]);
  const st = examStyle(exam.slug);

  const href = (q: { section?: string; type?: string }) => {
    const p = new URLSearchParams();
    if (q.section) p.set("section", q.section);
    if (q.type) p.set("type", q.type);
    const s = p.toString();
    return `/exam/${exam.slug}${s ? `?${s}` : ""}`;
  };
  const chip = (active: boolean) =>
    `whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition ${active ? "border-navy bg-navy text-white" : "border-line bg-white text-navy hover:border-gold"}`;

  return (
    <main>
      <section className="relative overflow-hidden text-white" style={{ background: `linear-gradient(135deg, ${st.from}, ${st.to})` }}>
        <div className="dot-grid absolute inset-0" aria-hidden />
        <Icon name={st.icon} className="absolute -right-6 -top-6 h-64 w-64 text-white/10" />
        <div className="relative mx-auto max-w-6xl px-4 py-12 sm:py-16">
          <nav className="text-sm text-white/70"><Link href="/" className="underline">Home</Link> / {exam.name}</nav>
          <div className="mt-4 flex items-center gap-4">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur"><Icon name={st.icon} className="h-8 w-8" /></span>
            <div>
              <h1 className="font-serif text-3xl sm:text-5xl">{exam.name}</h1>
              <p className="mt-1 text-white/75">{st.tagline}</p>
            </div>
          </div>
          <p className="mt-5 max-w-2xl text-white/85">{exam.blurb}</p>
          <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium backdrop-blur">
            <Icon name="files" className="h-4 w-4" /> {total} {total === 1 ? "title" : "titles"} available
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="rounded-2xl border border-line bg-white p-4 sm:p-5">
          {exam.sections.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted">Section</p>
              <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Section">
                <Link href={href({ type })} className={chip(!sec)}>All</Link>
                {exam.sections.map((s) => <Link key={s.id} href={href({ section: s.slug, type })} className={chip(sec?.id === s.id)}>{s.name}</Link>)}
              </div>
            </div>
          )}
          <div className={exam.sections.length > 0 ? "mt-4" : ""}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted">Material type</p>
            <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Product type">
              <Link href={href({ section })} className={chip(!typ)}>All types</Link>
              {(Object.keys(PRODUCT_TYPES) as (keyof typeof PRODUCT_TYPES)[]).map((t) => (
                <Link key={t} href={href({ section, type: t })} className={chip(typ === t)}>{typeLabel(t)}</Link>
              ))}
            </div>
          </div>
        </div>

        {products.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-line bg-white p-12 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gold-soft text-gold"><Icon name="book" className="h-7 w-7" /></span>
            <p className="mt-4 font-serif text-xl text-navy">{sec || typ ? "Nothing in this filter yet" : "New material is on the way"}</p>
            <p className="mt-1 text-sm text-muted">{sec || typ ? "Try another section or type." : "Check back shortly, or search across every exam."}</p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              {(sec || typ) && <Link href={`/exam/${exam.slug}`} className="rounded-xl bg-navy px-5 py-2.5 text-sm font-semibold text-white">Clear filters</Link>}
              <Link href="/search" className="rounded-xl border border-line px-5 py-2.5 text-sm font-semibold text-navy">Search all material</Link>
            </div>
          </div>
        ) : (
          <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => <li key={p.id}><ProductCard p={p} /></li>)}
          </ul>
        )}
      </div>
    </main>
  );
}
