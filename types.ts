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

// ── MATCHES BACKEND PY DICTIONARY KEYS ───────────────────────────────────────
export type PlanType = 'tester' | 'free' | 'starter' | 'pro' | 'agency' | 'admin';

export interface PlanInfo {
  plan: PlanType;
  trial_active: boolean;
  trial_expired: boolean;
  trial_days_remaining: number | null;
  trial_ends_at: string | null;  // ISO string format
  credits: number | null;        // Represents backend searches or credits left
  credits_reset_at?: string | null;
  daily_leads_used: number | null;
  daily_leads_limit: number | null;
  daily_leads_remaining: number | null;
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  is_admin: boolean;
  plan: PlanType;
  credits: number;
  joinedAt: string;
  username: string;
  plan_info?: PlanInfo;
}

export interface LimitInfo {
  plan: PlanType;
  trial_days_left?: number;
  daily_used?: number;
  daily_limit?: number;
  daily_remaining?: number;
  credits_left?: number;
  resets_at?: string;
}

export interface LoginCredentials {
  email: string;
  password?: string;
}

export interface RegisterCredentials {
  email: string;
  password?: string;
  name?: string;
  username?: string;
}

// ── FRONTEND PUBLIC PRICING CARD MATRIX ──────────────────────────────────────
export interface PricingPlan {
  id: PlanType;
  name: string;
  price: string;
  searches: string;
  dailyLimit: string;
  leadsPerSearch: number;
  deepAudits: number;
  features: string[];
}

// Note: 'tester' and 'admin' are excluded from the public layout matrix grid 
// but fully supported by the system execution engine above.
export const PLANS: PricingPlan[] = [
  {
    id: 'tester',
    name: 'Trial Configuration',
    price: '$0',
    searches: '10 Hunts Total',
    dailyLimit: '3 Hunts / day',
    leadsPerSearch: 15,
    deepAudits: 5,
    features: [
      '15 Leads per search execution',
      '3 Hunts allowed per day max',
      '5 Deep Audit verification credits included',
      'Basic identity grounding checks',
      'No external format exports available'
    ]
  },
  {
    id: 'free',
    name: 'Free Tier',
    price: '$0',
    searches: '5 Hunts Total',
    dailyLimit: '1 Hunt / day',
    leadsPerSearch: 10,
    deepAudits: 0,
    features: [
      '10 Leads per search execution',
      'Strict 1 Hunt baseline daily limit',
      'Basic identity grounding checks',
      'No external format exports available'
    ]
  },
  {
    id: 'starter',
    name: 'Starter',
    price: '$29',
    searches: '100 Hunts',
    dailyLimit: '15 Hunts / day',
    leadsPerSearch: 30,
    deepAudits: 100,
    features: [
      '30 Leads per search execution',
      'Up to 15 search hunts per day',
      '100 Deep Audit verification credits',
      'Standard .CSV data formatting exports',
      'Social layers & intent detection active'
    ]
  },
  {
    id: 'pro',
    name: 'Pro Pack',
    price: '$79',
    searches: '500 Hunts',
    dailyLimit: '50 Hunts / day',
    leadsPerSearch: 75,
    deepAudits: 500,
    features: [
      '75 Leads per search execution',
      'Generous 50 search hunts per day',
      '500 Deep Audit verification credits',
      'Bulk execution pipelines enabled',
      'Exports to CSV, Excel, HubSpot, Salesforce'
    ]
  },
  {
    id: 'agency',
    name: 'Agency Elite',
    price: '$199',
    searches: 'Unlimited Hunts',
    dailyLimit: 'Unlimited',
    leadsPerSearch: 150,
    deepAudits: 2500,
    features: [
      'Uncapped hunt executions completely',
      'No dynamic daily caps enforced',
      '150 Leads per single search execution',
      '2,500 Deep Audit verification credits',
      'Includes up to 5 shared workspace team seats',
      'Exports to CSV, Excel, JSON, HubSpot, Salesforce'
    ]
  }
];