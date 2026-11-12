// Product types. MOCK_TEST is reserved: the schema accepts it, but no UI offers it yet.
export const PRODUCT_TYPES = {
  BARE_ACT: "Bare Acts",
  PRACTICE_BOOK: "Practice Books",
  PYQ: "Previous Year Questions",
  SYLLABUS: "Syllabus",
  NOTES: "Notes",
} as const;

export type ProductType = keyof typeof PRODUCT_TYPES;
export const SELLABLE_TYPES = Object.keys(PRODUCT_TYPES) as ProductType[];

export const typeLabel = (t: string) => (PRODUCT_TYPES as Record<string, string>)[t] ?? t;

export const rupees = (paise: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(paise / 100);
