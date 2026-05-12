import type { Church, Tenant } from "@/lib/types";

const baseUrl = "https://www.aohdirectory.com";

export function buildTenantTitle(tenant: Tenant) {
  return `${tenant.branding.logoText} | ${tenant.name}`;
}

export function buildTenantDescription(tenant: Tenant) {
  return (
    tenant.heroDescription ||
    tenant.tagline ||
    `Browse churches, districts, and leadership information for ${tenant.name}.`
  );
}

export function buildTenantUrl(tenantSlug: string) {
  return `${baseUrl}/${tenantSlug}`;
}

export function buildChurchUrl(tenantSlug: string, churchId: string) {
  return `${baseUrl}/${tenantSlug}/church/${churchId}`;
}

export function buildDistrictUrl(tenantSlug: string, districtId: string) {
  return `${baseUrl}/${tenantSlug}/district/${districtId}`;
}

export function buildChurchTitle(church: Church, tenant: Tenant) {
  return `${church.name} in ${church.city}, ${church.state} | ${tenant.branding.logoText}`;
}

export function buildChurchDescription(church: Church, tenant: Tenant) {
  const parts = [
    church.name,
    `${church.city}, ${church.state}`,
    [church.pastorTitle, church.pastorName].filter(Boolean).join(" "),
    church.serviceHours?.length ? `Service times: ${church.serviceHours.join("; ")}` : "Service times available on profile",
    `Find directions and contact details in the ${tenant.branding.logoText}.`
  ];

  return parts.filter(Boolean).join(". ");
}
