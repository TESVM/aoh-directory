import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { reviewSubmissionAction, updateSubmissionAction } from "@/app/actions";
import { AdminRecordForm } from "@/components/admin-record-form";
import { SetupBanner } from "@/components/setup-banner";
import { SiteHeader } from "@/components/site-header";
import { requireTenantRole } from "@/lib/auth";
import { findPotentialDuplicates, getSubmissionByTenantAndId, getViewerContext } from "@/lib/data";
import { badgeTone } from "@/lib/utils";

export default async function AdminSubmissionPage({
  params
}: {
  params: Promise<{ tenant: string; id: string }>;
}) {
  const { tenant: tenantSlug, id } = await params;
  const { user } = await requireTenantRole(tenantSlug, ["admin", "overseer", "bishop"]);
  const viewer = await getViewerContext(tenantSlug);

  if (!viewer || viewer.role === "public") {
    return null;
  }

  const submission = await getSubmissionByTenantAndId(tenantSlug, id);
  if (!submission) {
    notFound();
  }

  if ((user.role === "overseer" || user.role === "bishop") && user.district !== submission.data.district) {
    redirect(`/${tenantSlug}/admin`);
  }

  const duplicates = await findPotentialDuplicates(tenantSlug, submission.id);

  return (
    <>
      <SiteHeader tenant={viewer.tenant} />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <SetupBanner />
        <div className="mb-6 flex flex-wrap items-center gap-3 text-sm font-medium text-brand-700">
          <Link href={`/${tenantSlug}/admin`}>Back to admin</Link>
          <span className="text-muted">/</span>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${badgeTone(submission.status)}`}>
            {submission.status}
          </span>
        </div>

        <div className="mb-6 rounded-[1.5rem] border border-line/80 bg-white p-5 shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-700">Submission Workflow</p>
              <p className="mt-2 text-muted">
                Edit the queued record first, then approve or reject from the same back-office screen.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <form action={reviewSubmissionAction}>
                <input type="hidden" name="tenantSlug" value={viewer.tenant.slug} />
                <input type="hidden" name="submissionId" value={submission.id} />
                <input type="hidden" name="decision" value="approve" />
                <button className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white">
                  Approve
                </button>
              </form>
              <form action={reviewSubmissionAction}>
                <input type="hidden" name="tenantSlug" value={viewer.tenant.slug} />
                <input type="hidden" name="submissionId" value={submission.id} />
                <input type="hidden" name="decision" value="reject" />
                <button className="rounded-full border border-claret/20 bg-claret/5 px-4 py-2 text-sm font-semibold text-claret">
                  Reject
                </button>
              </form>
            </div>
          </div>
          {duplicates.length ? (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <p className="font-semibold">Possible duplicates</p>
              <ul className="mt-2 list-disc pl-5">
                {duplicates.map((church) => (
                  <li key={church.id}>
                    <Link href={`/${tenantSlug}/admin/church/${church.id}`} className="font-medium underline">
                      {church.name}
                    </Link>{" "}
                    in {church.city}, {church.state}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <AdminRecordForm
          viewer={viewer}
          recordIdName="submissionId"
          recordIdValue={submission.id}
          values={submission.data}
          title={`Edit submission: ${submission.data.name}`}
          description="Saving here updates the queued submission only. Approval still requires a separate review action."
          submitLabel="Save submission changes"
          action={updateSubmissionAction}
        />
      </main>
    </>
  );
}
