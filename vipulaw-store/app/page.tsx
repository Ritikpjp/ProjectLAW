import Link from "next/link";
import { db } from "@/lib/db";
import { PRODUCT_TYPES } from "@/lib/catalog";
import { examStyle, typeStyle } from "@/lib/exam-meta";
import Icon from "@/components/Icons";
import ProductCard from "@/components/ProductCard";

const QR = ["1110111", "1010101", "1110110", "0001011", "1101001", "0111010", "1010111"];

const FEATURES = [
  { icon: "eye", title: "Free preview, always", text: "Read the first pages of every title before you spend a rupee." },
  { icon: "qr", title: "A copy that is yours", text: "Your name, mobile and licence ID are printed on each page, with a small QR code." },
  { icon: "shield", title: "Verifiable licence", text: "Scan the QR to confirm a copy is genuine. Leaked copies can be traced back." },
  { icon: "zap", title: "Instant download", text: "The moment payment clears, your personalised PDF is ready in My library." },
  { icon: "card", title: "Secure payments", text: "Pay by UPI, card or net banking through Razorpay. We never see your card details." },
  { icon: "layers", title: "Bundles and series", text: "Some titles ship as a bundle of several PDFs, all unlocked with a single purchase." },
];

const STEPS = [
  { n: "01", icon: "user", title: "Create your account", text: "Sign up with your mobile number and a one-time code. No password." },
  { n: "02", icon: "eye", title: "Preview the book", text: "Open any title and read the free preview pages." },
  { n: "03", icon: "card", title: "Pay securely", text: "Check out with UPI, card or net banking in a few taps." },
  { n: "04", icon: "download", title: "Download your copy", text: "Get the PDF stamped with your details, ready for study." },
];

const FAQ = [
  ["How do I receive the PDF?", "Immediately after payment, the book appears in My library with a Download button. You can download it again from there within the licence limit."],
  ["Why is my name on every page?", "Each copy is licensed to one student. Your name, mobile and a licence ID are printed in a small line on every page, with a QR code that confirms the copy is genuine."],
  ["Can I preview before buying?", "Yes. Every title shows its first few pages as a free preview on the product page."],
  ["Do I need a password?", "No. You log in with your mobile number and a one-time code each time."],
  ["Which payment methods work?", "UPI, debit and credit cards, and net banking, processed by Razorpay."],
  ["Can I share the PDF with friends?", "Copies are for the buyer's personal use. Because every page is personalised and traceable, sharing exposes your own details."],
];

export default async function Home() {
  const [exams, latest, stats] = await Promise.all([
    db.exam.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
      include: {
        sections: { orderBy: { sortOrder: "asc" }, select: { id: true, name: true } },
        _count: { select: { products: { where: { status: "PUBLISHED" } } } },
      },
    }),
    db.product.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { section: { select: { name: true } }, exam: { select: { name: true } }, files: { select: { pageCount: true } } },
    }),
    Promise.all([
      db.product.count({ where: { status: "PUBLISHED" } }),
      db.productFile.aggregate({ where: { product: { status: "PUBLISHED" } }, _sum: { pageCount: true } }),
    ]),
  ]);
  const [titles, pagesAgg] = stats;
  const pages = pagesAgg._sum.pageCount ?? 0;

  return (
    <main>
      {/* HERO */}
      <section className="hero-bg bg-navy relative overflow-hidden text-white">
        <div className="dot-grid absolute inset-0" aria-hidden />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-10 sm:py-20 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="min-w-0">
            <p className="rise inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-medium uppercase tracking-[0.18em] text-[#d9b566]">
              <Icon name="scales" className="h-3.5 w-3.5" /> Law exam study material
            </p>
            <h1 className="rise rise-2 mt-5 font-serif text-[2.15rem] leading-[1.12] sm:text-5xl lg:text-6xl">
              Prepare for every law exam with books made for <span className="text-[#d9b566]">your</span> paper.
            </h1>
            <p className="rise rise-3 mt-4 max-w-xl text-base leading-relaxed text-white/75 sm:mt-5 sm:text-lg">
              Practice books, previous year papers, bare acts and notes for Judiciary, APO / ADPO / ADA / APP, Law Officer, UGC NET / JRF and AIBE. Preview first, pay once, download instantly.
            </p>
            <form action="/search" className="rise rise-3 mt-8 flex max-w-xl overflow-hidden rounded-2xl bg-white p-1.5 shadow-2xl shadow-black/30">
              <label className="sr-only" htmlFor="home-search">Search study material</label>
              <span className="flex items-center pl-3 text-muted"><Icon name="search" /></span>
              <input id="home-search" name="q" minLength={2} maxLength={80} placeholder="Search e.g. jurisprudence, CPC, PYQ" className="min-w-0 flex-1 bg-transparent px-3 py-3 text-base text-ink outline-none" />
              <button className="rounded-xl bg-navy px-5 py-3 text-sm font-semibold text-white transition hover:bg-navy-soft">Search</button>
            </form>
            <div className="rise rise-3 mt-6 flex flex-wrap gap-3">
              <a href="#exams" className="flex-1 rounded-xl bg-gold px-6 py-3.5 text-center font-semibold sm:flex-none text-[#0a1529] transition hover:bg-[#d9b566]">Choose your exam</a>
              <Link href="/signup" className="flex-1 rounded-xl border border-white/30 px-6 py-3.5 text-center font-semibold text-white sm:flex-none transition hover:bg-white/10">Create free account</Link>
            </div>
            <ul className="mt-6 grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-white/70 sm:mt-8 sm:flex sm:flex-wrap sm:gap-x-6">
              {["Free preview", "Instant download", "Personalised PDFs", "Razorpay payments"].map((t) => (
                <li key={t} className="flex items-center gap-1.5"><Icon name="check" className="h-4 w-4 text-[#d9b566]" /> {t}</li>
              ))}
            </ul>
          </div>

          {/* Illustration of a personalised page */}
          <div className="relative mx-auto hidden w-full max-w-sm lg:block" aria-hidden>
            <div className="absolute -inset-6 rounded-[2rem] bg-gold/10 blur-2xl" />
            <div className="keep-light relative -rotate-2 rounded-2xl bg-white p-5 text-ink shadow-2xl shadow-black/40">
              <p className="border-b border-line pb-1.5 text-[9px] leading-tight text-muted">Licensed to <b className="text-ink">Aarav Sharma</b> · +91 98••• ••210 · Licence VL-7F3A9C21B0</p>
              <p className="mt-4 font-serif text-lg text-navy">Jurisprudence</p>
              <p className="text-[11px] text-muted">Practice set · Topic 4</p>
              <div className="mt-4 space-y-2">
                {[92, 100, 84, 96, 60].map((w, i) => <div key={i} className="h-2 rounded bg-slate-200" style={{ width: `${w}%` }} />)}
              </div>
              <div className="mt-5 space-y-1.5">
                {["A", "B", "C", "D"].map((o) => (
                  <div key={o} className="flex items-center gap-2 rounded-lg border border-line px-2.5 py-1.5 text-[11px] text-muted"><span className="font-semibold text-navy">{o}</span><div className="h-1.5 flex-1 rounded bg-slate-100" /></div>
                ))}
              </div>
              <div className="mt-5 flex items-end justify-between">
                <p className="text-[9px] text-muted">Page 14 of 120<br />Sample of your copy</p>
                <svg viewBox="0 0 7 7" className="h-12 w-12" shapeRendering="crispEdges">
                  {QR.flatMap((row, y) => [...row].map((c, x) => c === "1" ? <rect key={`${x}${y}`} x={x} y={y} width="1" height="1" fill="#0f1f3d" /> : null))}
                </svg>
              </div>
            </div>
            <div className="absolute -bottom-5 -left-4 flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-semibold text-navy shadow-xl"><Icon name="shield" className="h-4 w-4 text-gold" /> QR verifies the licence</div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="border-b border-line bg-white">
        <dl className="mx-auto grid max-w-6xl grid-cols-2 gap-px px-4 py-6 text-center sm:grid-cols-4">
          {[
            [String(exams.length), "Exam tracks"],
            [titles > 0 ? String(titles) : "New", titles > 0 ? "Titles available" : "Titles arriving soon"],
            [pages > 0 ? pages.toLocaleString("en-IN") : "PDF", pages > 0 ? "Pages of material" : "Notes and books"],
            ["Free", "Preview on every title"],
          ].map(([v, k]) => (
            <div key={k} className="px-2 py-2">
              <dt className="sr-only">{k}</dt>
              <dd className="font-serif text-3xl text-navy">{v}</dd>
              <p className="mt-0.5 text-xs font-medium uppercase tracking-wider text-muted">{k}</p>
            </div>
          ))}
        </dl>
      </section>

      {/* EXAMS */}
      <section id="exams" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-12 sm:py-16">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Start here</p>
          <h2 className="mt-2 font-serif text-[1.7rem] leading-tight text-navy sm:text-4xl">Choose your exam</h2>
          <p className="mt-3 text-muted">Pick the exam you are preparing for to see its practice books, previous year papers, bare acts and notes.</p>
        </div>
        <ul className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {exams.map((e) => {
            const st = examStyle(e.slug);
            return (
              <li key={e.id}>
                <Link href={`/exam/${e.slug}`} className="group flex h-full flex-col overflow-hidden rounded-3xl border border-line bg-white transition duration-200 hover:-translate-y-1 hover:border-gold hover:shadow-[0_22px_45px_-20px_rgba(15,31,61,0.4)]">
                  <div className="relative flex items-center gap-4 overflow-hidden px-6 py-6 text-white" style={{ background: `linear-gradient(135deg, ${st.from}, ${st.to})` }}>
                    <Icon name={st.icon} className="absolute -right-4 -top-4 h-32 w-32 text-white/10" />
                    <span className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur"><Icon name={st.icon} className="h-7 w-7" /></span>
                    <div className="relative min-w-0">
                      <h3 className="font-serif text-2xl leading-tight">{e.name}</h3>
                      <p className="mt-0.5 text-xs text-white/75">{st.tagline}</p>
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <p className="flex-1 text-sm leading-relaxed text-muted">{e.blurb}</p>
                    {e.sections.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {e.sections.map((s) => <span key={s.id} className="rounded-full px-2.5 py-1 text-xs font-medium text-navy" style={{ background: st.soft }}>{s.name}</span>)}
                      </div>
                    )}
                    <p className="mt-5 flex items-center justify-between border-t border-line pt-4 text-sm font-semibold text-navy">
                      <span>{e._count.products} {e._count.products === 1 ? "title" : "titles"}</span>
                      <span className="flex items-center gap-1 text-gold transition group-hover:gap-2">Explore <Icon name="arrow" className="h-4 w-4" /></span>
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
          <li>
            <Link href="/search" className="group flex h-full min-h-56 flex-col items-center justify-center rounded-3xl border-2 border-dashed border-gold/60 bg-gold-soft/40 p-6 text-center transition hover:border-gold hover:bg-gold-soft">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-gold shadow-sm"><Icon name="search" className="h-7 w-7" /></span>
              <h3 className="mt-4 font-serif text-xl text-navy">Not sure where to look?</h3>
              <p className="mt-1 max-w-[16rem] text-sm text-muted">Search all material by subject, act or topic.</p>
              <span className="mt-4 flex items-center gap-1 text-sm font-semibold text-navy">Search everything <Icon name="arrow" className="h-4 w-4 transition group-hover:translate-x-1" /></span>
            </Link>
          </li>
        </ul>
      </section>

      {/* MATERIAL TYPES */}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Shop by material</p>
          <h2 className="mt-2 font-serif text-[1.7rem] leading-tight text-navy sm:text-4xl">Everything you study from</h2>
          <ul className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {(Object.entries(PRODUCT_TYPES) as [string, string][]).map(([key, label]) => {
              const t = typeStyle(key);
              return (
                <li key={key}>
                  <Link href={`/search?type=${key}`} className="group flex h-full flex-col rounded-2xl border border-line bg-paper p-5 transition hover:-translate-y-0.5 hover:border-gold hover:bg-white hover:shadow-md">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl text-white" style={{ background: `linear-gradient(135deg, ${t.from}, ${t.to})` }}><Icon name={t.icon} /></span>
                    <h3 className="mt-4 font-serif text-lg text-navy">{label}</h3>
                    <p className="mt-1 flex-1 text-sm text-muted">{t.blurb}</p>
                    <span className="mt-4 flex items-center gap-1 text-sm font-semibold text-gold transition group-hover:gap-2">Browse <Icon name="arrow" className="h-4 w-4" /></span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* LATEST */}
      {latest.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Just added</p>
              <h2 className="mt-2 font-serif text-[1.7rem] leading-tight text-navy sm:text-4xl">Latest material</h2>
            </div>
            <Link href="/search?q=" className="hidden text-sm font-semibold text-navy underline sm:block">Search all titles</Link>
          </div>
          <ul className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {latest.map((p) => <li key={p.id}><ProductCard p={p} /></li>)}
          </ul>
        </section>
      )}

      {/* WHY */}
      <section className="hero-bg bg-navy relative overflow-hidden text-white">
        <div className="dot-grid absolute inset-0" aria-hidden />
        <div className="relative mx-auto max-w-6xl px-4 py-12 sm:py-16">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#d9b566]">Why Vipulaw</p>
          <h2 className="mt-2 max-w-2xl font-serif text-3xl sm:text-4xl">Study material you can trust, from preview to download</h2>
          <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <li key={f.title} className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold/20 text-[#d9b566]"><Icon name={f.icon} /></span>
                <h3 className="mt-4 font-serif text-xl">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/70">{f.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">How it works</p>
        <h2 className="mt-2 font-serif text-[1.7rem] leading-tight text-navy sm:text-4xl">From sign-up to study in four steps</h2>
        <ol className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <li key={s.n} className="relative rounded-2xl border border-line bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between">
                <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gold-soft text-navy ring-1 ring-gold/40"><Icon name={s.icon} className="h-8 w-8" /></span>
                <span className="font-serif text-5xl leading-none text-gold/50">{s.n}</span>
              </div>
              <h3 className="mt-5 font-serif text-xl text-navy">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{s.text}</p>
              {i < STEPS.length - 1 && <span aria-hidden className="absolute -right-4 top-1/2 z-10 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-white text-gold shadow-sm lg:flex"><Icon name="arrow" className="h-4 w-4" /></span>}
            </li>
          ))}
        </ol>
      </section>

      {/* FAQ */}
      <section className="bg-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:py-16 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Questions</p>
            <h2 className="mt-2 font-serif text-[1.7rem] leading-tight text-navy sm:text-4xl">Good to know before you buy</h2>
            <p className="mt-3 text-muted">Read our <Link href="/refund-policy" className="font-medium text-navy underline">refund policy</Link> and <Link href="/terms" className="font-medium text-navy underline">terms of use</Link> for the full details.</p>
          </div>
          <div className="space-y-3">
            {FAQ.map(([q, a]) => (
              <details key={q} className="faq group rounded-2xl border border-line bg-paper px-5 py-4 open:bg-white open:shadow-sm">
                <summary className="flex cursor-pointer items-center justify-between gap-4 font-semibold text-navy">
                  {q}
                  <span className="chev flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gold-soft text-lg leading-none text-navy transition-transform">+</span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-muted">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
        <div className="hero-bg bg-navy relative overflow-hidden rounded-3xl px-5 py-10 text-center text-white sm:px-12 sm:py-12">
          <div className="dot-grid absolute inset-0" aria-hidden />
          <div className="relative">
            <h2 className="mx-auto max-w-2xl font-serif text-3xl sm:text-4xl">Ready to start your preparation?</h2>
            <p className="mx-auto mt-3 max-w-xl text-white/75">Create a free account, preview any title, and download your personalised copy the moment you buy.</p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link href="/signup" className="rounded-xl bg-gold px-7 py-3.5 font-semibold text-[#0a1529] transition hover:bg-[#d9b566]">Create free account</Link>
              <a href="#exams" className="rounded-xl border border-white/30 px-7 py-3.5 font-semibold transition hover:bg-white/10">Browse exams</a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
