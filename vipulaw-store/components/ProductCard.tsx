import Link from "next/link";
import { rupees, typeLabel } from "@/lib/catalog";
import { typeStyle } from "@/lib/exam-meta";
import Icon from "@/components/Icons";

export type CardProduct = {
  slug: string; title: string; description: string; type: string; pricePaise: number;
  section: { name: string } | null; files?: { pageCount: number }[];
  exam?: { name: string } | null;
};

export default function ProductCard({ p }: { p: CardProduct }) {
  const t = typeStyle(p.type);
  const pages = p.files?.reduce((n, f) => n + f.pageCount, 0) ?? 0;
  return (
    <Link href={`/p/${p.slug}`} className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-white transition duration-200 hover:-translate-y-1 hover:border-gold hover:shadow-[0_18px_40px_-18px_rgba(15,31,61,0.35)]">
      <div className="relative flex h-32 items-end overflow-hidden p-4 text-white" style={{ background: `linear-gradient(135deg, ${t.from}, ${t.to})` }}>
        <Icon name={t.icon} className="absolute -right-3 -top-3 h-28 w-28 text-white/10" />
        <div className="dot-grid absolute inset-0 opacity-60" aria-hidden />
        <div className="relative flex w-full items-end justify-between gap-2">
          <span className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider backdrop-blur">{typeLabel(p.type)}</span>
          {p.section && <span className="rounded-full bg-[#d9b566]/90 px-2.5 py-1 text-[11px] font-semibold text-[#0a1529]">{p.section.name}</span>}
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        {p.exam && <p className="text-xs font-medium text-gold">{p.exam.name}</p>}
        <h3 className="mt-1 font-serif text-lg leading-snug text-navy">{p.title}</h3>
        <p className="mt-2 line-clamp-2 flex-1 text-sm text-muted">{p.description || "Exam-oriented study material in PDF format."}</p>
        {pages > 0 && (
          <p className="mt-3 flex items-center gap-1.5 text-xs text-muted">
            <Icon name="file" className="h-3.5 w-3.5" /> {pages} pages{p.files && p.files.length > 1 ? ` · ${p.files.length} files` : ""} · free preview
          </p>
        )}
        <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
          <span className="text-xl font-bold text-navy">{rupees(p.pricePaise)}</span>
          <span className="flex items-center gap-1 text-sm font-semibold text-gold transition group-hover:gap-2">Preview <Icon name="arrow" className="h-4 w-4" /></span>
        </div>
      </div>
    </Link>
  );
}
