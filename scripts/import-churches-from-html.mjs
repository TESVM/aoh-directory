import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const tenantId = process.env.IMPORT_TENANT_ID || "tenant-aoh";
const htmlPath =
  process.env.IMPORT_HTML_PATH ||
  "/Users/tes/Downloads/aoh_church_directory.html";

const stateMap = {
  Alabama: "AL",
  Mississippi: "MS",
  Texas: "TX",
  Louisiana: "LA",
  Maryland: "MD",
  "New York": "NY",
  Florida: "FL",
  "South Carolina": "SC",
  Illinois: "IL",
  Indiana: "IN",
  Ohio: "OH",
  Kentucky: "KY",
  Michigan: "MI",
  Missouri: "MO",
  Iowa: "IA",
  Wisconsin: "WI",
  Washington: "WA",
  Tennessee: "TN",
  California: "CA",
  Colorado: "CO",
  Pennsylvania: "PA",
  Georgia: "GA"
};

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

function slugify(value) {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeWebsite(value) {
  if (!value) return "";
  return String(value).replace(/^https?:\/\//, "").trim();
}

function parseChurchesArrayFromHtml(html) {
  const match = html.match(/const churches = \[(.*?)\];/s);
  if (!match) {
    throw new Error("Could not find churches array in HTML file.");
  }

  const code = `churches = [${match[1]}];`;
  const sandbox = { churches: [] };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox);
  return sandbox.churches;
}

function mapChurch(church) {
  const state = stateMap[church.state] || church.state;
  const city = church.city || "";
  const name = church.name || "";
  const id = slugify(`${name}-${city}-${state}`);

  return {
    id,
    tenant_id: tenantId,
    name,
    pastor_name: church.pastor || "",
    pastor_title: church.title || "",
    address: church.addr || "",
    city,
    state,
    zip: church.zip || "",
    district: church.district || "",
    phone: church.phone || "",
    email: church.email || "",
    website: normalizeWebsite(church.website),
    status: "pending",
    source: "Official-style HTML directory",
    last_updated: new Date().toISOString().slice(0, 10),
    location: { lat: 0, lng: 0 },
    ministries: [],
    notes: "Imported from local aoh_church_directory.html correction file."
  };
}

async function main() {
  if (!fs.existsSync(htmlPath)) {
    throw new Error(`HTML file not found: ${htmlPath}`);
  }

  const html = fs.readFileSync(htmlPath, "utf8");
  const churches = parseChurchesArrayFromHtml(html);
  const mapped = churches.map(mapChurch);
  const db = getFirestore(getAdminApp());

  for (const church of mapped) {
    await db.collection("churches").doc(church.id).set(church, { merge: true });
    console.log(`Imported churches/${church.id}`);
  }

  console.log(`HTML import complete: ${mapped.length} churches.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
