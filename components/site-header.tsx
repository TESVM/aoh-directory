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
          <div className="flex h-14 w-14 items-center justify-center rounded-[1rem] border border-brand-100 bg-white p-1.5 shadow-card sm:h-16 sm:w-16 sm:p-2">
            <img
              src="/aoh-logo.svg"
              alt="AOH Church of God logo"
              className="h-full w-full object-contain"
            />
          </div>
          <div>
            <p className="font-serif text-lg font-semibold text-ink">{tenant.branding.logoText}</p>
            <p className="text-sm text-muted">{tenant.name}</p>
          </div>
        </Link>
        <nav
          aria-label="Primary navigation"
          className="grid w-full grid-cols-2 gap-2 text-sm font-medium text-muted sm:flex sm:flex-wrap sm:items-center sm:gap-2 lg:w-auto lg:justify-end lg:gap-4"
        >
          <Link href={`/${tenant.slug}`} prefetch={false} className="flex min-h-11 items-center justify-center rounded-full px-3 py-2 text-center transition hover:bg-sky hover:text-pine">Find a Church</Link>
          <Link href={`/${tenant.slug}/district/3`} prefetch={false} className="flex min-h-11 items-center justify-center rounded-full px-3 py-2 text-center transition hover:bg-sky hover:text-pine">Districts</Link>
          <Link href={canAccessTenantAdmin ? `/${tenant.slug}/admin` : `/login?next=/${tenant.slug}/admin`} prefetch={false} className="col-span-2 flex min-h-11 items-center justify-center rounded-full px-3 py-2 text-center transition hover:bg-sky hover:text-pine sm:col-auto">
            {canAccessTenantAdmin ? "Back Office" : "Login"}
          </Link>
          {canAccessTenantAdmin ? (
            <Link href="/logout" prefetch={false} className="col-span-2 flex min-h-11 items-center justify-center rounded-full border border-brand-100 px-4 py-2 text-center text-ink transition hover:border-pine hover:text-pine sm:col-auto">Logout</Link>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
