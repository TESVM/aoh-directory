import { requireTenantRole } from "@/lib/auth";
import { AdminDashboard } from "@/components/admin-dashboard";
import { SiteHeader } from "@/components/site-header";
import { SetupBanner } from "@/components/setup-banner";
import { findPotentialDuplicates, getPrayerRequestsByTenant, getScopedChurches, getScopedSubmissions, getUsersByTenant, getViewerContext } from "@/lib/data";

export default async function AdminPage({
  params
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant: tenantSlug } = await params;
  await requireTenantRole(tenantSlug, ["admin", "overseer", "bishop", "pastor"]);
  const viewer = await getViewerContext(tenantSlug);
  if (!viewer || viewer.role === "public") {
    return null;
  }

  const [churches, submissions, users, prayerRequests] = await Promise.all([
    getScopedChurches(viewer),
    getScopedSubmissions(viewer),
    viewer.role === "admin" ? getUsersByTenant(viewer.tenant.slug) : Promise.resolve([]),
    viewer.role === "admin" ? getPrayerRequestsByTenant(viewer.tenant.slug) : Promise.resolve([])
  ]);
  const duplicateEntries = await Promise.all(
    submissions.map(async (submission) => [submission.id, await findPotentialDuplicates(viewer.tenant.slug, submission.id)] as const)
  );
  const duplicateMap = Object.fromEntries(duplicateEntries);

  return (
    <>
      <SiteHeader tenant={viewer.tenant} />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <SetupBanner />
        <div className="mb-8 rounded-[1.75rem] border border-line/80 bg-white p-6 shadow-card">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-700">Admin Dashboard</p>
          <h1 className="mt-3 font-serif text-4xl text-ink">Back Office Portal</h1>
          <p className="mt-3 max-w-3xl text-lg leading-8 text-muted">
            This portal is where the directory staff signs in, reviews churches, fixes records, and assigns
            editing access to Overseers, Bishops, and Pastors.
          </p>
        </div>

        <AdminDashboard
          viewer={viewer}
          churches={churches}
          submissions={submissions}
          duplicateMap={duplicateMap}
          users={users}
          prayerRequests={prayerRequests}
        />
      </main>
    </>
  );
}
