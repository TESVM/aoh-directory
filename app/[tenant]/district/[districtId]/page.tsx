import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { getDistrictStats, getTenantBySlug } from "@/lib/data";
import { badgeTone } from "@/lib/utils";

export default async function DistrictPage({
  params
}: {
  params: Promise<{ tenant: string; districtId: string }>;
}) {
  const { tenant: tenantSlug, districtId } = await params;
  const tenant = await getTenantBySlug(tenantSlug);

  if (!tenant) {
    notFound();
  }

  const stats = await getDistrictStats(tenant.slug, districtId);

  if (!stats.churches.length) {
    notFound();
  }

  return (
    <>
      <SiteHeader tenant={tenant} />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-line/80 bg-white p-8 shadow-soft">
          <div className="flex flex-col gap-5 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-700">District Dashboard</p>
              <h1 className="mt-3 font-serif text-5xl text-ink">District {districtId}</h1>
              <p className="mt-3 max-w-2xl text-lg leading-8 text-muted">
                Scoped view for district leaders with totals, verification breakdown, and district church listings.
              </p>
            </div>
            <Link href={`/${tenant.slug}`} className="flex min-h-11 w-full items-center justify-center rounded-full border border-line px-5 py-3 text-center text-sm font-semibold text-ink sm:w-auto">
              Back To Directory
            </Link>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <Metric label="Total churches" value={String(stats.total)} />
            <Metric label="Verified churches" value={String(stats.verified)} />
            <Metric label="Pending churches" value={String(stats.pending)} />
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.85fr]">
            <section className="rounded-[1.5rem] border border-line/80 bg-surface p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-700">District Churches</p>
              <div className="mt-4 space-y-4">
                {stats.churches.map((church) => (
                  <div key={church.id} className="rounded-[1.25rem] border border-line/80 bg-white p-4">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <h2 className="font-serif text-2xl text-ink">{church.name}</h2>
                        <p className="text-sm text-muted">
                          {church.city}, {church.state} • {church.pastorTitle} {church.pastorName}
                        </p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${badgeTone(church.status)}`}>
                        {church.status}
                      </span>
                    </div>
                    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                      <Link href={`/${tenant.slug}/church/${church.id}`} className="flex min-h-11 w-full items-center justify-center rounded-full border border-line px-4 py-2 text-center text-sm font-semibold text-brand-700 sm:w-auto">
                        View profile
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[1.5rem] border border-line/80 bg-gradient-to-br from-ink to-pine p-6 text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-100">Map Mode</p>
              <h2 className="mt-3 font-serif text-3xl">Cluster-ready geography</h2>
              <p className="mt-4 text-sm leading-7 text-white/80">
                This district view is already shaped for a Mapbox clustered map. Each record carries lat/lng,
                district id, and profile route target. The remaining work is client-side map rendering and token wiring.
              </p>
              <div className="mt-6 rounded-[1.25rem] border border-white/10 bg-white/10 p-4">
                <ul className="space-y-3 text-sm text-white/85">
                  <li>Use one persistent map instance.</li>
                  <li>Cluster by district subset for performance.</li>
                  <li>Open church preview on marker click.</li>
                </ul>
              </div>
            </section>
          </div>
        </div>
      </main>
    </>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.5rem] border border-line/80 bg-surface p-5">
      <p className="text-3xl font-semibold text-ink">{value}</p>
      <p className="mt-1 text-sm text-muted">{label}</p>
    </div>
  );
}
