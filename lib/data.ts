import { QueryDocumentSnapshot, Timestamp } from "firebase-admin/firestore";
import { cookies } from "next/headers";
import { Church, Submission, Tenant, UserRecord, ViewerContext } from "@/lib/types";
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

type FirestoreUser = {
  tenant_id: string;
  role: "admin" | "district_leader";
  district?: string;
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

function mapUserDoc(uid: string, data: FirestoreUser): UserRecord {
  return {
    uid,
    tenantId: data.tenant_id,
    role: data.role,
    district: data.district,
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
    user
  };
}

export async function getScopedChurches(viewer: ViewerContext) {
  const tenantChurches = await getChurchesByTenant(viewer.tenant.slug);
  if (viewer.role === "district_leader" && viewer.district) {
    return tenantChurches.filter((church) => church.district === viewer.district);
  }
  return tenantChurches;
}

export async function getScopedSubmissions(viewer: ViewerContext) {
  const tenantSubmissions = await getSubmissionsByTenant(viewer.tenant.slug);
  if (viewer.role === "district_leader" && viewer.district) {
    return tenantSubmissions.filter((submission) => submission.data.district === viewer.district);
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
