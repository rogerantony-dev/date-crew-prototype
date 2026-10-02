import { FunnelStrip } from "@/components/funnel-strip";
import { Workbench } from "@/components/workbench";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-[1400px] flex-col gap-4 px-4 py-6">
      <header>
        <h1 className="text-xl font-semibold text-stone-900">Pre-share check</h1>
        <p className="mt-1 max-w-3xl text-sm text-stone-600">
          Before a matchmaker shares a profile, every candidate is checked against the client&apos;s stated
          preferences. Dealbreakers block the share. When a client rejects a profile, AI turns their free-text
          feedback into structured reasons, and the matchmaker decides which ones become rules.
        </p>
      </header>
      <FunnelStrip />
      <Workbench />
    </main>
  );
}
