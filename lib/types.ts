export type VerificationStatus = "verified" | "pending" | "submitted";
export type ViewerRole = "admin" | "overseer" | "bishop" | "pastor" | "public";
export type ReportingQuarter = "Q1" | "Q2" | "Q3" | "Q4";
export type QuarterlyReportStatus = "draft" | "submitted" | "reviewed";

export type Tenant = {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  heroEyebrow?: string;
  heroTitle?: string;
  heroDescription?: string;
  showDistricts?: boolean;
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
  pastorMessengerUrl?: string;
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

export type QuarterlyReport = {
  id: string;
  tenantId: string;
  churchId: string;
  churchName: string;
  district: string;
  pastorName: string;
  quarter: ReportingQuarter;
  year: number;
  status: QuarterlyReportStatus;
  submittedAt: string;
  reviewedAt?: string;
  reviewedByName?: string;
  notes?: string;
  pastorReport: {
    attendanceTotals: {
      totalAttendance: number;
      sundaySchool: number;
      poor: number;
      youth: number;
      bibleStudy: number;
      mothers: number;
      missionaries: number;
      specialEfforts: number;
      deacons: number;
      womensDepartment: number;
      choir: number;
    };
    receipts: {
      buildingFund: number;
      offering: number;
      tithes: number;
      bishopsTithes: number;
      visitingChurchFund: number;
      taxes: number;
      pastorTithes: number;
      churchTithes: number;
      generalFund: number;
    };
    disbursements: {
      quarterly: number;
      taxes: number;
      pastorAide: number;
      sundaySchool: number;
      poor: number;
      mothers: number;
      missionaries: number;
      deacons: number;
      youth: number;
      buildingFund: number;
      loveOffering: number;
    };
    districtRemittance: {
      reportedToDistrict: number;
      pastorTithesReported: number;
      publication: number;
      disasterRelief: number;
      publicOffering: number;
      quarterlyMeetingTotal: number;
      overseerSupport: number;
      assistantOverseerSupport: number;
    };
  };
};
