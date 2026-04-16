"use client";

import Link from "next/link";
import type { FormEvent, ReactNode } from "react";
import { useMemo, useState, useTransition } from "react";
import { submitChurchSubmissionAction } from "@/app/actions";
import { PrayerRequestPanel } from "@/components/prayer-request-panel";
import { ShareChurchButton } from "@/components/share-church-button";
import { Church, Submission, Tenant } from "@/lib/types";
import { badgeTone, formatPhone, formatWebsite, toTelHref, toWebsiteHref } from "@/lib/utils";

type DirectoryShellProps = {
  tenant: Tenant;
  churches: Church[];
  submissions: Submission[];
};

type FormState = {
  name: string;
  pastorName: string;
  pastorTitle: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  district: string;
  phone: string;
  email: string;
  website: string;
};

const emptyForm: FormState = {
  name: "",
  pastorName: "",
  pastorTitle: "",
  address: "",
  city: "",
  state: "",
  zip: "",
  district: "",
  phone: "",
  email: "",
  website: ""
};

function buildGoogleMapsDirectionsUrl(church: Pick<Church, "address" | "city" | "state" | "zip" | "name">) {
  const destination = [church.address, `${church.city}, ${church.state} ${church.zip}`].filter(Boolean).join(", ");
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}&destination_place_id=&travelmode=driving`;
}

function buildChurchProfileUrl(tenantSlug: string, churchId: string) {
  return `/${tenantSlug}/church/${churchId}`;
}

export function DirectoryShell({ tenant, churches, submissions }: DirectoryShellProps) {
  const [tab, setTab] = useState<"directory" | "register">("directory");
  const [query, setQuery] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [districtFilter, setDistrictFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedId, setSelectedId] = useState(churches[0]?.id ?? null);
  const [formState, setFormState] = useState<FormState>(emptyForm);
  const [formMessage, setFormMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const allChurches = useMemo(() => churches, [churches]);

  const states = useMemo(
    () => [...new Set(allChurches.map((church) => church.state))].sort(),
    [allChurches]
  );
  const districts = useMemo(
    () => [...new Set(allChurches.map((church) => church.district))].sort((a, b) => a.localeCompare(b, undefined, { numeric: true })),
    [allChurches]
  );

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return allChurches.filter((church) => {
      const matchesQuery =
        !normalized ||
        [church.name, church.pastorName, church.pastorTitle, church.city, church.district]
          .join(" ")
          .toLowerCase()
          .includes(normalized);
      const matchesState = !stateFilter || church.state === stateFilter;
      const matchesDistrict = !districtFilter || church.district === districtFilter;
      const matchesStatus = !statusFilter || church.status === statusFilter;
      return matchesQuery && matchesState && matchesDistrict && matchesStatus;
    });
  }, [allChurches, districtFilter, query, stateFilter, statusFilter]);

  const selectedChurch = filtered.find((church) => church.id === selectedId) ?? filtered[0] ?? null;

  function handleInputChange<K extends keyof FormState>(field: K, value: FormState[K]) {
    setFormState((current) => ({ ...current, [field]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormMessage("");
    startTransition(async () => {
      const result = await submitChurchSubmissionAction(tenant.slug, formState);
      setFormMessage(result.message);
      if (result.ok) {
        setFormState(emptyForm);
      }
    });
  }

  return (
    <section className="space-y-8">
      <div className="overflow-hidden rounded-[2.4rem] bg-hero shadow-soft">
        <div className="grid gap-8 px-6 py-10 text-white lg:grid-cols-[1.2fr_0.8fr] lg:px-10 lg:py-14">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.32em] text-brand-100">Apostolic Overcoming Holy Church of God, Inc.</p>
            <h1 className="mt-4 font-serif text-4xl leading-tight sm:text-6xl">
              Find a church home, service time, and worship connection.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-brand-100">
              Search AOH churches by name, city, pastor, or district. Open a church, get directions, submit prayer, and connect fast.
            </p>
          </div>
          <div className="rounded-[1.8rem] border border-white/10 bg-white/8 p-6 backdrop-blur">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-100">Directory Snapshot</p>
            <div className="mt-4 grid grid-cols-3 gap-3">
              <StatCard value={String(allChurches.length)} label="Churches" dark />
              <StatCard value={String(allChurches.filter((church) => church.status === "verified").length)} label="Verified" dark />
              <StatCard value={String(submissions.length)} label="Pending" dark />
            </div>
            <p className="mt-4 text-sm leading-6 text-brand-100">
              Built to help visitors, members, pastors, and leaders find accurate church information quickly.
            </p>
          </div>
        </div>
      </div>

      <div className="inline-flex rounded-full border border-line bg-white p-1 shadow-card">
        <TabButton active={tab === "directory"} onClick={() => setTab("directory")}>
          Directory
        </TabButton>
        <TabButton active={tab === "register"} onClick={() => setTab("register")}>
          Register Your Church
        </TabButton>
      </div>

      {tab === "directory" ? (
        <div className="space-y-5">
          <div className="rounded-[1.9rem] border border-line/80 bg-white p-5 shadow-card">
            <div className="flex flex-col gap-5">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-700">Search Directory</p>
                <h2 className="mt-2 font-serif text-3xl text-ink">Search for a church near you</h2>
              </div>
              <div className="grid gap-3 md:grid-cols-[1.4fr_0.8fr_0.8fr_0.8fr]">
                <Field label="Church, pastor, city, or district">
              <input
                className="w-full rounded-2xl border border-line bg-surface px-4 py-4 text-base outline-none focus:border-brand-500"
                placeholder="Start typing here..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </Field>
            <Field label="State">
              <select
                className="w-full rounded-2xl border border-line bg-surface px-4 py-3 outline-none focus:border-brand-500"
                value={stateFilter}
                onChange={(event) => setStateFilter(event.target.value)}
              >
                <option value="">All states</option>
                {states.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="District">
              <select
                className="w-full rounded-2xl border border-line bg-surface px-4 py-3 outline-none focus:border-brand-500"
                value={districtFilter}
                onChange={(event) => setDistrictFilter(event.target.value)}
              >
                <option value="">All districts</option>
                {districts.map((district) => (
                  <option key={district} value={district}>
                    {district}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Status">
              <select
                className="w-full rounded-2xl border border-line bg-surface px-4 py-3 outline-none focus:border-brand-500"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="">All statuses</option>
                <option value="verified">Verified</option>
                <option value="pending">Pending</option>
                <option value="submitted">Submitted</option>
              </select>
            </Field>
              </div>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
            <div className="rounded-[1.75rem] border border-line/80 bg-white p-4 shadow-card">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-700">Results</p>
                  <p className="text-sm text-muted">{filtered.length} churches shown</p>
                </div>
                <button
                  className="text-sm font-medium text-brand-700"
                  onClick={() => {
                    setQuery("");
                    setStateFilter("");
                    setDistrictFilter("");
                    setStatusFilter("");
                  }}
                >
                  Reset
                </button>
              </div>
              <div className="space-y-3">
                {filtered.map((church) => (
                  <button
                    key={church.id}
                    className={`w-full rounded-[1.4rem] border p-4 text-left transition ${
                      selectedChurch?.id === church.id
                        ? "border-brand-500 bg-brand-50 shadow-card"
                        : "border-line/80 bg-surface hover:border-brand-300 hover:bg-white"
                    }`}
                    onClick={() => setSelectedId(church.id)}
                  >
                    <h2 className="font-serif text-xl text-ink">{church.name}</h2>
                    <p className="mt-1 text-sm text-muted">
                      {church.city}, {church.state}
                    </p>
                    <p className="mt-1 text-sm text-ink">
                      {church.pastorTitle} {church.pastorName}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge tone="bg-stone-100 text-stone-800">District {church.district}</Badge>
                      <Badge tone={badgeTone(church.status)}>{church.status}</Badge>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-line/80 bg-white p-6 shadow-card">
              {selectedChurch ? (
                <div className="space-y-6">
                  <div className="flex flex-col justify-between gap-4 border-b border-line/70 pb-5 md:flex-row">
                    <div>
                      <div className="flex flex-wrap gap-2">
                        <Badge tone={badgeTone(selectedChurch.status)}>{selectedChurch.status}</Badge>
                        <Badge tone="bg-stone-100 text-stone-800">District {selectedChurch.district}</Badge>
                      </div>
                      <h2 className="mt-3 font-serif text-3xl text-ink">{selectedChurch.name}</h2>
                      <p className="mt-2 text-lg text-muted">
                        {selectedChurch.pastorTitle} {selectedChurch.pastorName}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <Link
                        href={`/${tenant.slug}/church/${selectedChurch.id}`}
                        prefetch={false}
                        className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white"
                      >
                        Open Profile
                      </Link>
                      <Link
                        href={`/${tenant.slug}/district/${selectedChurch.district}`}
                        prefetch={false}
                        className="rounded-full border border-line px-5 py-3 text-sm font-semibold text-ink"
                      >
                        District View
                      </Link>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <a
                      href={buildGoogleMapsDirectionsUrl(selectedChurch)}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full border border-line px-4 py-2 text-sm font-semibold text-ink transition hover:border-brand-500 hover:text-brand-700"
                    >
                      Get Directions
                    </a>
                    {toTelHref(selectedChurch.phone) ? (
                      <a
                        href={toTelHref(selectedChurch.phone) || undefined}
                        className="rounded-full border border-line px-4 py-2 text-sm font-semibold text-ink transition hover:border-brand-500 hover:text-brand-700"
                      >
                        Call Church
                      </a>
                    ) : null}
                    {toWebsiteHref(selectedChurch.website) ? (
                      <a
                        href={toWebsiteHref(selectedChurch.website) || undefined}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full border border-line px-4 py-2 text-sm font-semibold text-ink transition hover:border-brand-500 hover:text-brand-700"
                      >
                        Visit Website
                      </a>
                    ) : null}
                    <ShareChurchButton
                      title={selectedChurch.name}
                      url={buildChurchProfileUrl(tenant.slug, selectedChurch.id)}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <InfoCard label="Address">
                      <a
                        href={buildGoogleMapsDirectionsUrl(selectedChurch)}
                        target="_blank"
                        rel="noreferrer"
                        className="block rounded-2xl border border-line bg-white px-4 py-3 transition hover:border-brand-500 hover:text-brand-700"
                      >
                        <p>{selectedChurch.address}</p>
                        <p>
                          {selectedChurch.city}, {selectedChurch.state} {selectedChurch.zip}
                        </p>
                        <p className="mt-2 text-sm font-medium text-brand-700">Open in Google Maps for directions</p>
                      </a>
                    </InfoCard>
                    <InfoCard label="Contact">
                      <p>{formatPhone(selectedChurch.phone)}</p>
                      <p>{selectedChurch.email || "Email not listed"}</p>
                      <p>{formatWebsite(selectedChurch.website)}</p>
                    </InfoCard>
                    <InfoCard label="Service Hours">
                      {selectedChurch.serviceHours?.length ? (
                        <ul className="space-y-1">
                          {selectedChurch.serviceHours.map((time) => (
                            <li key={time}>{time}</li>
                          ))}
                        </ul>
                      ) : (
                        <p>Call the church for current service times.</p>
                      )}
                    </InfoCard>
                    <InfoCard label="Online Worship">
                      {selectedChurch.onlineWorshipUrl ? (
                        <a
                          href={toWebsiteHref(selectedChurch.onlineWorshipUrl) || undefined}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex rounded-full border border-line px-4 py-2 text-sm font-semibold text-ink transition hover:border-brand-500 hover:text-brand-700"
                        >
                          Join Online Worship
                        </a>
                      ) : (
                        <p>Online worship is not listed for this church.</p>
                      )}
                    </InfoCard>
                    <InfoCard label="Trust Layer">
                      <p>Source: {selectedChurch.source}</p>
                      <p>Last updated: {selectedChurch.lastUpdated}</p>
                    </InfoCard>
                    <InfoCard label="Map Preview">
                      <p>
                        Lat/Lng: {selectedChurch.location.lat}, {selectedChurch.location.lng}
                      </p>
                      <p className="text-sm text-muted">
                        Mapbox cluster view plugs into this record shape without changing the route model.
                      </p>
                      <a
                        href={buildGoogleMapsDirectionsUrl(selectedChurch)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex rounded-full border border-line px-4 py-2 text-sm font-semibold text-ink transition hover:border-brand-500 hover:text-brand-700"
                      >
                        Get Directions
                      </a>
                    </InfoCard>
                    <InfoCard label="Ministry Groups">
                      {selectedChurch.ministries.length ? (
                        <div className="flex flex-wrap gap-2">
                          {selectedChurch.ministries.map((ministry) => (
                            <Badge key={ministry} tone="bg-brand-50 text-brand-900">
                              {ministry}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p>Ministry groups are not listed yet.</p>
                      )}
                    </InfoCard>
                    <InfoCard label="Prayer">
                      <PrayerRequestPanel
                        tenantSlug={tenant.slug}
                        churchId={selectedChurch.id}
                        churchName={selectedChurch.name}
                      />
                    </InfoCard>
                  </div>
                </div>
              ) : (
                <div className="grid min-h-[24rem] place-items-center text-center">
                  <div>
                    <h2 className="font-serif text-2xl text-ink">No churches found</h2>
                    <p className="mt-2 text-muted">Broaden the search or add a church from the registration tab.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 rounded-[1.75rem] border border-line/80 bg-white p-6 shadow-card lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-700">Community Powered</p>
            <h2 className="mt-3 font-serif text-3xl text-ink">Register an unlisted church</h2>
            <p className="mt-4 text-lg leading-8 text-muted">
              Public submissions are staged first, then reviewed before publishing to the real directory.
              This form now writes to Firestore `submissions` when Firebase admin credentials are configured.
            </p>
            <div className="mt-5 rounded-[1.25rem] bg-sky p-4 text-sm text-ink">
              If Firebase is not configured yet, the form will return a clear setup error instead of faking a publish.
            </div>
          </div>

          <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
            <FormField label="Church Name">
              <input
                required
                className="w-full rounded-2xl border border-line bg-surface px-4 py-3 outline-none focus:border-brand-500"
                value={formState.name}
                onChange={(event) => handleInputChange("name", event.target.value)}
              />
            </FormField>
            <FormField label="Pastor Name">
              <input
                required
                className="w-full rounded-2xl border border-line bg-surface px-4 py-3 outline-none focus:border-brand-500"
                value={formState.pastorName}
                onChange={(event) => handleInputChange("pastorName", event.target.value)}
              />
            </FormField>
            <FormField label="Pastor Title">
              <input
                className="w-full rounded-2xl border border-line bg-surface px-4 py-3 outline-none focus:border-brand-500"
                value={formState.pastorTitle}
                onChange={(event) => handleInputChange("pastorTitle", event.target.value)}
              />
            </FormField>
            <FormField label="Street Address">
              <input
                required
                className="w-full rounded-2xl border border-line bg-surface px-4 py-3 outline-none focus:border-brand-500"
                value={formState.address}
                onChange={(event) => handleInputChange("address", event.target.value)}
              />
            </FormField>
            <FormField label="City">
              <input
                required
                className="w-full rounded-2xl border border-line bg-surface px-4 py-3 outline-none focus:border-brand-500"
                value={formState.city}
                onChange={(event) => handleInputChange("city", event.target.value)}
              />
            </FormField>
            <FormField label="State">
              <input
                required
                maxLength={2}
                className="w-full rounded-2xl border border-line bg-surface px-4 py-3 uppercase outline-none focus:border-brand-500"
                value={formState.state}
                onChange={(event) => handleInputChange("state", event.target.value)}
              />
            </FormField>
            <FormField label="ZIP">
              <input
                className="w-full rounded-2xl border border-line bg-surface px-4 py-3 outline-none focus:border-brand-500"
                value={formState.zip}
                onChange={(event) => handleInputChange("zip", event.target.value)}
              />
            </FormField>
            <FormField label="District">
              <input
                className="w-full rounded-2xl border border-line bg-surface px-4 py-3 outline-none focus:border-brand-500"
                value={formState.district}
                onChange={(event) => handleInputChange("district", event.target.value)}
              />
            </FormField>
            <FormField label="Phone">
              <input
                className="w-full rounded-2xl border border-line bg-surface px-4 py-3 outline-none focus:border-brand-500"
                value={formState.phone}
                onChange={(event) => handleInputChange("phone", event.target.value)}
              />
            </FormField>
            <FormField label="Email">
              <input
                type="email"
                className="w-full rounded-2xl border border-line bg-surface px-4 py-3 outline-none focus:border-brand-500"
                value={formState.email}
                onChange={(event) => handleInputChange("email", event.target.value)}
              />
            </FormField>
            <div className="md:col-span-2">
              <FormField label="Website">
                <input
                  className="w-full rounded-2xl border border-line bg-surface px-4 py-3 outline-none focus:border-brand-500"
                  value={formState.website}
                  onChange={(event) => handleInputChange("website", event.target.value)}
                />
              </FormField>
            </div>
            <div className="md:col-span-2 flex items-center justify-between gap-4">
              <button
                disabled={isPending}
                className="rounded-full bg-brand-700 px-6 py-3 font-semibold text-white shadow-card disabled:opacity-60"
              >
                {isPending ? "Submitting..." : "Submit For Review"}
              </button>
              <p className="text-sm font-medium text-muted">{formMessage}</p>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}

function StatCard({ value, label, dark = false }: { value: string; label: string; dark?: boolean }) {
  return (
    <div className={`rounded-[1.25rem] p-4 shadow-card ${dark ? "bg-white/10 text-white" : "bg-white/90"}`}>
      <p className={`text-3xl font-semibold ${dark ? "text-white" : "text-ink"}`}>{value}</p>
      <p className={`text-sm ${dark ? "text-brand-100" : "text-muted"}`}>{label}</p>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      className={`rounded-full px-5 py-2.5 text-sm font-semibold transition ${
        active ? "bg-pine text-white" : "text-muted"
      }`}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-brand-700">{label}</span>
      {children}
    </label>
  );
}

function FormField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-ink">{label}</span>
      {children}
    </label>
  );
}

function InfoCard({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-[1.35rem] border border-line/80 bg-surface p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-700">{label}</p>
      <div className="mt-3 space-y-1 text-sm leading-7 text-ink">{children}</div>
    </div>
  );
}

function Badge({ tone, children }: { tone: string; children: ReactNode }) {
  return <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${tone}`}>{children}</span>;
}
