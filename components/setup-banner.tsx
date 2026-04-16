import { hasFirebaseAdminConfig, hasFirebaseClientConfig } from "@/lib/firebase/config";

export function SetupBanner() {
  const clientReady = hasFirebaseClientConfig();
  const adminReady = hasFirebaseAdminConfig();

  if (clientReady && adminReady) {
    return null;
  }

  return (
    <div className="mb-6 rounded-[1.5rem] border border-amber-200 bg-amber-50 p-4 text-amber-950 shadow-card">
      <p className="text-sm font-semibold uppercase tracking-[0.22em]">Setup Needed</p>
      <p className="mt-2 text-sm leading-7">
        Firebase is not fully configured yet.
        {!clientReady ? " Client login keys are missing." : ""}
        {!adminReady ? " Server admin keys are missing." : ""}
      </p>
      <div className="mt-3 flex flex-wrap gap-3 text-sm font-medium">
        <span className="rounded-full bg-white px-3 py-1">1. Copy `.env.example` to `.env.local`</span>
        <span className="rounded-full bg-white px-3 py-1">2. Fill in Firebase keys</span>
        <span className="rounded-full bg-white px-3 py-1">3. Run `npm run check:firebase`</span>
        <span className="rounded-full bg-white px-3 py-1">4. Run `npm run seed:firestore`</span>
      </div>
      <p className="mt-3 text-sm">See `README.md` in the project root for the exact setup list.</p>
    </div>
  );
}
