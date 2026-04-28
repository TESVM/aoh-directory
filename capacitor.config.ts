import type { CapacitorConfig } from "@capacitor/cli";

const defaultAppUrl = "https://aohdirectory.com/aoh";
const appUrl = process.env.CAP_SERVER_URL?.trim() || defaultAppUrl;

let server: CapacitorConfig["server"];

if (appUrl) {
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(appUrl);
  } catch {
    throw new Error("CAP_SERVER_URL must be a valid absolute URL, for example https://directory.example.org.");
  }

  // This app depends on Next.js server rendering and Firebase auth, so mobile
  // builds should point at the deployed HTTPS site instead of a static export.
  server = {
    url: parsedUrl.toString(),
    cleartext: parsedUrl.protocol === "http:",
    allowNavigation: [parsedUrl.host]
  };
}

const config: CapacitorConfig = {
  appId: "com.techandsolutions.aohdirectory",
  appName: "AOH Church of God Directory",
  webDir: "mobile-shell",
  server
};

export default config;
