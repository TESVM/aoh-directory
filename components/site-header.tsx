import Link from "next/link";
import { getCurrentUserRecord } from "@/lib/data";
import { Tenant } from "@/lib/types";

export async function SiteHeader({ tenant }: { tenant: Tenant }) {
  const user = await getCurrentUserRecord();
  const canAccessTenantAdmin = user?.tenantId === tenant.id;

  return (
    <header className="sticky top-0 z-30 border-b border-brand-100 bg-white/95 text-ink backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link href={`/${tenant.slug}`} className="flex items-center gap-3">
          <div
            className="grid h-11 w-11 place-items-center rounded-full border border-pine/15 bg-pine text-sm font-semibold text-brand-100 shadow-card"
          >
            {tenant.branding.logoText
              .split(" ")
              .map((part) => part[0])
              .join("")
              .slice(0, 3)}
          </div>
          <div>
            <p className="font-serif text-lg font-semibold text-ink">{tenant.branding.logoText}</p>
            <p className="text-sm text-muted">{tenant.name}</p>
          </div>
        </Link>
        <nav className="flex flex-wrap items-center gap-4 text-sm font-medium text-muted">
          <Link href={`/${tenant.slug}`} prefetch={false} className="transition hover:text-pine">Find a Church</Link>
          <Link href={`/${tenant.slug}/district/3`} prefetch={false} className="transition hover:text-pine">Districts</Link>
          <Link href={canAccessTenantAdmin ? `/${tenant.slug}/admin` : `/login?next=/${tenant.slug}/admin`} prefetch={false} className="transition hover:text-pine">
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
