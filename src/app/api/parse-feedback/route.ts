import { generateText, Output } from "ai";
import { z } from "zod";
import { CLIENTS, PROFILES } from "@/lib/data";
import { describeRule, formatHeight } from "@/lib/checker";
import { CHECKABLE_ATTRIBUTES, SOFT_ATTRIBUTES, type Rule } from "@/lib/types";

const MODEL = "anthropic/claude-sonnet-5.5";

const feedbackSchema = z.object({
  reasons: z
    .array(
      z.object({
        attribute: z.enum([...CHECKABLE_ATTRIBUTES, ...SOFT_ATTRIBUTES]),
        evidence: z.string().describe("Short verbatim quote from the feedback"),
        strength: z
          .enum(["dealbreaker", "preference", "vague"])
          .describe(
            "dealbreaker = client says it is a firm no; preference = a lean, not absolute; vague = no clear, actionable reason",
          ),
        summary: z.string().describe("One short line a matchmaker can act on, e.g. 'Won't date smokers'"),
      }),
    )
    .describe("One entry per distinct reason. Empty if the feedback gives no reason."),
  followUpQuestion: z
    .string()
    .nullable()
    .describe("If any reason is vague, one short question the matchmaker can ask the client to make it specific. Otherwise null."),
});

const list = <T extends string>(values: readonly [T, ...T[]]) => z.array(z.enum(values));
const habit = ["never", "occasionally", "regularly"] as const;
const ruleSchema = z.discriminatedUnion("attr", [
  z.object({ attr: z.literal("age"), hard: z.boolean(), min: z.number(), max: z.number() }),
  z.object({ attr: z.literal("height"), hard: z.boolean(), minCm: z.number(), maxCm: z.number() }),
  z.object({ attr: z.literal("location"), hard: z.boolean(), cities: z.array(z.string()) }),
  z.object({ attr: z.literal("religion"), hard: z.boolean(), allowed: z.array(z.string()) }),
  z.object({ attr: z.literal("diet"), hard: z.boolean(), allowed: list(["veg", "eggetarian", "non-veg"]) }),
  z.object({ attr: z.literal("smoking"), hard: z.boolean(), allowed: list(habit) }),
  z.object({ attr: z.literal("drinking"), hard: z.boolean(), allowed: list(habit) }),
  z.object({ attr: z.literal("children"), hard: z.boolean(), allowed: list(["yes", "no", "open"]) }),
  z.object({ attr: z.literal("education"), hard: z.boolean(), min: z.enum(["bachelors", "masters", "doctorate"]) }),
  z.object({ attr: z.literal("income"), hard: z.boolean(), minLakh: z.number() }),
  z.object({ attr: z.literal("marital_status"), hard: z.boolean(), allowed: list(["never_married", "divorced"]) }),
]);

const requestSchema = z.object({
  clientId: z.string(),
  profileId: z.string(),
  feedback: z.string().min(3).max(2000),
  // Sent by the browser so the model sees preferences the matchmaker has already updated.
  rules: z.array(ruleSchema).optional(),
});

function profileSummary(id: string) {
  const p = PROFILES[id];
  return `${p.name}, ${p.age}, ${formatHeight(p.heightCm)}, ${p.city}${p.openToRelocate ? " (open to relocate)" : ""}, ${p.religion}, ${p.diet}, smoking: ${p.smoking}, drinking: ${p.drinking}, wants children: ${p.wantsChildren}, ${p.education}, ${p.profession}, ₹${p.incomeLakh}L, ${p.maritalStatus.replace("_", " ")}. Bio: ${p.bio}`;
}

export async function POST(req: Request) {
  const parsed = requestSchema.safeParse(await req.json());
  if (!parsed.success) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
  const { clientId, profileId, feedback } = parsed.data;
  const client = CLIENTS.find((c) => c.id === clientId);
  if (!client || !PROFILES[profileId]) {
    return Response.json({ error: "Unknown client or profile" }, { status: 404 });
  }

  const rules: Rule[] = parsed.data.rules ?? client.rules;

  try {
    const { output } = await generateText({
      model: MODEL,
      output: Output.object({ schema: feedbackSchema }),
      system:
        "You help matchmakers at an Indian matchmaking service turn a client's free-text rejection of a suggested profile into structured reasons. " +
        "Only extract reasons the client actually gives; never invent reasons from the profile. " +
        "Map each reason to the closest attribute. Use 'vague' when the client gives no specific, actionable reason (e.g. 'didn't feel it'). " +
        "Clients often soften firm rules and overstate passing moods, so judge strength from the wording, not the topic.",
      prompt: [
        `Client stated preferences: ${rules.map((r) => `${r.attr}: ${describeRule(r)}${r.hard ? " (dealbreaker)" : ""}`).join("; ")}`,
        `Rejected profile: ${profileSummary(profileId)}`,
        `Client feedback: """${feedback}"""`,
      ].join("\n\n"),
    });
    return Response.json(output);
  } catch (error) {
    console.error("parse-feedback failed", error);
    const message = error instanceof Error ? error.message : String(error);
    const notConfigured = /api key|oidc|unauthori[sz]ed|authentication/i.test(message);
    return Response.json(
      {
        error: notConfigured
          ? "AI Gateway is not configured. Set AI_GATEWAY_API_KEY in .env.local (or run `vercel link && vercel env pull`)."
          : `AI call failed: ${message}`,
      },
      { status: notConfigured ? 503 : 502 },
    );
  }
}
