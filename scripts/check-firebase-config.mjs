const requiredClient = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID"
];

const requiredStorage = ["NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"];

const requiredAdmin = [
  "FIREBASE_PROJECT_ID",
  "FIREBASE_CLIENT_EMAIL",
  "FIREBASE_PRIVATE_KEY"
];

function checkSet(keys) {
  return keys.map((key) => ({
    key,
    present: Boolean(process.env[key])
  }));
}

const clientStatus = checkSet(requiredClient);
const storageStatus = checkSet(requiredStorage);
const adminStatus = checkSet(requiredAdmin);

console.log("Firebase client env:");
for (const item of clientStatus) {
  console.log(`- ${item.key}: ${item.present ? "set" : "missing"}`);
}

console.log("\nFirebase storage env:");
for (const item of storageStatus) {
  console.log(`- ${item.key}: ${item.present ? "set" : "missing"}`);
}

console.log("\nFirebase admin env:");
for (const item of adminStatus) {
  console.log(`- ${item.key}: ${item.present ? "set" : "missing"}`);
}

const missing = [...clientStatus, ...storageStatus, ...adminStatus].filter((item) => !item.present);
if (missing.length) {
  console.error("\nFirebase configuration is incomplete.");
  process.exit(1);
}

console.log("\nFirebase configuration looks complete.");
