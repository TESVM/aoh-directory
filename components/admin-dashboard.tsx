import Link from "next/link";
import { reviewSubmissionAction } from "@/app/actions";
import { Church, Submission, ViewerContext } from "@/lib/types";
import { badgeTone } from "@/lib/utils";

export function AdminDashboard({
  viewer,
  churches,
  submissions,
  duplicateMap
}: {
  viewer: ViewerContext;
  churches: Church[];
  submissions: Submission[];
  duplicateMap: Record<string, Church[]>;
}) {
  if (viewer.role === "public") {
    return (
      <div className="rounded-[1.75rem] border border-claret/20 bg-claret/5 p-8">
        <h1 className="font-serif text-3xl text-ink">Access restricted</h1>
        <p className="mt-3 max-w-2xl text-muted">
          Admin routes require an authenticated Firebase session and a matching Firestore user record.
        </p>
      </div>
    );
  }

  const pendingSubmissions = submissions.filter((submission) => submission.status === "pending");

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-4">
        <Metric value={String(churches.length)} label="Scoped churches" />
        <Metric value={String(churches.filter((church) => church.status === "verified").length)} label="Verified" />
        <Metric value={String(pendingSubmissions.length)} label="Pending submissions" />
        <Metric value={viewer.role === "district_leader" ? `District ${viewer.district}` : "All districts"} label="Access scope" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.75fr_1.25fr]">
        <section className="rounded-[1.75rem] border border-line/80 bg-white p-6 shadow-card">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-700">Review Queue</p>
          <div className="mt-5 space-y-4">
            {pendingSubmissions.map((submission) => {
              const duplicates = duplicateMap[submission.id] ?? [];
              return (
                <div key={submission.id} className="rounded-[1.25rem] border border-line/80 bg-surface p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-serif text-2xl text-ink">{submission.data.name}</h2>
                      <p className="text-sm text-muted">
                        {submission.data.city}, {submission.data.state} • District {submission.data.district}
                      </p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${badgeTone("pending")}`}>
                      pending
                    </span>
                  </div>
                  <p className="mt-4 text-sm text-ink">
                    Submitted {submission.createdAt}. Production workflow: approve, edit, or reject and log the action.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <Link
                      href={`/${viewer.tenant.slug}/admin/submission/${submission.id}`}
                      className="rounded-full border border-line px-4 py-2 text-sm font-semibold text-ink"
                    >
                      Edit Submission
                    </Link>
                    <form action={reviewSubmissionAction}>
                      <input type="hidden" name="tenantSlug" value={viewer.tenant.slug} />
                      <input type="hidden" name="submissionId" value={submission.id} />
                      <input type="hidden" name="decision" value="approve" />
                      <button className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white">
                        Approve
                      </button>
                    </form>
                    <Link
                      href={`/${viewer.tenant.slug}`}
                      className="rounded-full border border-line px-4 py-2 text-sm font-semibold text-ink"
                    >
                      Review Public View
                    </Link>
                    <form action={reviewSubmissionAction}>
                      <input type="hidden" name="tenantSlug" value={viewer.tenant.slug} />
                      <input type="hidden" name="submissionId" value={submission.id} />
                      <input type="hidden" name="decision" value="reject" />
                      <button className="rounded-full border border-claret/20 bg-claret/5 px-4 py-2 text-sm font-semibold text-claret">
                        Reject
                      </button>
                    </form>
                  </div>
                  {duplicates.length ? (
                    <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                      Possible duplicate:
                      <ul className="mt-2 list-disc pl-5">
                        {duplicates.map((church) => (
                          <li key={church.id}>
                            {church.name} in {church.city}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-[1.75rem] border border-line/80 bg-white p-6 shadow-card">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-700">Published Churches</p>
          <div className="mt-5 overflow-hidden rounded-[1.25rem] border border-line/80">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead className="bg-surface text-muted">
                <tr>
                  <th className="px-4 py-3 font-semibold">Church</th>
                  <th className="px-4 py-3 font-semibold">District</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {churches.map((church) => (
                  <tr key={church.id} className="border-t border-line/70">
                    <td className="px-4 py-3">
                      <p className="font-medium text-ink">{church.name}</p>
                      <p className="text-muted">{church.city}, {church.state}</p>
                    </td>
                    <td className="px-4 py-3 text-ink">{church.district}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${badgeTone(church.status)}`}>
                        {church.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-3">
                        <Link href={`/${viewer.tenant.slug}/church/${church.id}`} className="font-medium text-brand-700">
                          View
                        </Link>
                        <Link href={`/${viewer.tenant.slug}/admin/church/${church.id}`} className="font-medium text-ink">
                          Edit
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-[1.5rem] border border-line/80 bg-white p-5 shadow-card">
      <p className="text-3xl font-semibold text-ink">{value}</p>
      <p className="mt-1 text-sm text-muted">{label}</p>
    </div>
  );
}
