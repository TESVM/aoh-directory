import fs from "node:fs";
import path from "node:path";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const tenantId = process.env.IMPORT_TENANT_ID || "tenant-aoh";
const csvPath =
  process.env.IMPORT_CSV_PATH ||
  path.resolve(process.cwd(), "data/imports/aoh-churches-template.csv");

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

function parseCsvLine(line) {
  const values = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];

    if (char === '"') {
      if (inQuotes && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current);
  return values.map((value) => value.trim());
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseCsvFile(filePath) {
  const raw = fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, "");
  const lines = raw.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length < 2) {
    return [];
  }

  const headers = parseCsvLine(lines[0]);
  return lines.slice(1).map((line, rowIndex) => {
    const values = parseCsvLine(line);
    const row = Object.fromEntries(headers.map((header, index) => [header, values[index] || ""]));
    row.__row = String(rowIndex + 2);
    return row;
  });
}

function mapRowToChurch(row) {
  const name = row.church_name;
  const city = row.city;
  const state = row.state.toUpperCase();
  const derivedId = slugify(`${name}-${city}-${state}`);

  return {
    id: derivedId,
    tenant_id: tenantId,
    name,
    pastor_name: row.pastor_name,
    pastor_title: row.pastor_title || "Pastor",
    address: row.address,
    city,
    state,
    zip: row.zip,
    district: row.district,
    phone: row.phone,
    email: row.email,
    website: row.website,
    status: row.status || "pending",
    source: row.source || "CSV import",
    last_updated: row.last_updated || new Date().toISOString().slice(0, 10),
    location: {
      lat: Number(row.lat || 0),
      lng: Number(row.lng || 0)
    },
    ministries: row.ministries
      ? row.ministries.split("|").map((item) => item.trim()).filter(Boolean)
      : [],
    notes: row.notes || ""
  };
}

async function main() {
  if (!fs.existsSync(csvPath)) {
    throw new Error(`CSV file not found: ${csvPath}`);
  }

  const app = getAdminApp();
  const db = getFirestore(app);
  const rows = parseCsvFile(csvPath);

  if (!rows.length) {
    throw new Error("CSV file has no import rows.");
  }

  for (const row of rows) {
    if (!row.church_name || !row.city || !row.state) {
      console.log(`Skipped row ${row.__row}: missing church_name, city, or state`);
      continue;
    }

    const church = mapRowToChurch(row);
    await db.collection("churches").doc(church.id).set(church, { merge: true });
    console.log(`Imported churches/${church.id}`);
  }

  console.log(`CSV import complete for tenant ${tenantId}.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
