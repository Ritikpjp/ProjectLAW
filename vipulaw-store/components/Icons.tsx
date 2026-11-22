// Small hand-drawn icon set (24x24, stroke based) so the UI needs no icon package.
const PATHS: Record<string, string[]> = {
  scales: ["M6 6l-3 7a4 4 0 0 0 6 0z", "M18 6l-3 7a4 4 0 0 0 6 0z", "M12 3v18", "M8 21h8", "M6 6h12"],
  gavel: ["M14 4l6 6", "M11 7l6 6-4 4-6-6z", "M3 21l7-7", "M4 21h8"],
  briefcase: ["M3 8h18v11H3z", "M9 8V5h6v3", "M3 13h18"],
  cap: ["M2 9l10-5 10 5-10 5z", "M6 11v5c0 1.5 3 3 6 3s6-1.5 6-3v-5"],
  award: ["M12 14a5 5 0 1 0 0-10 5 5 0 0 0 0 10z", "M8.5 13.5L7 21l5-3 5 3-1.5-7.5"],
  book: ["M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z", "M4 19V5", "M8 7h7"],
  file: ["M6 3h8l5 5v13H6z", "M14 3v5h5", "M9 13h6", "M9 17h6"],
  files: ["M8 3h7l4 4v11H8z", "M15 3v4h4", "M5 7v14h11"],
  list: ["M9 6h11", "M9 12h11", "M9 18h11", "M4 6h.01", "M4 12h.01", "M4 18h.01"],
  help: ["M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z", "M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5", "M12 17h.01"],
  note: ["M5 3h14v18H5z", "M9 8h6", "M9 12h6", "M9 16h3"],
  eye: ["M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z", "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"],
  lock: ["M6 11h12v9H6z", "M8 11V8a4 4 0 0 1 8 0v3"],
  shield: ["M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z", "M9 12l2 2 4-4"],
  qr: ["M4 4h6v6H4z", "M14 4h6v6h-6z", "M4 14h6v6H4z", "M14 14h3v3", "M20 14v6h-3", "M14 20h.01"],
  download: ["M12 4v11", "M7 11l5 5 5-5", "M5 20h14"],
  search: ["M11 17a6 6 0 1 0 0-12 6 6 0 0 0 0 12z", "M16 16l4 4"],
  zap: ["M13 2L4 14h7l-1 8 9-12h-7z"],
  check: ["M5 12l4 4 10-10"],
  arrow: ["M5 12h14", "M13 6l6 6-6 6"],
  card: ["M3 6h18v12H3z", "M3 10h18", "M7 15h3"],
  user: ["M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z", "M4 21c0-4 3.5-6 8-6s8 2 8 6"],
  menu: ["M4 7h16", "M4 12h16", "M4 17h16"],
  chart: ["M4 20V4", "M4 20h16", "M8 16v-5", "M13 16V8", "M18 16v-8"],
  layers: ["M12 3l9 5-9 5-9-5z", "M3 13l9 5 9-5"],
  phone: ["M8 3h8v18H8z", "M11 18h2"],
  sun: ["M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z", "M12 2v2", "M12 20v2", "M4.9 4.9l1.4 1.4", "M17.7 17.7l1.4 1.4", "M2 12h2", "M20 12h2", "M4.9 19.1l1.4-1.4", "M17.7 6.3l1.4-1.4"],
  moon: ["M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"],
  pin: ["M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11z", "M12 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"],
  // State landmark glyphs: simple stylised outlines, not exact drawings.
  "s-delhi": ["M5 21V9h14v12", "M9 21v-5a3 3 0 0 1 6 0v5", "M4 9h16", "M12 3v3", "M3 21h18"],
  "s-up": ["M12 3c2 2 3 3.5 3 5.5a3 3 0 0 1-6 0C9 6.5 10 5 12 3z", "M4 21V12", "M20 21V12", "M2 12h4", "M18 12h4", "M8 21v-6h8v6", "M3 21h18"],
  "s-maharashtra": ["M4 21V9", "M20 21V9", "M3 9h2", "M19 9h2", "M8 21v-8a4 4 0 0 1 8 0v8", "M4 9l1-2 1 2", "M18 9l1-2 1 2", "M3 21h18"],
  "s-gujarat": ["M12 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4z", "M12 7v8", "M7 11h10", "M9 21l3-6 3 6", "M6 21h12"],
  "s-rajasthan": ["M3 21V8h3v2h2V8h3v2h2V8h3v2h2V8h3v13z", "M10 21v-5a2 2 0 0 1 4 0v5"],
  "s-mp": ["M4 17a8 8 0 0 1 16 0z", "M12 9V4", "M9 4h6", "M3 21h18", "M10 21v-4h4v4"],
  "s-bihar": ["M12 2l2 4h-4z", "M9 6h6l1 5H8z", "M7 11h10l1 10H6z", "M12 21v-5"],
  "s-haryana": ["M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z", "M12 3v18", "M3 12h18", "M5.6 5.6l12.8 12.8", "M18.4 5.6L5.6 18.4"],
  "s-punjab": ["M12 3c1.5 1.5 2.5 3 2.5 4.5h-5C9.5 6 10.5 4.5 12 3z", "M8 7.5h8", "M7 21V12h10v9", "M5 12h14", "M3 21h18"],
  "s-karnataka": ["M12 3a4 4 0 0 1 4 4H8a4 4 0 0 1 4-4z", "M4 8h16", "M6 8v12", "M10 8v12", "M14 8v12", "M18 8v12", "M3 20h18"],
  "s-tn": ["M12 2v3", "M10 5h4l1 4H9z", "M8 9h8l1 4H7z", "M6 13h12l1 8H5z", "M11 21v-4h2v4"],
  "s-wb": ["M3 18h18", "M5 18V9l7 3 7-3v9", "M5 9l1-5", "M19 9l-1-5", "M12 12v6"],
  "s-kerala": ["M3 15c3 4 15 4 18 0z", "M12 15V4", "M12 5l6 7h-6", "M3 20c3 2 15 2 18 0"],
  "s-telangana": ["M5 21V8", "M19 21V8", "M3 8h4", "M17 8h4", "M8 21v-9a4 4 0 0 1 8 0v9", "M12 3v4", "M3 21h18"],
};

export type IconName = keyof typeof PATHS;

export default function Icon({ name, className = "h-5 w-5" }: { name: IconName | string; className?: string }) {
  const paths = PATHS[name] ?? PATHS.file;
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      {paths.map((d, i) => <path key={i} d={d} />)}
    </svg>
  );
}
