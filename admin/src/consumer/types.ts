export interface AuthUser {
  id: string;
  email: string | null;
  phone: string | null;
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  gender: 'MALE' | 'FEMALE' | 'OTHER' | null;
  dob: string | null;
  plan: 'FREE' | 'PRO' | 'ENTERPRISE';
  documentCredits: number;
  profileComplete: boolean;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}

export interface ClauseItem {
  label: string;
  value: string;
}

export interface RiskFlag {
  severity: 'low' | 'medium' | 'high';
  title: string;
  detail: string;
}

export interface DocumentSummary {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number | null;
  status: 'UPLOADED' | 'PROCESSING' | 'READY' | 'FAILED';
  documentType: string | null;
  createdAt: string;
  summary?: { summaryText: string; documentType: string } | null;
  riskAnalysis?: { score: number; level: 'LOW' | 'MEDIUM' | 'HIGH' } | null;
}

export interface DocumentReport extends DocumentSummary {
  language: string;
  extractedText: string | null;
  clauseAnalysis?: { clauses: ClauseItem[] } | null;
  riskAnalysis?: {
    score: number;
    level: 'LOW' | 'MEDIUM' | 'HIGH';
    flags: RiskFlag[];
    suggestions: string[];
  } | null;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export type PayablePlan = 'PRO' | 'ENTERPRISE';

export interface RazorpayOrder {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
}

export type CreditPack = 'PACK_5' | 'PACK_10';

export interface ComparisonDifference {
  aspect: string;
  documentAValue: string;
  documentBValue: string;
  note: string;
}

export interface ComparisonResult {
  documentA: { id: string; fileName: string };
  documentB: { id: string; fileName: string };
  verdict: string;
  differences: ComparisonDifference[];
}

export interface KeyDate {
  label: string;
  detail: string;
}

export interface TemplateTypeOption {
  key: string;
  label: string;
}

export type SeatTier = 'STANDARD' | 'PREMIUM';

export interface OrganizationMember {
  userId: string;
  role: 'OWNER' | 'MEMBER';
  joinedAt: string;
  name: string | null;
  email: string | null;
  phone: string | null;
}

export interface Organization {
  id: string;
  name: string;
  role: 'OWNER' | 'MEMBER';
  seatTier: SeatTier;
  seatCount: number;
  subscriptionStatus: 'CREATED' | 'ACTIVE' | 'PAST_DUE' | 'CANCELLED';
  members: OrganizationMember[];
}

export interface TeamSubscriptionOrder {
  organizationId: string;
  razorpaySubscriptionId: string;
  keyId: string;
}
