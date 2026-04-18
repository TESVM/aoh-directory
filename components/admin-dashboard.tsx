"use client";

import { useState } from "react";
import Link from "next/link";
import { createManagedUserAction, reviewChurchClaimAction, reviewSubmissionAction } from "@/app/actions";
import { CommunicationsCenter } from "@/components/communications-center";
import { Church, ChurchClaim, PrayerRequest, Submission, UserRecord, ViewerContext } from "@/lib/types";
import { badgeTone } from "@/lib/utils";

export function AdminDashboard({
  viewer,
  churches,
  submissions,
  duplicateMap,
  users,
  prayerRequests,
  churchClaims
}: {
  viewer: ViewerContext;
  churches: Church[];
  submissions: Submission[];
  duplicateMap: Record<string, Church[]>;
  users: UserRecord[];
  prayerRequests: PrayerRequest[];
  churchClaims: ChurchClaim[];
}) {
  const [churchSearch, setChurchSearch] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");

  if (viewer.role === "public") {
    return (
      <div className="rounded-[2rem] border border-claret/20 bg-claret/5 p-8">
        <h1 className="font-serif text-3xl text-ink">Access restricted</h1>
        <p className="mt-3 max-w-2xl text-muted">
          Admin routes require an authenticated Firebase session and a matching Firestore user record.
        </p>
      </div>
    );
  }

  const pendingSubmissions = submissions.filter((submission) => submission.status === "pending");
  const recentlyUpdated = [...churches].sort((a, b) => b.lastUpdated.localeCompare(a.lastUpdated));
  const pendingClaims = churchClaims.filter((claim) => claim.status === "pending");
  const normalizedChurchSearch = churchSearch.trim().toLowerCase();
  const filteredChurches = recentlyUpdated.filter((church) => {
    const matchesSearch = normalizedChurchSearch
      ? [
          church.name,
          church.city,
          church.state,
          church.pastorName,
          church.pastorTitle,
          church.district
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(normalizedChurchSearch)
      : true;
    const matchesState = selectedState ? church.state === selectedState : true;
    const matchesDistrict = selectedDistrict ? church.district === selectedDistrict : true;

    return matchesSearch && matchesState && matchesDistrict;
  });
  const stateOptions = [...new Set(recentlyUpdated.map((church) => church.state).filter(Boolean))].sort();
  const districtOptions = uniqueDistricts(recentlyUpdated);

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-line/80 bg-white p-6 shadow-card">
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
            href={`/${viewer.tenant.slug}/admin#submissions`}
          />
          <QuickAction
            title="Fix live directory listings"
            detail={`${churches.length} in your scope`}
            description="Open a church card below, update the information, and save."
            href={`/${viewer.tenant.slug}/admin#churches`}
          />
          <QuickAction
            title="Check the public site"
            detail="Public view"
            description="Open the live directory and make sure the information looks right."
            href={`/${viewer.tenant.slug}`}
          />
        </div>
      </section>

      {viewer.role === "admin" ? (
        <section id="claims" className="rounded-[2rem] border border-line/80 bg-white p-6 shadow-card">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-700">Pastor Claim Requests</p>
              <h2 className="mt-3 font-serif text-3xl text-ink">Approve only after verification</h2>
              <p className="mt-3 max-w-3xl text-base leading-7 text-muted">
                A pastor or church leader can request access from the public church page. Admin should verify the person first,
                then approve the request. Approval creates a pastor login for that church only.
              </p>
            </div>
            <span className="rounded-full bg-surface px-3 py-1 text-sm font-semibold text-ink">
              {pendingClaims.length} waiting
            </span>
          </div>
          <div className="mt-5 space-y-4">
            {churchClaims.length ? (
              churchClaims
                .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
                .map((claim) => (
                  <div key={claim.id} className="rounded-[1.4rem] border border-line/80 bg-surface p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-semibold text-ink">{claim.churchName}</h3>
                        <p className="text-sm text-muted">
                          {claim.claimantName} • {claim.roleAtChurch} • {claim.createdAt}
                        </p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${badgeTone(claim.status === "approved" ? "verified" : claim.status === "rejected" ? "submitted" : "pending")}`}>
                        {claim.status}
                      </span>
                    </div>
                    <div className="mt-3 space-y-1 text-sm text-ink">
                      <p>Email: {claim.claimantEmail}</p>
                      <p>Phone: {claim.claimantPhone || "Not given"}</p>
                      <p>Verification notes: {claim.verificationNotes || "No notes given."}</p>
                    </div>
                    {claim.status === "pending" ? (
                      <div className="mt-4 flex flex-wrap gap-3">
                        <form action={reviewChurchClaimAction}>
                          <input type="hidden" name="tenantSlug" value={viewer.tenant.slug} />
                          <input type="hidden" name="claimId" value={claim.id} />
                          <input type="hidden" name="decision" value="approve" />
                          <button className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white">
                            Approve Claim
                          </button>
                        </form>
                        <form action={reviewChurchClaimAction}>
                          <input type="hidden" name="tenantSlug" value={viewer.tenant.slug} />
                          <input type="hidden" name="claimId" value={claim.id} />
                          <input type="hidden" name="decision" value="reject" />
                          <button className="rounded-full border border-claret/20 bg-claret/5 px-4 py-2 text-sm font-semibold text-claret">
                            Reject Claim
                          </button>
                        </form>
                        <Link
                          href={`/${viewer.tenant.slug}/admin/church/${claim.churchId}`}
                          prefetch={false}
                          className="rounded-full border border-line px-4 py-2 text-sm font-semibold text-ink"
                        >
                          Open Church
                        </Link>
                      </div>
                    ) : null}
                    {claim.status === "approved" ? (
                      <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
                        Pastor login created. Temporary password: <span className="font-semibold">{claim.temporaryPassword || "Saved in Firebase review log"}</span>
                      </div>
                    ) : null}
                  </div>
                ))
            ) : (
              <div className="rounded-[1.4rem] border border-line/80 bg-surface p-5 text-sm text-muted">
                No church claim requests have been submitted yet.
              </div>
            )}
          </div>
        </section>
      ) : null}

      {viewer.role === "admin" ? (
        <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[2rem] border border-line/80 bg-white p-6 shadow-card">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-700">People Who Can Edit</p>
            <h2 className="mt-3 font-serif text-3xl text-ink">Add a person</h2>
            <p className="mt-3 max-w-2xl text-base leading-7 text-muted">
              Create an Overseer, Bishop, or Pastor account. Use Overseer or Bishop for district-level editing.
              Use Pastor when one person should only edit one church.
            </p>

            <form action={createManagedUserAction} className="mt-6 grid gap-4 md:grid-cols-2">
              <input type="hidden" name="tenantSlug" value={viewer.tenant.slug} />
              <PortalField label="Full name" name="name" required />
              <PortalField label="Email" name="email" type="email" required />
              <PortalField label="Temporary password" name="password" required />
              <div className="space-y-2">
                <label htmlFor="role" className="text-sm font-medium text-ink">
                  Access type
                </label>
                <select
                  id="role"
                  name="role"
                  defaultValue="overseer"
                  className="w-full rounded-2xl border border-line bg-surface px-4 py-3 text-ink outline-none focus:border-brand-700"
                >
                  <option value="overseer">Overseer</option>
                  <option value="bishop">Bishop</option>
                  <option value="pastor">Pastor</option>
                </select>
              </div>
              <PortalField label="District number" name="district" placeholder="Use for Overseer or Bishop" />
              <div className="space-y-2 md:col-span-2">
                <label htmlFor="churchId" className="text-sm font-medium text-ink">
                  Church for Pastor accounts
                </label>
                <select
                  id="churchId"
                  name="churchId"
                  defaultValue=""
                  className="w-full rounded-2xl border border-line bg-surface px-4 py-3 text-ink outline-none focus:border-brand-700"
                >
                  <option value="">Select a church for Pastor</option>
                  {filteredChurches.map((church) => (
                    <option key={church.id} value={church.id}>
                      {church.name} - {church.city}, {church.state}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2 flex items-center justify-between gap-4 border-t border-line/80 pt-4">
                <p className="text-sm text-muted">
                  Temporary passwords can be changed by the person after their first sign-in.
                </p>
                <button className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white">
                  Create Login
                </button>
              </div>
            </form>
          </div>

          <div className="rounded-[2rem] border border-line/80 bg-white p-6 shadow-card">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-700">Current Editors</p>
            <h2 className="mt-3 font-serif text-3xl text-ink">Who already has access</h2>
            <div className="mt-5 space-y-4">
              {users.map((account) => (
                <div key={account.uid} className="rounded-[1.4rem] border border-line/80 bg-surface p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-ink">{account.name}</h3>
                      <p className="text-sm text-muted">{account.email}</p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">
                      {roleLabel(account.role)}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-muted">
                    {account.role === "pastor"
                      ? `Assigned church: ${churches.find((church) => church.id === account.churchId)?.name || "Church not found"}`
                      : `District: ${account.district || "Not assigned"}`}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {viewer.role === "admin" ? (
        <CommunicationsCenter
          tenantSlug={viewer.tenant.slug}
          districts={uniqueDistricts(churches)}
        />
      ) : null}

      {viewer.role === "admin" ? (
        <section id="submissions" className="rounded-[2rem] border border-line/80 bg-white p-6 shadow-card">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-700">Prayer Requests</p>
              <h2 className="mt-3 font-serif text-3xl text-ink">Recent requests</h2>
            </div>
            <span className="rounded-full bg-surface px-3 py-1 text-sm font-semibold text-ink">
              {prayerRequests.length} total
            </span>
          </div>
          <div className="mt-5 space-y-4">
            {prayerRequests.length ? (
              prayerRequests
                .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
                .slice(0, 8)
                .map((prayer) => (
                  <div key={prayer.id} className="rounded-[1.4rem] border border-line/80 bg-surface p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-semibold text-ink">{prayer.requesterName}</h3>
                        <p className="text-sm text-muted">
                          {prayer.churchName || "General request"} • {prayer.createdAt}
                        </p>
                      </div>
                      <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-brand-900">
                        {prayer.status}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-7 text-ink">{prayer.request}</p>
                    <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted">
                      {prayer.requesterEmail ? <span>{prayer.requesterEmail}</span> : null}
                      {prayer.requesterPhone ? <span>{prayer.requesterPhone}</span> : null}
                    </div>
                  </div>
                ))
            ) : (
              <div className="rounded-[1.4rem] border border-line/80 bg-surface p-5 text-sm text-muted">
                No prayer requests have been submitted yet.
              </div>
            )}
          </div>
        </section>
      ) : null}

      <div className="grid gap-4 md:grid-cols-4">
        <Metric value={String(churches.length)} label="Scoped churches" />
        <Metric value={String(churches.filter((church) => church.status === "verified").length)} label="Verified" />
        <Metric value={String(pendingSubmissions.length)} label="Pending submissions" />
        <Metric value={accessScopeLabel(viewer)} label="Access scope" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <section id="churches" className="rounded-[2rem] border border-line/80 bg-white p-6 shadow-card">
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
              <div className="rounded-[1.4rem] border border-line/80 bg-surface p-5 text-sm text-muted">
                There are no new church submissions waiting right now.
              </div>
            ) : null}
            {pendingSubmissions.map((submission) => {
              const duplicates = duplicateMap[submission.id] ?? [];
              return (
                <div key={submission.id} className="rounded-[1.4rem] border border-line/80 bg-surface p-4">
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

        <section className="rounded-[2rem] border border-line/80 bg-white p-6 shadow-card">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-700">Live Directory Listings</p>
              <h3 className="mt-2 font-serif text-2xl text-ink">Open a church and fix it</h3>
            </div>
            <span className="rounded-full bg-surface px-3 py-1 text-sm font-semibold text-ink">
              {filteredChurches.length} churches
            </span>
          </div>
          <div className="mt-5 rounded-[1.4rem] border border-line/80 bg-surface p-4">
            <label htmlFor="church-search" className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-700">
              Find a church fast
            </label>
            <input
              id="church-search"
              type="text"
              value={churchSearch}
              onChange={(event) => setChurchSearch(event.target.value)}
              placeholder="Search by church name, city, pastor, state, or district"
              className="mt-3 w-full rounded-2xl border border-line bg-white px-4 py-3 text-ink outline-none transition focus:border-brand-700"
            />
            <p className="mt-2 text-sm text-muted">
              Start typing to narrow the church list and the Pastor church dropdown.
            </p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="church-state-filter" className="text-sm font-medium text-ink">
                  Filter by state
                </label>
                <select
                  id="church-state-filter"
                  value={selectedState}
                  onChange={(event) => setSelectedState(event.target.value)}
                  className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-ink outline-none transition focus:border-brand-700"
                >
                  <option value="">All states</option>
                  {stateOptions.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label htmlFor="church-district-filter" className="text-sm font-medium text-ink">
                  Filter by district
                </label>
                <select
                  id="church-district-filter"
                  value={selectedDistrict}
                  onChange={(event) => setSelectedDistrict(event.target.value)}
                  className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-ink outline-none transition focus:border-brand-700"
                >
                  <option value="">All districts</option>
                  {districtOptions.map((district) => (
                    <option key={district} value={district}>
                      District {district}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div className="mt-5 space-y-4">
            {filteredChurches.length === 0 ? (
              <div className="rounded-[1.4rem] border border-line/80 bg-surface p-5 text-sm text-muted">
                No churches match that search yet. Try a church name, city, pastor, or district number.
              </div>
            ) : null}
            {filteredChurches.map((church) => (
              <div key={church.id} className="rounded-[1.4rem] border border-line/80 bg-surface p-4">
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
          </div>
        </section>
      </div>
    </div>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-[1.7rem] border border-line/80 bg-white p-5 shadow-card">
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
    <div className="rounded-[1.4rem] border border-line/80 bg-surface p-5">
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

function PortalField({
  label,
  name,
  type = "text",
  placeholder,
  required = false
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={name} className="text-sm font-medium text-ink">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-2xl border border-line bg-surface px-4 py-3 text-ink outline-none focus:border-brand-700"
      />
    </div>
  );
}

function roleLabel(role: UserRecord["role"]) {
  if (role === "overseer") return "Overseer";
  if (role === "bishop") return "Bishop";
  if (role === "pastor") return "Pastor";
  return "Admin";
}

function accessScopeLabel(viewer: ViewerContext) {
  if (viewer.role === "overseer" || viewer.role === "bishop") {
    return `District ${viewer.district}`;
  }
  if (viewer.role === "pastor") {
    return "One church";
  }
  return "All districts";
}

function uniqueDistricts(churches: Church[]) {
  return [...new Set(churches.map((church) => church.district).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true })
  );
}
