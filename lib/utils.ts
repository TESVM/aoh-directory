export function formatPhone(phone?: string) {
  return phone || "Not listed";
}

export function toTelHref(phone?: string) {
  const trimmedPhone = phone?.trim();
  if (!trimmedPhone) return null;
  const digits = trimmedPhone.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.length === 10) return `tel:+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `tel:+${digits}`;
  return `tel:${digits}`;
}

export function formatWebsite(website?: string) {
  const trimmedWebsite = website?.trim();
  if (!trimmedWebsite) return "Not listed";
  return trimmedWebsite.replace(/^https?:\/\//i, "");
}

export function toWebsiteHref(website?: string) {
  const trimmedWebsite = website?.trim();
  if (!trimmedWebsite) return null;
  return /^https?:\/\//i.test(trimmedWebsite) ? trimmedWebsite : `https://${trimmedWebsite}`;
}

export function toMailtoHref(email?: string) {
  const trimmedEmail = email?.trim();
  if (!trimmedEmail) return null;
  return `mailto:${trimmedEmail}`;
}

export function badgeTone(status: string) {
  if (status === "verified") return "bg-emerald-100 text-emerald-800";
  if (status === "submitted") return "bg-sky-100 text-sky-800";
  return "bg-amber-100 text-amber-800";
}
