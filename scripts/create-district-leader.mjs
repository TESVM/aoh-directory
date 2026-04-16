import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function getRequiredEnv(key) {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required env var: ${key}`);
  }
  return value;
}

function getAdminApp() {
  if (getApps().length) {
    return getApps()[0];
  }

  return initializeApp({
    credential: cert({
      projectId: getRequiredEnv("FIREBASE_PROJECT_ID"),
      clientEmail: getRequiredEnv("FIREBASE_CLIENT_EMAIL"),
      privateKey: getRequiredEnv("FIREBASE_PRIVATE_KEY").replace(/\\n/g, "\n")
    })
  });
}

const email = process.env.DISTRICT_LEADER_EMAIL || "district3@aohdirectory.org";
const password = process.env.DISTRICT_LEADER_PASSWORD || "District3Temp!2026";
const district = process.env.DISTRICT_LEADER_DISTRICT || "3";
const tenantId = process.env.DISTRICT_LEADER_TENANT_ID || "tenant-aoh";
const name = process.env.DISTRICT_LEADER_NAME || `District ${district} Leader`;

async function main() {
  const app = getAdminApp();
  const auth = getAuth(app);
  const db = getFirestore(app);

  let user;

  try {
    user = await auth.getUserByEmail(email);
    console.log(`Found existing auth user ${email}`);
  } catch {
    user = await auth.createUser({
      email,
      password,
      displayName: name
    });
    console.log(`Created auth user ${email}`);
  }

  await db.collection("users").doc(user.uid).set(
    {
      tenant_id: tenantId,
      role: "district_leader",
      district,
      name,
      email
    },
    { merge: true }
  );

  console.log(`Saved Firestore user record for ${email}`);
  console.log(`UID: ${user.uid}`);
  console.log(`Temporary password: ${password}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
