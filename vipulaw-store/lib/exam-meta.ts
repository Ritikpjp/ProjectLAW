// Presentation details for each exam track and product type. Exams themselves live in the database;
// unknown slugs fall back to a neutral style, so adding an exam in the DB never breaks the UI.
export type ExamStyle = { icon: string; tagline: string; from: string; to: string; soft: string };

const STYLES: Record<string, ExamStyle> = {
  judiciary: { icon: "scales", tagline: "Civil Judge and Judicial Service exams", from: "#0f1f3d", to: "#27437a", soft: "#e6ecf8" },
  "apo-adpo-ada-app": { icon: "gavel", tagline: "Prosecutor recruitment", from: "#4a1d2e", to: "#8a3552", soft: "#f8e8ee" },
  "law-officer": { icon: "briefcase", tagline: "Bank and PSU law officer posts", from: "#10483f", to: "#1f7d6c", soft: "#e2f3ef" },
  "ugc-net-jrf": { icon: "cap", tagline: "Law Paper 1 and Paper 2", from: "#4b3a0d", to: "#a27a1c", soft: "#f8f0d9" },
  aibe: { icon: "award", tagline: "All India Bar Examination", from: "#3b2766", to: "#6b4bb0", soft: "#eeE8fa" },
};

const FALLBACK: ExamStyle = { icon: "book", tagline: "Study material", from: "#0f1f3d", to: "#27437a", soft: "#e6ecf8" };

export const examStyle = (slug: string): ExamStyle => STYLES[slug] ?? FALLBACK;

export const TYPE_META: Record<string, { icon: string; blurb: string; from: string; to: string }> = {
  BARE_ACT: { icon: "book", blurb: "Section-wise statutes in a clean, searchable PDF.", from: "#0f1f3d", to: "#27437a" },
  PRACTICE_BOOK: { icon: "list", blurb: "Topic-wise MCQs and practice sets with answers.", from: "#10483f", to: "#1f7d6c" },
  PYQ: { icon: "files", blurb: "Past papers organised by year and subject.", from: "#4a1d2e", to: "#8a3552" },
  SYLLABUS: { icon: "list", blurb: "Official syllabus and exam pattern at a glance.", from: "#4b3a0d", to: "#a27a1c" },
  NOTES: { icon: "note", blurb: "Concise, exam-oriented notes for quick revision.", from: "#3b2766", to: "#6b4bb0" },
};

export const typeStyle = (t: string) => TYPE_META[t] ?? { icon: "file", blurb: "", from: "#0f1f3d", to: "#27437a" };
