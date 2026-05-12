import type { MetadataRoute } from "next";
import { getChurchesByTenant, getTenants } from "@/lib/data";

function toValidLastModified(value?: string) {
  if (!value) {
    return new Date();
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

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
          lastModified: toValidLastModified(church.lastUpdated)
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
