"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Icon from "@/components/Icons";

export type StateTile = { key: string; label: string; icon: string; count: string; href: string; active: boolean };

// One compact row of state tiles; the side arrows scroll the rest into view.
export default function StatePicker({ tiles }: { tiles: StateTile[] }) {
  const row = useRef<HTMLDivElement>(null);
  const [edge, setEdge] = useState({ start: true, end: false });

  const measure = useCallback(() => {
    const el = row.current;
    if (!el) return;
    setEdge({ start: el.scrollLeft <= 2, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 2 });
  }, []);

  useEffect(() => {
    const el = row.current;
    el?.querySelector<HTMLElement>("[aria-current=true]")?.scrollIntoView({ inline: "center", block: "nearest" });
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  const scroll = (dir: -1 | 1) => row.current?.scrollBy({ left: dir * Math.max(160, (row.current?.clientWidth ?? 300) * 0.7), behavior: "smooth" });
  const arrow = "absolute top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-white text-navy shadow-sm transition hover:border-gold disabled:pointer-events-none disabled:opacity-0";

  return (
    <div className="relative">
      <button type="button" aria-label="Scroll states left" onClick={() => scroll(-1)} disabled={edge.start} className={`${arrow} -left-3`}>
        <Icon name="arrow" className="h-4 w-4 rotate-180" />
      </button>
      <div ref={row} onScroll={measure} className="flex gap-2 overflow-x-auto scroll-smooth px-1 py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {tiles.map((t) => (
          <Link
            key={t.key}
            href={t.href}
            aria-current={t.active ? "true" : undefined}
            className={`flex w-[7.5rem] shrink-0 flex-col items-center gap-0.5 rounded-lg border px-2 py-2 text-center transition ${t.active ? "border-navy bg-navy text-white" : "border-line bg-white text-navy hover:border-gold"}`}
          >
            <Icon name={t.icon} className="h-4 w-4" />
            <span className="w-full truncate text-xs font-medium leading-tight">{t.label}</span>
            <span className="text-[10px] leading-none opacity-70">{t.count}</span>
          </Link>
        ))}
      </div>
      <button type="button" aria-label="Scroll states right" onClick={() => scroll(1)} disabled={edge.end} className={`${arrow} -right-3`}>
        <Icon name="arrow" className="h-4 w-4" />
      </button>
    </div>
  );
}
