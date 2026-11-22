import Link from "next/link";
import { rupees, typeLabel } from "@/lib/catalog";
import { stateName } from "@/lib/states";

export type CardProduct = {
  slug: string; title: string; description: string; type: string; pricePaise: number;
  section: { name: string } | null; files?: { pageCount: number }[];
  exam?: { name: string } | null; state?: string | null;
};

export default function ProductCard({ p }: { p: CardProduct }) {
  const pages = p.files?.reduce((n, f) => n + f.pageCount, 0) ?? 0;
  const meta = [p.exam?.name, stateName(p.state), p.section?.name, typeLabel(p.type)].filter(Boolean).join(" · ");
  return (
    <Link href={`/p/${p.slug}`} className="flex h-full flex-col rounded-xl border border-line bg-white p-5 shadow-sm transition hover:border-gold">
      <p className="text-xs text-muted">{meta}</p>
      <h3 className="mt-2 font-serif text-lg leading-snug text-navy">{p.title}</h3>
      {p.description && <p className="mt-2 line-clamp-2 flex-1 text-sm text-muted">{p.description}</p>}
      <p className="mt-4 flex items-baseline justify-between border-t border-line pt-3">
        <span className="font-medium text-navy">{rupees(p.pricePaise)}</span>
        {pages > 0 && <span className="text-xs text-muted">{pages} pages · free preview</span>}
      </p>
    </Link>
  );
}
