# Pre-share check: The Date Crew prototype

A prototype for matchmakers. It checks every candidate against a client's stated preferences before a profile is shared, and it turns free-text rejection feedback into structured reasons with AI. The full write-up is in [ANSWERS.md](ANSWERS.md).

## What it does

- **Rule check before sharing.** Each client preference is a rule, either a dealbreaker or soft. Candidates come out as *clear*, *review* (breaks a soft preference) or *blocked* (breaks a dealbreaker, so "Share" is disabled). Each card names the rule the candidate breaks.
- **Structured rejection feedback.** "Log rejection" sends the client's feedback to Claude, which returns reasons as attribute + strength + quote. Code, not the model, then checks whether the rejected profile broke a preference we already had.
- **Matchmaker approves every change.** A reason becomes a dealbreaker or soft rule with one click, and the tool shows which other candidates it now blocks. Reasons a rule can't check become notes. Vague feedback changes nothing and comes with a follow-up question.

All data is mocked in `src/lib/data.ts`. State lives in the browser and resets on reload.

## Run locally

```bash
pnpm install
# The feedback parser uses Vercel AI Gateway. Either:
echo 'AI_GATEWAY_API_KEY=...' > .env.local
# or link a Vercel project and pull an OIDC token:
vercel link && vercel env pull
pnpm dev
```

The rule check works without a key. Only "Structure feedback with AI" needs one.

## Code map

| File | What it does |
|---|---|
| `src/lib/checker.ts` | Deterministic rule engine: evaluate, check, tighten a rule from a rejected profile |
| `src/app/api/parse-feedback/route.ts` | Claude (`anthropic/claude-sonnet-5.5` via AI Gateway) with a Zod schema for structured output |
| `src/components/workbench.tsx` | Client list, preferences, candidate queue |
| `src/components/feedback-panel.tsx` | Feedback form, structured reasons, apply-rule actions, session metric |
| `src/lib/data.ts` | Mock clients, profiles, funnel and sample feedback |
