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

const duplicatePlans = [
  {
    keepId: "new-beginning-aoh-church-of-god-cincinnati-oh",
    removeId: "aoh-church-of-god-cincinnati-oh",
    merge: {
      notes:
        "Merged duplicate Cincinnati listing. Older generic AOH record removed in favor of New Beginning record."
    }
  },
  {
    keepId: "northport-apostolic-overcoming-holy-aoh-church-of-god-northport-al",
    removeId: "northport-aoh-church-of-god-northport-al",
    merge: {
      email: "northportaohchurch@gmail.com",
      notes:
        "Merged duplicate Northport listing. Screenshot record removed after preserving email on richer website record."
    }
  },
  {
    keepId: "sheriff-temple-a-o-h-church-of-god-champaign-il",
    removeId: "sheriff-temple-aoh-church-of-god-champaign-il",
    merge: {
      notes:
        "Merged duplicate Sheriff Temple listing. Kept corrected A.O.H. name and 601 E Vine St address."
    }
  }
];

async function main() {
  const db = getFirestore(getAdminApp());

  for (const plan of duplicatePlans) {
    const keepRef = db.collection("churches").doc(plan.keepId);
    const removeRef = db.collection("churches").doc(plan.removeId);

    const [keepDoc, removeDoc] = await Promise.all([keepRef.get(), removeRef.get()]);

    if (!keepDoc.exists || !removeDoc.exists) {
      console.log(`Skipped ${plan.removeId}: one of the records was missing.`);
      continue;
    }

    await keepRef.set(plan.merge, { merge: true });
    await removeRef.delete();
    console.log(`Removed duplicate ${plan.removeId} and kept ${plan.keepId}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
