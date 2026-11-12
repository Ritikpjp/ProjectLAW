import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getUser } from "@/lib/auth/session";
import ProfileForm from "@/components/ProfileForm";

export const metadata = { title: "My profile" };

export default async function Profile() {
  const user = await getUser();
  if (!user) redirect("/login?next=/profile");
  const exams = await db.exam.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" }, select: { slug: true, name: true } });
  return (
    <main className="mx-auto max-w-md px-4 py-8">
      <h1 className="font-serif text-3xl text-navy">My profile</h1>
      <dl className="mt-5 rounded-2xl border border-line bg-white p-5 text-sm">
        <div className="flex justify-between gap-4 py-1"><dt className="text-muted">Name</dt><dd className="font-medium">{user.name}{user.role === "ADMIN" && " (admin)"}</dd></div>
        <div className="flex justify-between gap-4 py-1"><dt className="text-muted">Mobile</dt><dd className="font-medium">{user.mobile}</dd></div>
        <p className="mt-3 text-xs text-muted">{user.role === "ADMIN" ? "Admins can change the display name below. The mobile number is fixed." : "Name and mobile are printed on your downloaded PDFs, so they cannot be changed here. Contact support to correct them."}</p>
      </dl>
      <div className="mt-6">
        <ProfileForm admin={user.role === "ADMIN"} exams={exams} initial={{ name: user.name, email: user.email, profession: user.profession, examTarget: user.examTarget, yearOfStudy: user.yearOfStudy }} />
      </div>
    </main>
  );
}
