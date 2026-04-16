"use server";

import { revalidatePath } from "next/cache";
import { getFirebaseAdminAuth, getFirebaseAdminDb } from "@/lib/firebase/admin";
import {
  findPotentialDuplicates,
  getChurchByTenantAndId,
  getSubmissionByTenantAndId,
  getSubmissionsByTenant,
  getTenantBySlug,
  getUsersByTenant
} from "@/lib/data";
import { requireTenantRole } from "@/lib/auth";

export type ActionResult = {
  ok: boolean;
  message: string;
};

type SubmissionPayload = {
  name: string;
  pastorName: string;
  pastorTitle: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  district: string;
  phone: string;
  email: string;
  website: string;
};

type ChurchPayload = SubmissionPayload & {
  status: "verified" | "pending" | "submitted";
  source: string;
  notes: string;
};

function assertFields(payload: SubmissionPayload) {
  if (!payload.name || !payload.pastorName || !payload.address || !payload.city || !payload.state) {
    throw new Error("Name, pastor, address, city, and state are required.");
  }
}

function readChurchPayload(formData: FormData): ChurchPayload {
  return {
    name: String(formData.get("name") || "").trim(),
    pastorName: String(formData.get("pastorName") || "").trim(),
    pastorTitle: String(formData.get("pastorTitle") || "").trim(),
    address: String(formData.get("address") || "").trim(),
    city: String(formData.get("city") || "").trim(),
    state: String(formData.get("state") || "").trim().toUpperCase(),
    zip: String(formData.get("zip") || "").trim(),
    district: String(formData.get("district") || "").trim(),
    phone: String(formData.get("phone") || "").trim(),
    email: String(formData.get("email") || "").trim(),
    website: String(formData.get("website") || "").trim(),
    status: (String(formData.get("status") || "pending").trim() as ChurchPayload["status"]),
    source: String(formData.get("source") || "").trim() || "Admin update",
    notes: String(formData.get("notes") || "").trim()
  };
}

function assertRoleScopedDistrict(
  actor: { role: "admin" | "overseer" | "bishop" | "pastor"; district?: string },
  district: string
) {
  if ((actor.role === "overseer" || actor.role === "bishop") && actor.district !== district) {
    throw new Error("Overseers and Bishops can only manage churches inside their assigned district.");
  }
}

function assertRoleScopedChurch(
  actor: { role: "admin" | "overseer" | "bishop" | "pastor"; churchId?: string },
  churchId: string
) {
  if (actor.role === "pastor" && actor.churchId !== churchId) {
    throw new Error("Pastors can only manage their assigned church.");
  }
}

export async function submitChurchSubmissionAction(
  tenantSlug: string,
  payload: SubmissionPayload
): Promise<ActionResult> {
  const tenant = await getTenantBySlug(tenantSlug);
  const db = getFirebaseAdminDb();

  if (!tenant || !db) {
    return {
      ok: false,
      message: "Firebase admin is not configured yet. Add the env vars in .env.local first."
    };
  }

  try {
    assertFields(payload);

    const duplicateSnapshot = await db
      .collection("churches")
      .where("tenant_id", "==", tenant.id)
      .where("name", "==", payload.name)
      .where("city", "==", payload.city)
      .limit(1)
      .get();

    if (!duplicateSnapshot.empty) {
      return {
        ok: false,
        message: "Possible duplicate found. Review the existing church before submitting another listing."
      };
    }

    await db.collection("submissions").add({
      tenant_id: tenant.id,
      status: "pending",
      created_at: new Date().toISOString(),
      data: {
        name: payload.name,
        pastor_name: payload.pastorName,
        pastor_title: payload.pastorTitle || "Pastor",
        address: payload.address,
        city: payload.city,
        state: payload.state.toUpperCase(),
        zip: payload.zip,
        district: payload.district,
        phone: payload.phone,
        email: payload.email,
        website: payload.website,
        status: "submitted",
        source: "Public submission",
        last_updated: new Date().toISOString().slice(0, 10),
        location: { lat: 0, lng: 0 },
        ministries: []
      }
    });

    revalidatePath(`/${tenantSlug}`);
    revalidatePath(`/${tenantSlug}/admin`);

    return {
      ok: true,
      message: "Submission received and queued for review."
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Unable to submit church."
    };
  }
}

export async function reviewSubmissionAction(formData: FormData) {
  const tenantSlug = String(formData.get("tenantSlug") || "");
  const submissionId = String(formData.get("submissionId") || "");
  const decision = String(formData.get("decision") || "");

  const { tenant, user } = await requireTenantRole(tenantSlug, ["admin", "overseer", "bishop"]);
  const db = getFirebaseAdminDb();

  if (!db) {
    throw new Error("Firebase admin is not configured.");
  }

  const submissionRef = db.collection("submissions").doc(submissionId);
  const submissionDoc = await submissionRef.get();
  if (!submissionDoc.exists) {
    throw new Error("Submission not found.");
  }

  const submission = (await getSubmissionsByTenant(tenantSlug)).find((item) => item.id === submissionId);
  if (!submission) {
    throw new Error("Submission could not be loaded.");
  }

  if ((user.role === "overseer" || user.role === "bishop") && user.district !== submission.data.district) {
    throw new Error("Overseers and Bishops can only review submissions for their own district.");
  }

  if (decision === "reject") {
    await submissionRef.update({
      status: "rejected",
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.uid
    });
  } else if (decision === "approve") {
    const duplicates = await findPotentialDuplicates(tenantSlug, submissionId);
    if (duplicates.length) {
      throw new Error("Resolve duplicate warnings before approval.");
    }

    const churchRef = await db.collection("churches").add({
      tenant_id: tenant.id,
      name: submission.data.name,
      pastor_name: submission.data.pastorName,
      pastor_title: submission.data.pastorTitle,
      address: submission.data.address,
      city: submission.data.city,
      state: submission.data.state,
      zip: submission.data.zip,
      district: submission.data.district,
      phone: submission.data.phone,
      email: submission.data.email,
      website: submission.data.website,
      status: "pending",
      source: "Approved submission",
      last_updated: new Date().toISOString().slice(0, 10),
      location: submission.data.location,
      ministries: submission.data.ministries,
      notes: submission.data.notes
    });

    await submissionRef.update({
      status: "approved",
      church_id: churchRef.id,
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.uid
    });
  }

  await db.collection("audit_logs").add({
    tenant_id: tenant.id,
    action: `submission_${decision}`,
    submission_id: submissionId,
    performed_by: user.uid,
    created_at: new Date().toISOString()
  });

  revalidatePath(`/${tenantSlug}`);
  revalidatePath(`/${tenantSlug}/admin`);
}

export async function updateChurchAction(formData: FormData) {
  const tenantSlug = String(formData.get("tenantSlug") || "");
  const churchId = String(formData.get("churchId") || "");
  const payload = readChurchPayload(formData);

  const { tenant, user } = await requireTenantRole(tenantSlug, ["admin", "overseer", "bishop", "pastor"]);
  const db = getFirebaseAdminDb();

  if (!db) {
    throw new Error("Firebase admin is not configured.");
  }

  const currentChurch = await getChurchByTenantAndId(tenantSlug, churchId);
  if (!currentChurch) {
    throw new Error("Church not found.");
  }

  assertFields(payload);
  assertRoleScopedDistrict(user, currentChurch.district);
  assertRoleScopedDistrict(user, payload.district);
  assertRoleScopedChurch(user, currentChurch.id);

  await db.collection("churches").doc(churchId).update({
    name: payload.name,
    pastor_name: payload.pastorName,
    pastor_title: payload.pastorTitle || "Pastor",
    address: payload.address,
    city: payload.city,
    state: payload.state,
    zip: payload.zip,
    district: payload.district,
    phone: payload.phone,
    email: payload.email,
    website: payload.website,
    status: payload.status,
    source: payload.source,
    notes: payload.notes,
    last_updated: new Date().toISOString().slice(0, 10)
  });

  await db.collection("audit_logs").add({
    tenant_id: tenant.id,
    action: "church_updated",
    church_id: churchId,
    performed_by: user.uid,
    created_at: new Date().toISOString()
  });

  revalidatePath(`/${tenantSlug}`);
  revalidatePath(`/${tenantSlug}/admin`);
  revalidatePath(`/${tenantSlug}/admin/church/${churchId}`);
  revalidatePath(`/${tenantSlug}/church/${churchId}`);
}

export async function updateSubmissionAction(formData: FormData) {
  const tenantSlug = String(formData.get("tenantSlug") || "");
  const submissionId = String(formData.get("submissionId") || "");
  const payload = readChurchPayload(formData);

  const { tenant, user } = await requireTenantRole(tenantSlug, ["admin", "overseer", "bishop"]);
  const db = getFirebaseAdminDb();

  if (!db) {
    throw new Error("Firebase admin is not configured.");
  }

  const currentSubmission = await getSubmissionByTenantAndId(tenantSlug, submissionId);
  if (!currentSubmission) {
    throw new Error("Submission not found.");
  }

  assertFields(payload);
  assertRoleScopedDistrict(user, currentSubmission.data.district);
  assertRoleScopedDistrict(user, payload.district);

  await db.collection("submissions").doc(submissionId).update({
    data: {
      name: payload.name,
      pastor_name: payload.pastorName,
      pastor_title: payload.pastorTitle || "Pastor",
      address: payload.address,
      city: payload.city,
      state: payload.state,
      zip: payload.zip,
      district: payload.district,
      phone: payload.phone,
      email: payload.email,
      website: payload.website,
      status: payload.status,
      source: payload.source,
      notes: payload.notes,
      last_updated: new Date().toISOString().slice(0, 10),
      location: currentSubmission.data.location,
      ministries: currentSubmission.data.ministries
    }
  });

  await db.collection("audit_logs").add({
    tenant_id: tenant.id,
    action: "submission_updated",
    submission_id: submissionId,
    performed_by: user.uid,
    created_at: new Date().toISOString()
  });

  revalidatePath(`/${tenantSlug}`);
  revalidatePath(`/${tenantSlug}/admin`);
  revalidatePath(`/${tenantSlug}/admin/submission/${submissionId}`);
}

export async function createManagedUserAction(formData: FormData) {
  const tenantSlug = String(formData.get("tenantSlug") || "");
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "").trim();
  const role = String(formData.get("role") || "").trim() as "overseer" | "bishop" | "pastor";
  const district = String(formData.get("district") || "").trim();
  const churchId = String(formData.get("churchId") || "").trim();

  const { tenant, user } = await requireTenantRole(tenantSlug, ["admin"]);
  const auth = getFirebaseAdminAuth();
  const db = getFirebaseAdminDb();

  if (!auth || !db) {
    throw new Error("Firebase admin is not configured.");
  }

  if (!name || !email || !password || !role) {
    throw new Error("Name, email, temporary password, and role are required.");
  }

  if ((role === "overseer" || role === "bishop") && !district) {
    throw new Error("Overseer and Bishop accounts require a district.");
  }

  if (role === "pastor" && !churchId) {
    throw new Error("Pastor accounts must be connected to a church.");
  }

  const existingUsers = await getUsersByTenant(tenantSlug);
  if (existingUsers.some((existingUser) => existingUser.email.toLowerCase() === email)) {
    throw new Error("That email is already assigned to a user in this directory.");
  }

  let authUser;
  try {
    authUser = await auth.getUserByEmail(email);
    throw new Error("That email already exists in Firebase Authentication.");
  } catch (error) {
    if (error instanceof Error && !error.message.includes("There is no user record")) {
      throw error;
    }
  }

  authUser = await auth.createUser({
    email,
    password,
    displayName: name
  });

  await db.collection("users").doc(authUser.uid).set({
    tenant_id: tenant.id,
    role,
    district: role === "pastor" ? null : district || null,
    church_id: role === "pastor" ? churchId : null,
    name,
    email
  });

  await db.collection("audit_logs").add({
    tenant_id: tenant.id,
    action: "user_created",
    created_user_uid: authUser.uid,
    created_user_role: role,
    performed_by: user.uid,
    created_at: new Date().toISOString()
  });

  revalidatePath(`/${tenantSlug}/admin`);
}
