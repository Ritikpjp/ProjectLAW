import Link from "next/link";
import { db } from "@/lib/db";
import Icon from "@/components/Icons";
import ProductCard from "@/components/ProductCard";

const STEPS = [
  { icon: "eye", title: "Preview", text: "Read the first pages of any title for free." },
  { icon: "card", title: "Pay", text: "UPI, card or net banking through Razorpay." },
  { icon: "download", title: "Download", text: "Your PDF, personalised with your name." },
];

export default async function Home() {
  const [exams, latest] = await Promise.all([
    db.exam.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { products: { where: { status: "PUBLISHED" } } } } },
    }),
    db.product.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { createdAt: "desc" },
      take: 3,
      include: { section: { select: { name: true } }, exam: { select: { name: true } }, files: { select: { pageCount: true } } },
    }),
  ]);

  return (
    <main>
      <section className="mx-auto max-w-5xl px-4 pb-10 pt-14 sm:pb-14 sm:pt-24">
        <h1 className="max-w-2xl font-serif text-4xl leading-tight text-navy sm:text-5xl">
          Law exam notes, made for your paper.
        </h1>
        <p className="mt-4 max-w-xl text-lg text-muted">
          Practice books, previous year papers and bare acts. Preview free, pay once, download instantly.
        </p>
        <form action="/search" className="mt-8 flex max-w-lg gap-2">
          <label className="sr-only" htmlFor="home-search">Search study material</label>
          <input id="home-search" name="q" minLength={2} maxLength={80} placeholder="Search a subject or act"
            className="min-w-0 flex-1 rounded-md border border-line bg-white px-4 py-3 text-base outline-none focus:border-gold" />
          <button className="rounded-md bg-navy px-5 py-3 text-sm font-medium text-white transition hover:bg-navy-soft">Search</button>
        </form>
      </section>

      <section id="exams" className="mx-auto max-w-5xl scroll-mt-20 px-4 py-10">
        <h2 className="text-sm font-medium uppercase tracking-widest text-muted">Choose your exam</h2>
        <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {exams.map((e) => (
            <li key={e.id}>
              <Link href={`/exam/${e.slug}`} className="group flex h-full flex-col rounded-xl border border-line bg-white p-5 shadow-sm transition hover:border-gold">
                <span className="font-serif text-xl text-navy">{e.name}</span>
                <span className="mt-1 flex-1 text-sm text-muted">{e.blurb}</span>
                <span className="mt-4 flex items-center justify-between text-sm text-muted">
                  {e._count.products} {e._count.products === 1 ? "title" : "titles"}
                  <Icon name="arrow" className="h-4 w-4 text-gold transition group-hover:translate-x-0.5" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {latest.length > 0 && (
        <section className="mx-auto max-w-5xl px-4 py-10">
          <h2 className="text-sm font-medium uppercase tracking-widest text-muted">Latest</h2>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {latest.map((p) => <li key={p.id}><ProductCard p={p} /></li>)}
          </ul>
        </section>
      )}

      <section className="mx-auto max-w-5xl px-4 py-10">
        <h2 className="text-sm font-medium uppercase tracking-widest text-muted">How it works</h2>
        <ol className="mt-5 grid gap-6 sm:grid-cols-3">
          {STEPS.map((s) => (
            <li key={s.title} className="flex gap-3 rounded-xl border border-line bg-white p-5 shadow-sm">
              <Icon name={s.icon} className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
              <div>
                <p className="font-medium text-navy">{s.title}</p>
                <p className="mt-0.5 text-sm text-muted">{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
