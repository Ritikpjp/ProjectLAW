import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

// Every exam has the same three sections.
const SECTIONS = ["Prelims", "Mains", "Pre + Mains"];

const EXAMS = [
  { slug: "judiciary", name: "Judiciary", blurb: "Prelims and Mains material for state judicial services.", sections: SECTIONS, stateWise: true },
  { slug: "apo-adpo-ada-app", name: "APO / ADPO / ADA / APP", blurb: "Prosecutor and Assistant Public Prosecutor exams.", sections: SECTIONS, stateWise: true },
  { slug: "law-officer", name: "Law Officer", blurb: "Law Officer recruitment exams.", sections: SECTIONS, stateWise: true },
  { slug: "ugc-net-jrf", name: "UGC NET / JRF", blurb: "Law, Paper 1 and Paper 2.", sections: SECTIONS, stateWise: false },
];

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

async function main() {
  for (const [i, e] of EXAMS.entries()) {
    const exam = await db.exam.upsert({
      where: { slug: e.slug },
      update: { name: e.name, blurb: e.blurb, sortOrder: i, stateWise: e.stateWise },
      create: { slug: e.slug, name: e.name, blurb: e.blurb, sortOrder: i, stateWise: e.stateWise },
    });
    for (const [j, s] of e.sections.entries()) {
      await db.section.upsert({
        where: { examId_slug: { examId: exam.id, slug: slugify(s) } },
        update: { name: s, sortOrder: j },
        create: { examId: exam.id, slug: slugify(s), name: s, sortOrder: j },
      });
    }
  }
  console.log("Seeded exams and sections");
}

main().finally(() => db.$disconnect());
