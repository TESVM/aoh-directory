import Link from "next/link";
import { getCurrentUserRecord } from "@/lib/data";
import { Tenant } from "@/lib/types";

export async function SiteHeader({ tenant }: { tenant: Tenant }) {
  const user = await getCurrentUserRecord();
  const canAccessTenantAdmin = user?.tenantId === tenant.id;

  return (
    <header className="relative z-30 border-b border-brand-100 bg-white/95 text-ink backdrop-blur sm:sticky sm:top-0">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-3 py-3 sm:px-6 sm:py-4 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <Link href={`/${tenant.slug}`} className="flex items-center gap-3 self-start">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.85rem] border border-brand-100 bg-white p-1 shadow-card sm:h-16 sm:w-16 sm:rounded-[1rem] sm:p-2">
            <img
              src="/aoh-directory-badge.png"
              alt="AOH Church of God logo"
              className="h-full w-full object-contain"
            />
          </div>
          <div className="min-w-0">
            <p className="font-serif text-base font-semibold leading-tight text-ink sm:text-lg">{tenant.branding.logoText}</p>
            <p className="text-xs leading-tight text-muted sm:text-sm">{tenant.name}</p>
          </div>
        </Link>
        <nav
          aria-label="Primary navigation"
          className="grid w-full grid-cols-3 gap-2 text-sm font-medium text-muted sm:flex sm:flex-wrap sm:items-center sm:gap-2 lg:w-auto lg:justify-end lg:gap-4"
        >
          <Link href={`/${tenant.slug}`} prefetch={false} className="flex min-h-10 items-center justify-center rounded-full px-2 py-2 text-center text-xs transition hover:bg-sky hover:text-pine sm:min-h-11 sm:px-3 sm:text-sm">Find a Church</Link>
          <Link href={`/${tenant.slug}/district/3`} prefetch={false} className="flex min-h-10 items-center justify-center rounded-full px-2 py-2 text-center text-xs transition hover:bg-sky hover:text-pine sm:min-h-11 sm:px-3 sm:text-sm">Districts</Link>
          <Link href={canAccessTenantAdmin ? `/${tenant.slug}/admin` : `/login?next=/${tenant.slug}/admin`} prefetch={false} className="flex min-h-10 items-center justify-center rounded-full px-2 py-2 text-center text-xs transition hover:bg-sky hover:text-pine sm:min-h-11 sm:px-3 sm:text-sm sm:col-auto">
            {canAccessTenantAdmin ? "Back Office" : "Login"}
          </Link>
          {canAccessTenantAdmin ? (
            <Link href="/logout" prefetch={false} className="col-span-3 flex min-h-10 items-center justify-center rounded-full border border-brand-100 px-3 py-2 text-center text-xs text-ink transition hover:border-pine hover:text-pine sm:col-auto sm:min-h-11 sm:px-4 sm:text-sm">Logout</Link>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
