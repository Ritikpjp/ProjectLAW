// Centred single card for sign-in pages. The admin variant only adds a small label.
export default function AuthShell({ variant, children }: { variant: "customer" | "admin"; children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-9rem)] max-w-md flex-col justify-center px-4 py-10">
      {variant === "admin" && <p className="mb-3 text-center text-xs font-medium uppercase tracking-widest text-gold">Admin</p>}
      <div className="rounded-xl border border-line bg-white p-6 shadow-sm sm:p-8">{children}</div>
    </main>
  );
}
