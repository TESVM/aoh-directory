import Link from "next/link";
import { getCurrentUserRecord } from "@/lib/data";
import { Tenant } from "@/lib/types";

export async function SiteHeader({ tenant }: { tenant: Tenant }) {
  const user = await getCurrentUserRecord();
  const canAccessTenantAdmin = user?.tenantId === tenant.id;

  return (
    <header className="sticky top-0 z-30 border-b border-brand-900/20 bg-pine/95 text-white backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link href={`/${tenant.slug}`} className="flex items-center gap-3">
          <div
            className="grid h-11 w-11 place-items-center rounded-full border border-brand-100/30 bg-brand-500 text-sm font-semibold text-pine shadow-card"
          >
            {tenant.branding.logoText
              .split(" ")
              .map((part) => part[0])
              .join("")
              .slice(0, 3)}
          </div>
          <div>
            <p className="font-serif text-lg font-semibold text-white">{tenant.branding.logoText}</p>
            <p className="text-sm text-brand-100">{tenant.name}</p>
          </div>
        </Link>
        <nav className="flex flex-wrap items-center gap-4 text-sm font-medium text-brand-100">
          <Link href={`/${tenant.slug}`} prefetch={false} className="transition hover:text-white">Find a Church</Link>
          <Link href={`/${tenant.slug}/district/3`} prefetch={false} className="transition hover:text-white">Districts</Link>
          <Link href={canAccessTenantAdmin ? `/${tenant.slug}/admin` : `/login?next=/${tenant.slug}/admin`} prefetch={false} className="transition hover:text-white">
            {canAccessTenantAdmin ? "Back Office" : "Login"}
          </Link>
          {canAccessTenantAdmin ? (
            <Link href="/logout" prefetch={false} className="rounded-full border border-brand-100/30 px-4 py-2 text-white transition hover:border-brand-100 hover:bg-white/5">Logout</Link>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
