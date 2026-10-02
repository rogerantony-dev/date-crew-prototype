import type {
  CheckableAttribute,
  CheckResult,
  ChildrenIntent,
  Diet,
  Education,
  Habit,
  MaritalStatus,
  Profile,
  Rule,
  RuleResult,
} from "./types";
import { CHECKABLE_ATTRIBUTES } from "./types";

const EDUCATION_RANK: Record<Education, number> = { bachelors: 0, masters: 1, doctorate: 2 };
const EDUCATIONS: Education[] = ["bachelors", "masters", "doctorate"];
const DIETS: Diet[] = ["veg", "eggetarian", "non-veg"];
const HABITS: Habit[] = ["never", "occasionally", "regularly"];
const CHILDREN: ChildrenIntent[] = ["yes", "no", "open"];
const MARITAL: MaritalStatus[] = ["never_married", "divorced"];
export const RELIGIONS = ["Hindu", "Muslim", "Christian", "Sikh", "Jain", "Parsi"];

export const ATTRIBUTE_LABEL: Record<string, string> = {
  age: "Age",
  height: "Height",
  location: "Location",
  religion: "Religion",
  diet: "Diet",
  smoking: "Smoking",
  drinking: "Drinking",
  children: "Wants children",
  education: "Education",
  income: "Income",
  marital_status: "Marital status",
  appearance: "Appearance",
  personality: "Personality",
  profession: "Profession",
  family: "Family",
  lifestyle: "Lifestyle",
  other: "Other",
};

export function isCheckable(attr: string): attr is CheckableAttribute {
  return (CHECKABLE_ATTRIBUTES as readonly string[]).includes(attr);
}

export function formatHeight(cm: number) {
  const totalInches = Math.round(cm / 2.54);
  return `${Math.floor(totalInches / 12)}'${totalInches % 12}"`;
}

const human = (v: string) => v.replace("_", " ");

export function describeRule(rule: Rule): string {
  switch (rule.attr) {
    case "age":
      return `${rule.min}–${rule.max} yrs`;
    case "height":
      return `${formatHeight(rule.minCm)}–${formatHeight(rule.maxCm)}`;
    case "location":
      return rule.cities.join(", ");
    case "education":
      return `${rule.min}+`;
    case "income":
      return `₹${rule.minLakh}L+`;
    default:
      return rule.allowed.map(human).join(", ");
  }
}

export function evaluateRule(rule: Rule, p: Profile): RuleResult {
  const result = (pass: boolean, detail: string): RuleResult => ({ rule, pass, detail });
  switch (rule.attr) {
    case "age":
      return result(p.age >= rule.min && p.age <= rule.max, `${p.age} yrs`);
    case "height":
      return result(
        p.heightCm >= rule.minCm && p.heightCm <= rule.maxCm,
        formatHeight(p.heightCm),
      );
    case "location": {
      const pass = rule.cities.includes(p.city) || p.openToRelocate;
      return result(pass, p.openToRelocate ? `${p.city} (open to relocate)` : p.city);
    }
    case "religion":
      return result(rule.allowed.includes(p.religion), p.religion);
    case "diet":
      return result(rule.allowed.includes(p.diet), human(p.diet));
    case "smoking":
      return result(rule.allowed.includes(p.smoking), human(p.smoking));
    case "drinking":
      return result(rule.allowed.includes(p.drinking), human(p.drinking));
    case "children":
      return result(rule.allowed.includes(p.wantsChildren), p.wantsChildren);
    case "education":
      return result(EDUCATION_RANK[p.education] >= EDUCATION_RANK[rule.min], p.education);
    case "income":
      return result(p.incomeLakh >= rule.minLakh, `₹${p.incomeLakh}L`);
    case "marital_status":
      return result(rule.allowed.includes(p.maritalStatus), human(p.maritalStatus));
  }
}

/**
 * Any failed dealbreaker blocks the share. Failed soft preferences send it to review.
 * Score is the share of preferences met, so clear profiles can be ranked.
 */
export function checkProfile(rules: Rule[], p: Profile): CheckResult {
  const results = rules.map((r) => evaluateRule(r, p));
  const hardFail = results.some((r) => !r.pass && r.rule.hard);
  const softFail = results.some((r) => !r.pass && !r.rule.hard);
  const passed = results.filter((r) => r.pass).length;
  return {
    status: hardFail ? "blocked" : softFail ? "review" : "clear",
    score: results.length ? Math.round((passed / results.length) * 100) : 100,
    results,
  };
}

export type StatedPreferenceVerdict = "violated" | "not_covered" | "not_stated";

/** Was this rejection reason already something the client told us? */
export function statedPreferenceVerdict(
  rules: Rule[],
  attr: CheckableAttribute,
  p: Profile,
): StatedPreferenceVerdict {
  const rule = rules.find((r) => r.attr === attr);
  if (!rule) return "not_stated";
  return evaluateRule(rule, p).pass ? "not_covered" : "violated";
}

const without = <T>(list: T[], value: T) => list.filter((v) => v !== value);

/**
 * Build the rule that would have filtered out this profile, starting from the
 * client's existing rule for the attribute (or none).
 * Deterministic on purpose: the AI only classifies feedback, code decides the rule.
 */
export function tightenRule(
  existing: Rule | undefined,
  attr: CheckableAttribute,
  p: Profile,
  hard: boolean,
): Rule {
  if (existing && !evaluateRule(existing, p).pass) {
    // The rule already excludes this profile; it just wasn't enforced.
    return { ...existing, hard };
  }
  switch (attr) {
    case "age": {
      const r = existing?.attr === "age" ? existing : { min: 18, max: 60 };
      const nearMax = r.max - p.age <= p.age - r.min;
      return nearMax
        ? { attr, hard, min: r.min, max: p.age - 1 }
        : { attr, hard, min: p.age + 1, max: r.max };
    }
    case "height": {
      const r = existing?.attr === "height" ? existing : { minCm: 140, maxCm: 200 };
      const nearMax = r.maxCm - p.heightCm < p.heightCm - r.minCm;
      return nearMax
        ? { attr, hard, minCm: r.minCm, maxCm: p.heightCm - 1 }
        : { attr, hard, minCm: p.heightCm + 1, maxCm: r.maxCm };
    }
    case "location": {
      const cities = existing?.attr === "location" ? existing.cities : [];
      return { attr, hard, cities: without(cities, p.city) };
    }
    case "religion": {
      const allowed = existing?.attr === "religion" ? existing.allowed : RELIGIONS;
      return { attr, hard, allowed: without(allowed, p.religion) };
    }
    case "diet": {
      const allowed = existing?.attr === "diet" ? existing.allowed : DIETS;
      return { attr, hard, allowed: without(allowed, p.diet) };
    }
    case "smoking": {
      const allowed = existing?.attr === "smoking" ? existing.allowed : HABITS;
      return { attr, hard, allowed: without(allowed, p.smoking) };
    }
    case "drinking": {
      const allowed = existing?.attr === "drinking" ? existing.allowed : HABITS;
      return { attr, hard, allowed: without(allowed, p.drinking) };
    }
    case "children": {
      const allowed = existing?.attr === "children" ? existing.allowed : CHILDREN;
      return { attr, hard, allowed: without(allowed, p.wantsChildren) };
    }
    case "education": {
      const next = EDUCATIONS[Math.min(EDUCATION_RANK[p.education] + 1, EDUCATIONS.length - 1)];
      return { attr, hard, min: next };
    }
    case "income":
      return { attr, hard, minLakh: p.incomeLakh + 1 };
    case "marital_status": {
      const allowed = existing?.attr === "marital_status" ? existing.allowed : MARITAL;
      return { attr, hard, allowed: without(allowed, p.maritalStatus) };
    }
  }
}

export function upsertRule(rules: Rule[], rule: Rule): Rule[] {
  return rules.some((r) => r.attr === rule.attr)
    ? rules.map((r) => (r.attr === rule.attr ? rule : r))
    : [...rules, rule];
}
