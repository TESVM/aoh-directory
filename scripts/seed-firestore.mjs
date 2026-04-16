import { cert, initializeApp, getApps } from "firebase-admin/app";
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

const tenants = [
  {
    id: "tenant-aoh",
    name: "Apostolic Overcoming Holy Church of God, Inc.",
    slug: "aoh",
    tagline: "A growing directory for churches, districts, and leadership across the network.",
    branding: {
      color: "#704710",
      accent: "#254441",
      logoText: "AOH Directory"
    }
  }
];

const churches = [
  {
    id: "greater-hope-mobile",
    tenant_id: "tenant-aoh",
    name: "Greater Hope Temple",
    pastor_name: "Marcus Bennett",
    pastor_title: "Bishop",
    address: "1248 West Congress Street",
    city: "Mobile",
    state: "AL",
    zip: "36603",
    district: "1",
    phone: "(251) 555-0188",
    email: "office@greaterhopetemple.org",
    website: "https://greaterhopetemple.example.org",
    status: "verified",
    source: "Headquarters roster",
    last_updated: "2026-04-15",
    location: { lat: 30.6832, lng: -88.0721 },
    ministries: ["Youth", "Prayer", "Outreach"],
    notes: "Regional host church for district meetings."
  },
  {
    id: "new-light-jackson",
    tenant_id: "tenant-aoh",
    name: "New Light Tabernacle",
    pastor_name: "Elaine Foster",
    pastor_title: "Elder",
    address: "901 Maple Street",
    city: "Jackson",
    state: "MS",
    zip: "39203",
    district: "3",
    phone: "(601) 555-0124",
    email: "connect@newlighttabernacle.org",
    website: "https://newlighttabernacle.example.org",
    status: "verified",
    source: "District council listing",
    last_updated: "2026-04-12",
    location: { lat: 32.3007, lng: -90.1848 },
    ministries: ["Women", "Bible Study"],
    notes: "Strong district leadership involvement."
  }
];

const users = [
  {
    uid: "cAmG8FwfMHc94stMCMkmr3Fxkia2",
    tenant_id: "tenant-aoh",
    role: "admin",
    name: "AOH Admin",
    email: "admin@aohdirectory.org"
  },
  {
    uid: "REPLACE_WITH_FIREBASE_UID_DISTRICT",
    tenant_id: "tenant-aoh",
    role: "district_leader",
    district: "3",
    name: "District 3 Leader",
    email: "district3@aohdirectory.org"
  }
];

async function upsertCollection(db, collectionName, docs, idField = "id") {
  for (const doc of docs) {
    const docId = doc[idField];
    const { [idField]: _ignored, ...data } = doc;
    await db.collection(collectionName).doc(docId).set(data, { merge: true });
    console.log(`Seeded ${collectionName}/${docId}`);
  }
}

async function main() {
  const app = getAdminApp();
  const db = getFirestore(app);
  const auth = getAuth(app);

  await upsertCollection(db, "tenants", tenants);
  await upsertCollection(db, "churches", churches);

  for (const user of users) {
    if (user.uid.startsWith("REPLACE_WITH_")) {
      console.log(`Skipped users/${user.email} because uid placeholder was not replaced.`);
      continue;
    }

    const authUser = await auth.getUser(user.uid);
    await db.collection("users").doc(authUser.uid).set(
      {
        tenant_id: user.tenant_id,
        role: user.role,
        district: user.district || null,
        name: user.name,
        email: user.email
      },
      { merge: true }
    );
    console.log(`Seeded users/${authUser.uid}`);
  }

  console.log("Firestore seed complete.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
