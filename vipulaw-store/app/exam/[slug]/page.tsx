import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { PRODUCT_TYPES, SELLABLE_TYPES, typeLabel } from "@/lib/catalog";
import { STATES, findState } from "@/lib/states";
import Icon from "@/components/Icons";
import ProductCard from "@/components/ProductCard";
import StatePicker, { type StateTile } from "@/components/StatePicker";

export default async function ExamPage({
  params, searchParams,
}: { params: Promise<{ slug: string }>; searchParams: Promise<{ section?: string; type?: string; state?: string }> }) {
  const { slug } = await params;
  const { section, type, state } = await searchParams;
  const exam = await db.exam.findFirst({
    where: { slug, active: true },
    include: { sections: { orderBy: { sortOrder: "asc" } } },
  });
  if (!exam) notFound();

  const sec = exam.sections.find((s) => s.slug === section);
  const typ = SELLABLE_TYPES.find((t) => t === type);
  const st = exam.stateWise ? findState(state) : undefined;

  // In a state-wise exam a title belongs to exactly one place: a state, or "General" (no state).
  const [products, perState] = await Promise.all([
    db.product.findMany({
      where: {
        examId: exam.id, status: "PUBLISHED",
        ...(sec && { sectionId: sec.id }), ...(typ && { type: typ }),
        ...(exam.stateWise && { state: st ? st.slug : null }),
      },
      orderBy: { createdAt: "desc" },
      include: { section: { select: { name: true } }, files: { select: { pageCount: true } } },
    }),
    exam.stateWise
      ? db.product.groupBy({ by: ["state"], where: { examId: exam.id, status: "PUBLISHED" }, _count: { _all: true } })
      : Promise.resolve([]),
  ]);
  const counts = new Map(perState.map((r) => [r.state, r._count._all]));

  const href = (q: { section?: string; type?: string; state?: string }) => {
    const p = new URLSearchParams();
    if (q.section) p.set("section", q.section);
    if (q.type) p.set("type", q.type);
    if (q.state) p.set("state", q.state);
    const s = p.toString();
    return `/exam/${exam.slug}${s ? `?${s}` : ""}`;
  };
  const stateSlug = st?.slug;
  const n = (c: number) => `${c} ${c === 1 ? "title" : "titles"}`;
  const stateTiles: StateTile[] = [
    { key: "general", label: "General", icon: "scales", count: n(counts.get(null) ?? 0), href: href({ section, type }), active: !stateSlug },
    ...STATES.map((x) => ({ key: x.slug, label: x.name, icon: x.icon, count: n(counts.get(x.slug) ?? 0), href: href({ section, type, state: x.slug }), active: stateSlug === x.slug })),
  ];
  const chip = (active: boolean) =>
    `whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm transition ${active ? "border-navy bg-navy text-white" : "border-line bg-white text-navy hover:border-gold"}`;

  return (
    <main className="mx-auto max-w-5xl px-4 pb-10 pt-10 sm:pt-14">
      <Link href="/" className="text-sm text-muted hover:text-navy">← All exams</Link>
      <div className="mt-3 rounded-xl border border-line bg-white p-6 shadow-sm">
        <h1 className="font-serif text-3xl text-navy sm:text-4xl">{exam.name}</h1>
        <p className="mt-2 max-w-xl text-muted">{exam.blurb}</p>

        {exam.stateWise && (
          <div className="mt-6 border-t border-line pt-5">
            <p className="mb-3 flex items-center gap-1.5 text-xs font-medium uppercase tracking-widest text-muted">
              <Icon name="pin" className="h-3.5 w-3.5" /> Choose your state
            </p>
            <StatePicker tiles={stateTiles} />
          </div>
        )}
      </div>

      <div className="mt-4 space-y-4 rounded-xl border border-line bg-white p-5 shadow-sm">
        {exam.sections.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-widest text-muted">Section</p>
            <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="group" aria-label="Section">
              <Link href={href({ type, state: stateSlug })} className={chip(!sec)}>All</Link>
              {exam.sections.map((s) => <Link key={s.id} href={href({ section: s.slug, type, state: stateSlug })} className={chip(sec?.id === s.id)}>{s.name}</Link>)}
            </div>
          </div>
        )}
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-widest text-muted">Material type</p>
          <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="group" aria-label="Product type">
            <Link href={href({ section, state: stateSlug })} className={chip(!typ)}>All types</Link>
            {(Object.keys(PRODUCT_TYPES) as (keyof typeof PRODUCT_TYPES)[]).map((t) => (
              <Link key={t} href={href({ section, type: t, state: stateSlug })} className={chip(typ === t)}>{typeLabel(t)}</Link>
            ))}
          </div>
        </div>
      </div>

      {exam.stateWise && (
        <p className="mt-4 text-sm text-muted">
          Showing <span className="font-medium text-navy">{st ? st.name : "General (not state-specific)"}</span>
          {st && <> · <Link href={href({ section, type })} className="underline">back to General</Link></>}
        </p>
      )}

      {products.length === 0 ? (
        <p className="mt-4 rounded-xl border border-dashed border-line bg-white p-10 text-center text-muted">
          {sec || typ ? "Nothing here yet. " : st ? `No titles for ${st.name} yet. ` : "New material is on the way. "}
          {(sec || typ) && <Link href={href({ state: stateSlug })} className="text-navy underline">Clear filters</Link>}
        </p>
      ) : (
        <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => <li key={p.id}><ProductCard p={p} /></li>)}
        </ul>
      )}
    </main>
  );
}
