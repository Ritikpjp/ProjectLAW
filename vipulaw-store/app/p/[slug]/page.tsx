import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getUser } from "@/lib/auth/session";
import { rupees, typeLabel } from "@/lib/catalog";
import { typeStyle } from "@/lib/exam-meta";
import Icon from "@/components/Icons";
import PayButton from "@/components/PayButton";
import ProductCard from "@/components/ProductCard";

const mb = (bytes: number) => `${(bytes / 1048576).toFixed(bytes > 10485760 ? 0 : 1)} MB`;

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await getUser();
  const product = await db.product.findFirst({
    where: { slug, status: "PUBLISHED" },
    include: { exam: true, section: true, files: { orderBy: { sortOrder: "asc" } } },
  });
  if (!product) notFound();

  const [owned, related] = await Promise.all([
    user ? db.order.findFirst({ where: { userId: user.id, productId: product.id, status: "PAID" } }) : null,
    db.product.findMany({
      where: { examId: product.examId, status: "PUBLISHED", id: { not: product.id } },
      orderBy: { createdAt: "desc" },
      take: 3,
      include: { section: { select: { name: true } }, exam: { select: { name: true } }, files: { select: { pageCount: true } } },
    }),
  ]);
  const pages = product.files.reduce((n, f) => n + f.pageCount, 0);
  const size = product.files.reduce((n, f) => n + f.bytes, 0);
  const t = typeStyle(product.type);

  return (
    <main>
      <section className="relative overflow-hidden text-white" style={{ background: `linear-gradient(135deg, ${t.from}, ${t.to})` }}>
        <div className="dot-grid absolute inset-0" aria-hidden />
        <Icon name={t.icon} className="absolute -right-6 -top-8 h-64 w-64 text-white/10" />
        <div className="relative mx-auto max-w-6xl px-4 py-10 sm:py-14">
          <nav className="text-sm text-white/70">
            <Link href="/" className="underline">Home</Link> / <Link href={`/exam/${product.exam.slug}`} className="underline">{product.exam.name}</Link>
          </nav>
          <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wider">
            <span className="rounded-full bg-white/15 px-3 py-1 backdrop-blur">{typeLabel(product.type)}</span>
            {product.section && <span className="rounded-full bg-[#d9b566]/90 px-3 py-1 text-[#0a1529]">{product.section.name}</span>}
          </div>
          <h1 className="mt-4 max-w-3xl font-serif text-[1.75rem] leading-tight sm:text-5xl">{product.title}</h1>
          <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/80">
            <li className="flex items-center gap-1.5"><Icon name="file" className="h-4 w-4 text-[#d9b566]" /> {pages} pages</li>
            <li className="flex items-center gap-1.5"><Icon name="files" className="h-4 w-4 text-[#d9b566]" /> {product.files.length} PDF {product.files.length === 1 ? "file" : "files"} · {mb(size)}</li>
            <li className="flex items-center gap-1.5"><Icon name="eye" className="h-4 w-4 text-[#d9b566]" /> Free preview</li>
          </ul>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 sm:gap-8 sm:py-10 lg:grid-cols-[1fr_380px]">
        <div className="min-w-0 space-y-8">
          <section className="rounded-2xl border border-line bg-white p-6">
            <h2 className="font-serif text-xl text-navy">About this title</h2>
            <p className="mt-3 whitespace-pre-line leading-relaxed text-ink/80">{product.description || "Exam-oriented study material in PDF format."}</p>
            {product.files.length > 1 && (
              <div className="mt-5">
                <p className="text-sm font-semibold text-navy">Included in this bundle</p>
                <ul className="mt-2 space-y-1.5">
                  {product.files.map((f) => (
                    <li key={f.id} className="flex items-center justify-between gap-3 rounded-lg bg-paper px-3 py-2 text-sm">
                      <span className="flex min-w-0 items-center gap-2"><Icon name="file" className="h-4 w-4 shrink-0 text-gold" /><span className="truncate">{f.label}</span></span>
                      <span className="shrink-0 text-xs text-muted">{f.pageCount} pages</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-line bg-white p-6">
            <h2 className="font-serif text-xl text-navy">What you get</h2>
            <ul className="mt-4 grid gap-4 sm:grid-cols-2">
              {[
                ["qr", "A personalised copy", "Your name, mobile and licence ID printed on every page, with a small verification QR."],
                ["zap", "Instant download", "Available in My library as soon as payment is confirmed."],
                ["shield", "Verifiable licence", "Anyone can scan the QR to check the copy is genuine."],
                ["lock", "Private and secure", "Files are never public. Only the buyer can download."],
              ].map(([icon, title, text]) => (
                <li key={title} className="flex gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold-soft text-navy"><Icon name={icon} /></span>
                  <div><p className="font-semibold text-navy">{title}</p><p className="text-sm text-muted">{text}</p></div>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-navy">Free preview</h2>
            <p className="mt-1 text-sm text-muted">The first few pages, exactly as they appear in the book. Your copy will also carry your details.</p>
            <div className="mt-4 space-y-5">
              {product.files.map((f) => (
                <div key={f.id}>
                  {product.files.length > 1 && <p className="mb-1.5 text-sm font-semibold text-navy">{f.label}</p>}
                  <object data={`/api/preview/${f.id}#toolbar=0&navpanes=0`} type="application/pdf" className="h-[70vh] min-h-[22rem] w-full rounded-2xl border border-line bg-white shadow-sm">
                    <a className="underline" href={`/api/preview/${f.id}`}>Open preview</a>
                  </object>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="order-first lg:order-none lg:sticky lg:top-28 lg:self-start">
          <div className="overflow-hidden rounded-3xl border border-line bg-white shadow-[0_24px_50px_-24px_rgba(15,31,61,0.35)]">
            <div className="bg-navy px-6 py-5 text-white">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#d9b566]">One-time price</p>
              <p className="mt-1 font-serif text-4xl">{rupees(product.pricePaise)}</p>
            </div>
            <div className="p-6">
              {user?.role === "ADMIN" ? (
                <div className="rounded-xl border border-[#d9b566] bg-gold-soft/60 p-4 text-sm text-navy">
                  <p className="flex items-center gap-2 font-semibold"><Icon name="shield" className="h-4 w-4" /> You are signed in as admin</p>
                  <p className="mt-1 text-navy/80">Admins cannot buy. Use <Link href="/admin" className="font-semibold underline">Upload</Link> to edit this title, its price or its files.</p>
                </div>
              ) : owned ? (
                <Link href="/library" className="block w-full rounded-xl bg-green-700 px-6 py-4 text-center text-lg font-bold text-white hover:bg-green-800">You own this. Download</Link>
              ) : (
                <PayButton productId={product.id} loggedIn={!!user} label={user ? `Buy now · ${rupees(product.pricePaise)}` : "Log in to buy"} />
              )}
              <ul className="mt-5 space-y-2.5 text-sm text-muted">
                <li className="flex gap-2"><Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-green-700" /> Secure payment by UPI, card or net banking via Razorpay</li>
                <li className="flex gap-2"><Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-green-700" /> Your details are printed on every page</li>
                <li className="flex gap-2"><Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-green-700" /> For personal use. Sharing is traceable.</li>
              </ul>
              <p className="mt-5 border-t border-line pt-4 text-xs text-muted">Please read the <Link href="/refund-policy" className="underline">refund policy</Link> before buying. Digital goods are delivered instantly.</p>
            </div>
          </div>
        </aside>
      </div>

      {related.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pb-6">
          <h2 className="font-serif text-2xl text-navy">More for {product.exam.name}</h2>
          <ul className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((p) => <li key={p.id}><ProductCard p={p} /></li>)}
          </ul>
        </section>
      )}
    </main>
  );
}
