"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getFirebaseAdminAuth, getFirebaseAdminBucket, getFirebaseAdminDb } from "@/lib/firebase/admin";
import {
  getChurchClaimsByTenant,
  findPotentialDuplicates,
  getChurchByTenantAndId,
  getChurchesByTenant,
  getPrayerRequestsByTenant,
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

export type CommunicationResult = {
  ok: boolean;
  message: string;
  emailCount?: number;
  smsCount?: number;
};

export type PrayerRequestResult = {
  ok: boolean;
  message: string;
};

export type ChurchClaimResult = {
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
  ministries: string[];
};

type ChurchPayload = SubmissionPayload & {
  churchImageUrl?: string;
  pastorImageUrl?: string;
  logoImageUrl?: string;
  serviceHours: string[];
  onlineWorshipUrl: string;
  status: "verified" | "pending" | "submitted";
  source: string;
  notes: string;
};

type PrayerPayload = {
  churchId?: string;
  churchName?: string;
  requesterName: string;
  requesterEmail?: string;
  requesterPhone?: string;
  request: string;
};

type ChurchClaimPayload = {
  churchId: string;
  churchName: string;
  claimantName: string;
  claimantEmail: string;
  claimantPhone?: string;
  roleAtChurch: string;
  verificationNotes: string;
};

const MAX_IMAGE_UPLOAD_BYTES = 4 * 1024 * 1024;
const ALLOWED_IMAGE_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/avif",
  "image/heic",
  "image/heif",
  "image/svg+xml"
]);
const EXTENSION_BY_MIME_TYPE: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
  "image/heic": "heic",
  "image/heif": "heif",
  "image/svg+xml": "svg"
};

function normalizePhoneNumber(phone?: string) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return null;
}

function unique<T>(values: T[]) {
  return [...new Set(values)];
}

function generateTemporaryPassword() {
  return `AOH!${randomUUID().replace(/-/g, "").slice(0, 10)}a`;
}

function parseMultilineList(value: FormDataEntryValue | null) {
  return String(value || "")
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function assertPrayerPayload(payload: PrayerPayload) {
  if (!payload.requesterName || !payload.request) {
    throw new Error("Your name and prayer request are required.");
  }
}

function assertChurchClaimPayload(payload: ChurchClaimPayload) {
  if (!payload.churchId || !payload.churchName || !payload.claimantName || !payload.claimantEmail || !payload.roleAtChurch) {
    throw new Error("Church, name, email, and role are required.");
  }
}

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
    ministries: parseMultilineList(formData.get("ministries")),
    churchImageUrl: String(formData.get("churchImageUrl") || "").trim() || undefined,
    pastorImageUrl: String(formData.get("pastorImageUrl") || "").trim() || undefined,
    logoImageUrl: String(formData.get("logoImageUrl") || "").trim() || undefined,
    serviceHours: parseMultilineList(formData.get("serviceHours")),
    onlineWorshipUrl: String(formData.get("onlineWorshipUrl") || "").trim(),
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
    throw new Error("Overseers and Bishops can only manage churches inside their assigned district or diocese.");
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

async function uploadImageIfProvided(
  formData: FormData,
  fieldName: "churchImage" | "pastorImage" | "churchLogo",
  storagePath: string
) {
  const entry = formData.get(fieldName);
  if (
    !entry ||
    typeof entry === "string" ||
    typeof (entry as File).arrayBuffer !== "function" ||
    typeof (entry as File).type !== "string" ||
    !(entry as File).size
  ) {
    return null;
  }

  if (!ALLOWED_IMAGE_MIME_TYPES.has(entry.type)) {
    throw new Error(
      "Unsupported image format. Use PNG, JPG, JPEG, WEBP, GIF, AVIF, HEIC, HEIF, or SVG."
    );
  }

  if (entry.size > MAX_IMAGE_UPLOAD_BYTES) {
    throw new Error("Image upload failed. Files must be 4 MB or smaller.");
  }

  const bucket = getFirebaseAdminBucket();
  if (!bucket) {
    console.error("Firebase Storage is not configured for upload.");
    throw new Error(
      "Image upload is not configured yet. Set the Firebase Storage bucket env var before uploading files."
    );
  }

  const extensionFromName = entry.name.includes(".") ? entry.name.split(".").pop()?.toLowerCase() : null;
  const safeExtension =
    (extensionFromName && /^[a-z0-9]+$/i.test(extensionFromName) ? extensionFromName : null) ||
    EXTENSION_BY_MIME_TYPE[entry.type] ||
    "jpg";
  const objectPath = `${storagePath}.${safeExtension}`;
  const file = bucket.file(objectPath);
  const buffer = Buffer.from(await entry.arrayBuffer());
  const downloadToken = randomUUID();

  try {
    await file.save(buffer, {
      metadata: {
        contentType: entry.type,
        metadata: {
          firebaseStorageDownloadTokens: downloadToken
        }
      },
      resumable: false,
      public: false
    });
  } catch (error) {
    console.error(`Image upload failed for ${fieldName}`, error);
    const errorText =
      error instanceof Error
        ? `${error.message} ${error.stack || ""}`
        : typeof error === "string"
          ? error
          : JSON.stringify(error);

    if (errorText.includes('"code": 412') || errorText.toLowerCase().includes("necessary permissions")) {
      throw new Error(
        "Image upload is not ready yet. Firebase Storage still needs to be linked in the Firebase console. Use the image link field for now, or finish the bucket-link step first."
      );
    }

    if (
      errorText.toLowerCase().includes("permission") ||
      errorText.toLowerCase().includes("forbidden") ||
      errorText.includes('"code": 403')
    ) {
      throw new Error(
        "Image upload failed because the Firebase service account cannot write to Storage. Check the bucket permissions for this project."
      );
    }

    throw new Error(
      "Image upload failed. Try PNG, JPG, JPEG, WEBP, GIF, AVIF, HEIC, HEIF, or SVG, or use the image link field instead."
    );
  }

  return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(objectPath)}?alt=media&token=${downloadToken}`;
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
        church_image_url: "",
        pastor_image_url: "",
        logo_image_url: "",
        service_hours: [],
        online_worship_url: "",
        ministries: payload.ministries
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
      church_image_url: submission.data.churchImageUrl || "",
      pastor_image_url: submission.data.pastorImageUrl || "",
      logo_image_url: submission.data.logoImageUrl || "",
      service_hours: submission.data.serviceHours,
      online_worship_url: submission.data.onlineWorshipUrl,
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

export async function updateChurchAction(formData: FormData): Promise<ActionResult> {
  try {
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

    const churchImageUrl =
      (await uploadImageIfProvided(formData, "churchImage", `${tenant.id}/churches/${churchId}/church-photo-${Date.now()}`)) ||
      payload.churchImageUrl ||
      currentChurch.churchImageUrl ||
      "";
    const pastorImageUrl =
      (await uploadImageIfProvided(formData, "pastorImage", `${tenant.id}/churches/${churchId}/pastor-photo-${Date.now()}`)) ||
      payload.pastorImageUrl ||
      currentChurch.pastorImageUrl ||
      "";
    const logoImageUrl =
      (await uploadImageIfProvided(formData, "churchLogo", `${tenant.id}/churches/${churchId}/logo-${Date.now()}`)) ||
      payload.logoImageUrl ||
      currentChurch.logoImageUrl ||
      "";

    await db.collection("churches").doc(churchId).set(
      {
        tenant_id: tenant.id,
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
        church_image_url: churchImageUrl,
        pastor_image_url: pastorImageUrl,
        logo_image_url: logoImageUrl,
        service_hours: payload.serviceHours,
        online_worship_url: payload.onlineWorshipUrl,
        status: payload.status,
        source: payload.source,
        notes: payload.notes,
        last_updated: new Date().toISOString().slice(0, 10),
        location: currentChurch.location,
        ministries: payload.ministries
      },
      { merge: true }
    );

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

    return {
      ok: true,
      message: "Church changes saved."
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Church changes could not be saved."
    };
  }
}

export async function deleteChurchAction(formData: FormData): Promise<ActionResult> {
  try {
    const tenantSlug = String(formData.get("tenantSlug") || "");
    const churchId = String(formData.get("churchId") || "");

    const { tenant, user } = await requireTenantRole(tenantSlug, ["admin", "overseer", "bishop", "pastor"]);
    const db = getFirebaseAdminDb();

    if (!db) {
      throw new Error("Firebase admin is not configured.");
    }

    const currentChurch = await getChurchByTenantAndId(tenantSlug, churchId);
    if (!currentChurch) {
      throw new Error("Church not found.");
    }

    assertRoleScopedDistrict(user, currentChurch.district);
    assertRoleScopedChurch(user, currentChurch.id);

    await db.collection("churches").doc(churchId).set(
      {
        tenant_id: tenant.id,
        name: currentChurch.name,
        city: currentChurch.city,
        state: currentChurch.state,
        district: currentChurch.district,
        deleted_at: new Date().toISOString(),
        deleted_by: user.uid,
        last_updated: new Date().toISOString().slice(0, 10)
      },
      { merge: true }
    );

    await db.collection("audit_logs").add({
      tenant_id: tenant.id,
      action: "church_deleted",
      church_id: churchId,
      performed_by: user.uid,
      created_at: new Date().toISOString()
    });

    revalidatePath(`/${tenantSlug}`);
    revalidatePath(`/${tenantSlug}/admin`);
    revalidatePath(`/${tenantSlug}/admin/church/${churchId}`);
    revalidatePath(`/${tenantSlug}/church/${churchId}`);

    return {
      ok: true,
      message: "Church profile deleted."
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Church could not be deleted."
    };
  }
}

export async function updateSubmissionAction(formData: FormData): Promise<ActionResult> {
  try {
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

    const churchImageUrl =
      (await uploadImageIfProvided(
        formData,
        "churchImage",
        `${tenant.id}/submissions/${submissionId}/church-photo-${Date.now()}`
      )) ||
      payload.churchImageUrl ||
      currentSubmission.data.churchImageUrl ||
      "";
    const pastorImageUrl =
      (await uploadImageIfProvided(
        formData,
        "pastorImage",
        `${tenant.id}/submissions/${submissionId}/pastor-photo-${Date.now()}`
      )) ||
      payload.pastorImageUrl ||
      currentSubmission.data.pastorImageUrl ||
      "";
    const logoImageUrl =
      (await uploadImageIfProvided(formData, "churchLogo", `${tenant.id}/submissions/${submissionId}/logo-${Date.now()}`)) ||
      payload.logoImageUrl ||
      currentSubmission.data.logoImageUrl ||
      "";

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
        church_image_url: churchImageUrl,
        pastor_image_url: pastorImageUrl,
        logo_image_url: logoImageUrl,
        service_hours: payload.serviceHours,
        online_worship_url: payload.onlineWorshipUrl,
        status: payload.status,
        source: payload.source,
        notes: payload.notes,
        last_updated: new Date().toISOString().slice(0, 10),
        location: currentSubmission.data.location,
        ministries: payload.ministries
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

    return {
      ok: true,
      message: "Submission changes saved."
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Submission changes could not be saved."
    };
  }
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

export async function submitChurchClaimAction(
  tenantSlug: string,
  payload: ChurchClaimPayload
): Promise<ChurchClaimResult> {
  const tenant = await getTenantBySlug(tenantSlug);
  const db = getFirebaseAdminDb();

  if (!tenant || !db) {
    return {
      ok: false,
      message: "Church claiming is not configured yet."
    };
  }

  try {
    assertChurchClaimPayload(payload);

    const existingClaims = await getChurchClaimsByTenant(tenantSlug);
    const duplicatePendingClaim = existingClaims.find(
      (claim) =>
        claim.churchId === payload.churchId &&
        claim.claimantEmail.toLowerCase() === payload.claimantEmail.toLowerCase() &&
        claim.status === "pending"
    );

    if (duplicatePendingClaim) {
      return {
        ok: false,
        message: "A claim request with this email is already waiting for review."
      };
    }

    await db.collection("church_claims").add({
      tenant_id: tenant.id,
      church_id: payload.churchId,
      church_name: payload.churchName,
      claimant_name: payload.claimantName,
      claimant_email: payload.claimantEmail.toLowerCase(),
      claimant_phone: payload.claimantPhone || "",
      role_at_church: payload.roleAtChurch,
      verification_notes: payload.verificationNotes || "",
      created_at: new Date().toISOString(),
      status: "pending"
    });

    revalidatePath(`/${tenantSlug}/church/${payload.churchId}`);
    revalidatePath(`/${tenantSlug}/admin`);

    return {
      ok: true,
      message: "Your request has been sent for review. Admin will verify that you are connected to this church before giving access."
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Unable to submit church claim."
    };
  }
}

export async function reviewChurchClaimAction(formData: FormData) {
  const tenantSlug = String(formData.get("tenantSlug") || "");
  const claimId = String(formData.get("claimId") || "");
  const decision = String(formData.get("decision") || "");

  const { tenant, user } = await requireTenantRole(tenantSlug, ["admin"]);
  const auth = getFirebaseAdminAuth();
  const db = getFirebaseAdminDb();

  if (!auth || !db) {
    throw new Error("Firebase admin is not configured.");
  }

  const claimRef = db.collection("church_claims").doc(claimId);
  const claimDoc = await claimRef.get();

  if (!claimDoc.exists) {
    throw new Error("Claim request not found.");
  }

  const claim = (await getChurchClaimsByTenant(tenantSlug)).find((item) => item.id === claimId);
  if (!claim) {
    throw new Error("Claim request could not be loaded.");
  }

  if (decision === "reject") {
    await claimRef.update({
      status: "rejected",
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.uid
    });
  } else if (decision === "approve") {
    const church = await getChurchByTenantAndId(tenantSlug, claim.churchId);
    if (!church) {
      throw new Error("The church tied to this claim could not be found.");
    }

    try {
      await auth.getUserByEmail(claim.claimantEmail);
      throw new Error("That email already has a Firebase login. Review the account before approving.");
    } catch (error) {
      if (error instanceof Error && !error.message.includes("There is no user record")) {
        throw error;
      }
    }

    const temporaryPassword = generateTemporaryPassword();
    const authUser = await auth.createUser({
      email: claim.claimantEmail,
      password: temporaryPassword,
      displayName: claim.claimantName
    });

    await db.collection("users").doc(authUser.uid).set({
      tenant_id: tenant.id,
      role: "pastor",
      district: church.district || null,
      church_id: church.id,
      name: claim.claimantName,
      email: claim.claimantEmail
    });

    await claimRef.update({
      status: "approved",
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.uid,
      approved_user_uid: authUser.uid,
      temporary_password: temporaryPassword
    });
  } else {
    throw new Error("Unknown claim decision.");
  }

  await db.collection("audit_logs").add({
    tenant_id: tenant.id,
    action: `church_claim_${decision}`,
    church_claim_id: claimId,
    performed_by: user.uid,
    created_at: new Date().toISOString()
  });

  revalidatePath(`/${tenantSlug}/admin`);
  revalidatePath(`/${tenantSlug}/church/${claim.churchId}`);
}

export async function submitPrayerRequestAction(
  tenantSlug: string,
  payload: PrayerPayload
): Promise<PrayerRequestResult> {
  const tenant = await getTenantBySlug(tenantSlug);
  const db = getFirebaseAdminDb();

  if (!tenant || !db) {
    return {
      ok: false,
      message: "Prayer requests are not configured yet."
    };
  }

  try {
    assertPrayerPayload(payload);

    await db.collection("prayer_requests").add({
      tenant_id: tenant.id,
      church_id: payload.churchId || null,
      church_name: payload.churchName || null,
      requester_name: payload.requesterName,
      requester_email: payload.requesterEmail || null,
      requester_phone: payload.requesterPhone || null,
      request: payload.request,
      created_at: new Date().toISOString(),
      status: "new"
    });

    const sendGridApiKey = process.env.SENDGRID_API_KEY;
    const sendGridFromEmail = process.env.SENDGRID_FROM_EMAIL;

    if (sendGridApiKey && sendGridFromEmail) {
      const users = await getUsersByTenant(tenantSlug);
      const adminEmails = users
        .filter((user) => user.role === "admin")
        .map((user) => user.email)
        .filter(Boolean);
      const churchEmail = payload.churchId
        ? (await getChurchByTenantAndId(tenantSlug, payload.churchId))?.email
        : null;
      const recipients = unique([...adminEmails, ...(churchEmail ? [churchEmail] : [])]);

      if (recipients.length) {
        await fetch("https://api.sendgrid.com/v3/mail/send", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${sendGridApiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            personalizations: [
              {
                to: recipients.map((email) => ({ email }))
              }
            ],
            from: { email: sendGridFromEmail, name: `${tenant.name} Prayer Requests` },
            subject: payload.churchName
              ? `New prayer request for ${payload.churchName}`
              : `New prayer request from ${tenant.name}`,
            content: [
              {
                type: "text/plain",
                value: [
                  `Requester: ${payload.requesterName}`,
                  payload.requesterEmail ? `Email: ${payload.requesterEmail}` : null,
                  payload.requesterPhone ? `Phone: ${payload.requesterPhone}` : null,
                  payload.churchName ? `Church: ${payload.churchName}` : null,
                  "",
                  payload.request
                ]
                  .filter(Boolean)
                  .join("\n")
              }
            ]
          })
        });
      }
    }

    revalidatePath(`/${tenantSlug}/admin`);

    return {
      ok: true,
      message: "Your prayer request has been sent."
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Unable to send your prayer request."
    };
  }
}

export async function sendBroadcastMessageAction(
  _previousState: CommunicationResult,
  formData: FormData
): Promise<CommunicationResult> {
  const tenantSlug = String(formData.get("tenantSlug") || "");
  const subject = String(formData.get("subject") || "").trim();
  const body = String(formData.get("body") || "").trim();
  const channel = String(formData.get("channel") || "email").trim() as "email" | "sms" | "both";
  const district = String(formData.get("district") || "").trim();

  const { tenant, user } = await requireTenantRole(tenantSlug, ["admin"]);

  if (!body) {
    return { ok: false, message: "Message body is required." };
  }

  if ((channel === "email" || channel === "both") && !subject) {
    return { ok: false, message: "Email subject is required when sending email." };
  }

  const churches = await getChurchesByTenant(tenantSlug);
  const scopedChurches = district ? churches.filter((church) => church.district === district) : churches;
  const emails = unique(
    scopedChurches
      .map((church) => church.email?.trim().toLowerCase())
      .filter((email): email is string => Boolean(email))
  );
  const phoneNumbers = unique(
    scopedChurches
      .map((church) => normalizePhoneNumber(church.phone))
      .filter((phone): phone is string => Boolean(phone))
  );

  if (!emails.length && (channel === "email" || channel === "both")) {
    return { ok: false, message: "No church email addresses were found for this message." };
  }

  if (!phoneNumbers.length && (channel === "sms" || channel === "both")) {
    return { ok: false, message: "No church phone numbers were found that can receive text messages." };
  }

  const emailRequested = channel === "email" || channel === "both";
  const smsRequested = channel === "sms" || channel === "both";

  try {
    if (emailRequested) {
      const sendGridApiKey = process.env.SENDGRID_API_KEY;
      const sendGridFromEmail = process.env.SENDGRID_FROM_EMAIL;

      if (!sendGridApiKey || !sendGridFromEmail) {
        return {
          ok: false,
          message: "Email sending is not configured yet. Add SENDGRID_API_KEY and SENDGRID_FROM_EMAIL."
        };
      }

      const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${sendGridApiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          personalizations: [
            {
              to: emails.map((email) => ({ email }))
            }
          ],
          from: { email: sendGridFromEmail, name: `${tenant.name} Back Office` },
          subject,
          content: [{ type: "text/plain", value: body }]
        })
      });

      if (!response.ok) {
        const responseText = await response.text();
        return { ok: false, message: `Email sending failed: ${responseText}` };
      }
    }

    if (smsRequested) {
      const twilioSid = process.env.TWILIO_ACCOUNT_SID;
      const twilioToken = process.env.TWILIO_AUTH_TOKEN;
      const twilioFromPhone = process.env.TWILIO_FROM_PHONE;

      if (!twilioSid || !twilioToken || !twilioFromPhone) {
        return {
          ok: false,
          message: "Text messaging is not configured yet. Add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_FROM_PHONE."
        };
      }

      for (const to of phoneNumbers) {
        const payload = new URLSearchParams({
          To: to,
          From: twilioFromPhone,
          Body: body
        });

        const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
          method: "POST",
          headers: {
            Authorization: `Basic ${Buffer.from(`${twilioSid}:${twilioToken}`).toString("base64")}`,
            "Content-Type": "application/x-www-form-urlencoded"
          },
          body: payload.toString()
        });

        if (!response.ok) {
          const responseText = await response.text();
          return { ok: false, message: `Text sending failed: ${responseText}` };
        }
      }
    }

    const db = getFirebaseAdminDb();
    if (db) {
      await db.collection("audit_logs").add({
        tenant_id: tenant.id,
        action: "broadcast_sent",
        channel,
        district: district || null,
        subject: subject || null,
        email_count: emailRequested ? emails.length : 0,
        sms_count: smsRequested ? phoneNumbers.length : 0,
        performed_by: user.uid,
        created_at: new Date().toISOString()
      });
    }

    revalidatePath(`/${tenantSlug}/admin`);

    return {
      ok: true,
      message: `Message sent successfully.${emailRequested ? ` Email recipients: ${emails.length}.` : ""}${smsRequested ? ` Text recipients: ${phoneNumbers.length}.` : ""}`,
      emailCount: emailRequested ? emails.length : 0,
      smsCount: smsRequested ? phoneNumbers.length : 0
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Unable to send the message."
    };
  }
}
