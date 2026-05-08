import { useState, useEffect, useCallback } from 'react';
import { Campaign, Lead, NicheIntel, User, PlanInfo } from "@/types";
import {
  ArrowRightIcon, BoltIcon, CircleStackIcon, CreditCardIcon,
  MagnifyingGlassIcon, PlusIcon, QueueListIcon, EnvelopeIcon,
  PhoneIcon, GlobeAltIcon, ArrowPathIcon, FunnelIcon,
  ChevronLeftIcon, ChevronRightIcon, CheckBadgeIcon,
  AdjustmentsHorizontalIcon, XMarkIcon, ExclamationTriangleIcon,
  ClockIcon, ChevronDownIcon, ArrowsUpDownIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import {
  getMyLeads, getMyLeadsMeta,
  MyLead, LeadFilters, LeadsPagination,
  DashboardStats,
  getDashboardStats
} from '../services/authService';

type DashTab = 'overview' | 'leads';

// ── Trial Banner ──────────────────────────────────────────────────────────────
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
            <p className="text-red-400/60 text-[11px] mt-0.5">Upgrade to continue finding leads</p>
          </div>
        </div>
        <button onClick={onUpgrade}
          className="shrink-0 bg-red-500 text-white font-black px-5 py-2 rounded-xl text-xs uppercase tracking-widest hover:bg-red-400 transition-all">
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
            <div className={`h-full ${bar} rounded-full transition-all duration-700`}
              style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>
      <button onClick={onUpgrade}
        className="shrink-0 bg-indigo-600 text-white font-black px-5 py-2 rounded-xl text-xs uppercase tracking-widest hover:bg-indigo-500 transition-all">
        Upgrade
      </button>
    </div>
  );
};

// ── Custom Select — replaces native <select> with styled dropdown ─────────────
const FilterSelect = ({
  value,
  onChange,
  options,
  placeholder,
  icon,
  accentColor = 'indigo',
}: {
  value: string;
  onChange: (v: string) => void;
  options: { label: string; value: string }[];
  placeholder: string;
  icon?: React.ReactNode;
  accentColor?: 'indigo' | 'cyan' | 'amber' | 'emerald' | 'violet';
}) => {
  const [open, setOpen] = useState(false);
  const selected = options.find(o => o.value === value);

  const accent: Record<string, { ring: string; text: string; bg: string; dot: string }> = {
    indigo: { ring: 'border-indigo-500/60', text: 'text-indigo-400', bg: 'bg-indigo-500/10', dot: 'bg-indigo-400' },
    cyan: { ring: 'border-cyan-500/60', text: 'text-cyan-400', bg: 'bg-cyan-500/10', dot: 'bg-cyan-400' },
    amber: { ring: 'border-amber-500/60', text: 'text-amber-400', bg: 'bg-amber-500/10', dot: 'bg-amber-400' },
    emerald: { ring: 'border-emerald-500/60', text: 'text-emerald-400', bg: 'bg-emerald-500/10', dot: 'bg-emerald-400' },
    violet: { ring: 'border-violet-500/60', text: 'text-violet-400', bg: 'bg-violet-500/10', dot: 'bg-violet-400' },
  };
  const a = accent[accentColor];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap
          ${value
            ? `${a.bg} ${a.ring} ${a.text}`
            : 'bg-white/[0.03] border-white/8 text-slate-500 hover:border-white/20 hover:text-slate-300'
          }`}
      >
        {icon && <span className="shrink-0 opacity-70">{icon}</span>}
        <span>{selected?.label ?? placeholder}</span>
        <ChevronDownIcon className={`w-3 h-3 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />=
          {/* Dropdown */}
          <div className="absolute max-h-90 overflow-y-auto top-full left-0 mt-1.5 z-50 min-w-[160px] 
          bg-[#0d0e14] border border-white/10 rounded-2xl 
          shadow-2xl shadow-black/50 overflow-hidden py-1.5
          [&::-webkit-scrollbar]:w-1
        [&::-webkit-scrollbar-track]:bg-gray-100
        [&::-webkit-scrollbar-thumb]:bg-gray-300
        dark:[&::-webkit-scrollbar-track]:bg-neutral-700
        dark:[&::-webkit-scrollbar-thumb]:bg-neutral-500">
            {options.map(opt => (
              <button
                key={opt.value}
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`w-full text-left px-4 py-2.5 text-[11px] font-bold transition-all flex items-center gap-2.5
                  ${opt.value === value
                    ? `${a.text} ${a.bg}`
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
              >
                {opt.value === value && (
                  <CheckCircleIcon className={`w-3.5 h-3.5 shrink-0 ${a.text}`} />
                )}
                {opt.value !== value && <span className="w-3.5" />}
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// ── Sort Button — compact sort toggle ─────────────────────────────────────────
const SortToggle = ({
  sortBy,
  order,
  onChange,
}: {
  sortBy: string;
  order: string;
  onChange: (sort: string, ord: string) => void;
}) => {
  const [open, setOpen] = useState(false);

  const options = [
    { label: 'Newest first', sort: 'created_at', ord: 'desc' },
    { label: 'Oldest first', sort: 'created_at', ord: 'asc' },
    { label: 'Highest score', sort: 'score', ord: 'desc' },
    { label: 'Lowest score', sort: 'score', ord: 'asc' },
    { label: 'Name A→Z', sort: 'name', ord: 'asc' },
    { label: 'Name Z→A', sort: 'name', ord: 'desc' },
  ];

  const current = options.find(o => o.sort === sortBy && o.ord === order) ?? options[0];

  return (
    <div className="relative ml-auto">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-white/8 bg-white/[0.03] text-slate-500 hover:border-white/20 hover:text-slate-300 text-[10px] font-black uppercase tracking-widest transition-all"
      >
        <ArrowsUpDownIcon className="w-3.5 h-3.5" />
        <span>{current.label}</span>
        <ChevronDownIcon className={`w-3 h-3 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full right-0 mt-1.5 z-50 min-w-[160px] bg-[#0d0e14] border border-white/10 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden py-1.5">
            {options.map(opt => {
              const active = opt.sort === sortBy && opt.ord === order;
              return (
                <button
                  key={`${opt.sort}-${opt.ord}`}
                  onClick={() => { onChange(opt.sort, opt.ord); setOpen(false); }}
                  className={`w-full text-left px-4 py-2.5 text-[11px] font-bold transition-all flex items-center gap-2.5
                    ${active ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                >
                  {active
                    ? <CheckCircleIcon className="w-3.5 h-3.5 shrink-0 text-indigo-400" />
                    : <span className="w-3.5" />
                  }
                  {opt.label}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

// ── Per-page selector ─────────────────────────────────────────────────────────
const PerPageToggle = ({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) => (
  <div className="flex items-center gap-1 bg-white/[0.03] border border-white/8 rounded-xl p-1">
    {[10, 25, 50].map(n => (
      <button
        key={n}
        onClick={() => onChange(n)}
        className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all
          ${value === n
            ? 'bg-indigo-600 text-white shadow-sm'
            : 'text-slate-600 hover:text-slate-300'
          }`}
      >
        {n}
      </button>
    ))}
  </div>
);

// ── Active filter pill ────────────────────────────────────────────────────────
const FilterPill = ({
  label,
  value,
  color,
  onRemove,
}: {
  label: string;
  value: string;
  color: string;
  onRemove: () => void;
}) => (
  <span className={`flex items-center gap-1.5 pl-3 pr-2 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest ${color}`}>
    <span className="opacity-60">{label}:</span>
    <span>{value}</span>
    <button
      onClick={onRemove}
      className="ml-0.5 w-4 h-4 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
    >
      <XMarkIcon className="w-2.5 h-2.5" />
    </button>
  </span>
);

// ── Status config shared between badge and filter ─────────────────────────────
const STATUS_CONFIG: Record<string, { color: string; bg: string; border: string; dot: string }> = {
  new: { color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', dot: 'bg-indigo-400' },
  contacted: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', dot: 'bg-amber-400' },
  replied: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', dot: 'bg-emerald-400' },
  qualified: { color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', dot: 'bg-cyan-400' },
  rejected: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', dot: 'bg-red-400' },
};

// ── Status Badge ──────────────────────────────────────────────────────────────
const StatusBadge = ({ status }: { status: string }) => {
  const s = STATUS_CONFIG[status] ?? STATUS_CONFIG.new;
  return (
    <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[9px] font-black uppercase tracking-widest ${s.color} ${s.bg} ${s.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.dot}`} />
      {status}
    </span>
  );
};

// ── Main Dashboard ─────────────────────────────────────────────────────────────
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

  const [myLeads, setMyLeads] = useState<MyLead[]>([]);
  const [pagination, setPagination] = useState<LeadsPagination | null>(null);
  const [isLoadingLeads, setIsLoadingLeads] = useState(false);
  const [leadsError, setLeadsError] = useState<string | null>(null);

  const [filters, setFilters] = useState<LeadFilters>({
    page: 1, per_page: 10, sort_by: 'created_at', order: 'desc'
  });
  const [nicheOptions, setNicheOptions] = useState<string[]>([]);
  const [cityOptions, setCityOptions] = useState<string[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  const planInfo = currentUser?.plan_info ?? null;
  const isTrialExpired = planInfo?.trial_expired === true;

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoadingStats(true);
      try { setStats(await getDashboardStats()); }
      catch (e) { console.error('Failed to load stats'); }
      finally { setIsLoadingStats(false); }
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
      setLeadsError(e.response?.data?.error || 'Failed to load leads');
    } finally {
      setIsLoadingLeads(false);
    }
  }, [filters]);

  useEffect(() => {
    getMyLeadsMeta()
      .then(meta => { setNicheOptions(meta.niches); setCityOptions(meta.cities); })
      .catch(() => { });
  }, []);

  useEffect(() => {
    if (activeTab === 'leads') fetchLeads();
  }, [activeTab, fetchLeads]);

  const updateFilter = (key: keyof LeadFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, ...(key !== 'page' ? { page: 1 } : {}) }));
  };

  const clearFilters = () => {
    setFilters({ page: 1, per_page: 10, sort_by: 'created_at', order: 'desc' });
  };

  const hasActiveFilters = !!(filters.niche || filters.city || filters.status);
  const activeFilterCount = [filters.niche, filters.city, filters.status].filter(Boolean).length;

  const handleNewHunt = () => {
    if (isTrialExpired && !currentUser?.is_admin) return;
    setNiche(''); setCity(''); setServiceOffered(''); setIdealCompanyType('');
    setLeads([]); setNicheIntel(null);
    onNavigate('/setup');
  };

  // Build niche and city option arrays for FilterSelect
  const nicheSelectOptions = [
    { label: 'All Niches', value: '' },
    ...nicheOptions.map(n => ({ label: n, value: n })),
  ];
  const citySelectOptions = [
    { label: 'All Cities', value: '' },
    ...cityOptions.map(c => ({ label: c, value: c })),
  ];
  const statusSelectOptions = [
    { label: 'All Statuses', value: '' },
    ...Object.entries(STATUS_CONFIG).map(([k]) => ({
      label: k.charAt(0).toUpperCase() + k.slice(1),
      value: k,
    })),
  ];

  return (
    <div className="max-w-6xl w-full py-6 md:py-10 animate-in fade-in duration-500">

      {planInfo && !currentUser?.is_admin && (
        <TrialBanner planInfo={planInfo} onUpgrade={() => onNavigate('/pricing')} />
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
        <div>
          <h2 className="text-3xl md:text-4xl font-black text-white tracking-tighter mb-1">Control Center</h2>
          <p className="text-slate-500 text-xs md:text-sm font-medium">Overview of your active hunting campaigns</p>
        </div>
        <div className="flex flex-row items-center gap-3 md:gap-4 w-full md:w-auto">
          <div className="flex-1 md:flex-none bg-white/[0.02] border border-white/5 px-4 md:px-6 py-3 md:py-4 rounded-2xl">
            <p className="text-[8px] md:text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1">
              {planInfo?.plan === 'free' ? 'Trial' : 'Credits'}
            </p>
            {planInfo?.plan === 'free' && !currentUser?.is_admin ? (
              isTrialExpired ? (
                <p className="text-xl md:text-2xl font-black text-red-400">Expired</p>
              ) : (
                <p className={`text-xl md:text-2xl font-black ${(planInfo.trial_days_remaining ?? 0) <= 2 ? 'text-red-400' :
                  (planInfo.trial_days_remaining ?? 0) <= 5 ? 'text-amber-400' : 'text-indigo-400'
                  }`}>
                  {planInfo.trial_days_remaining ?? 0}d left
                </p>
              )
            ) : (
              <p className="text-xl md:text-2xl font-black text-indigo-400">{currentUser?.credits ?? 0}</p>
            )}
          </div>

          <div className="flex-1 md:flex-none flex flex-col items-stretch gap-1">
            <button
              onClick={handleNewHunt}
              disabled={isTrialExpired && !currentUser?.is_admin}
              title={isTrialExpired ? 'Upgrade your plan to start a new hunt' : undefined}
              className={`bg-indigo-600 text-white font-bold px-4 md:px-8 py-3 md:py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/10 text-xs md:text-sm
                ${isTrialExpired && !currentUser?.is_admin ? 'opacity-40 cursor-not-allowed' : 'hover:bg-indigo-500'}`}
            >
              <PlusIcon className="w-4 h-4 md:w-5 md:h-5" />
              <span>New Hunt</span>
            </button>
            {isTrialExpired && !currentUser?.is_admin && (
              <p className="text-[9px] text-red-400 font-bold text-center uppercase tracking-widest">Plan expired</p>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/5 mb-8">
        {([
          { key: 'overview', label: 'Overview' },
          { key: 'leads', label: `My Leads${pagination ? ` (${pagination.total_count})` : ''}` },
        ] as { key: DashTab; label: string }[]).map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`px-6 py-4 text-[10px] font-black uppercase tracking-widest transition-all relative
              ${activeTab === tab.key ? 'text-white' : 'text-slate-600 hover:text-slate-400'}`}>
            {tab.label}
            {activeTab === tab.key && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />
            )}
          </button>
        ))}
      </div>

      {/* ══ OVERVIEW TAB ══════════════════════════════════════════════════════ */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {isLoadingStats ? (
            <div className="flex items-center justify-center py-20">
              <ArrowPathIcon className="w-6 h-6 text-indigo-500 animate-spin" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Total Leads', val: stats?.stats.total_leads ?? 0, sub: `${stats?.stats.leads_this_month ?? 0} this month`, color: 'text-indigo-400', icon: <QueueListIcon className="w-6 h-6" /> },
                  { label: 'Contacted', val: stats?.stats.status_breakdown?.contacted ?? 0, sub: `${stats?.stats.status_breakdown?.replied ?? 0} replied`, color: 'text-amber-400', icon: <EnvelopeIcon className="w-6 h-6" /> },
                  { label: 'Qualified', val: stats?.stats.status_breakdown?.qualified ?? 0, sub: `${stats?.stats.status_breakdown?.rejected ?? 0} rejected`, color: 'text-emerald-400', icon: <CheckBadgeIcon className="w-6 h-6" /> },
                  { label: 'Vault Size', val: stats?.stats.vault_total ?? 0, sub: 'global leads indexed', color: 'text-cyan-400', icon: <CircleStackIcon className="w-6 h-6" /> },
                ].map((s, i) => (
                  <div key={i} className="bg-white/[0.02] border border-white/5 p-6 rounded-3xl">
                    <div className={`w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center ${s.color} mb-4`}>{s.icon}</div>
                    <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mb-1">{s.label}</p>
                    <p className={`text-3xl font-black ${s.color} mb-1`}>{s.val}</p>
                    <p className="text-[10px] text-slate-600">{s.sub}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-12 gap-6">
                <div className="col-span-12 lg:col-span-7">
                  <div className="bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden">
                    <div className="p-6 border-b border-white/5 flex items-center justify-between">
                      <h3 className="text-white font-bold">Recent Leads</h3>
                      <button onClick={() => setActiveTab('leads')}
                        className="text-[10px] font-black text-indigo-400 uppercase tracking-widest hover:text-white transition-all">
                        View All →
                      </button>
                    </div>
                    <div className="divide-y divide-white/5">
                      {!stats?.recent_leads.length ? (
                        <div className="p-12 text-center text-slate-600 text-sm italic">No leads yet — launch a hunt</div>
                      ) : stats.recent_leads.map(lead => (
                        <div key={lead.id} className="px-6 py-4 flex items-center justify-between hover:bg-white/[0.01] transition-colors">
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-bold text-sm truncate">{lead.name}</p>
                            <p className="text-[10px] text-slate-500 truncate">{lead.niche} • {lead.city}</p>
                          </div>
                          <div className="flex items-center gap-3 ml-4 shrink-0">
                            <StatusBadge status={lead.status ?? 'new'} />
                            <span className={`text-[10px] font-black ${lead.score >= 70 ? 'text-emerald-400' : 'text-indigo-400'}`}>
                              {lead.score}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="col-span-12 lg:col-span-5 space-y-4">
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
                              <div className={`h-full ${row.color} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

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

              <div className={`p-8 rounded-3xl shadow-xl text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6
                ${isTrialExpired && !currentUser?.is_admin
                  ? 'bg-red-900/40 border border-red-500/20 shadow-red-900/20'
                  : 'bg-gradient-to-br from-indigo-600 to-indigo-800 shadow-indigo-600/20'
                }`}
              >
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200 mb-1">Current Plan</p>
                  <h3 className="text-3xl font-black tracking-tight">{stats?.user.plan?.toUpperCase() ?? 'FREE'}</h3>
                  <p className="text-indigo-200 text-sm mt-1">
                    {planInfo?.plan === 'free' && !currentUser?.is_admin
                      ? isTrialExpired
                        ? 'Your free trial has ended — upgrade to keep hunting'
                        : `${planInfo.trial_days_remaining} day${planInfo.trial_days_remaining === 1 ? '' : 's'} remaining in free trial`
                      : `${stats?.user.credits ?? 0} credits remaining`
                    }
                  </p>
                </div>
                <button onClick={() => onNavigate('/pricing')}
                  className="bg-white text-indigo-700 font-black px-6 py-3 rounded-2xl text-xs uppercase tracking-widest hover:bg-indigo-50 transition-all">
                  {isTrialExpired ? 'Upgrade Now' : 'Upgrade Plan'}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ══ MY LEADS TAB ══════════════════════════════════════════════════════ */}
      {activeTab === 'leads' && (
        <div className="space-y-4">

          {/* ── IMPROVED FILTER BAR ────────────────────────────────────────── */}
          <div className="space-y-3">

            {/* Row 1: filters + sort */}
            <div className="flex flex-wrap items-center gap-2">

              {/* Filter label */}
              <div className="flex items-center gap-2 text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] mr-1">
                <FunnelIcon className="w-3.5 h-3.5" />
                <span>Filter</span>
                {activeFilterCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[8px] font-black flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </div>

              {/* Niche */}
              <FilterSelect
                value={filters.niche || ''}
                onChange={v => updateFilter('niche', v)}
                options={nicheSelectOptions}
                placeholder="Niche"
                accentColor="indigo"
                icon={<QueueListIcon className="w-3.5 h-3.5" />}
              />

              {/* City */}
              <FilterSelect
                value={filters.city || ''}
                onChange={v => updateFilter('city', v)}
                options={citySelectOptions}
                placeholder="City"
                accentColor="cyan"
                icon={<GlobeAltIcon className="w-3.5 h-3.5" />}
              />

              {/* Status */}
              <FilterSelect
                value={filters.status || ''}
                onChange={v => updateFilter('status', v)}
                options={statusSelectOptions}
                placeholder="Status"
                accentColor="amber"
                icon={<BoltIcon className="w-3.5 h-3.5" />}
              />

              {/* Divider */}
              <div className="w-px h-5 bg-white/8 mx-1" />

              {/* Per page */}
              <PerPageToggle
                value={filters.per_page || 10}
                onChange={v => updateFilter('per_page', v)}
              />

              {/* Sort — pushed to right */}
              <SortToggle
                sortBy={filters.sort_by || 'created_at'}
                order={filters.order || 'desc'}
                onChange={(sort, ord) => setFilters(prev => ({ ...prev, sort_by: sort as any, order: ord as any, page: 1 }))}
              />
            </div>

            {/* Row 2: active filter pills + clear */}
            {hasActiveFilters && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-[9px] font-black text-slate-700 uppercase tracking-widest">Active:</span>

                {filters.niche && (
                  <FilterPill
                    label="Niche" value={filters.niche}
                    color="text-indigo-400 bg-indigo-500/10 border-indigo-500/20 border"
                    onRemove={() => updateFilter('niche', '')}
                  />
                )}
                {filters.city && (
                  <FilterPill
                    label="City" value={filters.city}
                    color="text-cyan-400 bg-cyan-500/10 border-cyan-500/20 border"
                    onRemove={() => updateFilter('city', '')}
                  />
                )}
                {filters.status && (
                  <FilterPill
                    label="Status" value={filters.status}
                    color="text-amber-400 bg-amber-500/10 border-amber-500/20 border"
                    onRemove={() => updateFilter('status', '')}
                  />
                )}

                <button onClick={clearFilters}
                  className="ml-1 text-[9px] font-black text-slate-600 uppercase tracking-widest hover:text-red-400 transition-colors flex items-center gap-1">
                  <XMarkIcon className="w-3 h-3" />
                  Clear all
                </button>
              </div>
            )}
          </div>
          {/* ── END FILTER BAR ─────────────────────────────────────────────── */}

          {/* Leads Table */}
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
            {/* Header */}
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
                className={`grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-white/[0.02] transition-colors
                  ${i < myLeads.length - 1 ? 'border-b border-white/5' : ''}`}
              >
                <div className="col-span-4 min-w-0">
                  <p className="text-white font-bold text-sm truncate">{lead.name}</p>
                  <a href={lead.website} target="_blank" rel="noreferrer"
                    className="text-[10px] text-indigo-400 hover:text-indigo-300 truncate block transition-colors">
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
                Showing {((pagination.page - 1) * pagination.per_page) + 1}–
                {Math.min(pagination.page * pagination.per_page, pagination.total_count)} of {pagination.total_count}
              </p>
              <div className="flex items-center gap-2">
                <button onClick={() => updateFilter('page', pagination.page - 1)}
                  disabled={!pagination.has_prev}
                  className="p-2 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-white hover:border-white/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed">
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
                    <button key={p} onClick={() => updateFilter('page', p)}
                      className={`w-8 h-8 rounded-xl text-[10px] font-black transition-all ${p === pagination.page
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:border-white/20'
                        }`}>
                      {p}
                    </button>
                  ))
                }

                <button onClick={() => updateFilter('page', pagination.page + 1)}
                  disabled={!pagination.has_next}
                  className="p-2 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-white hover:border-white/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed">
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

export default UserDashboard;