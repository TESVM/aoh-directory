import { notFound } from "next/navigation";
import { DirectoryShell } from "@/components/directory-shell";
import { SiteHeader } from "@/components/site-header";
import { SetupBanner } from "@/components/setup-banner";
import { getChurchesByTenant, getSubmissionsByTenant, getTenantBySlug } from "@/lib/data";

export default async function TenantDirectoryPage({
  params
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant: tenantSlug } = await params;
  const tenant = await getTenantBySlug(tenantSlug);

  if (!tenant) {
    notFound();
  }

  const churches = await getChurchesByTenant(tenant.slug);
  const submissions = await getSubmissionsByTenant(tenant.slug);

  return (
    <>
      <SiteHeader tenant={tenant} />
      <main id="main-content" className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <SetupBanner />
        <DirectoryShell tenant={tenant} churches={churches} submissions={submissions} />
      </main>
    </>
  );
}
