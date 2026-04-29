import { LoginCredentials, RegisterCredentials, User, PlanInfo } from "@/types";
import api from "../components/api";

export const login = async (credentials: LoginCredentials): Promise<User> => {
  const response = await api.post('/auth/login', credentials);
  console.log('RAW LOGIN RESPONSE:', response.data);
  const { access_token, refresh_token, ...userData } = response.data;

  localStorage.setItem('access_token', access_token);
  localStorage.setItem('refresh_token', refresh_token);

  const mappedUser: User = {
    id:        String(userData.id),
    email:     userData.email,
    username:  userData.username,
    is_admin:  userData.is_admin ?? false,
    role:      userData.role,
    plan:      userData.plan ?? 'free',
    credits:   userData.credits ?? 0,
    joinedAt:  userData.created_at ?? new Date().toISOString(),
    // ── CHANGED: store plan_info from login response ──────────────────────
    // BEFORE: plan_info was never stored — trial days were invisible to frontend.
    // NOW:    plan_info is saved on the user object in localStorage so any
    //         component can read trial_days_remaining / trial_expired immediately.
    plan_info: userData.plan_info ?? null,
    // ─────────────────────────────────────────────────────────────────────
  };

  localStorage.setItem('user_session', JSON.stringify(mappedUser));
  return mappedUser;
};

export const register = async (credentials: RegisterCredentials): Promise<User> => {
  const response = await api.post('/auth/register', credentials);
  return response.data;
};

export const googleLogin = async (googleToken: string): Promise<User> => {
  const response = await api.post('/auth/login/google', { token: googleToken });
  const { access_token, refresh_token, ...userData } = response.data;

  localStorage.setItem('access_token', access_token);
  localStorage.setItem('refresh_token', refresh_token);

  // ── CHANGED: map plan_info for Google login too ───────────────────────────
  const user: User = {
    id:        String(userData.id),
    email:     userData.email,
    username:  userData.username,
    is_admin:  userData.is_admin ?? false,
    role:      userData.role ?? 'user',
    plan:      userData.plan ?? 'free',
    credits:   userData.credits ?? 0,
    joinedAt:  userData.created_at ?? new Date().toISOString(),
    plan_info: userData.plan_info ?? null,
  };
  // ─────────────────────────────────────────────────────────────────────────

  localStorage.setItem('user_session', JSON.stringify(user));
  return user;
};

export const getCurrentUser = async (): Promise<User | null> => {
  const session = localStorage.getItem('user_session');
  return session ? JSON.parse(session) : null;
};

// ── CHANGED: new refreshPlanInfo helper ───────────────────────────────────────
// Call this on app load (or after token refresh) to pull the latest plan_info
// from GET /auth/me and update the stored user session. This keeps the trial
// countdown accurate even after a page refresh without a full re-login.
export const refreshPlanInfo = async (): Promise<PlanInfo | null> => {
  try {
    const response = await api.get('/auth/me');
    const { plan_info } = response.data;
    if (!plan_info) return null;

    const session = localStorage.getItem('user_session');
    if (session) {
      const user: User = JSON.parse(session);
      user.plan_info = plan_info;
      // Also sync credits/plan in case they changed
      user.plan    = response.data.plan ?? user.plan;
      user.credits = response.data.credits ?? user.credits;
      localStorage.setItem('user_session', JSON.stringify(user));
    }
    return plan_info;
  } catch {
    return null;
  }
};
// ─────────────────────────────────────────────────────────────────────────────

export const logout = () => {
  localStorage.removeItem('lg_campaigns');
  localStorage.removeItem('lg_global_leads');
  localStorage.removeItem('lg_all_users');
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user_session');
};

export const saveUserSession = (user: User) => {
  localStorage.setItem('user_session', JSON.stringify(user));
};

// ── Leads service ─────────────────────────────────────────────────────────────

export interface LeadFilters {
  page?:     number;
  per_page?: number;
  niche?:    string;
  city?:     string;
  status?:   string;
  sort_by?:  'created_at' | 'score' | 'name';
  order?:    'asc' | 'desc';
}

export interface LeadsPagination {
  page:        number;
  per_page:    number;
  total_count: number;
  total_pages: number;
  has_next:    boolean;
  has_prev:    boolean;
}

export interface MyLead {
  id:           string;
  name:         string;
  website:      string;
  email:        string | null;
  phone_number: string | null;
  niche:        string;
  city:         string;
  score:        number;
  reasoning:    string;
  status:       string;
  acquired_at:  string;
}

export interface MyLeadsResponse {
  data:            MyLead[];
  pagination:      LeadsPagination;
  filters_applied: LeadFilters;
}

export const getMyLeads = async (filters: LeadFilters = {}): Promise<MyLeadsResponse> => {
  const cleanParams = Object.fromEntries(
    Object.entries(filters).filter(([_, v]) => v !== '' && v !== undefined)
  );
  const response = await api.get('/my-leads', { params: cleanParams });
  return response.data;
};

export const getMyLeadsMeta = async (): Promise<{ niches: string[]; cities: string[] }> => {
  const response = await api.get('/my-leads/meta');
  return response.data;
};

export interface DashboardStats {
  user: {
    credits:  number;
    plan:     string;
    is_admin: boolean;
    username: string;
  };
  stats: {
    total_leads:      number;
    leads_this_month: number;
    high_quality:     number;
    avg_score:        number;
    leads_with_email: number;
    leads_with_phone: number;
    vault_total:      number;
    status_breakdown?: {
      new?:       number;
      contacted?: number;
      replied?:   number;
      qualified?: number;
      rejected?:  number;
    };
  };
  top_niches:   { niche: string; count: number }[];
  top_cities:   { city:  string; count: number }[];
  recent_leads: {
    id:          string;
    name:        string;
    website:     string;
    niche:       string;
    city:        string;
    email:       string | null;
    phone:       string | null;
    acquired_at: string;
    score:       number;
    status:      string;
  }[];
}

export const getDashboardStats = async (): Promise<DashboardStats> => {
  const response = await api.get('/dashboard-stats');
  return response.data;
};

export interface EmailVerification {
  is_valid:       boolean;
  deliverability: 'deliverable' | 'probable' | 'undeliverable' | 'unknown' | 'invalid';
  status:         'verified' | 'catchall_server' | 'mailbox_not_found' | 'no_mx_record' |
                  'disposable' | 'invalid_format' | 'smtp_timeout' | 'no_email';
  checks: {
    format?:      boolean;
    disposable?:  boolean;
    mx?:          boolean;
    mx_host?:     string;
    smtp_valid?:  boolean | null;
    is_catchall?: boolean;
    smtp_code?:   number | null;
  };
}

export interface WebsiteVerification {
  is_live:       boolean;
  status:        'live' | 'unreachable' | 'no_website' | 'http_error' | 'timeout';
  response_code: number | null;
}

export interface VerificationResult {
  lead_id:          string;
  name:             string;
  overall:          'verified' | 'partial' | 'failed';
  website:          WebsiteVerification;
  email:            EmailVerification;
  verified_at:      string;
  error?:           string;
  failure_reasons?: string[];
}

export interface VerificationSummary {
  summary: {
    total:     number;
    verified:  number;
    partial:   number;
    failed:    number;
    not_owned?: number;
  };
  results: VerificationResult[];
}

export const verifyLeads = async (leadIds: string[]): Promise<VerificationSummary> => {
  const response = await api.post('/verify-leads', { lead_ids: leadIds });
  return response.data;
};

export const verifySingleLead = async (leadId: string): Promise<VerificationResult> => {
  const response = await api.post(`/verify-lead/${leadId}`);
  return response.data;
};

export interface AdminUser {
  id:                   string;
  username:             string;
  email:                string | null;
  is_admin:             boolean;
  is_pro:               boolean;
  is_free:              boolean;
  plan:                 string;
  credits:              number;
  daily_leads_count:    number;
  trial_expired:        boolean;
  trial_days_remaining: number | null;
  billing_start:        string | null;
  lead_count:           number;
  joined_at:            string | null;
}

export interface AdminUsersResponse {
  data:        AdminUser[];
  total:       number;
  page:        number;
  per_page:    number;
  total_pages: number;
}

export async function getAdminUsers(
  page     = 1,
  per_page = 20,
  search   = ''
): Promise<AdminUsersResponse> {
  const params = new URLSearchParams({
    page:     String(page),
    per_page: String(per_page),
    ...(search ? { search } : {}),
  });
  const res = await api.get(`/admin/users?${params}`);
  return res.data;
}