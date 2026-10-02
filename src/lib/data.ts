import type { Client, Profile } from "./types";

// Mocked data. Names and details are fictional.

export const FUNNEL = [
  { stage: "Profiles shared", count: 1000 },
  { stage: "Profiles accepted", count: 310 },
  { stage: "Contact details shared", count: 210 },
  { stage: "Conversations started", count: 150 },
  { stage: "Meetings fixed", count: 75 },
  { stage: "Meetings completed", count: 42 },
];

const m = (p: Omit<Profile, "gender">): Profile => ({ ...p, gender: "M" });
const f = (p: Omit<Profile, "gender">): Profile => ({ ...p, gender: "F" });

export const PROFILES: Record<string, Profile> = Object.fromEntries(
  [
    m({ id: "m1", name: "Arjun Rao", age: 31, heightCm: 178, city: "Bengaluru", openToRelocate: false, religion: "Hindu", diet: "veg", smoking: "never", drinking: "occasionally", wantsChildren: "yes", education: "masters", profession: "Software engineer", incomeLakh: 48, maritalStatus: "never_married", bio: "Weekend cyclist, Carnatic music fan, close to family." }),
    m({ id: "m2", name: "Vikram Shah", age: 33, heightCm: 170, city: "Mumbai", openToRelocate: false, religion: "Jain", diet: "veg", smoking: "never", drinking: "never", wantsChildren: "yes", education: "masters", profession: "Chartered accountant", incomeLakh: 40, maritalStatus: "never_married", bio: "Calm, organised, loves cooking for friends." }),
    m({ id: "m3", name: "Siddharth Nair", age: 30, heightCm: 182, city: "Bengaluru", openToRelocate: false, religion: "Hindu", diet: "non-veg", smoking: "never", drinking: "occasionally", wantsChildren: "yes", education: "masters", profession: "Strategy consultant", incomeLakh: 55, maritalStatus: "never_married", bio: "Runs half marathons, reads history." }),
    m({ id: "m4", name: "Karan Malhotra", age: 34, heightCm: 176, city: "Delhi", openToRelocate: false, religion: "Hindu", diet: "eggetarian", smoking: "occasionally", drinking: "regularly", wantsChildren: "open", education: "masters", profession: "Investment banker", incomeLakh: 60, maritalStatus: "never_married", bio: "Travels ~20 days a month for work, foodie." }),
    m({ id: "m5", name: "Aditya Kulkarni", age: 32, heightCm: 175, city: "Pune", openToRelocate: true, religion: "Hindu", diet: "veg", smoking: "never", drinking: "occasionally", wantsChildren: "yes", education: "bachelors", profession: "Founder, D2C brand", incomeLakh: 35, maritalStatus: "never_married", bio: "Building a snacks brand, plays badminton." }),
    m({ id: "m6", name: "Nikhil Menon", age: 35, heightCm: 180, city: "Bengaluru", openToRelocate: false, religion: "Christian", diet: "eggetarian", smoking: "never", drinking: "occasionally", wantsChildren: "yes", education: "doctorate", profession: "Research scientist", incomeLakh: 30, maritalStatus: "never_married", bio: "Climate researcher, amateur photographer." }),
    m({ id: "m7", name: "Rahul Verma", age: 29, heightCm: 174, city: "Bengaluru", openToRelocate: false, religion: "Hindu", diet: "veg", smoking: "never", drinking: "never", wantsChildren: "no", education: "masters", profession: "Architect", incomeLakh: 28, maritalStatus: "never_married", bio: "Designs homes, sketches on weekends." }),
    m({ id: "m8", name: "Ishaan Kapoor", age: 33, heightCm: 185, city: "Mumbai", openToRelocate: false, religion: "Sikh", diet: "eggetarian", smoking: "never", drinking: "occasionally", wantsChildren: "open", education: "masters", profession: "Product manager", incomeLakh: 50, maritalStatus: "never_married", bio: "Treks every monsoon, plays guitar badly." }),
    m({ id: "m9", name: "Sameer Khan", age: 38, heightCm: 179, city: "Hyderabad", openToRelocate: false, religion: "Muslim", diet: "non-veg", smoking: "never", drinking: "never", wantsChildren: "open", education: "doctorate", profession: "Surgeon", incomeLakh: 70, maritalStatus: "divorced", bio: "Long hours, longer walks. Values honesty." }),
    m({ id: "m10", name: "Pranav Joshi", age: 40, heightCm: 172, city: "Bengaluru", openToRelocate: false, religion: "Hindu", diet: "veg", smoking: "never", drinking: "occasionally", wantsChildren: "no", education: "masters", profession: "Professor", incomeLakh: 25, maritalStatus: "never_married", bio: "Teaches economics, gardens, reads poetry." }),
    f({ id: "f1", name: "Priya Sharma", age: 28, heightCm: 162, city: "Mumbai", openToRelocate: false, religion: "Hindu", diet: "veg", smoking: "never", drinking: "occasionally", wantsChildren: "yes", education: "masters", profession: "Marketing manager", incomeLakh: 22, maritalStatus: "never_married", bio: "Dancer, dog person, big on family dinners." }),
    f({ id: "f2", name: "Sneha Patil", age: 27, heightCm: 158, city: "Pune", openToRelocate: false, religion: "Hindu", diet: "non-veg", smoking: "never", drinking: "never", wantsChildren: "open", education: "bachelors", profession: "School teacher", incomeLakh: 9, maritalStatus: "never_married", bio: "Teaches Class 5, loves board games." }),
    f({ id: "f3", name: "Neha Gupta", age: 30, heightCm: 166, city: "Delhi", openToRelocate: false, religion: "Hindu", diet: "eggetarian", smoking: "never", drinking: "occasionally", wantsChildren: "yes", education: "masters", profession: "Corporate lawyer", incomeLakh: 30, maritalStatus: "never_married", bio: "Debater, traveller, makes great chai." }),
    f({ id: "f4", name: "Aisha Fernandes", age: 29, heightCm: 168, city: "Mumbai", openToRelocate: false, religion: "Christian", diet: "non-veg", smoking: "occasionally", drinking: "regularly", wantsChildren: "yes", education: "masters", profession: "Journalist", incomeLakh: 18, maritalStatus: "never_married", bio: "Covers city politics, sings in a choir." }),
    f({ id: "f5", name: "Riya Desai", age: 33, heightCm: 160, city: "Mumbai", openToRelocate: false, religion: "Hindu", diet: "veg", smoking: "never", drinking: "never", wantsChildren: "yes", education: "doctorate", profession: "Doctor (resident)", incomeLakh: 35, maritalStatus: "never_married", bio: "Paediatric resident, swims at 6am." }),
    f({ id: "f6", name: "Tanvi Joshi", age: 26, heightCm: 164, city: "Pune", openToRelocate: false, religion: "Hindu", diet: "veg", smoking: "never", drinking: "never", wantsChildren: "no", education: "bachelors", profession: "Fashion designer", incomeLakh: 15, maritalStatus: "never_married", bio: "Runs a small label, loves flea markets." }),
  ].map((p) => [p.id, p]),
);

export const CLIENTS: Client[] = [
  {
    id: "c1", name: "Ananya Iyer", gender: "F", age: 29, heightCm: 163, city: "Bengaluru", openToRelocate: false, religion: "Hindu", diet: "veg", smoking: "never", drinking: "occasionally", wantsChildren: "yes", education: "masters", profession: "Product designer", incomeLakh: 32, maritalStatus: "never_married", bio: "",
    matchmaker: "A",
    rules: [
      { attr: "age", hard: false, min: 29, max: 35 },
      { attr: "height", hard: false, minCm: 173, maxCm: 193 },
      { attr: "location", hard: false, cities: ["Bengaluru", "Mumbai"] },
      { attr: "diet", hard: true, allowed: ["veg", "eggetarian"] },
      { attr: "smoking", hard: true, allowed: ["never"] },
      { attr: "children", hard: true, allowed: ["yes", "open"] },
      { attr: "education", hard: false, min: "masters" },
    ],
    notes: [],
    candidateIds: ["m1", "m2", "m3", "m4", "m5", "m6", "m7", "m8"],
  },
  {
    id: "c2", name: "Rohan Mehta", gender: "M", age: 32, heightCm: 180, city: "Mumbai", openToRelocate: false, religion: "Hindu", diet: "non-veg", smoking: "never", drinking: "occasionally", wantsChildren: "yes", education: "masters", profession: "Brand strategist", incomeLakh: 45, maritalStatus: "never_married", bio: "",
    matchmaker: "B",
    rules: [
      { attr: "age", hard: false, min: 26, max: 31 },
      { attr: "location", hard: false, cities: ["Mumbai", "Pune"] },
      { attr: "smoking", hard: false, allowed: ["never", "occasionally"] },
      { attr: "children", hard: true, allowed: ["yes"] },
    ],
    notes: [],
    candidateIds: ["f1", "f2", "f3", "f4", "f5", "f6"],
  },
  {
    id: "c3", name: "Kavya Reddy", gender: "F", age: 34, heightCm: 165, city: "Hyderabad", openToRelocate: false, religion: "Hindu", diet: "eggetarian", smoking: "never", drinking: "never", wantsChildren: "open", education: "doctorate", profession: "Dermatologist", incomeLakh: 40, maritalStatus: "divorced", bio: "",
    matchmaker: "B",
    rules: [
      { attr: "age", hard: false, min: 34, max: 42 },
      { attr: "location", hard: false, cities: ["Hyderabad", "Bengaluru"] },
      { attr: "children", hard: true, allowed: ["open", "no"] },
      { attr: "drinking", hard: false, allowed: ["never", "occasionally"] },
      { attr: "education", hard: false, min: "masters" },
    ],
    notes: [],
    candidateIds: ["m4", "m6", "m7", "m8", "m9", "m10"],
  },
];

// Realistic free-text rejection feedback, to try the parser quickly.
export const SAMPLE_FEEDBACK: { clientId: string; profileId: string; text: string }[] = [
  { clientId: "c1", profileId: "m2", text: "He seems sweet but 5'7 is just too short for me. I did say at least 5'8, honestly anything under that is a no." },
  { clientId: "c1", profileId: "m4", text: "He smokes?? And he travels like 20 days a month for work. I want someone who is actually around." },
  { clientId: "c1", profileId: "m8", text: "Not sure... didn't really feel it from the photos." },
  { clientId: "c2", profileId: "f5", text: "She's lovely but 33 feels too close to my age, and a resident doctor's hours would be tough for us." },
  { clientId: "c2", profileId: "f4", text: "I said occasional smoking was fine but now that I see it, I'd really prefer someone who doesn't smoke at all." },
  { clientId: "c3", profileId: "m4", text: "Drinks a lot from what I can tell, and he's in Delhi. I'm not moving cities, that's final." },
];
