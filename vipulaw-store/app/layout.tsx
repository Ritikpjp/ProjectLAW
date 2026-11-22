import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { getUser } from "@/lib/auth/session";
import LogoutButton from "@/components/LogoutButton";
import Icon from "@/components/Icons";
import ThemeToggle from "@/components/ThemeToggle";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Vipulaw | Law exam notes and practice books", template: "%s | Vipulaw" },
  description: "Practice books, PYQs, bare acts and notes for Judiciary, APO/ADPO/ADA/APP, Law Officer and UGC NET/JRF.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

const link = "rounded-md px-3 py-2 text-sm text-ink/80 transition hover:text-navy";
const menuLink = "block rounded-md px-3 py-2.5 text-sm text-ink/80 hover:bg-gold-soft";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const theme = (await cookies()).get("vl_theme")?.value === "dark" ? "dark" : "light";
  const user = await getUser();
  const admin = user?.role === "ADMIN";

  return (
    <html lang="en" data-theme={theme} className={`${inter.variable} ${playfair.variable}`}>
      <body className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-40 border-b border-line bg-white/90 backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
            <Link href="/" className="font-serif text-2xl font-bold leading-none text-navy" aria-label="Vipulaw home">
              vipu<span className="text-gold">law</span>
            </Link>

            <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
              <Link href="/#exams" className={link}>Exams</Link>
              <Link href="/search" className={link}>Search</Link>
              {user ? (
                admin ? (
                  <>
                    <Link href="/admin" className={link}>Upload</Link>
                    <Link href="/profile" title="Admin profile" className="ml-1 max-w-[10rem] truncate rounded-full bg-[#d9b566] px-3 py-1 text-sm font-medium text-[#0a1529]">Admin · {user.name.split(" ")[0]}</Link>
                  </>
                ) : (
                  <>
                    <Link href="/library" className={link}>My library</Link>
                    <Link href="/profile" title="My profile" className="ml-1 max-w-[10rem] truncate rounded-full border border-line bg-gold-soft px-3 py-1 text-sm font-medium text-navy">{user.name}</Link>
                  </>
                )
              ) : (
                <Link href="/login" className={link}>Log in</Link>
              )}
              {user ? <LogoutButton /> : <Link href="/signup" className="ml-1 rounded-md bg-navy px-4 py-2 text-sm font-medium text-white transition hover:bg-navy-soft">Sign up</Link>}
              <ThemeToggle initial={theme} />
            </nav>

            <div className="flex items-center gap-1 md:hidden">
              {user && (
                <Link href="/profile" title={admin ? "Admin profile" : "My profile"}
                  className={`max-w-[4.5rem] truncate rounded-full px-2.5 py-1 text-xs font-medium min-[400px]:max-w-[7rem] min-[400px]:text-sm ${admin ? "bg-[#d9b566] text-[#0a1529]" : "border border-line bg-gold-soft text-navy"}`}>
                  {admin ? `Admin · ${user.name.split(" ")[0]}` : user.name}
                </Link>
              )}
              <ThemeToggle initial={theme} />
              <details className="relative">
                <summary aria-label="Menu" className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-md text-navy hover:bg-gold-soft [&::-webkit-details-marker]:hidden">
                  <Icon name="menu" />
                </summary>
                <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border border-line bg-white p-2 shadow-lg">
                  <Link href="/#exams" className={menuLink}>Exams</Link>
                  <Link href="/search" className={menuLink}>Search</Link>
                  <div className="my-1 h-px bg-line" />
                  {user ? (
                    <>
                      {admin ? <Link href="/admin" className={menuLink}>Upload</Link> : <Link href="/library" className={menuLink}>My library</Link>}
                      <Link href="/profile" className={menuLink}>{admin ? `Admin · ${user.name.split(" ")[0]}` : "Profile"}</Link>
                      <div className="px-1"><LogoutButton /></div>
                    </>
                  ) : (
                    <>
                      <Link href="/login" className={menuLink}>Log in</Link>
                      <Link href="/signup" className="mt-1 block rounded-md bg-navy px-3 py-2.5 text-center text-sm font-medium text-white">Sign up</Link>
                    </>
                  )}
                </div>
              </details>
            </div>
          </div>
        </header>

        <div className="flex-1">{children}</div>

        <footer className="mt-20 border-t border-line">
          <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} Vipulaw. For the buyer&apos;s personal use only.</p>
            <nav className="flex flex-wrap gap-x-5 gap-y-2" aria-label="Footer">
              <Link href="/terms" className="hover:text-navy">Terms</Link>
              <Link href="/privacy" className="hover:text-navy">Privacy</Link>
              <Link href="/refund-policy" className="hover:text-navy">Refunds</Link>
              <Link href="/admin/login" className="hover:text-navy">Admin</Link>
            </nav>
          </div>
        </footer>
      </body>
    </html>
  );
}
