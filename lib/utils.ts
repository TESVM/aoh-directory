export function formatPhone(phone?: string) {
  return phone || "Not listed";
}

export function formatWebsite(website?: string) {
  if (!website) return "Not listed";
  return website.replace(/^https?:\/\//, "");
}

export function badgeTone(status: string) {
  if (status === "verified") return "bg-emerald-100 text-emerald-800";
  if (status === "submitted") return "bg-sky-100 text-sky-800";
  return "bg-amber-100 text-amber-800";
}
