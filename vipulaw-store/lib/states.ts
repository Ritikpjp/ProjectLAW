// Important states for state-wise exams. Each state has a simple landmark glyph (see components/Icons.tsx).
// A title filed under a state appears only in that state's section; titles with no state are "General".
export const STATES = [
  { slug: "delhi", name: "Delhi", icon: "s-delhi" },
  { slug: "uttar-pradesh", name: "Uttar Pradesh", icon: "s-up" },
  { slug: "maharashtra", name: "Maharashtra", icon: "s-maharashtra" },
  { slug: "gujarat", name: "Gujarat", icon: "s-gujarat" },
  { slug: "rajasthan", name: "Rajasthan", icon: "s-rajasthan" },
  { slug: "madhya-pradesh", name: "Madhya Pradesh", icon: "s-mp" },
  { slug: "bihar", name: "Bihar", icon: "s-bihar" },
  { slug: "haryana", name: "Haryana", icon: "s-haryana" },
  { slug: "punjab", name: "Punjab", icon: "s-punjab" },
  { slug: "karnataka", name: "Karnataka", icon: "s-karnataka" },
  { slug: "tamil-nadu", name: "Tamil Nadu", icon: "s-tn" },
  { slug: "west-bengal", name: "West Bengal", icon: "s-wb" },
  { slug: "kerala", name: "Kerala", icon: "s-kerala" },
  { slug: "telangana", name: "Telangana", icon: "s-telangana" },
] as const;

export type StateSlug = (typeof STATES)[number]["slug"];
export const STATE_SLUGS = STATES.map((s) => s.slug) as [StateSlug, ...StateSlug[]];

export const findState = (slug: string | null | undefined) => STATES.find((s) => s.slug === slug);
export const stateName = (slug: string | null | undefined) => findState(slug)?.name ?? null;
