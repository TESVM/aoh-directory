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

const tenantId = "tenant-aoh";
const lastUpdated = "2026-04-17";

const churches = [
  {
    id: "sheriff-temple-a-o-h-church-of-god-champaign-il",
    name: "Sheriff Temple A.O.H. Church of God",
    pastor_name: "James Wright",
    pastor_title: "Pastor",
    address: "601 E Vine St",
    city: "Champaign",
    state: "IL",
    zip: "61820",
    district: "",
    phone: "",
    email: "",
    website: "https://staoh.com",
    online_worship_url: "https://staoh.com/live-stream",
    service_hours: ["Sunday Morning Worship - 12:00 PM"],
    status: "pending",
    source: "User roll call",
    logo_image_url: "/church-logos/sheriff-temple-aoh.svg",
    ministries: [],
    notes: "Updated from April 17, 2026 roll call post with pastor, website, logo, and Sunday worship time."
  },
  {
    id: "chosen-generations-aoh-church-of-god-everett-wa",
    name: "Chosen Generations AOH Church of God",
    pastor_name: "Dennis Moton",
    pastor_title: "Pastor",
    address: "",
    city: "Everett",
    state: "WA",
    zip: "",
    district: "",
    phone: "",
    email: "",
    website: "https://chosengenerations.com",
    online_worship_url: "",
    service_hours: ["Sunday Worship - 1:00 PM Pacific Time"],
    status: "pending",
    source: "User roll call",
    logo_image_url: "/church-logos/chosen-generations-aoh.svg",
    ministries: [],
    notes: "Added from April 17, 2026 roll call post with pastor, logo, website, and Sunday worship time."
  },
  {
    id: "bethesda-temple-aoh-church-of-god-birmingham-al",
    name: "Bethesda Temple A.O.H Church of God",
    pastor_name: "Donald J Gill",
    pastor_title: "Elder",
    address: "2801 35th Ave North",
    city: "Birmingham",
    state: "AL",
    zip: "35207",
    district: "",
    phone: "205-322-3297",
    email: "",
    website: "",
    online_worship_url: "",
    service_hours: [
      "Wednesday Night - 6:00 PM",
      "Sunday School - 9:30 AM",
      "Sunday Worship - 11:00 AM"
    ],
    status: "pending",
    source: "User roll call",
    logo_image_url: "/church-logos/bethesda-temple-aoh.svg",
    ministries: [],
    notes: "Updated from April 17, 2026 roll call post. User described the church as a loving church."
  }
];

async function upsertChurches() {
  const db = getFirestore(getAdminApp());

  for (const church of churches) {
    await db.collection("churches").doc(church.id).set(
      {
        tenant_id: tenantId,
        location: { lat: 0, lng: 0 },
        last_updated: lastUpdated,
        ...church
      },
      { merge: true }
    );

    console.log(`Upserted churches/${church.id}`);
  }
}

upsertChurches().catch((error) => {
  console.error(error);
  process.exit(1);
});
