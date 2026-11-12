export const metadata = { title: "Privacy policy" };

// DRAFT text. Have it reviewed by a lawyer and add your business name, address and support contact before launch.
export default function Page() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="font-serif text-3xl text-navy">Privacy policy</h1>
      <p className="mt-4 text-ink/80">We collect your name, email, mobile number, profession, target exam and year of study to run your account, verify you by WhatsApp code, process payments and print your licence details on the files you buy.</p>
      <p className="mt-4 text-ink/80">Payments are processed by Razorpay; we do not store card or UPI details. We do not sell your data. Mobile numbers receive one-time codes on WhatsApp; email is used for receipts and support.</p>
      <p className="mt-4 text-ink/80">To request access or deletion of your data, contact us at the support address on this site.</p>
    </main>
  );
}
