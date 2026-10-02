"use client";

import { useState } from "react";
import { PROFILES, SAMPLE_FEEDBACK } from "@/lib/data";
import {
  ATTRIBUTE_LABEL,
  checkProfile,
  describeRule,
  isCheckable,
  statedPreferenceVerdict,
  tightenRule,
  upsertRule,
  type StatedPreferenceVerdict,
} from "@/lib/checker";
import type { Client, FeedbackReason, ParsedFeedback, Profile, Rule } from "@/lib/types";

export type RejectionLogEntry = {
  clientName: string;
  profileName: string;
  brokeStatedPreference: boolean;
};

const VERDICT: Record<StatedPreferenceVerdict, { label: string; style: string }> = {
  violated: { label: "Already in stated preferences: should not have been shared", style: "bg-rose-100 text-rose-800" },
  not_covered: { label: "Stated preference didn't cover this", style: "bg-amber-100 text-amber-800" },
  not_stated: { label: "New preference", style: "bg-sky-100 text-sky-800" },
};

const STRENGTH_STYLE: Record<FeedbackReason["strength"], string> = {
  dealbreaker: "bg-rose-50 text-rose-700 border-rose-200",
  preference: "bg-stone-50 text-stone-700 border-stone-200",
  vague: "bg-stone-50 text-stone-500 border-dashed border-stone-300",
};

type Props = {
  client: Client;
  profile: Profile | null;
  log: RejectionLogEntry[];
  onSelectProfile: (profileId: string) => void;
  onLogged: (entry: RejectionLogEntry) => void;
  onApplyRule: (rule: Rule) => void;
  onAddNote: (note: string) => void;
};

export function FeedbackPanel(props: Props) {
  return (
    <>
      <section className="rounded-lg border border-stone-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-stone-900">Rejection feedback</h2>
        {props.profile ? <FeedbackForm {...props} profile={props.profile} /> : <EmptyState {...props} />}
      </section>
      <RejectionLog log={props.log} />
    </>
  );
}

function EmptyState({ client, onSelectProfile }: Props) {
  const samples = SAMPLE_FEEDBACK.filter((s) => s.clientId === client.id);
  return (
    <div className="mt-2 text-sm text-stone-600">
      <p>Click &ldquo;Log rejection&rdquo; on a candidate to structure the client&apos;s feedback.</p>
      {samples.length > 0 && (
        <>
          <p className="mt-3 text-xs font-semibold text-stone-500">Sample feedback from {client.name.split(" ")[0]}</p>
          <ul className="mt-1 flex flex-col gap-1.5">
            {samples.map((s) => (
              <li key={s.profileId}>
                <button
                  onClick={() => onSelectProfile(s.profileId)}
                  className="w-full rounded-md border border-stone-200 px-2 py-1.5 text-left text-xs hover:border-stone-400"
                >
                  <span className="font-medium text-stone-800">{PROFILES[s.profileId].name}:</span>{" "}
                  <span className="text-stone-600">&ldquo;{s.text}&rdquo;</span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function FeedbackForm({ client, profile, onLogged, onApplyRule, onAddNote }: Props & { profile: Profile }) {
  const sample = SAMPLE_FEEDBACK.find((s) => s.clientId === client.id && s.profileId === profile.id);
  const [text, setText] = useState(sample?.text ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ parsed: ParsedFeedback; rulesAtRejection: Rule[] } | null>(null);
  const [outcomes, setOutcomes] = useState<Record<number, string>>({});

  async function structure() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/parse-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: client.id, profileId: profile.id, feedback: text, rules: client.rules }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? `Request failed (${res.status})`);
      const parsed = body as ParsedFeedback;
      // Judge against the rules in force when the profile was shared, not after we tighten them.
      const rulesAtRejection = client.rules;
      setResult({ parsed, rulesAtRejection });
      setOutcomes({});
      onLogged({
        clientName: client.name,
        profileName: profile.name,
        brokeStatedPreference: parsed.reasons.some(
          (r) => isCheckable(r.attribute) && statedPreferenceVerdict(rulesAtRejection, r.attribute, profile) === "violated",
        ),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setPending(false);
    }
  }

  function applyRule(index: number, reason: FeedbackReason, hard: boolean) {
    if (!isCheckable(reason.attribute)) return;
    const existing = client.rules.find((r) => r.attr === reason.attribute);
    const rule = tightenRule(existing, reason.attribute, profile, hard);
    const nextRules = upsertRule(client.rules, rule);
    const newlyBlocked = client.candidateIds
      .filter((id) => id !== profile.id)
      .map((id) => PROFILES[id])
      .filter((p) => checkProfile(client.rules, p).status !== "blocked" && checkProfile(nextRules, p).status === "blocked");
    onApplyRule(rule);
    setOutcomes((o) => ({
      ...o,
      [index]:
        `${ATTRIBUTE_LABEL[rule.attr]} set to ${describeRule(rule)}${hard ? " (dealbreaker)" : " (soft)"}.` +
        (newlyBlocked.length ? ` Now also blocks ${newlyBlocked.map((p) => p.name).join(", ")}.` : ""),
    }));
  }

  function saveNote(index: number, reason: FeedbackReason) {
    onAddNote(`${reason.summary} (from feedback on ${profile.name})`);
    setOutcomes((o) => ({ ...o, [index]: "Saved as a note on the client." }));
  }

  return (
    <div className="mt-2 flex flex-col gap-3">
      <p className="text-xs text-stone-600">
        {client.name.split(" ")[0]} rejected <span className="font-medium text-stone-900">{profile.name}</span>. Paste
        their feedback:
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
        className="w-full rounded-md border border-stone-300 p-2 text-sm text-stone-900 focus:border-stone-900 focus:outline-none"
        placeholder="e.g. He's nice but I can't do a smoker…"
      />
      <button
        onClick={structure}
        disabled={pending || text.trim().length < 3}
        className="self-start rounded-md bg-stone-900 px-3 py-1.5 text-xs font-medium text-white disabled:bg-stone-300"
      >
        {pending ? "Structuring…" : "Structure feedback with AI"}
      </button>
      {error && <p className="rounded-md bg-rose-50 p-2 text-xs text-rose-800">{error}</p>}

      {result && (
        <div className="flex flex-col gap-2">
          {result.parsed.reasons.length === 0 && (
            <p className="text-xs text-stone-500">No specific reason found in this feedback.</p>
          )}
          {result.parsed.reasons.map((reason, i) => {
            const checkable = isCheckable(reason.attribute);
            const verdict = isCheckable(reason.attribute)
              ? statedPreferenceVerdict(result.rulesAtRejection, reason.attribute, profile)
              : null;
            return (
              <div key={i} className={`rounded-md border p-2 ${STRENGTH_STYLE[reason.strength]}`}>
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="font-semibold text-stone-900">{ATTRIBUTE_LABEL[reason.attribute]}</span>
                  <span className="rounded bg-white/70 px-1.5 py-0.5 text-[11px]">{reason.strength}</span>
                  {verdict && (
                    <span className={`rounded px-1.5 py-0.5 text-[11px] ${VERDICT[verdict].style}`}>{VERDICT[verdict].label}</span>
                  )}
                </div>
                <p className="mt-1 text-xs text-stone-800">{reason.summary}</p>
                <p className="mt-0.5 text-[11px] italic text-stone-500">&ldquo;{reason.evidence}&rdquo;</p>
                <div className="mt-2">
                  {outcomes[i] ? (
                    <p className="text-[11px] font-medium text-emerald-800">✓ {outcomes[i]}</p>
                  ) : reason.strength === "vague" ? (
                    <p className="text-[11px] text-stone-500">
                      No rule change: one vague rejection isn&apos;t a pattern.
                    </p>
                  ) : checkable ? (
                    <div className="flex flex-wrap gap-1.5">
                      <ActionButton primary={reason.strength === "dealbreaker"} onClick={() => applyRule(i, reason, true)}>
                        Make dealbreaker
                      </ActionButton>
                      <ActionButton primary={reason.strength === "preference"} onClick={() => applyRule(i, reason, false)}>
                        Add as soft preference
                      </ActionButton>
                    </div>
                  ) : (
                    <ActionButton primary onClick={() => saveNote(i, reason)}>
                      Save as note
                    </ActionButton>
                  )}
                </div>
              </div>
            );
          })}
          {result.parsed.followUpQuestion && (
            <p className="rounded-md bg-sky-50 p-2 text-xs text-sky-900">
              <span className="font-semibold">Ask {client.name.split(" ")[0]}:</span> {result.parsed.followUpQuestion}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function ActionButton({ primary, onClick, children }: { primary?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded px-2 py-1 text-[11px] font-medium ${primary ? "bg-stone-900 text-white" : "border border-stone-300 bg-white text-stone-800"}`}
    >
      {children}
    </button>
  );
}

function RejectionLog({ log }: { log: RejectionLogEntry[] }) {
  if (log.length === 0) return null;
  const broke = log.filter((l) => l.brokeStatedPreference).length;
  return (
    <section className="rounded-lg border border-stone-200 bg-white p-4">
      <h2 className="text-sm font-semibold text-stone-900">This session</h2>
      <p className="mt-1 text-xs text-stone-600">
        {log.length} rejection{log.length === 1 ? "" : "s"} structured ·{" "}
        <span className="font-semibold text-rose-700">
          {broke} ({Math.round((broke / log.length) * 100)}%) broke a stated preference
        </span>
        . This is the number the pre-share check should push towards 0.
      </p>
      <ul className="mt-2 flex flex-col gap-1 text-xs text-stone-600">
        {log.map((l, i) => (
          <li key={i}>
            {l.clientName} → {l.profileName}: {l.brokeStatedPreference ? "broke stated preference" : "new information"}
          </li>
        ))}
      </ul>
    </section>
  );
}
