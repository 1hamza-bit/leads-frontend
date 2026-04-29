import { useState, useEffect, useCallback } from 'react';
import { Campaign, Lead, NicheIntel, User, PlanInfo } from "@/types";
import {
  ArrowRightIcon, BoltIcon, CircleStackIcon, CreditCardIcon,
  MagnifyingGlassIcon, PlusIcon, QueueListIcon, EnvelopeIcon,
  PhoneIcon, GlobeAltIcon, ArrowPathIcon, FunnelIcon,
  ChevronLeftIcon, ChevronRightIcon, CheckBadgeIcon,
  AdjustmentsHorizontalIcon, XMarkIcon, ExclamationTriangleIcon,
  ClockIcon
} from "@heroicons/react/24/outline";
import {
  getMyLeads, getMyLeadsMeta,
  MyLead, LeadFilters, LeadsPagination,
  DashboardStats,
  getDashboardStats
} from '../services/authService';

type DashTab = 'overview' | 'leads';

// ── CHANGED: TrialBanner component ───────────────────────────────────────────
// Shown at the top of the dashboard when the user is on the free plan.
// - Active trial: shows days remaining with a progress bar
// - Expired trial: shows a red "expired" banner with upgrade CTA
// Hidden entirely for pro users and admins.
const TrialBanner = ({
  planInfo,
  onUpgrade,
}: {
  planInfo: PlanInfo;
  onUpgrade: () => void;
}) => {
  if (planInfo.plan !== 'free') return null;

  if (planInfo.trial_expired) {
    return (
      <div className="flex items-center justify-between gap-4 bg-red-500/10 border border-red-500/20 rounded-2xl px-5 py-4 mb-6">
        <div className="flex items-center gap-3">
          <ExclamationTriangleIcon className="w-5 h-5 text-red-400 shrink-0" />
          <div>
            <p className="text-red-400 font-black text-sm">Free trial expired</p>
            <p className="text-red-400/60 text-[11px] mt-0.5">
              Upgrade to continue finding leads
            </p>
          </div>
        </div>
        <button
          onClick={onUpgrade}
          className="shrink-0 bg-red-500 text-white font-black px-5 py-2 rounded-xl text-xs uppercase tracking-widest hover:bg-red-400 transition-all"
        >
          Upgrade
        </button>
      </div>
    );
  }

  const days = planInfo.trial_days_remaining ?? 0;
  const pct = Math.round(((14 - days) / 14) * 100);
  const color = days <= 2 ? 'text-red-400' : days <= 5 ? 'text-amber-400' : 'text-indigo-400';
  const bar = days <= 2 ? 'bg-red-500' : days <= 5 ? 'bg-amber-500' : 'bg-indigo-500';

  return (
    <div className="flex items-center justify-between gap-4 bg-white/[0.02] border border-white/5 rounded-2xl px-5 py-4 mb-6">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <ClockIcon className={`w-5 h-5 shrink-0 ${color}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1.5">
            <p className={`font-black text-sm ${color}`}>
              {days === 0 ? 'Trial expires today' : `${days} day${days === 1 ? '' : 's'} left in free trial`}
            </p>
            <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest ml-4 shrink-0">
              {planInfo.daily_leads_remaining ?? 0} leads today
            </span>
          </div>
          <div className="h-1 bg-white/5 rounded-full overflow-hidden">
            <div
              className={`h-full ${bar} rounded-full transition-all duration-700`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>
      <button
        onClick={onUpgrade}
        className="shrink-0 bg-indigo-600 text-white font-black px-5 py-2 rounded-xl text-xs uppercase tracking-widest hover:bg-indigo-500 transition-all"
      >
        Upgrade
      </button>
    </div>
  );
};
// ─────────────────────────────────────────────────────────────────────────────

const UserDashboard = ({
  onNavigate, currentUser, campaigns, globalLeads,
  setNiche, setCity, setServiceOffered, setIdealCompanyType,
  setLeads, setNicheIntel
}: {
  onNavigate: (v: string) => void;
  currentUser: User | null;
  campaigns: Campaign[];
  globalLeads: Lead[];
  setNiche: (s: string) => void;
  setCity: (s: string) => void;
  setServiceOffered: (s: string) => void;
  setIdealCompanyType: (s: string) => void;
  setLeads: (l: Lead[]) => void;
  setNicheIntel: (i: NicheIntel | null) => void;
}) => {
  const [activeTab, setActiveTab] = useState<DashTab>('overview');

  // Leads state
  const [myLeads, setMyLeads] = useState<MyLead[]>([]);
  const [pagination, setPagination] = useState<LeadsPagination | null>(null);
  const [isLoadingLeads, setIsLoadingLeads] = useState(false);
  const [leadsError, setLeadsError] = useState<string | null>(null);

  // Filter state
  const [filters, setFilters] = useState<LeadFilters>({
    page: 1, per_page: 10, sort_by: 'created_at', order: 'desc'
  });
  const [nicheOptions, setNicheOptions] = useState<string[]>([]);
  const [cityOptions, setCityOptions] = useState<string[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // ── CHANGED: derive planInfo from currentUser ─────────────────────────────
  // BEFORE: no trial info was available — the plan card only showed credits.
  // NOW:    planInfo drives the banner, the plan card, and the New Hunt button.
  const planInfo = currentUser?.plan_info ?? null;
  const isTrialExpired = planInfo?.trial_expired === true;
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoadingStats(true);
      try {
        const data = await getDashboardStats();
        setStats(data);
      } catch (e) {
        console.error('Failed to load stats');
      } finally {
        setIsLoadingStats(false);
      }
    };
    fetchStats();
  }, []);

  const fetchLeads = useCallback(async () => {
    setIsLoadingLeads(true);
    setLeadsError(null);
    try {
      const res = await getMyLeads(filters);
      setMyLeads(res.data);
      setPagination(res.pagination);
    } catch (e: any) {
      setLeadsError(e.response?.data?.error || "Failed to load leads");
    } finally {
      setIsLoadingLeads(false);
    }
  }, [filters]);

  useEffect(() => {
    getMyLeadsMeta()
      .then(meta => {
        setNicheOptions(meta.niches);
        setCityOptions(meta.cities);
      })
      .catch(() => { });
  }, []);

  useEffect(() => {
    if (activeTab === 'leads') {
      fetchLeads();
    }
  }, [activeTab, fetchLeads]);

  const updateFilter = (key: keyof LeadFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      ...(key !== 'page' ? { page: 1 } : {})
    }));
  };

  const clearFilters = () => {
    setFilters({ page: 1, per_page: 10, sort_by: 'created_at', order: 'desc' });
  };

  const hasActiveFilters = filters.niche || filters.city || filters.status;

  // ── CHANGED: New Hunt handler — blocked when trial expired ────────────────
  const handleNewHunt = () => {
    if (isTrialExpired && !currentUser.is_admin) return;
    setNiche('');
    setCity('');
    setServiceOffered('');
    setIdealCompanyType('');
    setLeads([]);        // ← needs to be passed as prop
    setNicheIntel(null);
    onNavigate('/setup');
  };
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-6xl w-full py-6 md:py-10 animate-in fade-in duration-500">

      {/* ── Trial Banner ── */}
      {/* CHANGED: shown above header for free users */}
      {planInfo && !currentUser?.is_admin && (
        <TrialBanner
          planInfo={planInfo}
          onUpgrade={() => onNavigate('/pricing')}
        />
      )}

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
        <div>
          <h2 className="text-3xl md:text-4xl font-black text-white tracking-tighter mb-1">
            Control Center
          </h2>
          <p className="text-slate-500 text-xs md:text-sm font-medium">
            Overview of your active hunting campaigns
          </p>
        </div>
        <div className="flex flex-row items-center gap-3 md:gap-4 w-full md:w-auto">

          {/* ── CHANGED: plan chip — shows trial days OR credits ──────────── */}
          {/* BEFORE: always showed credits (even when 0 and trial expired).   */}
          {/* NOW:    free users see days remaining; expired users see "Expired"; pro users see credits */}
          <div className="flex-1 md:flex-none bg-white/[0.02] border border-white/5 px-4 md:px-6 py-3 md:py-4 rounded-2xl">
            <p className="text-[8px] md:text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1">
              {planInfo?.plan === 'free' ? 'Trial' : 'Credits'}
            </p>
            {planInfo?.plan === 'free' && !currentUser.is_admin ? (
              isTrialExpired ? (
                <p className="text-xl md:text-2xl font-black text-red-400">Expired</p>
              ) : (
                <p className={`text-xl md:text-2xl font-black ${(planInfo.trial_days_remaining ?? 0) <= 2 ? 'text-red-400' :
                    (planInfo.trial_days_remaining ?? 0) <= 5 ? 'text-amber-400' :
                      'text-indigo-400'
                  }`}>
                  {planInfo.trial_days_remaining ?? 0}d left
                </p>
              )
            ) : (
              <p className="text-xl md:text-2xl font-black text-indigo-400">
                {currentUser?.credits ?? 0}
              </p>
            )}
          </div>
          {/* ──────────────────────────────────────────────────────────────── */}

          {/* ── CHANGED: New Hunt button — disabled + tooltip when expired ── */}
          {/* BEFORE: always clickable.                                        */}
          {/* NOW:    disabled with explanation text when trial has expired.   */}
          <div className="flex-1 md:flex-none flex flex-col items-stretch gap-1">
            <button
              onClick={handleNewHunt}
              disabled={isTrialExpired && !currentUser.is_admin}
              title={isTrialExpired ? 'Upgrade your plan to start a new hunt' : undefined}
              className={`bg-indigo-600 text-white font-bold px-4 md:px-8 py-3 md:py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/10 text-xs md:text-sm
                ${isTrialExpired && !currentUser.is_admin
                  ? 'opacity-40 cursor-not-allowed'
                  : 'hover:bg-indigo-500'
                }`}
            >
              <PlusIcon className="w-4 h-4 md:w-5 md:h-5" />
              <span>New Hunt</span>
            </button>
            {isTrialExpired && !currentUser.is_admin && (
              <p className="text-[9px] text-red-400 font-bold text-center uppercase tracking-widest">
                Plan expired
              </p>
            )}
          </div>
          {/* ──────────────────────────────────────────────────────────────── */}

        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex border-b border-white/5 mb-8">
        {([
          { key: 'overview', label: 'Overview' },
          { key: 'leads', label: `My Leads ${pagination ? `(${pagination.total_count})` : ''}` },
        ] as { key: DashTab, label: string }[]).map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-6 py-4 text-[10px] font-black uppercase tracking-widest transition-all relative ${activeTab === tab.key
              ? 'text-white'
              : 'text-slate-600 hover:text-slate-400'
              }`}
          >
            {tab.label}
            {activeTab === tab.key && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />
            )}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════
          TAB: OVERVIEW
      ══════════════════════════════════════ */}
      {activeTab === 'overview' && (
        <div className="space-y-6">

          {isLoadingStats ? (
            <div className="flex items-center justify-center py-20">
              <ArrowPathIcon className="w-6 h-6 text-indigo-500 animate-spin" />
            </div>
          ) : (
            <>
              {/* ── Top stat cards ── */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  {
                    label: 'Total Leads',
                    val: stats?.stats.total_leads ?? 0,
                    sub: `${stats?.stats.leads_this_month ?? 0} this month`,
                    color: 'text-indigo-400',
                    icon: <QueueListIcon className="w-6 h-6" />
                  },
                  {
                    label: 'Contacted',
                    val: stats?.stats.status_breakdown?.contacted ?? 0,
                    sub: `${stats?.stats.status_breakdown?.replied ?? 0} replied`,
                    color: 'text-amber-400',
                    icon: <EnvelopeIcon className="w-6 h-6" />
                  },
                  {
                    label: 'Qualified',
                    val: stats?.stats.status_breakdown?.qualified ?? 0,
                    sub: `${stats?.stats.status_breakdown?.rejected ?? 0} rejected`,
                    color: 'text-emerald-400',
                    icon: <CheckBadgeIcon className="w-6 h-6" />
                  },
                  {
                    label: 'Vault Size',
                    val: stats?.stats.vault_total ?? 0,
                    sub: 'global leads indexed',
                    color: 'text-cyan-400',
                    icon: <CircleStackIcon className="w-6 h-6" />
                  },
                ].map((s, i) => (
                  <div key={i} className="bg-white/[0.02] border border-white/5 p-6 rounded-3xl">
                    <div className={`w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center ${s.color} mb-4`}>
                      {s.icon}
                    </div>
                    <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mb-1">{s.label}</p>
                    <p className={`text-3xl font-black ${s.color} mb-1`}>{s.val}</p>
                    <p className="text-[10px] text-slate-600">{s.sub}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-12 gap-6">

                {/* ── Recent Leads ── */}
                <div className="col-span-12 lg:col-span-7">
                  <div className="bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden">
                    <div className="p-6 border-b border-white/5 flex items-center justify-between">
                      <h3 className="text-white font-bold">Recent Leads</h3>
                      <button
                        onClick={() => setActiveTab('leads')}
                        className="text-[10px] font-black text-indigo-400 uppercase tracking-widest hover:text-white transition-all"
                      >
                        View All →
                      </button>
                    </div>
                    <div className="divide-y divide-white/5">
                      {!stats?.recent_leads.length ? (
                        <div className="p-12 text-center text-slate-600 text-sm italic">
                          No leads yet — launch a hunt
                        </div>
                      ) : stats.recent_leads.map(lead => (
                        <div key={lead.id} className="px-6 py-4 flex items-center justify-between hover:bg-white/[0.01] transition-colors">
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-bold text-sm truncate">{lead.name}</p>
                            <p className="text-[10px] text-slate-500 truncate">
                              {lead.niche} • {lead.city}
                            </p>
                          </div>
                          <div className="flex items-center gap-3 ml-4 shrink-0">
                            <StatusBadge status={lead.status ?? 'new'} />
                            <span className={`text-[10px] font-black ${lead.score >= 70 ? 'text-emerald-400' : 'text-indigo-400'
                              }`}>
                              {lead.score}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* ── Right column ── */}
                <div className="col-span-12 lg:col-span-5 space-y-4">

                  {/* Pipeline breakdown */}
                  <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6">
                    <h3 className="text-white font-bold mb-5">Pipeline Breakdown</h3>
                    <div className="space-y-3">
                      {[
                        { label: 'New', val: stats?.stats.status_breakdown?.new ?? 0, color: 'bg-indigo-500' },
                        { label: 'Contacted', val: stats?.stats.status_breakdown?.contacted ?? 0, color: 'bg-amber-500' },
                        { label: 'Replied', val: stats?.stats.status_breakdown?.replied ?? 0, color: 'bg-cyan-500' },
                        { label: 'Qualified', val: stats?.stats.status_breakdown?.qualified ?? 0, color: 'bg-emerald-500' },
                        { label: 'Rejected', val: stats?.stats.status_breakdown?.rejected ?? 0, color: 'bg-red-500' },
                      ].map(row => {
                        const total = stats?.stats.total_leads || 1;
                        const pct = Math.round((row.val / total) * 100);
                        return (
                          <div key={row.label}>
                            <div className="flex justify-between text-[10px] font-bold mb-1">
                              <span className="text-slate-500 uppercase tracking-widest">{row.label}</span>
                              <span className="text-white">{row.val}</span>
                            </div>
                            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${row.color} rounded-full transition-all duration-700`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Top niches */}
                  <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6">
                    <h3 className="text-white font-bold mb-5">Top Niches</h3>
                    <div className="space-y-2">
                      {!stats?.top_niches.length ? (
                        <p className="text-slate-600 text-sm italic">No data yet</p>
                      ) : stats.top_niches.map((n, i) => (
                        <div key={n.niche} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-[9px] font-black text-slate-600 w-4">{i + 1}</span>
                            <span className="text-[11px] text-slate-300 truncate max-w-[160px]">{n.niche}</span>
                          </div>
                          <span className="text-[10px] font-black text-indigo-400">{n.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Top cities */}
                  <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6">
                    <h3 className="text-white font-bold mb-5">Top Cities</h3>
                    <div className="space-y-2">
                      {!stats?.top_cities.length ? (
                        <p className="text-slate-600 text-sm italic">No data yet</p>
                      ) : stats.top_cities.map((c, i) => (
                        <div key={c.city} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-[9px] font-black text-slate-600 w-4">{i + 1}</span>
                            <span className="text-[11px] text-slate-300">{c.city}</span>
                          </div>
                          <span className="text-[10px] font-black text-cyan-400">{c.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </div>

              {/* ── CHANGED: Plan card — shows trial info for free, credits for pro ── */}
              {/* BEFORE: always showed "X credits remaining" even for free/expired.   */}
              {/* NOW:    adapts copy and color to the actual plan state.              */}
              <div className={`p-8 rounded-3xl shadow-xl text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6
                ${isTrialExpired && !currentUser.is_admin
                  ? 'bg-red-900/40 border border-red-500/20 shadow-red-900/20'
                  : 'bg-gradient-to-br from-indigo-600 to-indigo-800 shadow-indigo-600/20'
                }`}
              >
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200 mb-1">
                    Current Plan
                  </p>
                  <h3 className="text-3xl font-black tracking-tight">
                    {stats?.user.plan?.toUpperCase() ?? 'FREE'}
                  </h3>
                  <p className="text-indigo-200 text-sm mt-1">
                    {planInfo?.plan === 'free' && !currentUser.is_admin
                      ? isTrialExpired
                        ? 'Your free trial has ended — upgrade to keep hunting'
                        : `${planInfo.trial_days_remaining} day${planInfo.trial_days_remaining === 1 ? '' : 's'} remaining in free trial`
                      : `${stats?.user.credits ?? 0} credits remaining`
                    }
                  </p>
                </div>
                <button
                  onClick={() => onNavigate('/pricing')}
                  className="bg-white text-indigo-700 font-black px-6 py-3 rounded-2xl text-xs uppercase tracking-widest hover:bg-indigo-50 transition-all"
                >
                  {isTrialExpired ? 'Upgrade Now' : 'Upgrade Plan'}
                </button>
              </div>
              {/* ──────────────────────────────────────────────────────────── */}
            </>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════
          TAB: MY LEADS
      ══════════════════════════════════════ */}
      {activeTab === 'leads' && (
        <div className="space-y-4">

          {/* Filter Bar */}
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4">
            <div className="flex flex-wrap items-center gap-3">

              <select
                value={filters.niche || ''}
                onChange={e => updateFilter('niche', e.target.value)}
                className="bg-white/5 border border-white/10 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500/50 transition-all cursor-pointer"
              >
                <option value="">All Niches</option>
                {nicheOptions.map(n => <option key={n} value={n}>{n}</option>)}
              </select>

              <select
                value={filters.city || ''}
                onChange={e => updateFilter('city', e.target.value)}
                className="bg-white/5 border border-white/10 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500/50 transition-all cursor-pointer"
              >
                <option value="">All Cities</option>
                {cityOptions.map(c => <option key={c} value={c}>{c}</option>)}
              </select>

              <select
                value={filters.status || ''}
                onChange={e => updateFilter('status', e.target.value)}
                className="bg-white/5 border border-white/10 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500/50 transition-all cursor-pointer"
              >
                <option value="">All Statuses</option>
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="replied">Replied</option>
                <option value="qualified">Qualified</option>
                <option value="rejected">Rejected</option>
              </select>

              <select
                value={`${filters.sort_by}-${filters.order}`}
                onChange={e => {
                  const [sort, ord] = e.target.value.split('-');
                  setFilters(prev => ({ ...prev, sort_by: sort as any, order: ord as any, page: 1 }));
                }}
                className="bg-white/5 border border-white/10 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500/50 transition-all cursor-pointer"
              >
                <option value="created_at-desc">Newest First</option>
                <option value="created_at-asc">Oldest First</option>
                <option value="score-desc">Highest Score</option>
                <option value="score-asc">Lowest Score</option>
                <option value="name-asc">Name A–Z</option>
                <option value="name-desc">Name Z–A</option>
              </select>

              <select
                value={filters.per_page || 10}
                onChange={e => updateFilter('per_page', Number(e.target.value))}
                className="bg-white/5 border border-white/10 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500/50 transition-all cursor-pointer"
              >
                <option value={10}>10 / page</option>
                <option value={25}>25 / page</option>
                <option value={50}>50 / page</option>
              </select>

              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-2 text-[10px] font-black text-red-400 uppercase tracking-widest hover:text-red-300 transition-all ml-auto"
                >
                  <XMarkIcon className="w-4 h-4" /> Clear Filters
                </button>
              )}
            </div>

            {hasActiveFilters && (
              <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-white/5">
                {filters.niche && (
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-full text-[9px] font-black uppercase tracking-widest">
                    Niche: {filters.niche}
                    <button onClick={() => updateFilter('niche', '')}><XMarkIcon className="w-3 h-3" /></button>
                  </span>
                )}
                {filters.city && (
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-full text-[9px] font-black uppercase tracking-widest">
                    City: {filters.city}
                    <button onClick={() => updateFilter('city', '')}><XMarkIcon className="w-3 h-3" /></button>
                  </span>
                )}
                {filters.status && (
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full text-[9px] font-black uppercase tracking-widest">
                    Status: {filters.status}
                    <button onClick={() => updateFilter('status', '')}><XMarkIcon className="w-3 h-3" /></button>
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Leads Table */}
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">

            <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-white/5 bg-black/20">
              <div className="col-span-4 text-[9px] font-black text-slate-600 uppercase tracking-widest">Company</div>
              <div className="col-span-2 text-[9px] font-black text-slate-600 uppercase tracking-widest hidden md:block">Niche / City</div>
              <div className="col-span-2 text-[9px] font-black text-slate-600 uppercase tracking-widest hidden lg:block">Contact</div>
              <div className="col-span-2 text-[9px] font-black text-slate-600 uppercase tracking-widest">Status</div>
              <div className="col-span-1 text-[9px] font-black text-slate-600 uppercase tracking-widest text-right">Score</div>
              <div className="col-span-1 text-[9px] font-black text-slate-600 uppercase tracking-widest text-right hidden sm:block">Date</div>
            </div>

            {isLoadingLeads && (
              <div className="flex items-center justify-center py-20">
                <ArrowPathIcon className="w-6 h-6 text-indigo-500 animate-spin" />
              </div>
            )}

            {leadsError && !isLoadingLeads && (
              <div className="p-8 text-center text-red-400 text-sm">{leadsError}</div>
            )}

            {!isLoadingLeads && !leadsError && myLeads.length === 0 && (
              <div className="p-20 text-center">
                <MagnifyingGlassIcon className="w-10 h-10 text-slate-700 mx-auto mb-4" />
                <p className="text-slate-600 text-[10px] font-black uppercase tracking-widest">
                  {hasActiveFilters ? 'No leads match your filters' : 'No leads yet — launch a hunt'}
                </p>
              </div>
            )}

            {!isLoadingLeads && myLeads.map((lead, i) => (
              <div
                key={lead.id}
                className={`grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-white/[0.02] transition-colors ${i < myLeads.length - 1 ? 'border-b border-white/5' : ''
                  }`}
              >
                <div className="col-span-4 min-w-0">
                  <p className="text-white font-bold text-sm truncate">{lead.name}</p>
                  <a
                    href={lead.website} target="_blank" rel="noreferrer"
                    className="text-[10px] text-indigo-400 hover:text-indigo-300 truncate block transition-colors"
                  >
                    {lead.website?.replace(/https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
                  </a>
                </div>

                <div className="col-span-2 hidden md:block min-w-0">
                  <p className="text-[10px] text-slate-400 font-bold truncate">{lead.niche}</p>
                  <p className="text-[10px] text-slate-600 truncate">{lead.city}</p>
                </div>

                <div className="col-span-2 hidden lg:flex flex-col gap-1">
                  {lead.email && (
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 truncate">
                      <EnvelopeIcon className="w-3 h-3 text-slate-600 shrink-0" />
                      <span className="truncate">{lead.email}</span>
                    </div>
                  )}
                  {lead.phone_number && (
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                      <PhoneIcon className="w-3 h-3 text-slate-600 shrink-0" />
                      <span>{lead.phone_number}</span>
                    </div>
                  )}
                  {!lead.email && !lead.phone_number && (
                    <span className="text-[10px] text-slate-700 italic">No contact</span>
                  )}
                </div>

                <div className="col-span-2">
                  <StatusBadge status={lead.status} />
                </div>

                <div className="col-span-1 text-right">
                  <span className={`text-[10px] font-black ${lead.score >= 70 ? 'text-emerald-400' :
                      lead.score >= 40 ? 'text-indigo-400' : 'text-slate-500'
                    }`}>
                    {lead.score}%
                  </span>
                </div>

                <div className="col-span-1 text-right hidden sm:block">
                  <span className="text-[9px] text-slate-600">
                    {new Date(lead.acquired_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.total_pages > 1 && (
            <div className="flex items-center justify-between px-2">
              <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">
                Showing {((pagination.page - 1) * pagination.per_page) + 1}–{Math.min(pagination.page * pagination.per_page, pagination.total_count)} of {pagination.total_count}
              </p>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateFilter('page', pagination.page - 1)}
                  disabled={!pagination.has_prev}
                  className="p-2 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-white hover:border-white/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeftIcon className="w-4 h-4" />
                </button>

                {Array.from({ length: pagination.total_pages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === pagination.total_pages || Math.abs(p - pagination.page) <= 1)
                  .reduce<(number | '...')[]>((acc, p, i, arr) => {
                    if (i > 0 && (p as number) - (arr[i - 1] as number) > 1) acc.push('...');
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, i) => p === '...' ? (
                    <span key={`ellipsis-${i}`} className="text-slate-600 px-1">…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => updateFilter('page', p)}
                      className={`w-8 h-8 rounded-xl text-[10px] font-black transition-all ${p === pagination.page
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:border-white/20'
                        }`}
                    >
                      {p}
                    </button>
                  ))
                }

                <button
                  onClick={() => updateFilter('page', pagination.page + 1)}
                  disabled={!pagination.has_next}
                  className="p-2 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-white hover:border-white/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRightIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ── Status Badge ──────────────────────────────────────────────────────────────
const StatusBadge = ({ status }: { status: string }) => {
  const config: Record<string, { color: string; bg: string; border: string }> = {
    new: { color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
    contacted: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
    replied: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    qualified: { color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
    rejected: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
  };
  const s = config[status] ?? config.new;
  return (
    <span className={`px-2 py-1 rounded-lg border text-[9px] font-black uppercase tracking-widest ${s.color} ${s.bg} ${s.border}`}>
      {status}
    </span>
  );
};

export default UserDashboard;