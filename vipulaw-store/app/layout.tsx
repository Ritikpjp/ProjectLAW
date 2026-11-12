import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { db } from "@/lib/db";
import { getUser } from "@/lib/auth/session";
import LogoutButton from "@/components/LogoutButton";
import Icon from "@/components/Icons";
import ThemeToggle from "@/components/ThemeToggle";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Vipulaw | Law exam notes and practice books", template: "%s | Vipulaw" },
  description: "Practice books, PYQs, bare acts and notes for Judiciary, APO/ADA/APP, Law Officer, UGC NET and AIBE.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

const navLink = "rounded-lg px-2.5 py-2 text-sm sm:px-3 font-medium text-navy transition hover:bg-gold-soft";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const theme = (await cookies()).get("vl_theme")?.value === "dark" ? "dark" : "light";
  const [user, exams] = await Promise.all([
    getUser(),
    db.exam.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" }, select: { slug: true, name: true } }),
  ]);

  return (
    <html lang="en" data-theme={theme} className={`${inter.variable} ${playfair.variable}`}>
      <body className="flex min-h-screen flex-col">
        <div className="bg-navy text-[12.5px] text-white/85">
          <div className="mx-auto flex max-w-6xl items-center justify-center gap-x-8 gap-y-1 px-4 py-2 text-center">
            <span className="flex items-center gap-1.5"><Icon name="eye" className="h-3.5 w-3.5 text-[#d9b566]" /> Free preview on every title</span>
            <span className="hidden items-center gap-1.5 sm:flex"><Icon name="download" className="h-3.5 w-3.5 text-[#d9b566]" /> Instant download after payment</span>
            <span className="hidden items-center gap-1.5 md:flex"><Icon name="qr" className="h-3.5 w-3.5 text-[#d9b566]" /> Personalised, verifiable PDFs</span>
          </div>
        </div>

        <header className="sticky top-0 z-40 border-b border-line bg-white/90 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-3 py-2.5 sm:gap-3 sm:px-4 sm:py-3">
            <Link href="/" className="flex shrink-0 items-center gap-2 sm:gap-2.5" aria-label="Vipulaw home">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-navy text-[#d9b566]"><Icon name="scales" className="h-5 w-5" /></span>
              <span className="font-serif text-2xl font-bold leading-none text-navy">vipu<span className="text-gold">law</span></span>
            </Link>

            <nav className="flex items-center gap-0.5 sm:gap-2" aria-label="Account">
              <Link href="/search" aria-label="Search" className={`${navLink} hidden items-center gap-1.5 sm:flex`}><Icon name="search" className="h-4 w-4" /><span className="hidden sm:inline">Search</span></Link>
              <ThemeToggle initial={theme} />
              {user ? (
                <>
                  {user.role === "ADMIN" ? (
                    <>
                      <Link href="/admin" className={`${navLink} flex items-center gap-1.5`}><Icon name="layers" className="h-4 w-4" /><span>Upload</span></Link>
                      <Link href="/profile" title="Admin profile" className="flex max-w-[11rem] items-center gap-1.5 rounded-full bg-[#d9b566] px-3 py-1.5 text-sm font-semibold text-[#0a1529]">
                        <Icon name="shield" className="h-4 w-4 shrink-0" /><span className="truncate">Admin · {user.name.split(" ")[0]}</span>
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link href="/library" className={navLink}>My library</Link>
                      <Link href="/profile" className={`${navLink} hidden sm:block`}>Profile</Link>
                    </>
                  )}
                  <div className="hidden sm:block"><LogoutButton /></div>
                </>
              ) : (
                <>
                  <Link href="/login" className={navLink}>Log in</Link>
                  <Link href="/signup" className="hidden rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white transition hover:bg-navy-soft sm:block">Sign up free</Link>
                </>
              )}
              <details className="relative lg:hidden">
                <summary aria-label="Menu" className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-lg text-navy hover:bg-gold-soft [&::-webkit-details-marker]:hidden">
                  <Icon name="menu" />
                </summary>
                <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-2xl border border-line bg-white p-2 shadow-xl">
                  <Link href="/search" className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-navy hover:bg-gold-soft"><Icon name="search" className="h-4 w-4" /> Search all material</Link>
                  <div className="my-2 h-px bg-line" />
                  <p className="px-3 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-widest text-muted">Exams</p>
                  {exams.map((e) => <Link key={e.slug} href={`/exam/${e.slug}`} className="block rounded-lg px-3 py-2.5 text-sm font-medium text-navy hover:bg-gold-soft">{e.name}</Link>)}
                  <div className="my-2 h-px bg-line" />
                  {user ? (
                    <>
                      {user.role === "ADMIN" && <Link href="/admin" className="block rounded-lg px-3 py-2.5 text-sm font-medium text-navy hover:bg-gold-soft">Upload</Link>}
                      <Link href="/profile" className="block rounded-lg px-3 py-2.5 text-sm font-medium text-navy hover:bg-gold-soft">My profile</Link>
                      <div className="px-1"><LogoutButton /></div>
                    </>
                  ) : (
                    <Link href="/signup" className="block rounded-lg bg-navy px-3 py-2.5 text-center text-sm font-semibold text-white">Create free account</Link>
                  )}
                </div>
              </details>
            </nav>
          </div>
          <nav aria-label="Exams" className="hidden border-t border-line bg-paper lg:block">
            <ul className="mx-auto flex max-w-6xl items-center justify-center gap-1 px-4 py-1.5">
              {exams.map((e) => (
                <li key={e.slug}><Link href={`/exam/${e.slug}`} className="block rounded-lg px-4 py-2 text-sm font-semibold text-navy/80 transition hover:bg-gold-soft hover:text-navy">{e.name}</Link></li>
              ))}
            </ul>
          </nav>
        </header>

        <div className="flex-1">{children}</div>

        <footer className="mt-16 bg-navy text-white/80">
          <div className="gold-rule" />
          <div className="mx-auto grid max-w-6xl grid-cols-2 gap-x-6 gap-y-9 px-4 py-10 sm:py-12 lg:grid-cols-4 lg:gap-10">
            <div className="col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-[#d9b566]"><Icon name="scales" className="h-5 w-5" /></span>
                <span className="font-serif text-2xl font-bold text-white">vipu<span className="text-[#d9b566]">law</span></span>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-white/65">
                Exam-focused PDF notes, practice books and previous year papers for law aspirants. Every purchase is a personal, traceable copy.
              </p>
            </div>
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-[#d9b566]">Exams</h3>
              <ul className="mt-4 space-y-2.5 text-sm">
                {exams.map((e) => <li key={e.slug}><Link href={`/exam/${e.slug}`} className="hover:text-white">{e.name}</Link></li>)}
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-[#d9b566]">Your account</h3>
              <ul className="mt-4 space-y-2.5 text-sm">
                <li><Link href="/signup" className="hover:text-white">Create an account</Link></li>
                <li><Link href="/login" className="hover:text-white">Student login</Link></li>
                <li><Link href="/library" className="hover:text-white">My library</Link></li>
                <li><Link href="/search" className="hover:text-white">Search material</Link></li>
                <li><Link href="/admin/login" className="hover:text-white">Admin login</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-[#d9b566]">Policies</h3>
              <ul className="mt-4 space-y-2.5 text-sm">
                <li><Link href="/terms" className="hover:text-white">Terms of use</Link></li>
                <li><Link href="/privacy" className="hover:text-white">Privacy policy</Link></li>
                <li><Link href="/refund-policy" className="hover:text-white">Refund policy</Link></li>
              </ul>
              <p className="mt-5 flex items-center gap-2 text-xs text-white/55"><Icon name="lock" className="h-4 w-4" /> Payments processed by Razorpay</p>
            </div>
          </div>
          <div className="border-t border-white/10">
            <p className="mx-auto max-w-6xl px-4 py-5 text-center text-xs text-white/50">
              © {new Date().getFullYear()} Vipulaw. Digital products are for the buyer&apos;s personal use only. Copies carry the buyer&apos;s details and a verification code.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
