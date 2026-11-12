import { db } from "@/lib/db";
import { getUser } from "@/lib/auth/session";

export const metadata = { title: "Licence check", robots: { index: false } };

/** Target of the QR on each page. The public sees only validity; admins see who the copy was issued to. */
export default async function Verify({ params }: { params: Promise<{ licence: string }> }) {
  const raw = decodeURIComponent((await params).licence);
  const m = /^(VL-[0-9A-F]{10})(?:\.(\d{1,4}))?$/.exec(raw);
  const order = m ? await db.order.findUnique({ where: { licenceId: m[1] }, include: { user: true, product: true } }) : null;
  const viewer = await getUser();
  const isAdmin = viewer?.role === "ADMIN";

  return (
    <main className="mx-auto max-w-md px-4 py-16 text-center">
      {order && order.status === "PAID" ? (
        <>
          <p className="text-4xl">✓</p>
          <h1 className="mt-2 font-serif text-2xl text-navy">Genuine Vipulaw copy</h1>
          <p className="mt-2 text-muted">This page belongs to a licensed copy of “{order.product.title}”.</p>
          {isAdmin && (
            <dl className="mt-6 rounded-xl border border-line bg-white p-4 text-left text-sm">
              <dt className="text-muted">Issued to</dt><dd className="font-medium">{order.user.name}</dd>
              <dt className="mt-2 text-muted">Mobile / email</dt><dd>{order.user.mobile} · {order.user.email}</dd>
              <dt className="mt-2 text-muted">Licence / page</dt><dd>{order.licenceId}{m?.[2] ? ` · page ${m[2]}` : ""}</dd>
              <dt className="mt-2 text-muted">Purchased</dt><dd>{order.paidAt?.toLocaleString("en-IN")}</dd>
            </dl>
          )}
        </>
      ) : (
        <>
          <h1 className="font-serif text-2xl text-navy">Licence not found</h1>
          <p className="mt-2 text-muted">This code does not match a valid purchase.</p>
        </>
      )}
    </main>
  );
}
