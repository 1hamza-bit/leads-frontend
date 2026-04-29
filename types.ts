export type LeadStatus = 'found' | 'qualifying' | 'qualified' | 'rejected' | 'sent' | 'failed' | 'verified';

export interface ScoreBreakdown {
  nicheAlignment: number;
  commercialIntent: number;
  dataVeracity: number;
}

export interface DecisionMakerInfo {
  name: string;
  role: string;
  contactHint: string;
  linkedinUrl?: string;
}

export interface NicheIntel {
  idealLeadProfile: string;
  buyingSignals: string[];
  suggestedPainPoints: string[];
  competitorFocus: string;
  strictExclusionCriteria: string[];
}

export interface DeepAuditResult {
  realnessScore: number;
  lastActiveDate: string;
  socialProofStrength: 'Low' | 'Medium' | 'High';
  proofPoints: string[];
  verificationEvidence: string;
  isLikelyReal: boolean;
  decisionMaker?: DecisionMakerInfo;
}

export interface SocialLinks {
  instagram?: string;
  linkedin?: string;
  facebook?: string;
}

export interface Lead {
  id: string;
  name: string;
  niche: string;
  city: string;
  email: string;
  phone?: string;
  socials: SocialLinks;
  website: string;
  source: 'Google' | 'Facebook Ads' | 'LinkedIn';
  sourceUrl?: string;
  score: number;
  confidence: number;
  scoreBreakdown: ScoreBreakdown;
  reasoning: string;
  status: LeadStatus;
  contactedAt?: string;
  sentMessage?: string;
  manualNotes?: string;
  isManuallyVerified?: boolean;
  deepAudit?: DeepAuditResult;
}

export interface Campaign {
  id: string;
  userId: string;
  city: string;
  niche: string;
  serviceOffered: string;
  idealCompanyType: string;
  leads: Lead[];
  timestamp: string;
  nicheIntel?: NicheIntel;
}

export interface QualificationCriteria {
  niche: string;
  city: string;
  mustHaveAds: boolean;
  industryKeywords: string[];
  additionalNotes: string;
  idealCompanyType: string;
  nicheIntel?: NicheIntel;
  excludedWebsites?: string[];
}

export type UserRole = 'user' | 'admin';
export type PlanType = 'free' | 'pro' | 'enterprise';

// ── CHANGED: new PlanInfo interface matching what auth.py now returns ─────────
// Returned inside every login, google login, refresh, and /auth/me response.
// Frontend uses this to drive the trial banner and disable the New Hunt button.
export interface PlanInfo {
  plan:                  'free' | 'pro';
  trial_active:          boolean;
  trial_expired:         boolean;
  trial_days_remaining:  number | null;
  trial_ends_at:         string | null;  // ISO datetime string
  credits:               number | null;
  credits_reset_at?:     string | null;
  daily_leads_used:      number | null;
  daily_leads_limit:     number | null;
  daily_leads_remaining: number | null;
}
// ─────────────────────────────────────────────────────────────────────────────

export interface User {
  id:        string;
  email:     string;
  role:      UserRole;
  is_admin:  boolean;
  plan:      'free' | 'pro';
  credits:   number;
  joinedAt:  string;
  username:  string;
  // ── CHANGED: plan_info now lives on the User object ───────────────────────
  // Populated from the login/refresh/me response and stored in localStorage.
  // Optional so existing sessions without it don't break.
  plan_info?: PlanInfo;
  // ─────────────────────────────────────────────────────────────────────────
}

export interface LimitInfo {
  plan:             'free' | 'pro';
  trial_days_left?: number;
  daily_used?:      number;
  daily_limit?:     number;
  daily_remaining?: number;
  credits_left?:    number;
  resets_at?:       string;
}

export interface LoginCredentials {
  email:     string;
  password?: string;
}

export interface RegisterCredentials {
  email:     string;
  password?: string;
  name?:     string;
  username?: string;
}

export interface Plan {
  id:       PlanType;
  name:     string;
  price:    string;
  credits:  number;
  features: string[];
}

export const PLANS: Plan[] = [
  { id: 'free',       name: 'Explorer',  price: '$0',   credits: 10,   features: ['10 Monthly Leads', 'Basic Grounding', 'Manual Export'] },
  { id: 'pro',        name: 'Hunter',    price: '$49',  credits: 250,  features: ['250 Monthly Leads', 'Deep Decision Maker Search', 'Direct Email Outreach'] },
  { id: 'enterprise', name: 'Authority', price: '$199', credits: 2000, features: ['2000 Monthly Leads', 'Priority AI Engine', 'Admin Multi-User Access'] },
];