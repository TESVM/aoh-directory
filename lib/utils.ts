export function formatPhone(phone?: string) {
  return phone || "Not listed";
}

export function toTelHref(phone?: string) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.length === 10) return `tel:+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `tel:+${digits}`;
  return `tel:${digits}`;
}

export function formatWebsite(website?: string) {
  if (!website) return "Not listed";
  return website.replace(/^https?:\/\//, "");
}

export function toWebsiteHref(website?: string) {
  if (!website) return null;
  return /^https?:\/\//i.test(website) ? website : `https://${website}`;
}

export function badgeTone(status: string) {
  if (status === "verified") return "bg-emerald-100 text-emerald-800";
  if (status === "submitted") return "bg-sky-100 text-sky-800";
  return "bg-amber-100 text-amber-800";
}
