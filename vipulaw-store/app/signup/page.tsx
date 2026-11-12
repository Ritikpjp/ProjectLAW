import AuthForm from "@/components/AuthForm";
import AuthShell from "@/components/AuthShell";
import { db } from "@/lib/db";
import { safeNext } from "@/lib/safe-next";

export const metadata = { title: "Create your account" };

export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const exams = await db.exam.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" }, select: { slug: true, name: true } });
  return (
    <AuthShell
      variant="customer"
      heading="Start preparing with material built for your exam."
      lead="Join as a student, advocate or aspirant. Browse every title with a free preview before you pay."
      points={[
        { icon: "eye", title: "Free preview first", text: "Read the opening pages of any book before buying." },
        { icon: "zap", title: "Instant download", text: "Pay once through Razorpay and your PDF is ready at once." },
        { icon: "shield", title: "A copy that is yours", text: "Each PDF carries your details and a QR that verifies the licence." },
      ]}
    >
      <AuthForm mode="signup" exams={exams} next={safeNext((await searchParams).next)} />
    </AuthShell>
  );
}
