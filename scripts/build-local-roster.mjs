import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const IMPORT_DIR = path.join(ROOT, "data", "imports");
const OUTPUT_DIR = path.join(ROOT, "data", "generated");
const OUTPUT_PATH = path.join(OUTPUT_DIR, "aoh-local-roster.json");

const SOURCE_FILES = [
  "aoh-from-screenshots.csv",
  "aoh-from-google.csv",
  "aoh-additional-web-sweep.csv",
  "aoh-midwest-sweep.csv",
  "aoh-ohio-additions.csv",
  "aoh-washington.csv",
  "aoh-user-additions.csv"
];

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

function parseCsvFile(filePath) {
  const raw = fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, "");
  const lines = raw.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);

    // Some hand-built CSV rows have an extra blank cell immediately before `status`.
    if (
      values.length === headers.length + 1 &&
      values[11] === "" &&
      ["pending", "verified", "submitted"].includes(values[12])
    ) {
      values.splice(11, 1);
    }

    return Object.fromEntries(headers.map((header, index) => [header, values[index] || ""]));
  });
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/apostolic overcoming holy|church of god|aoh|apostolic|church|temple/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizedKey(row) {
  return [normalize(row.church_name), normalize(row.city), normalize(row.state)].join("|");
}

function richnessScore(row) {
  return [
    row.pastor_name,
    row.pastor_title,
    row.address,
    row.zip,
    row.district,
    row.phone,
    row.email,
    row.website,
    row.notes
  ].filter(Boolean).length;
}

function firstNonEmpty(...values) {
  return values.find((value) => String(value || "").trim()) || "";
}

function mergeField(preferred, alternate) {
  return firstNonEmpty(preferred, alternate);
}

function mergeRows(current, next) {
  const preferred = richnessScore(next) > richnessScore(current) ? next : current;
  const alternate = preferred === current ? next : current;
  const mergedNotes = [current.notes, next.notes]
    .filter(Boolean)
    .filter((value, index, list) => list.indexOf(value) === index)
    .join(" | ");

  return {
    church_name: mergeField(preferred.church_name, alternate.church_name),
    pastor_name: mergeField(preferred.pastor_name, alternate.pastor_name),
    pastor_title: mergeField(preferred.pastor_title, alternate.pastor_title),
    address: mergeField(preferred.address, alternate.address),
    city: mergeField(preferred.city, alternate.city),
    state: mergeField(preferred.state, alternate.state).toUpperCase(),
    zip: mergeField(preferred.zip, alternate.zip),
    district: mergeField(preferred.district, alternate.district),
    phone: mergeField(preferred.phone, alternate.phone),
    email: mergeField(preferred.email, alternate.email),
    website: mergeField(preferred.website, alternate.website),
    status: mergeField(preferred.status, alternate.status) || "pending",
    source: [current.source, next.source]
      .filter(Boolean)
      .filter((value, index, list) => list.indexOf(value) === index)
      .join(" + "),
    last_updated: mergeField(preferred.last_updated, alternate.last_updated) || "2026-04-21",
    lat: mergeField(preferred.lat, alternate.lat),
    lng: mergeField(preferred.lng, alternate.lng),
    ministries: mergeField(preferred.ministries, alternate.ministries),
    notes: mergedNotes
  };
}

function mapRowToChurch(row) {
  const name = row.church_name.trim();
  const city = row.city.trim();
  const state = row.state.trim().toUpperCase();

  return {
    id: slugify(`${name}-${city}-${state}`),
    tenantId: "tenant-aoh",
    name,
    pastorName: row.pastor_name.trim(),
    pastorTitle: row.pastor_title.trim(),
    address: row.address.trim(),
    city,
    state,
    zip: row.zip.trim(),
    district: row.district.trim(),
    phone: row.phone.trim(),
    email: row.email.trim(),
    website: row.website.trim(),
    status: row.status === "verified" || row.status === "submitted" ? row.status : "pending",
    source: row.source.trim() || "Public church directory import",
    lastUpdated: row.last_updated.trim() || "2026-04-21",
    location: {
      lat: Number(row.lat || 0),
      lng: Number(row.lng || 0)
    },
    ministries: row.ministries
      ? row.ministries.split("|").map((item) => item.trim()).filter(Boolean)
      : [],
    notes: row.notes.trim()
  };
}

function main() {
  const merged = new Map();

  for (const fileName of SOURCE_FILES) {
    const filePath = path.join(IMPORT_DIR, fileName);
    const rows = parseCsvFile(filePath);

    for (const row of rows) {
      if (!row.church_name || !row.city || !row.state) continue;
      const key = normalizedKey(row);
      merged.set(key, merged.has(key) ? mergeRows(merged.get(key), row) : row);
    }
  }

  const churches = [...merged.values()]
    .map(mapRowToChurch)
    .sort((left, right) =>
      left.state.localeCompare(right.state) ||
      left.city.localeCompare(right.city) ||
      left.name.localeCompare(right.name)
    );

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(churches, null, 2)}\n`);
  console.log(`Wrote ${churches.length} churches to ${OUTPUT_PATH}`);
}

main();
