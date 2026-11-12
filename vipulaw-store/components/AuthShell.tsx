import Icon from "@/components/Icons";

type Props = {
  variant: "customer" | "admin";
  heading: string;
  lead: string;
  points: { icon: string; title: string; text: string }[];
  children: React.ReactNode;
};

// Two-column sign-in layout: an informative brand panel beside the form card.
export default function AuthShell({ variant, heading, lead, points, children }: Props) {
  const admin = variant === "admin";
  return (
    <main className={admin ? "bg-navy" : ""}>
      <div className="mx-auto grid min-h-[calc(100vh-10rem)] max-w-6xl lg:grid-cols-2">
        <section className={`relative hidden overflow-hidden bg-navy px-6 py-10 lg:block text-white sm:px-10 lg:py-16 ${admin ? "" : "hero-bg"}`}>
          <div className="dot-grid absolute inset-0 opacity-70" aria-hidden />
          <div className="relative max-w-md">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-widest text-[#d9b566]">
              <Icon name={admin ? "lock" : "scales"} className="h-3.5 w-3.5" /> {admin ? "Admin console" : "Student portal"}
            </span>
            <h2 className="mt-5 font-serif text-3xl leading-tight sm:text-4xl">{heading}</h2>
            <p className="mt-4 text-white/75">{lead}</p>
            <ul className="mt-8 space-y-5">
              {points.map((p) => (
                <li key={p.title} className="flex gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[#d9b566]"><Icon name={p.icon} /></span>
                  <div><p className="font-semibold">{p.title}</p><p className="text-sm text-white/65">{p.text}</p></div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className={`flex items-center justify-center px-4 py-8 sm:px-10 sm:py-10 ${admin ? "bg-paper lg:rounded-l-[2rem]" : ""}`}>
          <div className="w-full max-w-md rounded-3xl border border-line bg-white p-5 shadow-[0_20px_50px_-20px_rgba(15,31,61,0.25)] sm:p-8">
            {children}
          </div>
        </section>
      </div>
    </main>
  );
}
