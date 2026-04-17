import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { ClaimChurchPanel } from "@/components/claim-church-panel";
import { PrayerRequestPanel } from "@/components/prayer-request-panel";
import { ShareChurchButton } from "@/components/share-church-button";
import { SiteHeader } from "@/components/site-header";
import { getChurchByTenantAndId, getTenantBySlug } from "@/lib/data";
import { badgeTone, formatPhone, formatWebsite, toTelHref, toWebsiteHref } from "@/lib/utils";

function buildGoogleMapsDirectionsUrl(address: string, city: string, state: string, zip: string) {
  const destination = [address, `${city}, ${state} ${zip}`].filter(Boolean).join(", ");
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}&travelmode=driving`;
}

export default async function ChurchProfilePage({
  params
}: {
  params: Promise<{ tenant: string; id: string }>;
}) {
  const { tenant: tenantSlug, id } = await params;
  const tenant = await getTenantBySlug(tenantSlug);
  const church = await getChurchByTenantAndId(tenantSlug, id);

  if (!tenant || !church) {
    notFound();
  }

  const directionsUrl = buildGoogleMapsDirectionsUrl(church.address, church.city, church.state, church.zip);
  const publicProfileUrl = `/${tenant.slug}/church/${church.id}`;

  return (
    <>
      <SiteHeader tenant={tenant} />
      <main id="main-content" className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[2.4rem] bg-hero shadow-soft">
          <div className="border-b border-white/10 px-8 py-10 text-white">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div className="max-w-3xl">
                <div className="flex flex-wrap gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${badgeTone(church.status)}`}>
                    {church.status}
                  </span>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-brand-100">
                    District {church.district}
                  </span>
                </div>
                <div className="mt-5 flex flex-wrap items-center gap-4">
                  {church.logoImageUrl ? (
                    <img
                      src={church.logoImageUrl}
                      alt={`${church.name} logo`}
                      className="h-20 w-20 rounded-[1.2rem] border border-white/15 bg-white p-2 object-cover"
                    />
                  ) : null}
                  <div>
                    <h1 className="font-serif text-5xl leading-tight sm:text-6xl">{church.name}</h1>
                    <p className="mt-4 text-xl text-brand-100">
                      {church.pastorTitle} {church.pastorName}
                    </p>
                  </div>
                </div>
                <p className="mt-5 max-w-2xl text-base leading-7 text-brand-100">
                  Find service times, get directions, join online worship, and connect with the ministry life of this church.
                </p>
              </div>
              <div className="rounded-[1.6rem] border border-white/10 bg-white/8 p-5 backdrop-blur">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-100">Quick Actions</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link href={`/${tenant.slug}`} className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:border-brand-100">
                    Back To Directory
                  </Link>
                  <Link href={`/${tenant.slug}/district/${church.district}`} className="rounded-full bg-brand-500 px-5 py-3 text-sm font-semibold text-pine">
                    District Dashboard
                  </Link>
                  <a
                    href={directionsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:border-brand-100"
                  >
                    Get Directions
                  </a>
                  {toTelHref(church.phone) ? (
                    <a
                      href={toTelHref(church.phone) || undefined}
                      className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:border-brand-100"
                    >
                      Call Church
                    </a>
                  ) : null}
                  {toWebsiteHref(church.website) ? (
                    <a
                      href={toWebsiteHref(church.website) || undefined}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:border-brand-100"
                    >
                      Visit Website
                    </a>
                  ) : null}
                  <div className="text-ink">
                    <ShareChurchButton title={church.name} url={publicProfileUrl} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-5 bg-white p-8 lg:grid-cols-[1fr_0.9fr]">
            <div className="space-y-5">
              <ProfileCard title="Church Family">
                <div className="grid gap-4 sm:grid-cols-2">
                  <VisualCard
                    title="Church Photo"
                    imageUrl={church.churchImageUrl}
                    fallback="Church photo coming soon."
                  />
                  <VisualCard
                    title="Pastor Photo"
                    imageUrl={church.pastorImageUrl}
                    fallback="Pastor photo coming soon."
                  />
                </div>
              </ProfileCard>

              <ProfileCard title="Church Information">
                <a
                  href={directionsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-2xl border border-line bg-white px-4 py-3 transition hover:border-brand-500 hover:text-brand-700"
                >
                  <p>{church.address}</p>
                  <p>
                    {church.city}, {church.state} {church.zip}
                  </p>
                  <p className="mt-2 text-sm font-medium text-brand-700">Open in Google Maps for directions</p>
                </a>
                <p>{formatPhone(church.phone)}</p>
                <p>{church.email || "Email not listed"}</p>
                <p>{formatWebsite(church.website)}</p>
              </ProfileCard>

              <ProfileCard title="Service Hours">
                {church.serviceHours?.length ? (
                  <ul className="space-y-2">
                    {church.serviceHours.map((time) => (
                      <li key={time}>{time}</li>
                    ))}
                  </ul>
                ) : (
                  <p>Call the church for current service times.</p>
                )}
              </ProfileCard>

              <ProfileCard title="Online Worship">
                {church.onlineWorshipUrl ? (
                  <a
                    href={toWebsiteHref(church.onlineWorshipUrl) || undefined}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex rounded-full border border-line px-4 py-2 text-sm font-semibold text-ink transition hover:border-brand-500 hover:text-brand-700"
                  >
                    Join Online Worship
                  </a>
                ) : (
                  <p>Online worship is not listed for this church.</p>
                )}
              </ProfileCard>

              <ProfileCard title="Map & Directions">
                <p>Use the button below to open this church in Google Maps.</p>
                <p className="text-muted">
                  Google Maps will show the church location and help you get there.
                </p>
                <a
                  href={directionsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex rounded-full border border-line px-4 py-2 text-sm font-semibold text-ink transition hover:border-brand-500 hover:text-brand-700"
                >
                  Open Directions
                </a>
              </ProfileCard>
            </div>

            <div className="space-y-5">
              <ProfileCard title="Trust Layer">
                <p>Source: {church.source}</p>
                <p>Last updated: {church.lastUpdated}</p>
                <p>Status: {church.status}</p>
              </ProfileCard>
              <ProfileCard title="Ministries">
                {church.ministries.length ? (
                  <div className="flex flex-wrap gap-2">
                    {church.ministries.map((ministry) => (
                      <span key={ministry} className="rounded-full bg-brand-50 px-3 py-1 text-sm font-medium text-brand-900">
                        {ministry}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p>Ministry groups are not listed yet.</p>
                )}
              </ProfileCard>
              <ProfileCard title="Prayer Request">
                <PrayerRequestPanel tenantSlug={tenant.slug} churchId={church.id} churchName={church.name} />
              </ProfileCard>
              <ProfileCard title="Claim This Church">
                <ClaimChurchPanel tenantSlug={tenant.slug} churchId={church.id} churchName={church.name} />
              </ProfileCard>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

function ProfileCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-[1.7rem] border border-line/80 bg-surface p-6 shadow-card">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-700">{title}</p>
      <div className="mt-4 space-y-2 text-base leading-7 text-ink">{children}</div>
    </section>
  );
}

function VisualCard({
  title,
  imageUrl,
  fallback
}: {
  title: string;
  imageUrl?: string;
  fallback: string;
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-ink">{title}</p>
      {imageUrl ? (
        <img src={imageUrl} alt={title} className="aspect-[4/3] w-full rounded-[1.2rem] border border-line/70 object-cover" />
      ) : (
        <div className="grid aspect-[4/3] w-full place-items-center rounded-[1.2rem] border border-dashed border-line bg-white px-3 text-center text-sm text-muted">
          {fallback}
        </div>
      )}
    </div>
  );
}
