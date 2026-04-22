import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { updateChurchAction } from "@/app/actions";
import { AdminRecordForm } from "@/components/admin-record-form";
import { SetupBanner } from "@/components/setup-banner";
import { SiteHeader } from "@/components/site-header";
import { requireTenantRole } from "@/lib/auth";
import { ensureChurchInFirestore, getChurchByTenantAndId, getViewerContext } from "@/lib/data";

export default async function AdminChurchPage({
  params
}: {
  params: Promise<{ tenant: string; id: string }>;
}) {
  const { tenant: tenantSlug, id } = await params;
  const { user } = await requireTenantRole(tenantSlug, ["admin", "overseer", "bishop", "pastor"]);
  const viewer = await getViewerContext(tenantSlug);

  if (!viewer || viewer.role === "public") {
    return null;
  }

  const church = await getChurchByTenantAndId(tenantSlug, id);
  if (!church) {
    notFound();
  }

  if ((user.role === "overseer" || user.role === "bishop") && user.district !== church.district) {
    redirect(`/${tenantSlug}/admin`);
  }

  if (user.role === "pastor" && user.churchId !== church.id) {
    redirect(`/${tenantSlug}/admin`);
  }

  const bootstrapResult = await ensureChurchInFirestore(tenantSlug, church.id);

  return (
    <>
      <SiteHeader tenant={viewer.tenant} />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <SetupBanner />
        {!bootstrapResult.ok ? (
          <div className="mb-6 rounded-[1.5rem] border border-amber-200 bg-amber-50 p-4 text-amber-950 shadow-card">
            <p className="text-sm font-semibold uppercase tracking-[0.22em]">Church Record Warning</p>
            <p className="mt-2 text-sm leading-7">
              This church page loaded from the merged directory, but Firestore did not fully prepare the live record yet.
              You can still try saving. If the problem repeats, reopen the editor from the admin dashboard.
            </p>
            {bootstrapResult.reason ? <p className="mt-3 text-sm font-medium">{bootstrapResult.reason}</p> : null}
          </div>
        ) : null}
        <div className="mb-6 flex flex-wrap items-center gap-3 text-sm font-medium text-brand-700">
          <Link href={`/${tenantSlug}/admin`}>Back to admin</Link>
          <span className="text-muted">/</span>
          <Link href={`/${tenantSlug}/church/${church.id}`}>View public page</Link>
        </div>
        <AdminRecordForm
          viewer={viewer}
          recordIdName="churchId"
          recordIdValue={church.id}
          values={church}
          title={`Edit ${church.name}`}
          description="Back-office editing updates the live Firestore church record and writes an audit log entry."
          submitLabel="Save church changes"
          action={updateChurchAction}
        />
      </main>
    </>
  );
}
