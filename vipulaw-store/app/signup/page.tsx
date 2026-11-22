import AuthForm from "@/components/AuthForm";
import AuthShell from "@/components/AuthShell";
import { db } from "@/lib/db";
import { safeNext } from "@/lib/safe-next";

export const metadata = { title: "Create your account" };

export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const exams = await db.exam.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" }, select: { slug: true, name: true } });
  return (
    <AuthShell variant="customer">
      <AuthForm mode="signup" exams={exams} next={safeNext((await searchParams).next)} />
    </AuthShell>
  );
}
