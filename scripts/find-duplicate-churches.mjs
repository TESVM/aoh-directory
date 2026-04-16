import { cert, getApps, initializeApp } from "firebase-admin/app";
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

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/apostolic overcoming holy|church of god|aoh|apostolic|temple|church/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeAddress(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function main() {
  const tenantId = process.env.IMPORT_TENANT_ID || "tenant-aoh";
  const db = getFirestore(getAdminApp());
  const snapshot = await db.collection("churches").where("tenant_id", "==", tenantId).get();
  const churches = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

  const duplicates = [];

  for (let index = 0; index < churches.length; index += 1) {
    for (let inner = index + 1; inner < churches.length; inner += 1) {
      const a = churches[index];
      const b = churches[inner];
      const sameCityState = a.city === b.city && a.state === b.state;
      const sameWebsite =
        a.website &&
        b.website &&
        String(a.website).toLowerCase().replace(/^https?:\/\//, "") ===
          String(b.website).toLowerCase().replace(/^https?:\/\//, "");
      const samePhone = a.phone && b.phone && String(a.phone).replace(/\D/g, "") === String(b.phone).replace(/\D/g, "");
      const sameAddress =
        a.address &&
        b.address &&
        normalizeAddress(a.address) === normalizeAddress(b.address);
      const similarName =
        normalize(a.name) &&
        normalize(a.name) === normalize(b.name);

      if ((sameCityState && similarName) || sameWebsite || samePhone || (sameCityState && sameAddress)) {
        duplicates.push({
          left: {
            id: a.id,
            name: a.name,
            city: a.city,
            state: a.state,
            address: a.address || "",
            website: a.website || "",
            phone: a.phone || ""
          },
          right: {
            id: b.id,
            name: b.name,
            city: b.city,
            state: b.state,
            address: b.address || "",
            website: b.website || "",
            phone: b.phone || ""
          },
          reasons: {
            sameCityState,
            similarName,
            sameWebsite,
            samePhone,
            sameAddress
          }
        });
      }
    }
  }

  console.log(JSON.stringify(duplicates, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
