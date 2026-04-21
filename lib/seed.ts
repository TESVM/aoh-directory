import { Church, Submission, Tenant, UserRecord } from "@/lib/types";
import importedAohRoster from "@/data/generated/aoh-local-roster.json";

export const seededTenants: Tenant[] = [
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
  },
  {
    id: "tenant-demo",
    name: "Network Demo Tenant",
    slug: "demo",
    tagline: "Second tenant proving route and data isolation.",
    branding: {
      color: "#7f2d2d",
      accent: "#1d2430",
      logoText: "Demo Directory"
    }
  }
];

const importedAohChurches = importedAohRoster as Church[];

export const seededChurches: Church[] = [
  ...importedAohChurches,
  {
    id: "steadfast-chicago",
    tenantId: "tenant-demo",
    name: "Steadfast Fellowship",
    pastorName: "Nina Brooks",
    pastorTitle: "Pastor",
    address: "18 East 95th Street",
    city: "Chicago",
    state: "IL",
    zip: "60619",
    district: "Central",
    phone: "(773) 555-0111",
    email: "hello@steadfast.example.org",
    website: "https://steadfast.example.org",
    status: "verified",
    source: "Demo tenant seed",
    lastUpdated: "2026-04-15",
    location: { lat: 41.721, lng: -87.621 },
    ministries: ["Community", "Outreach"]
  }
];

export const seededSubmissions: Submission[] = [
  {
    id: "sub-1",
    tenantId: "tenant-aoh",
    status: "pending",
    createdAt: "2026-04-14",
    data: {
      name: "Victory Temple Fellowship",
      pastorName: "Alicia Reed",
      pastorTitle: "Pastor",
      address: "219 Carter Avenue",
      city: "Birmingham",
      state: "AL",
      zip: "35211",
      district: "2",
      phone: "(205) 555-0170",
      email: "info@victorytemple.example.org",
      website: "https://victorytemple.example.org",
      status: "submitted",
      source: "Public submission",
      lastUpdated: "2026-04-14",
      location: { lat: 33.4801, lng: -86.851 },
      serviceHours: [],
      ministries: ["Youth", "Outreach"],
      notes: "Submitted through public registration form."
    }
  },
  {
    id: "sub-2",
    tenantId: "tenant-aoh",
    status: "pending",
    createdAt: "2026-04-13",
    data: {
      name: "Temple of Reconciliation",
      pastorName: "Harold Stone",
      pastorTitle: "Overseer",
      address: "1301 Poydras Street",
      city: "New Orleans",
      state: "LA",
      zip: "70112",
      district: "4",
      phone: "(504) 555-0115",
      email: "contact@reconciliation.example.org",
      website: "https://reconciliation.example.org",
      status: "submitted",
      source: "Public submission",
      lastUpdated: "2026-04-13",
      location: { lat: 29.9511, lng: -90.0796 },
      serviceHours: [],
      ministries: ["Prayer", "Relief"],
      notes: "Potential duplicate address not yet reviewed."
    }
  }
];

export const seededUsers: UserRecord[] = [
  {
    uid: "admin-aoh",
    tenantId: "tenant-aoh",
    role: "admin",
    name: "AOH Admin",
    email: "admin@aohdirectory.org"
  },
  {
    uid: "leader-d3",
    tenantId: "tenant-aoh",
    role: "overseer",
    district: "3",
    name: "District 3 Overseer",
    email: "district3@aohdirectory.org"
  }
];
