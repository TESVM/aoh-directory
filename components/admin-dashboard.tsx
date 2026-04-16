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
  const recentlyUpdated = [...churches]
    .sort((a, b) => b.lastUpdated.localeCompare(a.lastUpdated))
    .slice(0, 8);

  return (
    <div className="space-y-8">
      <section className="rounded-[1.75rem] border border-line/80 bg-white p-6 shadow-card">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-700">Simple Back Office</p>
        <h2 className="mt-3 font-serif text-3xl text-ink">Choose what you want to do</h2>
        <p className="mt-3 max-w-3xl text-base leading-7 text-muted">
          This office is built for simple daily work. Review new churches, fix live listings, or open the public
          directory to check how a page looks.
        </p>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <QuickAction
            title="Review new churches"
            detail={`${pendingSubmissions.length} waiting`}
            description="Open a submitted church, correct any mistakes, then approve it."
          />
          <QuickAction
            title="Fix live directory listings"
            detail={`${churches.length} in your scope`}
            description="Open a church card below, update the information, and save."
          />
          <QuickAction
            title="Check the public site"
            detail="Public view"
            description="Open the live directory and make sure the information looks right."
            href={`/${viewer.tenant.slug}`}
          />
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-4">
        <Metric value={String(churches.length)} label="Scoped churches" />
        <Metric value={String(churches.filter((church) => church.status === "verified").length)} label="Verified" />
        <Metric value={String(pendingSubmissions.length)} label="Pending submissions" />
        <Metric value={viewer.role === "district_leader" ? `District ${viewer.district}` : "All districts"} label="Access scope" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-[1.75rem] border border-line/80 bg-white p-6 shadow-card">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-700">New Churches Waiting</p>
              <h3 className="mt-2 font-serif text-2xl text-ink">Review one at a time</h3>
            </div>
            <span className="rounded-full bg-surface px-3 py-1 text-sm font-semibold text-ink">
              {pendingSubmissions.length} pending
            </span>
          </div>
          <div className="mt-5 space-y-4">
            {pendingSubmissions.length === 0 ? (
              <div className="rounded-[1.25rem] border border-line/80 bg-surface p-5 text-sm text-muted">
                There are no new church submissions waiting right now.
              </div>
            ) : null}
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
                    Submitted {submission.createdAt}. Open it first if you want to fix the name, address, pastor, or district before approving.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <Link
                      href={`/${viewer.tenant.slug}/admin/submission/${submission.id}`}
                      prefetch={false}
                      className="rounded-full border border-line px-4 py-2 text-sm font-semibold text-ink"
                    >
                      Open Submission
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
                      prefetch={false}
                      className="rounded-full border border-line px-4 py-2 text-sm font-semibold text-ink"
                    >
                      View Public Site
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
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-700">Live Directory Listings</p>
              <h3 className="mt-2 font-serif text-2xl text-ink">Open a church and fix it</h3>
            </div>
            <span className="rounded-full bg-surface px-3 py-1 text-sm font-semibold text-ink">
              {recentlyUpdated.length} shown
            </span>
          </div>
          <div className="mt-5 space-y-4">
            {recentlyUpdated.map((church) => (
              <div key={church.id} className="rounded-[1.25rem] border border-line/80 bg-surface p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h4 className="font-serif text-2xl text-ink">{church.name}</h4>
                    <p className="text-sm text-muted">
                      {church.city}, {church.state} • District {church.district}
                    </p>
                    <p className="mt-2 text-sm text-ink">
                      {church.pastorTitle} {church.pastorName}
                    </p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${badgeTone(church.status)}`}>
                    {church.status}
                  </span>
                </div>
                <p className="mt-4 text-sm text-muted">Last updated {church.lastUpdated || "Not listed"}.</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link
                    href={`/${viewer.tenant.slug}/admin/church/${church.id}`}
                    prefetch={false}
                    className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white"
                  >
                    Edit Church
                  </Link>
                  <Link
                    href={`/${viewer.tenant.slug}/church/${church.id}`}
                    prefetch={false}
                    className="rounded-full border border-line px-4 py-2 text-sm font-semibold text-ink"
                  >
                    View Public Page
                  </Link>
                </div>
              </div>
            ))}
            {churches.length > recentlyUpdated.length ? (
              <p className="text-sm text-muted">
                Showing the most recently updated churches first. Open more records by editing from this list after future updates.
              </p>
            ) : null}
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

function QuickAction({
  title,
  detail,
  description,
  href
}: {
  title: string;
  detail: string;
  description: string;
  href?: `/${string}`;
}) {
  const content = (
    <div className="rounded-[1.25rem] border border-line/80 bg-surface p-5">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-700">{detail}</p>
      <h3 className="mt-2 text-lg font-semibold text-ink">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted">{description}</p>
    </div>
  );

  if (!href) return content;
  return (
    <Link href={href} prefetch={false}>
      {content}
    </Link>
  );
}
