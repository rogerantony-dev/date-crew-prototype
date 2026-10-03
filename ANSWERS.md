# The Date Crew: Product & Tech Generalist Assessment

## Part 1. Diagnose the problem

**The funnel, as step rates**

| Stage | Count | % of previous stage | Lost |
|---|---|---|---|
| Profiles shared | 1,000 | | |
| Profiles accepted | 310 | 31% | 690 |
| Contact details shared | 210 | 68% | 100 |
| Conversations started | 150 | 71% | 60 |
| Meetings fixed | 75 | 50% | 75 |
| Meetings completed | 42 | 56% | 33 |

Only 4.2% of shared profiles end in a completed meeting.

**Three questions I'd investigate**

1. **Why do clients reject profiles?** I'd hand-tag 150 to 200 rejection notes as "broke a stated preference", "new information" or "vague". The first points to a process problem, the second to a preference-capture problem, and they need different fixes.
2. **What does Matchmaker A (44%) do differently from B (21%)?** After ruling out client mix, I'd compare shares per client, preference-breaking shares and how each of them searches. A process gap can be taught or built into a tool.
3. **What explains "reject, then later accept someone similar"?** If it's fatigue or timing rather than real preference, tightening filters after every rejection would overfit.

**Biggest problem.** It's the first step. 690 of the 1,000 profiles are rejected, more than all later losses combined (268). About 35% of those rejections, roughly 240 a month, break preferences the client already gave us. That waste is avoidable. Without those 240 shares, acceptance would be 310 / 760 = 41%, close to Matchmaker A's 44%. I'm assuming A and B have similar clients, so B's gap is mostly preference-breaking shares.

**Three metrics**

1. **% of shares that break a stated preference.** Today this is about 24% (240/1000). It's the leading indicator the fix controls directly, and the target is close to 0.
2. **Acceptance rate per matchmaker.** This shows whether the fix works, and whether B is closing the gap with A.
3. **Completed meetings per active client per month.** This is the outcome clients pay for. It stops us gaming acceptance by sharing less.

## Part 2. Design a solution

**Problem.** Matchmakers share profiles that break preferences the client already gave us. That's about 240 wasted shares a month, each costing a client's attention and a matchmaker's time. Rejection feedback is free text, so nobody can see this pattern or learn from it.

**User.** Matchmakers use the tool every day. Team leads read a weekly view of violation and acceptance rates per matchmaker.

**Solution.** A pre-share check with a feedback loop.

1. Each client's preferences become structured rules, and each rule is either a **dealbreaker** or **soft**. We already collect these preferences, so this is mostly re-entering them as fields with a dealbreaker flag.
2. Before sharing, every candidate goes through the rule check. A broken dealbreaker blocks the share. A broken soft preference flags it for review and shows the reason. Profiles that pass are ranked by how many preferences they meet, which also cuts search time.
3. When a client rejects a profile, the matchmaker pastes their feedback. An LLM turns it into structured reasons (attribute, firm or soft, a verbatim quote). Code then checks whether the rejected profile broke a preference we already had.
4. The matchmaker decides what changes. One click turns a reason into a dealbreaker or a soft preference. Reasons a rule can't check, like "travels 20 days a month", become notes on the client. Vague feedback changes nothing and comes with a follow-up question the matchmaker can ask the client.

The AI never changes a preference by itself. Clients sometimes reject a profile and later accept a similar one, so automatic learning from every rejection would overfit. A human approves every change.

**Data.**
- Client preferences as structured fields, each with a dealbreaker flag.
- Candidate profile attributes, structured the same way.
- A share log with client, candidate, matchmaker, timestamp, check result at share time and outcome.
- Rejection feedback text, plus the structured reasons.

**Technology.**
- An internal Next.js tool on Postgres. The "Share" action generates the email the team already sends, so the check sits in the path of every share instead of being an optional extra step.
- The rule engine is plain TypeScript. It's deterministic, fast, testable and free, and checking "smoker vs never-smoker" doesn't need AI.
- An LLM with schema-validated structured output, used only to read feedback. The prototype uses Gemini Flash on the free tier. In production, any small model works, at a fraction of a rupee per call.

**Two-week plan.**
- Week 1: preference schema and migration, rule engine with tests, a share flow that blocks dealbreakers, and the share log.
- Week 2: AI feedback structuring with the approve flow, a dashboard of violations and acceptance per matchmaker, and a pilot with Matchmaker B.

**Success metric.**
- Primary: preference-breaking shares fall from about 24% to under 3%.
- Expected result: acceptance rate goes from 31% to 38–41% within a month, with completed meetings per client flat or up.

## Part 3. Prototype

A working "pre-share check" with mocked clients and profiles.

- Live: https://date-crew.vercel.app
- Code: https://github.com/rogerantony-dev/date-crew-prototype

- It shows the funnel from the brief and highlights the biggest drop.
- For each client, it lists candidates as clear, review or blocked, and names the preference each one breaks. Blocked profiles can't be shared.
- Logging a rejection sends the feedback to Gemini for structured reasons. The tool then labels each reason as "already in stated preferences", "stated preference didn't cover this" or "new preference".
- One click makes a reason a dealbreaker or soft rule. The tool then shows which other candidates the new rule blocks.
- It tracks the % of logged rejections that broke a stated preference, which is the metric from Part 1.

## Part 4. Curveball: the metric doesn't move

**What I'd check first.** Whether the tool is being used. What % of shares went through the check, and how often matchmakers overrode or worked around a block? A tool nobody uses is a rollout problem, not a broken idea.

**What data I'd look at.**
- The share log. Did preference-breaking shares actually drop?
- Rejection reasons before and after launch. Suppose violations fell to near zero and acceptance stayed flat. Then those clients would have rejected those profiles anyway, and the stated preference was just the easiest reason to give.
- The results by matchmaker, and sample size. Two weeks is about 500 shares, which gives roughly ±4pp on a 31% rate, so a small gain could be hidden by noise.

**Iterate, change or kill.**
- Not adopted: iterate on the workflow.
- Adopted, but violations didn't fall: fix the rules.
- Violations fell and acceptance didn't move: the hypothesis was wrong. I'd keep the check, since it costs almost nothing, but stop investing in it. I'd move the effort to what the structured feedback shows people actually reject on, and to what Matchmaker A does differently.

## AI usage

> Draft. Rewrite in your own words, and replace the last line with something you actually disagreed with.

- I used Claude Code to read the brief, check the funnel maths, build the Next.js prototype and draft these answers. Inside the prototype, Gemini turns rejection feedback into structured reasons.
- I kept every preference check deterministic and every rule change human-approved, so the AI never decides on its own whether a profile breaks a preference.
- One AI suggestion I disagreed with: _(fill in)_
