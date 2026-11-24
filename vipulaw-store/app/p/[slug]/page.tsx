import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getUser } from "@/lib/auth/session";
import { priceLabel, typeLabel } from "@/lib/catalog";
import { stateName } from "@/lib/states";
import PayButton from "@/components/PayButton";

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await getUser();
  const product = await db.product.findFirst({
    where: { slug, status: "PUBLISHED" },
    include: { exam: true, section: true, files: { orderBy: { sortOrder: "asc" } } },
  });
  if (!product) notFound();

  const owned = user ? await db.order.findFirst({ where: { userId: user.id, productId: product.id, status: "PAID" } }) : null;
  const free = product.pricePaise === 0;
  const pages = product.files.reduce((n, f) => n + f.pageCount, 0);
  const meta = [product.exam.name, stateName(product.state), product.section?.name, typeLabel(product.type)].filter(Boolean).join(" · ");

  return (
    <main className="mx-auto max-w-5xl px-4 pb-10 pt-8 sm:pt-12">
      <Link href={`/exam/${product.exam.slug}`} className="text-sm text-muted hover:text-navy">← {product.exam.name}</Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-4">
          <section className="rounded-xl border border-line bg-white p-6 shadow-sm">
            <p className="text-sm text-muted">{meta}</p>
            <h1 className="mt-2 font-serif text-3xl leading-tight text-navy sm:text-4xl">{product.title}</h1>
            <p className="mt-2 text-sm text-muted">{pages} pages · {product.files.length} PDF {product.files.length === 1 ? "file" : "files"}</p>
            {product.description && <p className="mt-4 whitespace-pre-line leading-relaxed text-ink/80">{product.description}</p>}
          </section>

          <section className="rounded-xl border border-line bg-white p-6 shadow-sm">
            <h2 className="font-serif text-xl text-navy">Free preview</h2>
            <p className="mt-1 text-sm text-muted">The first few pages of the book.</p>
            <div className="mt-4 space-y-5">
              {product.files.map((f) => (
                <div key={f.id}>
                  {product.files.length > 1 && <p className="mb-1.5 text-sm text-muted">{f.label}</p>}
                  <object data={`/api/preview/${f.id}#toolbar=0&navpanes=0`} type="application/pdf" className="h-[70vh] min-h-[22rem] w-full rounded-lg border border-line bg-white">
                    <a className="underline" href={`/api/preview/${f.id}`}>Open preview</a>
                  </object>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="order-first lg:order-none lg:sticky lg:top-20 lg:self-start">
          <div className="rounded-xl border border-line bg-white p-5 shadow-sm">
            <p className="font-serif text-3xl text-navy">{priceLabel(product.pricePaise)}</p>
            <p className="mt-1 text-sm text-muted">{free ? "Free with your account. Instant download." : "One-time payment. Instant download."}</p>
            <div className="mt-5">
              {user?.role === "ADMIN" ? (
                <p className="rounded-md bg-gold-soft px-3 py-3 text-sm text-navy">
                  Admins can&apos;t {free ? "claim" : "buy"}. <Link href="/admin" className="underline">Edit this title in Upload.</Link>
                </p>
              ) : owned ? (
                <Link href="/library" className="block w-full rounded-md bg-green-700 px-6 py-3.5 text-center font-medium text-white hover:bg-green-800">In your library</Link>
              ) : (
                <PayButton productId={product.id} loggedIn={!!user} label={free ? (user ? "Get it free" : "Log in to get it free") : user ? "Buy now" : "Log in to buy"} />
              )}
            </div>
            <p className="mt-4 text-xs leading-relaxed text-muted">
              Your name and a verification QR are printed on each page. Personal use only. See the <Link href="/refund-policy" className="underline">refund policy</Link>.
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}
