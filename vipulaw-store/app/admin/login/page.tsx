import { redirect } from "next/navigation";
import AuthForm from "@/components/AuthForm";
import AuthShell from "@/components/AuthShell";
import { getUser } from "@/lib/auth/session";

export const metadata = { title: "Admin sign in", robots: { index: false } };

export default async function AdminLogin() {
  const user = await getUser();
  if (user?.role === "ADMIN") redirect("/admin");
  return (
    <AuthShell
      variant="admin"
      heading="Run the store from one console."
      lead="Upload PDFs, set prices, manage exam sections and watch orders come in. Access is limited to authorised numbers."
      points={[
        { icon: "layers", title: "Catalogue", text: "Upload single PDFs or bundles, publish when ready." },
        { icon: "card", title: "Pricing and orders", text: "You set every price. See paid orders with buyer details." },
        { icon: "lock", title: "Restricted access", text: "Only mobile numbers on the admin list can sign in here." },
      ]}
    >
      <AuthForm mode="login" variant="admin" exams={[]} next="/admin" />
    </AuthShell>
  );
}
