import { redirect } from "next/navigation";
import AuthForm from "@/components/AuthForm";
import AuthShell from "@/components/AuthShell";
import { getUser } from "@/lib/auth/session";

export const metadata = { title: "Admin sign in", robots: { index: false } };

export default async function AdminLogin() {
  const user = await getUser();
  if (user?.role === "ADMIN") redirect("/admin");
  return (
    <AuthShell variant="admin">
      <AuthForm mode="login" variant="admin" exams={[]} next="/admin" />
    </AuthShell>
  );
}
