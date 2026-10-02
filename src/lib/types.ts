export type Diet = "veg" | "eggetarian" | "non-veg";
export type Habit = "never" | "occasionally" | "regularly";
export type ChildrenIntent = "yes" | "no" | "open";
export type Education = "bachelors" | "masters" | "doctorate";
export type MaritalStatus = "never_married" | "divorced";

export type Profile = {
  id: string;
  name: string;
  gender: "M" | "F";
  age: number;
  heightCm: number;
  city: string;
  openToRelocate: boolean;
  religion: string;
  diet: Diet;
  smoking: Habit;
  drinking: Habit;
  wantsChildren: ChildrenIntent;
  education: Education;
  profession: string;
  incomeLakh: number;
  maritalStatus: MaritalStatus;
  bio: string;
};

// Attributes we can check deterministically against a profile.
export const CHECKABLE_ATTRIBUTES = [
  "age",
  "height",
  "location",
  "religion",
  "diet",
  "smoking",
  "drinking",
  "children",
  "education",
  "income",
  "marital_status",
] as const;
export type CheckableAttribute = (typeof CHECKABLE_ATTRIBUTES)[number];

// Things clients reject on that a rule cannot check. These become notes for the matchmaker.
export const SOFT_ATTRIBUTES = [
  "appearance",
  "personality",
  "profession",
  "family",
  "lifestyle",
  "other",
] as const;
export type SoftAttribute = (typeof SOFT_ATTRIBUTES)[number];

export type Attribute = CheckableAttribute | SoftAttribute;

export type Rule =
  | { attr: "age"; hard: boolean; min: number; max: number }
  | { attr: "height"; hard: boolean; minCm: number; maxCm: number }
  | { attr: "location"; hard: boolean; cities: string[] }
  | { attr: "religion"; hard: boolean; allowed: string[] }
  | { attr: "diet"; hard: boolean; allowed: Diet[] }
  | { attr: "smoking"; hard: boolean; allowed: Habit[] }
  | { attr: "drinking"; hard: boolean; allowed: Habit[] }
  | { attr: "children"; hard: boolean; allowed: ChildrenIntent[] }
  | { attr: "education"; hard: boolean; min: Education }
  | { attr: "income"; hard: boolean; minLakh: number }
  | { attr: "marital_status"; hard: boolean; allowed: MaritalStatus[] };

export type Client = Profile & {
  matchmaker: "A" | "B";
  rules: Rule[];
  notes: string[];
  candidateIds: string[];
};

export type RuleResult = {
  rule: Rule;
  pass: boolean;
  detail: string;
};

export type CheckStatus = "blocked" | "review" | "clear";

export type CheckResult = {
  status: CheckStatus;
  score: number;
  results: RuleResult[];
};

export type FeedbackReason = {
  attribute: Attribute;
  evidence: string;
  strength: "dealbreaker" | "preference" | "vague";
  summary: string;
};

export type ParsedFeedback = {
  reasons: FeedbackReason[];
  followUpQuestion: string | null;
};
