# Pre-share check: The Date Crew prototype

A prototype for matchmakers. It checks every candidate against a client's stated preferences before a profile is shared, and it turns free-text rejection feedback into structured reasons with AI. The full write-up is in [ANSWERS.md](ANSWERS.md).

**Live:** https://date-crew.vercel.app

## What it does

- **Rule check before sharing.** Each client preference is a rule, either a dealbreaker or soft. Candidates come out as *clear*, *review* (breaks a soft preference) or *blocked* (breaks a dealbreaker, so "Share" is disabled). Each card names the rule the candidate breaks.
- **Structured rejection feedback.** "Log rejection" sends the client's feedback to Gemini, which returns reasons as attribute + strength + quote. Code, not the model, then checks whether the rejected profile broke a preference we already had.
- **Matchmaker approves every change.** A reason becomes a dealbreaker or soft rule with one click, and the tool shows which other candidates it now blocks. Reasons a rule can't check become notes. Vague feedback changes nothing and comes with a follow-up question.

All data is mocked in `src/lib/data.ts`. State lives in the browser and resets on reload.

## Run locally

```bash
pnpm install
# The feedback parser uses Gemini. Get a free key at https://aistudio.google.com/apikey
echo 'GOOGLE_GENERATIVE_AI_API_KEY=...' > .env.local
pnpm dev
```

The rule check works without a key. Only "Structure feedback with AI" needs one. On Vercel, set the same variable under the project's environment variables.

## Stack

Next.js 16 (App Router) on Vercel, TypeScript, Tailwind CSS, Vercel AI SDK with Google Gemini Flash (free tier), and Zod.

## Code map

| File | What it does |
|---|---|
| `src/lib/checker.ts` | Deterministic rule engine: evaluate, check, tighten a rule from a rejected profile |
| `src/app/api/parse-feedback/route.ts` | Gemini via the Vercel AI SDK (`@ai-sdk/google`). Tries `gemini-flash-latest`, falls back to `gemini-2.5-flash`, and uses a Zod schema for structured output |
| `src/components/workbench.tsx` | Client list, preferences, candidate queue |
| `src/components/feedback-panel.tsx` | Feedback form, structured reasons, apply-rule actions, session metric |
| `src/lib/data.ts` | Mock clients, profiles, funnel and sample feedback |
