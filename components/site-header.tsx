import Link from "next/link";
import { getCurrentUserRecord } from "@/lib/data";
import { Tenant } from "@/lib/types";

export async function SiteHeader({ tenant }: { tenant: Tenant }) {
  const user = await getCurrentUserRecord();
  const canAccessTenantAdmin = user?.tenantId === tenant.id;

  return (
    <header className="sticky top-0 z-30 border-b border-brand-100 bg-white/95 text-ink backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <Link href={`/${tenant.slug}`} className="flex items-center gap-3 self-start">
          <img
            src="/aoh-logo.svg"
            alt="AOH Church of God logo"
            className="h-14 w-14 rounded-full border border-brand-100 bg-white object-contain shadow-card sm:h-16 sm:w-16"
          />
          <div>
            <p className="font-serif text-lg font-semibold text-ink">{tenant.branding.logoText}</p>
            <p className="text-sm text-muted">{tenant.name}</p>
          </div>
        </Link>
        <nav
          aria-label="Primary navigation"
          className="flex w-full flex-wrap items-center gap-2 text-sm font-medium text-muted lg:w-auto lg:justify-end lg:gap-4"
        >
          <Link href={`/${tenant.slug}`} prefetch={false} className="rounded-full px-3 py-2 transition hover:bg-sky hover:text-pine">Find a Church</Link>
          <Link href={`/${tenant.slug}/district/3`} prefetch={false} className="rounded-full px-3 py-2 transition hover:bg-sky hover:text-pine">Districts</Link>
          <Link href={canAccessTenantAdmin ? `/${tenant.slug}/admin` : `/login?next=/${tenant.slug}/admin`} prefetch={false} className="rounded-full px-3 py-2 transition hover:bg-sky hover:text-pine">
            {canAccessTenantAdmin ? "Back Office" : "Login"}
          </Link>
          {canAccessTenantAdmin ? (
            <Link href="/logout" prefetch={false} className="rounded-full border border-brand-100 px-4 py-2 text-ink transition hover:border-pine hover:text-pine">Logout</Link>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
