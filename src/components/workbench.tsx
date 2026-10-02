"use client";

import { useState } from "react";
import { CLIENTS, PROFILES } from "@/lib/data";
import { ATTRIBUTE_LABEL, checkProfile, describeRule, formatHeight, upsertRule } from "@/lib/checker";
import type { CheckResult, CheckStatus, Client, Profile, Rule } from "@/lib/types";
import { FeedbackPanel, type RejectionLogEntry } from "./feedback-panel";

const STATUS_ORDER: Record<CheckStatus, number> = { clear: 0, review: 1, blocked: 2 };

const STATUS_STYLE: Record<CheckStatus, { label: string; badge: string; card: string }> = {
  clear: { label: "Clear to share", badge: "bg-emerald-100 text-emerald-800", card: "border-stone-200 bg-white" },
  review: { label: "Review", badge: "bg-amber-100 text-amber-800", card: "border-amber-200 bg-white" },
  blocked: { label: "Blocked", badge: "bg-rose-100 text-rose-800", card: "border-rose-200 bg-rose-50/40" },
};

export function Workbench() {
  const [clients, setClients] = useState<Client[]>(CLIENTS);
  const [clientId, setClientId] = useState(CLIENTS[0].id);
  const [feedbackFor, setFeedbackFor] = useState<string | null>(null);
  const [shared, setShared] = useState<Set<string>>(new Set());
  const [log, setLog] = useState<RejectionLogEntry[]>([]);

  const client = clients.find((c) => c.id === clientId)!;
  const candidates = client.candidateIds
    .map((id) => ({ profile: PROFILES[id], check: checkProfile(client.rules, PROFILES[id]) }))
    .sort((a, b) => STATUS_ORDER[a.check.status] - STATUS_ORDER[b.check.status] || b.check.score - a.check.score);
  const counts = { clear: 0, review: 0, blocked: 0 };
  candidates.forEach((c) => counts[c.check.status]++);

  function updateClient(patch: (c: Client) => Client) {
    setClients((all) => all.map((c) => (c.id === clientId ? patch(c) : c)));
  }

  function selectClient(id: string) {
    setClientId(id);
    setFeedbackFor(null);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)_400px]">
      <nav className="flex flex-col gap-2" aria-label="Clients">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-stone-500">Clients</h2>
        {clients.map((c) => (
          <button
            key={c.id}
            onClick={() => selectClient(c.id)}
            className={`rounded-md border px-3 py-2 text-left text-sm ${c.id === clientId ? "border-stone-900 bg-stone-900 text-white" : "border-stone-200 bg-white text-stone-800 hover:border-stone-400"}`}
          >
            <div className="font-medium">{c.name}</div>
            <div className={`text-xs ${c.id === clientId ? "text-stone-300" : "text-stone-500"}`}>
              {c.age} · {c.city} · Matchmaker {c.matchmaker}
            </div>
          </button>
        ))}
      </nav>

      <section className="flex min-w-0 flex-col gap-4">
        <Preferences
          client={client}
          onToggleHard={(attr) =>
            updateClient((c) => ({
              ...c,
              rules: c.rules.map((r) => (r.attr === attr ? { ...r, hard: !r.hard } : r)),
            }))
          }
        />

        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-sm font-semibold text-stone-900">Candidates for {client.name.split(" ")[0]}</h2>
          <p className="text-xs text-stone-500">
            <span className="text-emerald-700">{counts.clear} clear</span> ·{" "}
            <span className="text-amber-700">{counts.review} review</span> ·{" "}
            <span className="text-rose-700">{counts.blocked} blocked</span>
          </p>
        </div>
        <ul className="flex flex-col gap-2">
          {candidates.map(({ profile, check }) => {
            const key = `${clientId}:${profile.id}`;
            return (
              <CandidateCard
                key={profile.id}
                profile={profile}
                check={check}
                isShared={shared.has(key)}
                isSelected={feedbackFor === profile.id}
                onShare={() => setShared((s) => new Set(s).add(key))}
                onLogRejection={() => setFeedbackFor(profile.id)}
              />
            );
          })}
        </ul>
      </section>

      <aside className="flex flex-col gap-4">
        <FeedbackPanel
          key={`${clientId}:${feedbackFor}`}
          client={client}
          profile={feedbackFor ? PROFILES[feedbackFor] : null}
          log={log}
          onSelectProfile={setFeedbackFor}
          onLogged={(entry) => setLog((l) => [...l, entry])}
          onApplyRule={(rule: Rule) =>
            updateClient((c) => ({ ...c, rules: upsertRule(c.rules, rule) }))
          }
          onAddNote={(note) => updateClient((c) => ({ ...c, notes: [...c.notes, note] }))}
        />
      </aside>
    </div>
  );
}

function Preferences({ client, onToggleHard }: { client: Client; onToggleHard: (attr: Rule["attr"]) => void }) {
  return (
    <section className="rounded-lg border border-stone-200 bg-white p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold text-stone-900">{client.name}&apos;s preferences</h2>
        <p className="text-xs text-stone-500">Click a preference to switch between dealbreaker and soft.</p>
      </div>
      <ul className="mt-3 flex flex-wrap gap-2">
        {client.rules.map((r) => (
          <li key={r.attr}>
            <button
              onClick={() => onToggleHard(r.attr)}
              className={`rounded-full border px-3 py-1 text-xs ${r.hard ? "border-rose-300 bg-rose-50 text-rose-900" : "border-stone-200 bg-stone-50 text-stone-700"}`}
              title={r.hard ? "Dealbreaker: blocks the share" : "Soft: flags for review"}
            >
              <span className="font-medium">{ATTRIBUTE_LABEL[r.attr]}:</span> {describeRule(r)}
              {r.hard && <span className="ml-1 font-semibold">· dealbreaker</span>}
            </button>
          </li>
        ))}
      </ul>
      {client.notes.length > 0 && (
        <div className="mt-3 border-t border-stone-100 pt-3">
          <h3 className="text-xs font-semibold text-stone-500">Learned from feedback (not rule-checkable)</h3>
          <ul className="mt-1 list-disc pl-5 text-xs text-stone-700">
            {client.notes.map((n, i) => (
              <li key={i}>{n}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function CandidateCard({
  profile: p,
  check,
  isShared,
  isSelected,
  onShare,
  onLogRejection,
}: {
  profile: Profile;
  check: CheckResult;
  isShared: boolean;
  isSelected: boolean;
  onShare: () => void;
  onLogRejection: () => void;
}) {
  const style = STATUS_STYLE[check.status];
  const failed = check.results.filter((r) => !r.pass);
  return (
    <li className={`rounded-lg border p-3 ${style.card} ${isSelected ? "ring-2 ring-stone-900" : ""}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-stone-900">{p.name}</span>
            <span className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${style.badge}`}>{style.label}</span>
            {check.status !== "blocked" && (
              <span className="text-xs tabular-nums text-stone-500">{check.score}% of preferences met</span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-stone-600">
            {p.age} · {formatHeight(p.heightCm)} · {p.city} · {p.religion} · {p.diet} · {p.profession}
          </p>
          <p className="mt-0.5 text-xs text-stone-500">{p.bio}</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            onClick={onShare}
            disabled={check.status === "blocked" || isShared}
            className="rounded-md bg-stone-900 px-3 py-1.5 text-xs font-medium text-white disabled:cursor-not-allowed disabled:bg-stone-300"
            title={check.status === "blocked" ? "Breaks a dealbreaker; cannot be shared" : undefined}
          >
            {isShared ? "Shared ✓" : "Share"}
          </button>
          <button
            onClick={onLogRejection}
            className="rounded-md border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-800 hover:border-stone-500"
          >
            Log rejection
          </button>
        </div>
      </div>
      {failed.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {failed.map((r) => (
            <li
              key={r.rule.attr}
              className={`rounded px-2 py-0.5 text-[11px] ${r.rule.hard ? "bg-rose-100 text-rose-800" : "bg-amber-50 text-amber-800"}`}
            >
              {ATTRIBUTE_LABEL[r.rule.attr]}: {r.detail} (wants {describeRule(r.rule)})
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}
