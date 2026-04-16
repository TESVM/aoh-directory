import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentUserRecord, getTenantBySlug } from "@/lib/data";

export async function requireTenantRole(tenantSlug: string, allowedRoles: Array<"admin" | "district_leader">) {
  const tenant = await getTenantBySlug(tenantSlug);
  const user = await getCurrentUserRecord();

  if (!tenant || !user || user.tenantId !== tenant.id || !allowedRoles.includes(user.role)) {
    redirect(`/login?next=/${tenantSlug}/admin`);
  }

  return { tenant, user };
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(process.env.SESSION_COOKIE_NAME || "aoh_directory_session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0
  });
}
