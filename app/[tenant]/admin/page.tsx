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
        <div className="mb-8 overflow-hidden rounded-[2.2rem] bg-hero shadow-soft">
          <div className="px-6 py-10 text-white sm:px-8">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-100">AOH Back Office</p>
            <h1 className="mt-3 font-serif text-4xl sm:text-5xl">Manage churches, people, and messages</h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-brand-100">
              This is the private work area for reviewing churches, fixing records, answering prayer requests,
              and assigning editor access to Overseers, Bishops, and Pastors.
            </p>
          </div>
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
