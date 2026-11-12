import { z } from "zod";

// Indian mobile: accepts 9876543210, +919876543210, 91 9876543210 -> +919876543210
export function normaliseMobile(input: string): string | null {
  const d = input.replace(/[\s\-()]/g, "").replace(/^\+/, "");
  const m = /^(?:91|0)?([6-9]\d{9})$/.exec(d);
  return m ? `+91${m[1]}` : null;
}

export const mobileSchema = z.string().trim().transform((v, ctx) => {
  const m = normaliseMobile(v);
  if (!m) ctx.addIssue({ code: "custom", message: "Enter a valid 10-digit Indian mobile number" });
  return m ?? "";
});

export const PROFESSIONS = ["Law student", "Practising advocate", "Judicial aspirant", "Working professional", "Other"] as const;
export const YEARS = ["1st year", "2nd year", "3rd year", "4th year", "5th year", "Graduated", "Postgraduate"] as const;

export const signupSchema = z.object({
  name: z.string().trim().min(2).max(80).regex(/^[\p{L}][\p{L}\s.'-]*$/u, "Name has invalid characters"),
  email: z.string().trim().toLowerCase().email().max(120),
  mobile: mobileSchema,
  profession: z.enum(PROFESSIONS),
  examTarget: z.string().trim().min(1).max(40),
  yearOfStudy: z.enum(YEARS),
});

export const otpSchema = z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code");
