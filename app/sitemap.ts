import type { MetadataRoute } from "next";
import { getChurchesByTenant, getTenants } from "@/lib/data";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://www.aohdirectory.com";
  const tenants = await getTenants();
  const tenantEntries = await Promise.all(
    tenants.map(async (tenant) => {
      const churches = await getChurchesByTenant(tenant.slug);
      const districts = [...new Set(churches.map((church) => church.district).filter(Boolean))];

      return [
        {
          url: `${baseUrl}/${tenant.slug}`,
          lastModified: new Date()
        },
        ...churches.map((church) => ({
          url: `${baseUrl}/${tenant.slug}/church/${church.id}`,
          lastModified: church.lastUpdated ? new Date(church.lastUpdated) : new Date()
        })),
        ...districts.map((district) => ({
          url: `${baseUrl}/${tenant.slug}/district/${district}`,
          lastModified: new Date()
        }))
      ];
    })
  );

  return [
    {
      url: `${baseUrl}/privacy-policy`,
      lastModified: new Date()
    },
    ...tenantEntries.flat()
  ];
}
