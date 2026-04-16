export type VerificationStatus = "verified" | "pending" | "submitted";
export type ViewerRole = "admin" | "district_leader" | "public";

export type Tenant = {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  branding: {
    color: string;
    accent: string;
    logoText: string;
  };
};

export type Church = {
  id: string;
  tenantId: string;
  name: string;
  pastorName: string;
  pastorTitle: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  district: string;
  phone?: string;
  email?: string;
  website?: string;
  status: VerificationStatus;
  source: string;
  lastUpdated: string;
  location: {
    lat: number;
    lng: number;
  };
  ministries: string[];
  notes?: string;
};

export type Submission = {
  id: string;
  tenantId: string;
  churchId?: string;
  data: Omit<Church, "id" | "tenantId">;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
};

export type UserRecord = {
  uid: string;
  tenantId: string;
  role: Exclude<ViewerRole, "public">;
  district?: string;
  name: string;
  email: string;
};

export type ViewerContext = {
  tenant: Tenant;
  role: ViewerRole;
  district?: string;
  user?: UserRecord;
};
