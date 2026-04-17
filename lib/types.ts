export type VerificationStatus = "verified" | "pending" | "submitted";
export type ViewerRole = "admin" | "overseer" | "bishop" | "pastor" | "public";

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
  churchImageUrl?: string;
  pastorImageUrl?: string;
  logoImageUrl?: string;
  serviceHours?: string[];
  onlineWorshipUrl?: string;
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

export type PrayerRequest = {
  id: string;
  tenantId: string;
  churchId?: string;
  churchName?: string;
  requesterName: string;
  requesterEmail?: string;
  requesterPhone?: string;
  request: string;
  createdAt: string;
  status: "new" | "reviewed";
};

export type ChurchClaim = {
  id: string;
  tenantId: string;
  churchId: string;
  churchName: string;
  claimantName: string;
  claimantEmail: string;
  claimantPhone?: string;
  roleAtChurch: string;
  verificationNotes: string;
  createdAt: string;
  status: "pending" | "approved" | "rejected";
  reviewedAt?: string;
  approvedUserUid?: string;
  temporaryPassword?: string;
};

export type UserRecord = {
  uid: string;
  tenantId: string;
  role: Exclude<ViewerRole, "public">;
  district?: string;
  churchId?: string;
  name: string;
  email: string;
};

export type ViewerContext = {
  tenant: Tenant;
  role: ViewerRole;
  district?: string;
  churchId?: string;
  user?: UserRecord;
};
