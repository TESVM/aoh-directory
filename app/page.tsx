import Link from "next/link";
import { SetupBanner } from "@/components/setup-banner";
import { getTenants } from "@/lib/data";

export default async function LandingPage() {
  const tenants = await getTenants();

  return (
    <main id="main-content" className="mx-auto flex min-h-screen max-w-6xl items-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full space-y-6">
        <SetupBanner />
        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <section>
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-brand-700">Standalone Product</p>
          <img
            src="/aoh-logo.svg"
            alt="AOH Church of God logo"
            className="mt-4 h-28 w-28 object-contain sm:h-32 sm:w-32"
          />
          <h1 className="mt-4 font-serif text-5xl text-ink sm:text-6xl">AOH Directory</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-muted">
            Separate multi-tenant church directory website with tenant-aware routes, district dashboards,
            admin review scaffolding, and a split-view directory UI.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/aoh" className="rounded-full bg-ink px-6 py-3 font-semibold text-white shadow-card">
              Open AOH Tenant
            </Link>
            <Link href="/demo" className="rounded-full border border-line px-6 py-3 font-semibold text-ink">
              Open Demo Tenant
            </Link>
          </div>
        </section>

        <section className="rounded-[2rem] border border-line/80 bg-white p-6 shadow-soft" aria-label="Available tenants">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-700">Available Tenants</p>
          <div className="mt-5 space-y-4">
            {tenants.map((tenant) => (
              <div key={tenant.id} className="rounded-[1.25rem] border border-line/80 bg-surface p-4">
                <p className="font-serif text-2xl text-ink">{tenant.branding.logoText}</p>
                <p className="mt-1 text-sm text-muted">{tenant.name}</p>
                <p className="mt-2 text-sm text-ink">Route: /{tenant.slug}</p>
              </div>
            ))}
          </div>
        </section>
        </div>
      </div>
    </main>
  );
}
