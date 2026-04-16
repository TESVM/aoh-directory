import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
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
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-line/80 bg-white p-8 shadow-soft">
          <div className="flex flex-wrap items-start justify-between gap-6 border-b border-line/70 pb-6">
            <div>
              <div className="flex flex-wrap gap-2">
                <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${badgeTone(church.status)}`}>
                  {church.status}
                </span>
                <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-stone-800">
                  District {church.district}
                </span>
              </div>
              <h1 className="mt-4 font-serif text-5xl text-ink">{church.name}</h1>
              <p className="mt-3 text-xl text-muted">
                {church.pastorTitle} {church.pastorName}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href={`/${tenant.slug}`} className="rounded-full border border-line px-5 py-3 text-sm font-semibold text-ink">
                Back To Directory
              </Link>
              <Link href={`/${tenant.slug}/district/${church.district}`} className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white">
                District Dashboard
              </Link>
              <a
                href={directionsUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-line px-5 py-3 text-sm font-semibold text-ink transition hover:border-brand-500 hover:text-brand-700"
              >
                Get Directions
              </a>
              {toTelHref(church.phone) ? (
                <a
                  href={toTelHref(church.phone) || undefined}
                  className="rounded-full border border-line px-5 py-3 text-sm font-semibold text-ink transition hover:border-brand-500 hover:text-brand-700"
                >
                  Call Church
                </a>
              ) : null}
              {toWebsiteHref(church.website) ? (
                <a
                  href={toWebsiteHref(church.website) || undefined}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-line px-5 py-3 text-sm font-semibold text-ink transition hover:border-brand-500 hover:text-brand-700"
                >
                  Visit Website
                </a>
              ) : null}
              <ShareChurchButton title={church.name} url={publicProfileUrl} />
            </div>
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_0.9fr]">
            <div className="space-y-5">
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

              <ProfileCard title="Map Preview">
                <p>
                  Coordinates: {church.location.lat}, {church.location.lng}
                </p>
                <p className="text-muted">
                  Production Mapbox clustered view can center on this church and reuse the same record shape.
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
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

function ProfileCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-[1.5rem] border border-line/80 bg-surface p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-700">{title}</p>
      <div className="mt-4 space-y-2 text-base leading-7 text-ink">{children}</div>
    </section>
  );
}
