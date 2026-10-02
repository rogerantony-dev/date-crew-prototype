import { FUNNEL } from "@/lib/data";

export function FunnelStrip() {
  const steps = FUNNEL.map((s, i) => ({
    ...s,
    rate: i === 0 ? null : s.count / FUNNEL[i - 1].count,
    lost: i === 0 ? 0 : FUNNEL[i - 1].count - s.count,
  }));
  const biggestLoss = Math.max(...steps.map((s) => s.lost));

  return (
    <section className="rounded-lg border border-stone-200 bg-white p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold text-stone-900">Last 30 days</h2>
        <p className="text-xs text-stone-500">
          690 rejections × ~35% against stated preferences ≈{" "}
          <span className="font-semibold text-rose-700">240 shares a month that a rule check could have caught</span>
        </p>
      </div>
      <ol className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {steps.map((s) => (
          <li
            key={s.stage}
            className={`rounded-md border p-2 ${s.lost === biggestLoss ? "border-rose-300 bg-rose-50" : "border-stone-200"}`}
          >
            <div className="text-xs text-stone-500">{s.stage}</div>
            <div className="text-lg font-semibold tabular-nums text-stone-900">{s.count.toLocaleString()}</div>
            {s.rate !== null && (
              <div className={`text-xs tabular-nums ${s.lost === biggestLoss ? "font-semibold text-rose-700" : "text-stone-500"}`}>
                {Math.round(s.rate * 100)}% of previous · −{s.lost}
              </div>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
