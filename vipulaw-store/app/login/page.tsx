import AuthForm from "@/components/AuthForm";
import AuthShell from "@/components/AuthShell";
import { db } from "@/lib/db";
import { safeNext } from "@/lib/safe-next";

export const metadata = { title: "Student login" };

export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const exams = await db.exam.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" }, select: { slug: true, name: true } });
  return (
    <AuthShell
      variant="customer"
      heading="Welcome back. Your library is waiting."
      lead="Log in to download the books you have bought, as many times as you need within your licence."
      points={[
        { icon: "download", title: "Your purchases, one place", text: "Every PDF you own is in My library, ready to download." },
        { icon: "qr", title: "Personalised copies", text: "Your name and licence ID are printed on each page you download." },
        { icon: "phone", title: "No password needed", text: "A one-time code to your mobile number is all it takes." },
      ]}
    >
      <AuthForm mode="login" exams={exams} next={safeNext((await searchParams).next)} />
    </AuthShell>
  );
}
