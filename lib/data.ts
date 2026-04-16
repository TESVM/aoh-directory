import { QueryDocumentSnapshot, Timestamp } from "firebase-admin/firestore";
import { cookies } from "next/headers";
import { Church, PrayerRequest, Submission, Tenant, UserRecord, ViewerContext } from "@/lib/types";
import { getFirebaseAdminAuth, getFirebaseAdminDb } from "@/lib/firebase/admin";
import { seededChurches, seededSubmissions, seededTenants, seededUsers } from "@/lib/seed";

type FirestoreChurch = {
  tenant_id: string;
  name: string;
  pastor_name: string;
  pastor_title: string;
  address: string;
  city: string;
  state: string;
  zip?: string;
  district: string;
  phone?: string;
  email?: string;
  website?: string;
  status: "verified" | "pending" | "submitted";
  source?: string;
  last_updated?: string | Timestamp;
  location?: {
    lat: number;
    lng: number;
  };
  church_image_url?: string;
  pastor_image_url?: string;
  logo_image_url?: string;
  service_hours?: string[];
  online_worship_url?: string;
  ministries?: string[];
  notes?: string;
};

type FirestoreSubmission = {
  tenant_id: string;
  church_id?: string;
  data: Omit<FirestoreChurch, "tenant_id">;
  status: "pending" | "approved" | "rejected";
  created_at?: string | Timestamp;
};

type FirestoreTenant = {
  name: string;
  slug: string;
  tagline: string;
  branding: {
    color: string;
    accent: string;
    logoText: string;
  };
};

type FirestorePrayerRequest = {
  tenant_id: string;
  church_id?: string;
  church_name?: string;
  requester_name: string;
  requester_email?: string;
  requester_phone?: string;
  request: string;
  created_at?: string | Timestamp;
  status: "new" | "reviewed";
};

type FirestoreUser = {
  tenant_id: string;
  role: "admin" | "district_leader" | "overseer" | "bishop" | "pastor";
  district?: string;
  church_id?: string;
  name: string;
  email: string;
};

function normalizeDate(value?: string | Timestamp) {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value.toDate().toISOString().slice(0, 10);
}

function mapChurchDoc(doc: QueryDocumentSnapshot<FirestoreChurch>): Church {
  const data = doc.data();
  return {
    id: doc.id,
    tenantId: data.tenant_id,
    name: data.name,
    pastorName: data.pastor_name,
    pastorTitle: data.pastor_title,
    address: data.address,
    city: data.city,
    state: data.state,
    zip: data.zip ?? "",
    district: data.district,
    phone: data.phone,
    email: data.email,
    website: data.website,
    status: data.status,
    source: data.source ?? "Firestore",
    lastUpdated: normalizeDate(data.last_updated),
    location: data.location ?? { lat: 0, lng: 0 },
    churchImageUrl: data.church_image_url,
    pastorImageUrl: data.pastor_image_url,
    logoImageUrl: data.logo_image_url,
    serviceHours: data.service_hours ?? [],
    onlineWorshipUrl: data.online_worship_url,
    ministries: data.ministries ?? [],
    notes: data.notes
  };
}

function mapSubmissionDoc(doc: QueryDocumentSnapshot<FirestoreSubmission>, tenantId: string): Submission {
  const data = doc.data();
  return {
    id: doc.id,
    tenantId,
    churchId: data.church_id,
    status: data.status,
    createdAt: normalizeDate(data.created_at),
    data: {
      name: data.data.name,
      pastorName: data.data.pastor_name,
      pastorTitle: data.data.pastor_title,
      address: data.data.address,
      city: data.data.city,
      state: data.data.state,
      zip: data.data.zip ?? "",
      district: data.data.district,
      phone: data.data.phone,
      email: data.data.email,
      website: data.data.website,
      status: data.data.status,
      source: data.data.source ?? "Submission",
      lastUpdated: normalizeDate(data.data.last_updated),
      location: data.data.location ?? { lat: 0, lng: 0 },
      churchImageUrl: data.data.church_image_url,
      pastorImageUrl: data.data.pastor_image_url,
      logoImageUrl: data.data.logo_image_url,
      serviceHours: data.data.service_hours ?? [],
      onlineWorshipUrl: data.data.online_worship_url,
      ministries: data.data.ministries ?? [],
      notes: data.data.notes
    }
  };
}

function mapTenantDoc(id: string, data: FirestoreTenant): Tenant {
  return {
    id,
    name: data.name,
    slug: data.slug,
    tagline: data.tagline,
    branding: data.branding
  };
}

function mapPrayerRequestDoc(doc: QueryDocumentSnapshot<FirestorePrayerRequest>, tenantId: string): PrayerRequest {
  const data = doc.data();
  return {
    id: doc.id,
    tenantId,
    churchId: data.church_id,
    churchName: data.church_name,
    requesterName: data.requester_name,
    requesterEmail: data.requester_email,
    requesterPhone: data.requester_phone,
    request: data.request,
    createdAt: normalizeDate(data.created_at),
    status: data.status
  };
}

function mapUserDoc(uid: string, data: FirestoreUser): UserRecord {
  const normalizedRole = data.role === "district_leader" ? "overseer" : data.role;
  return {
    uid,
    tenantId: data.tenant_id,
    role: normalizedRole,
    district: data.district,
    churchId: data.church_id,
    name: data.name,
    email: data.email
  };
}

export async function getTenants() {
  const db = getFirebaseAdminDb();
  if (!db) return seededTenants;

  try {
    const snapshot = await db.collection("tenants").get();
    if (snapshot.empty) return seededTenants;
    return snapshot.docs.map((doc) => mapTenantDoc(doc.id, doc.data() as FirestoreTenant));
  } catch {
    return seededTenants;
  }
}

export async function getTenantBySlug(slug: string) {
  const db = getFirebaseAdminDb();
  if (!db) return seededTenants.find((tenant) => tenant.slug === slug) ?? null;

  try {
    const snapshot = await db.collection("tenants").where("slug", "==", slug).limit(1).get();
    if (snapshot.empty) return seededTenants.find((tenant) => tenant.slug === slug) ?? null;
    const doc = snapshot.docs[0];
    return mapTenantDoc(doc.id, doc.data() as FirestoreTenant);
  } catch {
    return seededTenants.find((tenant) => tenant.slug === slug) ?? null;
  }
}

export async function getChurchesByTenant(tenantSlug: string) {
  const tenant = await getTenantBySlug(tenantSlug);
  if (!tenant) return [];

  const db = getFirebaseAdminDb();
  if (!db) return seededChurches.filter((church) => church.tenantId === tenant.id);

  try {
    const snapshot = await db.collection("churches").where("tenant_id", "==", tenant.id).get();
    return snapshot.docs.map((doc) => mapChurchDoc(doc as QueryDocumentSnapshot<FirestoreChurch>));
  } catch {
    return seededChurches.filter((church) => church.tenantId === tenant.id);
  }
}

export async function getChurchByTenantAndId(tenantSlug: string, churchId: string) {
  const tenant = await getTenantBySlug(tenantSlug);
  if (!tenant) return null;

  const db = getFirebaseAdminDb();
  if (!db) {
    return seededChurches.find((church) => church.tenantId === tenant.id && church.id === churchId) ?? null;
  }

  try {
    const doc = await db.collection("churches").doc(churchId).get();
    if (!doc.exists) {
      return seededChurches.find((church) => church.tenantId === tenant.id && church.id === churchId) ?? null;
    }
    const mapped = mapChurchDoc(doc as QueryDocumentSnapshot<FirestoreChurch>);
    return mapped.tenantId === tenant.id ? mapped : null;
  } catch {
    return seededChurches.find((church) => church.tenantId === tenant.id && church.id === churchId) ?? null;
  }
}

export async function getSubmissionByTenantAndId(tenantSlug: string, submissionId: string) {
  const tenant = await getTenantBySlug(tenantSlug);
  if (!tenant) return null;

  const db = getFirebaseAdminDb();
  if (!db) {
    return seededSubmissions.find(
      (submission) => submission.tenantId === tenant.id && submission.id === submissionId
    ) ?? null;
  }

  try {
    const doc = await db.collection("submissions").doc(submissionId).get();
    if (!doc.exists) {
      return seededSubmissions.find(
        (submission) => submission.tenantId === tenant.id && submission.id === submissionId
      ) ?? null;
    }
    const mapped = mapSubmissionDoc(doc as QueryDocumentSnapshot<FirestoreSubmission>, tenant.id);
    return mapped.tenantId === tenant.id ? mapped : null;
  } catch {
    return seededSubmissions.find(
      (submission) => submission.tenantId === tenant.id && submission.id === submissionId
    ) ?? null;
  }
}

export async function getSubmissionsByTenant(tenantSlug: string) {
  const tenant = await getTenantBySlug(tenantSlug);
  if (!tenant) return [];

  const db = getFirebaseAdminDb();
  if (!db) return seededSubmissions.filter((submission) => submission.tenantId === tenant.id);

  try {
    const snapshot = await db.collection("submissions").where("tenant_id", "==", tenant.id).get();
    return snapshot.docs.map((doc) => mapSubmissionDoc(doc as QueryDocumentSnapshot<FirestoreSubmission>, tenant.id));
  } catch {
    return seededSubmissions.filter((submission) => submission.tenantId === tenant.id);
  }
}

export async function getDistrictStats(tenantSlug: string, districtId: string) {
  const districtChurches = (await getChurchesByTenant(tenantSlug)).filter(
    (church) => church.district === districtId
  );

  return {
    total: districtChurches.length,
    verified: districtChurches.filter((church) => church.status === "verified").length,
    pending: districtChurches.filter((church) => church.status !== "verified").length,
    churches: districtChurches
  };
}

export async function getPrayerRequestsByTenant(tenantSlug: string) {
  const tenant = await getTenantBySlug(tenantSlug);
  if (!tenant) return [];

  const db = getFirebaseAdminDb();
  if (!db) return [];

  try {
    const snapshot = await db.collection("prayer_requests").where("tenant_id", "==", tenant.id).get();
    return snapshot.docs.map((doc) => mapPrayerRequestDoc(doc as QueryDocumentSnapshot<FirestorePrayerRequest>, tenant.id));
  } catch {
    return [];
  }
}

export async function getCurrentUserRecord() {
  const auth = getFirebaseAdminAuth();
  const db = getFirebaseAdminDb();
  const sessionCookieName = process.env.SESSION_COOKIE_NAME || "aoh_directory_session";
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(sessionCookieName)?.value;

  if (!auth || !db || !sessionCookie) {
    return null;
  }

  try {
    const decoded = await auth.verifySessionCookie(sessionCookie, true);
    const userDoc = await db.collection("users").doc(decoded.uid).get();
    if (!userDoc.exists) return null;
    return mapUserDoc(userDoc.id, userDoc.data() as FirestoreUser);
  } catch {
    return null;
  }
}

export async function getViewerContext(tenantSlug: string): Promise<ViewerContext | null> {
  const tenant = await getTenantBySlug(tenantSlug);
  if (!tenant) return null;

  const user = await getCurrentUserRecord();
  if (!user || user.tenantId !== tenant.id) {
    return { tenant, role: "public" };
  }

  return {
    tenant,
    role: user.role,
    district: user.district,
    churchId: user.churchId,
    user
  };
}

export async function getScopedChurches(viewer: ViewerContext) {
  const tenantChurches = await getChurchesByTenant(viewer.tenant.slug);
  if ((viewer.role === "overseer" || viewer.role === "bishop") && viewer.district) {
    return tenantChurches.filter((church) => church.district === viewer.district);
  }
  if (viewer.role === "pastor" && viewer.churchId) {
    return tenantChurches.filter((church) => church.id === viewer.churchId);
  }
  return tenantChurches;
}

export async function getScopedSubmissions(viewer: ViewerContext) {
  const tenantSubmissions = await getSubmissionsByTenant(viewer.tenant.slug);
  if ((viewer.role === "overseer" || viewer.role === "bishop") && viewer.district) {
    return tenantSubmissions.filter((submission) => submission.data.district === viewer.district);
  }
  if (viewer.role === "pastor" && viewer.churchId) {
    return [];
  }
  return tenantSubmissions;
}

export async function findPotentialDuplicates(tenantSlug: string, submissionId: string) {
  const target = (await getSubmissionsByTenant(tenantSlug)).find((submission) => submission.id === submissionId);
  if (!target) return [];

  return (await getChurchesByTenant(tenantSlug)).filter((church) => {
    const sameName = church.name.toLowerCase() === target.data.name.toLowerCase();
    const sameCity = church.city.toLowerCase() === target.data.city.toLowerCase();
    const sameAddress = church.address.toLowerCase() === target.data.address.toLowerCase();
    return (sameName && sameCity) || sameAddress;
  });
}

export async function getUserByEmail(email: string) {
  const db = getFirebaseAdminDb();
  if (!db) {
    return seededUsers.find((user) => user.email.toLowerCase() === email.toLowerCase()) ?? null;
  }

  try {
    const snapshot = await db.collection("users").where("email", "==", email).limit(1).get();
    if (snapshot.empty) return seededUsers.find((user) => user.email.toLowerCase() === email.toLowerCase()) ?? null;
    const doc = snapshot.docs[0];
    return mapUserDoc(doc.id, doc.data() as FirestoreUser);
  } catch {
    return seededUsers.find((user) => user.email.toLowerCase() === email.toLowerCase()) ?? null;
  }
}

export async function getUsersByTenant(tenantSlug: string) {
  const tenant = await getTenantBySlug(tenantSlug);
  if (!tenant) return [];

  const db = getFirebaseAdminDb();
  if (!db) {
    return seededUsers.filter((user) => user.tenantId === tenant.id);
  }

  try {
    const snapshot = await db.collection("users").where("tenant_id", "==", tenant.id).get();
    return snapshot.docs.map((doc) => mapUserDoc(doc.id, doc.data() as FirestoreUser));
  } catch {
    return seededUsers.filter((user) => user.tenantId === tenant.id);
  }
}
