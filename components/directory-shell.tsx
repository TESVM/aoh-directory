"use client";

import type { Route } from "next";
import Link from "next/link";
import type { FormEvent, ReactNode } from "react";
import { useMemo, useState, useTransition } from "react";
import { submitChurchSubmissionAction } from "@/app/actions";
import { Church, Submission, Tenant } from "@/lib/types";
import { badgeTone } from "@/lib/utils";

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
  ministries: string;
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
  website: "",
  ministries: ""
};

function parseMultilineEntries(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function scoreChurchProfileCompleteness(church: Church) {
  let score = 0;

  const optionalFields = [
    church.pastorName,
    church.pastorTitle,
    church.address,
    church.city,
    church.state,
    church.zip,
    church.district,
    church.phone,
    church.email,
    church.website,
    church.source,
    church.lastUpdated,
    church.churchImageUrl,
    church.pastorImageUrl,
    church.logoImageUrl,
    church.onlineWorshipUrl,
    church.notes
  ];

  for (const value of optionalFields) {
    if (String(value || "").trim()) {
      score += 1;
    }
  }

  if ((church.location?.lat || 0) !== 0 || (church.location?.lng || 0) !== 0) {
    score += 1;
  }

  if (church.serviceHours?.length) {
    score += 1;
  }

  if (church.ministries?.length) {
    score += 1;
  }

  return score;
}

function buildChurchProfileUrl(tenantSlug: string, churchId: string): Route {
  return `/${tenantSlug}/church/${churchId}` as Route;
}

export function DirectoryShell({ tenant, churches, submissions }: DirectoryShellProps) {
  const [tab, setTab] = useState<"directory" | "register">("directory");
  const [query, setQuery] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [districtFilter, setDistrictFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [formState, setFormState] = useState<FormState>(emptyForm);
  const [formMessage, setFormMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const allChurches = useMemo(
    () =>
      [...churches].sort((left, right) => {
        const completenessDifference =
          scoreChurchProfileCompleteness(right) - scoreChurchProfileCompleteness(left);

        if (completenessDifference !== 0) {
          return completenessDifference;
        }

        return left.city.localeCompare(right.city) || left.name.localeCompare(right.name);
      }),
    [churches]
  );

  const states = useMemo(
    () => [...new Set(allChurches.map((church) => church.state))].sort(),
    [allChurches]
  );
  const districts = useMemo(
    () =>
      [...new Set(allChurches.map((church) => church.district).filter(Boolean))].sort((a, b) =>
        a.localeCompare(b, undefined, { numeric: true })
      ),
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

  function handleInputChange<K extends keyof FormState>(field: K, value: FormState[K]) {
    setFormState((current) => ({ ...current, [field]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormMessage("");
    startTransition(async () => {
      const result = await submitChurchSubmissionAction(tenant.slug, {
        ...formState,
        ministries: parseMultilineEntries(formState.ministries)
      });
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

      <div className="flex w-full flex-col rounded-[1.5rem] border border-line bg-white p-1 shadow-card sm:inline-flex sm:w-auto sm:flex-row sm:rounded-full" role="tablist" aria-label="Directory views">
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

            {filtered.length ? (
              <>
                <p className="mb-4 text-sm text-muted">Tap any church to open its full profile on a separate page.</p>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {filtered.map((church) => (
                    <Link
                      key={church.id}
                      href={buildChurchProfileUrl(tenant.slug, church.id)}
                      prefetch={false}
                      className="block rounded-[1.4rem] border border-line/80 bg-surface p-4 text-left transition hover:border-brand-300 hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-200"
                      aria-label={`Open ${church.name} church profile`}
                    >
                      {church.churchImageUrl ? (
                        <img
                          src={church.churchImageUrl}
                          alt={church.name}
                          className="mb-4 aspect-[16/9] w-full rounded-[1rem] border border-line/80 object-cover"
                        />
                      ) : null}
                      <h2 className="font-serif text-xl text-ink">{church.name}</h2>
                      <p className="mt-1 text-sm text-muted">
                        {church.city}, {church.state}
                      </p>
                      <p className="mt-1 text-sm text-ink">
                        {[church.pastorTitle, church.pastorName].filter(Boolean).join(" ") || "Leadership details pending"}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Badge tone="bg-stone-100 text-stone-800">
                          {church.district ? `District ${church.district}` : "District pending"}
                        </Badge>
                        <Badge tone={badgeTone(church.status)}>{church.status}</Badge>
                      </div>
                      <p className="mt-4 text-sm font-semibold text-brand-700">Open full profile</p>
                    </Link>
                  ))}
                </div>
              </>
            ) : (
              <div className="grid min-h-[16rem] place-items-center text-center">
                <div>
                  <h2 className="font-serif text-2xl text-ink">No churches found</h2>
                  <p className="mt-2 text-muted">Broaden the search or add a church from the registration tab.</p>
                </div>
              </div>
            )}
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
            <div className="md:col-span-2">
              <FormField label="Ministry Groups">
                <textarea
                  rows={4}
                  className="w-full rounded-2xl border border-line bg-surface px-4 py-3 outline-none focus:border-brand-500"
                  value={formState.ministries}
                  onChange={(event) => handleInputChange("ministries", event.target.value)}
                />
              </FormField>
              <p className="mt-2 text-sm text-muted">Put each ministry group on its own line.</p>
            </div>
            <div className="md:col-span-2 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <button
                disabled={isPending}
                className="flex min-h-11 w-full items-center justify-center rounded-full bg-brand-700 px-6 py-3 text-center font-semibold text-white shadow-card disabled:opacity-60 sm:w-auto"
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
      role="tab"
      aria-selected={active}
      className={`w-full rounded-full px-5 py-3 text-sm font-semibold transition sm:w-auto sm:py-2.5 ${
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

function Badge({ tone, children }: { tone: string; children: ReactNode }) {
  return <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${tone}`}>{children}</span>;
}
