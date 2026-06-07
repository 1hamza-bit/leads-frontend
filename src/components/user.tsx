import { useState, useEffect, useCallback, useRef } from 'react';
import { Campaign, Lead, NicheIntel, User, PlanInfo } from "@/types";
import {
  BoltIcon, CircleStackIcon,
  MagnifyingGlassIcon, PlusIcon, QueueListIcon, EnvelopeIcon,
  PhoneIcon, GlobeAltIcon, ArrowPathIcon, FunnelIcon,
  ChevronLeftIcon, ChevronRightIcon, CheckBadgeIcon,
  XMarkIcon, ExclamationTriangleIcon, ClockIcon,
  ChevronDownIcon, ArrowsUpDownIcon, LinkIcon,
  BuildingOfficeIcon, MapPinIcon, CloudArrowDownIcon,
  FingerPrintIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import {
  getMyLeads, getMyLeadsMeta,
  MyLead, LeadFilters, LeadsPagination,
  DashboardStats, getDashboardStats
} from '../services/authService';
import api from './api';

type DashTab = 'overview' | 'leads';

// ─────────────────────────────────────────────────────────────────────────────
// TRIAL BANNER
// ─────────────────────────────────────────────────────────────────────────────
const TrialBanner = ({ planInfo, onUpgrade }: { planInfo: PlanInfo; onUpgrade: () => void }) => {
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
        <button onClick={onUpgrade} className="shrink-0 bg-red-500 text-white font-black px-5 py-2 rounded-xl text-xs uppercase tracking-widest hover:bg-red-400 transition-all">
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
              {days === 0 ? 'Trial expires today' : `${days} day${days === 1 ? '' : 's'} left`}
            </p>
            <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest ml-4 shrink-0">
              {planInfo.daily_leads_remaining ?? 0} leads today
            </span>
          </div>
          <div className="h-1 bg-white/5 rounded-full overflow-hidden">
            <div className={`h-full ${bar} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>
      <button onClick={onUpgrade} className="shrink-0 bg-indigo-600 text-white font-black px-5 py-2 rounded-xl text-xs uppercase tracking-widest hover:bg-indigo-500 transition-all">
        Upgrade
      </button>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// FILTER SELECT
// ─────────────────────────────────────────────────────────────────────────────
const FilterSelect = ({
  value, onChange, options, placeholder, icon, accentColor = 'indigo',
}: {
  value: string;
  onChange: (v: string) => void;
  options: { label: string; value: string }[];
  placeholder: string;
  icon?: React.ReactNode;
  accentColor?: 'indigo' | 'cyan' | 'amber';
}) => {
  const [open, setOpen] = useState(false);
  const selected = options.find(o => o.value === value);
  const accent: Record<string, { ring: string; text: string; bg: string }> = {
    indigo: { ring: 'border-indigo-500/60', text: 'text-indigo-400', bg: 'bg-indigo-500/10' },
    cyan: { ring: 'border-cyan-500/60', text: 'text-cyan-400', bg: 'bg-cyan-500/10' },
    amber: { ring: 'border-amber-500/60', text: 'text-amber-400', bg: 'bg-amber-500/10' },
  };
  const a = accent[accentColor];
  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap
          ${value ? `${a.bg} ${a.ring} ${a.text}` : 'bg-white/[0.03] border-white/10 text-slate-500 hover:border-white/20 hover:text-slate-300'}`}>
        {icon && <span className="shrink-0 opacity-70">{icon}</span>}
        <span>{selected?.label ?? placeholder}</span>
        <ChevronDownIcon className={`w-3 h-3 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1.5 z-50 min-w-[180px] max-h-56 overflow-y-auto
            bg-[#0d0e14] border border-white/10 rounded-2xl shadow-2xl shadow-black/60 py-1.5
            [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-white/10">
            {options.map(opt => (
              <button key={opt.value} type="button" onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`w-full text-left px-4 py-2.5 text-[11px] font-bold flex items-center gap-2.5 transition-colors
                  ${opt.value === value ? `${a.text} ${a.bg}` : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
                {opt.value === value
                  ? <CheckCircleIcon className={`w-3.5 h-3.5 shrink-0 ${a.text}`} />
                  : <span className="w-3.5" />}
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SORT TOGGLE
// ─────────────────────────────────────────────────────────────────────────────
const SortToggle = ({ sortBy, order, onChange }: {
  sortBy: string; order: string; onChange: (s: string, o: string) => void;
}) => {
  const [open, setOpen] = useState(false);
  const opts = [
    { label: 'Newest first', sort: 'created_at', ord: 'desc' },
    { label: 'Oldest first', sort: 'created_at', ord: 'asc' },
    { label: 'Highest score', sort: 'score', ord: 'desc' },
    { label: 'Lowest score', sort: 'score', ord: 'asc' },
    { label: 'Name A→Z', sort: 'name', ord: 'asc' },
    { label: 'Name Z→A', sort: 'name', ord: 'desc' },
  ];
  const current = opts.find(o => o.sort === sortBy && o.ord === order) ?? opts[0];
  return (
    <div className="relative ml-auto">
      <button type="button" onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-white/10 bg-white/[0.03] text-slate-500 hover:border-white/20 hover:text-slate-300 text-[10px] font-black uppercase tracking-widest transition-all">
        <ArrowsUpDownIcon className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">{current.label}</span>
        <ChevronDownIcon className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full right-0 mt-1.5 z-50 min-w-[160px] bg-[#0d0e14] border border-white/10 rounded-2xl shadow-2xl shadow-black/60 py-1.5 overflow-hidden">
            {opts.map(opt => {
              const active = opt.sort === sortBy && opt.ord === order;
              return (
                <button key={`${opt.sort}-${opt.ord}`} type="button"
                  onClick={() => { onChange(opt.sort, opt.ord); setOpen(false); }}
                  className={`w-full text-left px-4 py-2.5 text-[11px] font-bold flex items-center gap-2.5 transition-colors
                    ${active ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
                  {active ? <CheckCircleIcon className="w-3.5 h-3.5 shrink-0 text-indigo-400" /> : <span className="w-3.5" />}
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

// ─────────────────────────────────────────────────────────────────────────────
// PER PAGE TOGGLE
// ─────────────────────────────────────────────────────────────────────────────
const PerPageToggle = ({ value, onChange }: { value: number; onChange: (v: number) => void }) => (
  <div className="flex items-center gap-1 bg-white/[0.03] border border-white/10 rounded-xl p-1">
    {[10, 25, 50].map(n => (
      <button key={n} type="button" onClick={() => onChange(n)}
        className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all
          ${value === n ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-300'}`}>
        {n}
      </button>
    ))}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// FILTER PILL
// ─────────────────────────────────────────────────────────────────────────────
const FilterPill = ({ label, value, color, onRemove }: {
  label: string; value: string; color: string; onRemove: () => void;
}) => (
  <span className={`flex items-center gap-1.5 pl-3 pr-2 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest ${color}`}>
    <span className="opacity-60">{label}:</span>
    <span>{value}</span>
    <button type="button" onClick={onRemove}
      className="ml-0.5 w-4 h-4 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all">
      <XMarkIcon className="w-2.5 h-2.5" />
    </button>
  </span>
);

// ─────────────────────────────────────────────────────────────────────────────
// STATUS + SOURCE BADGES
// ─────────────────────────────────────────────────────────────────────────────
const STATUS_CFG: Record<string, { color: string; bg: string; border: string; dot: string }> = {
  new: { color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', dot: 'bg-indigo-400' },
  contacted: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', dot: 'bg-amber-400' },
  replied: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', dot: 'bg-emerald-400' },
  qualified: { color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', dot: 'bg-cyan-400' },
  rejected: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', dot: 'bg-red-400' },
  verified: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', dot: 'bg-emerald-400' },
  saved: { color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20', dot: 'bg-violet-400' },
};
const StatusBadge = ({ status }: { status: string }) => {
  const s = STATUS_CFG[status] ?? STATUS_CFG.new;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[9px] font-black uppercase tracking-widest ${s.color} ${s.bg} ${s.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.dot}`} />
      {status}
    </span>
  );
};

const SRC_CFG: Record<string, { label: string; cls: string }> = {
  vault: { label: 'Vault', cls: 'text-slate-400  border-slate-500/40' },
  google_search: { label: 'Google', cls: 'text-blue-400   border-blue-500/40' },
  facebook_graph: { label: 'Facebook', cls: 'text-indigo-400 border-indigo-500/40' },
  facebook_gemini: { label: 'Facebook', cls: 'text-indigo-400 border-indigo-500/40' },
  linkedin_signal: { label: 'LinkedIn', cls: 'text-cyan-400   border-cyan-500/40' },
  news_signal: { label: 'News', cls: 'text-amber-400  border-amber-500/40' },
  ai_search: { label: 'AI', cls: 'text-violet-400 border-violet-500/40' },
  csv_import: { label: 'Imported', cls: 'text-emerald-400 border-emerald-500/40' },
};
const SourceBadge = ({ source }: { source?: string }) => {
  const c = SRC_CFG[source || ''] ?? SRC_CFG.ai_search;
  return (
    <span className={`px-2 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-widest ${c.cls}`}>
      {c.label}
    </span>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// CRM EXPORT MODAL  (dashboard-specific — backend powered)
//
// Lives here rather than App.tsx because it reads niche/city from the
// dashboard filter state directly.
//
// Calls GET /my-leads/export?format=xxx&niche=xxx&city=xxx&status=xxx
// Backend returns a streaming file download.
// ─────────────────────────────────────────────────────────────────────────────
const DashboardExportModal = ({
  onClose,
  activeNiche,
  activeCity,
  activeStatus,
  totalCount,
  nicheOptions,
  cityOptions,
}: {
  onClose: () => void;
  activeNiche: string;
  activeCity: string;
  activeStatus: string;
  totalCount: number;
  nicheOptions: string[];
  cityOptions: string[];
}) => {
  const [format, setFormat] = useState<'csv' | 'json' | 'hubspot' | 'salesforce'>('csv');
  const [scope, setScope] = useState<'all' | 'filtered'>('all');
  const [niche, setNiche] = useState('');
  const [city, setCity] = useState('');
  const [status, setStatus] = useState('');
  const [exporting, setExporting] = useState(false);
  const [done, setDone] = useState(false);
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [countLoading, setCountLoading] = useState(false);
  // ── Add near other state declarations ─────────────────────────────────────


  // When modal opens, pre-fill from active filters if user chose 'filtered'
  useEffect(() => {
    if (scope === 'filtered') {
      setNiche(activeNiche);
      setCity(activeCity);
      setStatus(activeStatus);
    } else {
      setNiche('');
      setCity('');
      setStatus('');
    }
  }, [scope]);

  // Live preview count
  useEffect(() => {
    setCountLoading(true);
    const params = new URLSearchParams({ per_page: '1', page: '1' });
    if (niche) params.set('niche', niche);
    if (city) params.set('city', city);
    if (status) params.set('status', status);

    api.get(`/my-leads?${params.toString()}`)
      .then(res => setPreviewCount(res.data.pagination?.total_count ?? 0))
      .catch(() => setPreviewCount(null))
      .finally(() => setCountLoading(false));
  }, [niche, city, status]);

  const FORMATS = [
    { id: 'csv', label: 'CSV', sub: 'Universal — Excel / Google Sheets', color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5' },
    { id: 'json', label: 'JSON', sub: 'All fields + deep audit data', color: 'text-blue-400 border-blue-500/30 bg-blue-500/5' },
    { id: 'hubspot', label: 'HubSpot CSV', sub: 'Direct import — HubSpot contacts', color: 'text-orange-400 border-orange-500/30 bg-orange-500/5' },
    { id: 'salesforce', label: 'Salesforce CSV', sub: 'Direct import — Salesforce leads', color: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/5' },
  ] as const;

  const FIELDS: Record<string, string> = {
    csv: 'Name, Email, Phone, Website, City, Niche, Score, Status, Reasoning, Email Verified, Decision Maker',
    json: 'All fields + verification status, deep audit, decision maker, social profiles, activity signals',
    hubspot: 'First Name, Last Name, Email, Phone, Website URL, City, Industry, Lead Status, Notes, Score',
    salesforce: 'Last Name, First Name, Email, Phone, Website, City, Industry, Lead Status, Description, Rating',
  };

  const HOW_TO: Record<string, { steps: string[]; link: string }> = {
    hubspot: {
      steps: ['Go to Contacts → Import', 'Choose "Import file from computer"', 'Select "Contacts" as object type', 'Upload CSV — columns map automatically', 'Review duplicates & confirm'],
      link: 'https://knowledge.hubspot.com/crm-setup/how-to-import-contacts',
    },
    salesforce: {
      steps: ['Go to Leads → Import', 'Select "Insert new records"', 'Upload CSV', 'Map columns (Last Name required)', 'Click Import Now'],
      link: 'https://help.salesforce.com/s/articleView?id=sf.importing_crm_data.htm',
    },
  };

  const nicheOpts = [{ label: 'All Niches', value: '' }, ...nicheOptions.map(n => ({ label: n, value: n }))];
  const cityOpts = [{ label: 'All Cities', value: '' }, ...cityOptions.map(c => ({ label: c, value: c }))];
  const statusOpts = [
    { label: 'All Statuses', value: '' },
    ...Object.keys(STATUS_CFG).map(k => ({ label: k.charAt(0).toUpperCase() + k.slice(1), value: k })),
  ];

  const doExport = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams({ format });
      if (niche) params.set('niche', niche);
      if (city) params.set('city', city);
      if (status) params.set('status', status);

      // Get JWT token — try both storage locations
      const token = localStorage.getItem('access_token')
        || sessionStorage.getItem('access_token')
        || localStorage.getItem('token')
        || '';

      const response = await fetch(
        `${(api.defaults as any).baseURL || ''}/my-leads/export?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error((err as any).error || `Export failed: ${response.status}`);
      }

      const disposition = response.headers.get('Content-Disposition') || '';
      const match = disposition.match(/filename=(.+)/);
      const filename = match ? match[1] : `intentiq-export.${format === 'json' ? 'json' : 'csv'}`;

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);

      setDone(true);
      setTimeout(() => setDone(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const exportCount = countLoading ? '…' : (previewCount ?? totalCount);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-[#0d0e14] border border-white/10 rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center gap-4 shrink-0">
          <div className="w-10 h-10 bg-indigo-500/10 rounded-2xl flex items-center justify-center">
            <CloudArrowDownIcon className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-white font-bold text-base">Export Leads to CRM</h3>
            <p className="text-slate-500 text-[10px]">Choose what to export and which format</p>
          </div>
          <button onClick={onClose} className="ml-auto text-slate-600 hover:text-white transition-colors text-xl leading-none">×</button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-white/10">

          {/* ── Scope: All vs Filtered ── */}
          <div>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">What to export</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'all', label: 'All my leads', sub: 'Every lead in your account' },
                { id: 'filtered', label: 'Filtered selection', sub: 'Choose niche, city or status below' },
              ].map(s => (
                <button key={s.id} type="button" onClick={() => setScope(s.id as 'all' | 'filtered')}
                  className={`p-4 rounded-2xl border text-left transition-all ${scope === s.id
                    ? 'bg-indigo-500/10 border-indigo-500/40'
                    : 'bg-white/[0.02] border-white/5 hover:border-white/20'
                    }`}>
                  <div className={`w-3.5 h-3.5 rounded-full border-2 mb-2 flex items-center justify-center ${scope === s.id ? 'border-indigo-400' : 'border-slate-600'}`}>
                    {scope === s.id && <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />}
                  </div>
                  <p className={`font-bold text-[11px] ${scope === s.id ? 'text-white' : 'text-slate-400'}`}>{s.label}</p>
                  <p className="text-[9px] text-slate-600 mt-0.5">{s.sub}</p>
                </button>
              ))}
            </div>
          </div>


          {/* ── Filters (only visible when scope=filtered) ── */}
          {scope === 'filtered' && (
            <div className="p-4 bg-white/[0.02] rounded-2xl border border-white/5 space-y-3">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Filter Options</p>
              <div className="flex flex-wrap gap-2">
                <FilterSelect
                  value={niche} onChange={setNiche}
                  options={nicheOpts} placeholder="Niche"
                  accentColor="indigo"
                  icon={<QueueListIcon className="w-3.5 h-3.5" />}
                />
                <FilterSelect
                  value={city} onChange={setCity}
                  options={cityOpts} placeholder="City"
                  accentColor="cyan"
                  icon={<GlobeAltIcon className="w-3.5 h-3.5" />}
                />
                <FilterSelect
                  value={status} onChange={setStatus}
                  options={statusOpts} placeholder="Status"
                  accentColor="amber"
                  icon={<BoltIcon className="w-3.5 h-3.5" />}
                />
              </div>

              {/* Active filter pills */}
              {(niche || city || status) && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {niche && <FilterPill label="Niche" value={niche} color="text-indigo-400 bg-indigo-500/10 border border-indigo-500/20" onRemove={() => setNiche('')} />}
                  {city && <FilterPill label="City" value={city} color="text-cyan-400   bg-cyan-500/10   border border-cyan-500/20" onRemove={() => setCity('')} />}
                  {status && <FilterPill label="Status" value={status} color="text-amber-400  bg-amber-500/10  border border-amber-500/20" onRemove={() => setStatus('')} />}
                  <button type="button" onClick={() => { setNiche(''); setCity(''); setStatus(''); }}
                    className="text-[9px] font-black text-slate-600 hover:text-red-400 transition-colors uppercase tracking-widest flex items-center gap-1">
                    <XMarkIcon className="w-3 h-3" /> Clear
                  </button>
                </div>
              )}

              {/* Live preview count */}
              <div className="flex items-center gap-2 pt-1">
                {countLoading
                  ? <ArrowPathIcon className="w-3.5 h-3.5 text-slate-600 animate-spin" />
                  : <span className="text-[9px] font-black text-slate-500">
                    Matching leads: <span className="text-indigo-400">{previewCount ?? '—'}</span>
                  </span>
                }
              </div>
            </div>
          )}

          {/* ── Format picker ── */}
          <div>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">Export Format</p>
            <div className="space-y-2">
              {FORMATS.map(f => (
                <button key={f.id} type="button" onClick={() => setFormat(f.id as any)}
                  className={`w-full flex items-center gap-4 p-3.5 rounded-2xl border transition-all text-left ${format === f.id ? f.color + ' border-opacity-100' : 'bg-white/[0.02] border-white/5 hover:border-white/20'
                    }`}>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${format === f.id ? 'border-current' : 'border-slate-600'}`}>
                    {format === f.id && <div className="w-2 h-2 rounded-full bg-current" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-bold text-sm ${format === f.id ? 'text-white' : 'text-slate-400'}`}>{f.label}</p>
                    <p className="text-[10px] text-slate-600 mt-0.5">{f.sub}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Fields preview */}
          <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl">
            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Fields included</p>
            <p className="text-[10px] text-slate-400 leading-relaxed">{FIELDS[format]}</p>
          </div>

          {/* Import instructions for HubSpot/Salesforce */}
          {(format === 'hubspot' || format === 'salesforce') && HOW_TO[format] && (
            <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl">
              <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-2">
                How to import into {format === 'hubspot' ? 'HubSpot' : 'Salesforce'}
              </p>
              <ol className="text-[10px] text-slate-500 space-y-1 list-decimal list-inside">
                {HOW_TO[format].steps.map((s, i) => <li key={i}>{s}</li>)}
              </ol>
              <a href={HOW_TO[format].link} target="_blank" rel="noreferrer"
                className="text-[9px] text-indigo-400 hover:text-indigo-300 font-bold mt-2 block transition-colors">
                Official import guide →
              </a>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/5 shrink-0">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] text-slate-500">Leads to export</span>
            <span className="text-[10px] font-black text-white flex items-center gap-1.5">
              {countLoading
                ? <ArrowPathIcon className="w-3.5 h-3.5 text-slate-600 animate-spin" />
                : <>{exportCount} lead{Number(exportCount) !== 1 ? 's' : ''}</>}
            </span>
          </div>
          <button onClick={doExport} disabled={exporting || done || exportCount === 0}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-40 shadow-lg shadow-indigo-600/20">
            {exporting
              ? <><ArrowPathIcon className="w-4 h-4 animate-spin" /> Preparing {format.toUpperCase()}…</>
              : done
                ? <><CheckCircleIcon className="w-4 h-4" /> Downloaded — check your folder!</>
                : <><CloudArrowDownIcon className="w-4 h-4" /> Download {format.toUpperCase()} ({exportCount} leads)</>}
          </button>
          <button onClick={onClose}
            className="mt-3 w-full text-slate-600 text-[9px] font-bold uppercase tracking-widest hover:text-white transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// LEAD DETAIL PANEL
// ─────────────────────────────────────────────────────────────────────────────
const LeadDetailPanel = ({ lead, onClose }: { lead: MyLead; onClose: () => void }) => {
  const scoreColor =
    lead.score >= 80 ? 'text-emerald-400' :
      lead.score >= 60 ? 'text-indigo-400' :
        lead.score >= 40 ? 'text-amber-400' : 'text-red-400';
  const scoreBorder =
    lead.score >= 80 ? 'border-emerald-500/30 bg-emerald-500/5' :
      lead.score >= 60 ? 'border-indigo-500/30  bg-indigo-500/5' :
        lead.score >= 40 ? 'border-amber-500/30   bg-amber-500/5' :
          'border-red-500/30 bg-red-500/5';

  const dm = (lead as any).decision_maker;
  const reasoning = (lead as any).reasoning;
  const auditSummary = (lead as any).deep_audit_summary;
  const source = (lead as any).source;

  return (
    <div className="flex flex-col h-full bg-[#0a0b10]">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06] bg-black/30 shrink-0">
        <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Lead Detail</p>
        <button type="button" onClick={onClose}
          className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-500 hover:text-white transition-all">
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-white/10">
        <div className="px-5 pt-5 pb-4 border-b border-white/[0.06]">
          <div className="flex items-start gap-3 mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-black text-base leading-tight break-words mb-2">{lead.name}</h3>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={lead.status} />
                {source && <SourceBadge source={source} />}
              </div>
            </div>
            <div className={`shrink-0 flex flex-col items-center justify-center w-14 h-14 rounded-2xl border ${scoreBorder}`}>
              <span className={`text-xl font-black leading-none ${scoreColor}`}>{lead.score}</span>
              <span className="text-[8px] text-slate-600 font-bold uppercase mt-0.5">score</span>
            </div>
            <div className="col-span-1 text-right flex flex-col items-end gap-1">
              <span className={`text-[10px] font-black ${lead.score >= 70 ? 'text-emerald-400' :
                lead.score >= 40 ? 'text-indigo-400' : 'text-slate-500'
                }`}>
                {lead.score}%
              </span>
              {/* Verification dot */}
              {(lead as any).verification?.overall && (() => {
                const dots: Record<string, string> = {
                  verified: 'bg-emerald-400',
                  partial: 'bg-amber-400',
                  failed: 'bg-red-400',
                };
                return (
                  <div className={`w-1.5 h-1.5 rounded-full ${dots[(lead as any).verification.overall] ?? 'bg-slate-600'}`}
                    title={`Verification: ${(lead as any).verification.overall}`} />
                );
              })()}
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {lead.niche && (
              <span className="flex items-center gap-1 px-2 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-full text-[9px] font-black uppercase tracking-widest">
                <BuildingOfficeIcon className="w-3 h-3" />{lead.niche}
              </span>
            )}
            {lead.city && (
              <span className="flex items-center gap-1 px-2 py-1 bg-white/5 border border-white/10 text-slate-400 rounded-full text-[9px] font-black uppercase tracking-widest">
                <MapPinIcon className="w-3 h-3" />{lead.city}
              </span>
            )}
          </div>
        </div>

        {/* Contact info */}
        <div className="px-5 py-4 border-b border-white/[0.06] space-y-3">
          <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.15em]">Contact</p>

          {/* Website */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                <LinkIcon className="w-3.5 h-3.5 text-slate-600" />
              </div>
              {lead.website ? (
                <a href={lead.website} target="_blank" rel="noreferrer"
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 truncate transition-colors">
                  {lead.website.replace(/https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
                </a>
              ) : (
                <span className="text-[11px] text-slate-600 italic">No website</span>
              )}
            </div>
            {/* Website live badge from persisted verification */}
            {(lead as any).verification?.website?.is_live !== undefined && (
              (lead as any).verification.website.is_live
                ? <span className="shrink-0 px-2 py-0.5 rounded-full text-[9px] font-black border bg-emerald-500/10 border-emerald-500/30 text-emerald-400">Live</span>
                : <span className="shrink-0 px-2 py-0.5 rounded-full text-[9px] font-black border bg-red-500/10 border-red-500/30 text-red-400">Down</span>
            )}
          </div>

          {/* Email */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                <EnvelopeIcon className="w-3.5 h-3.5 text-slate-600" />
              </div>
              {lead.email ? (
                <span className="text-[11px] text-slate-300 truncate">{lead.email}</span>
              ) : (
                <span className="text-[11px] text-slate-600 italic">No email</span>
              )}
            </div>
            {/* Email status badge from persisted verification */}
            {(lead as any).verification?.email?.status && (() => {
              const STATUS_BADGE: Record<string, { label: string; color: string; bg: string; border: string }> = {
                verified: { label: 'Verified', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
                audit_verified: { label: 'Audited', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
                mx_verified: { label: 'MX OK', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
                probable: { label: 'Probable', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
                catchall_server: { label: 'Catch-All', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
                undeliverable: { label: 'Bad Email', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' },
                no_mx_record: { label: 'No MX', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' },
                invalid_format: { label: 'Invalid', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' },
                no_email: { label: 'No Email', color: 'text-slate-500', bg: 'bg-white/5', border: 'border-white/10' },
              };
              const cfg = STATUS_BADGE[(lead as any).verification.email.status] ?? { label: (lead as any).verification.email.status, color: 'text-slate-400', bg: 'bg-white/5', border: 'border-white/10' };
              return (
                <span className={`shrink-0 px-2 py-0.5 rounded-full text-[9px] font-black border ${cfg.color} ${cfg.bg} ${cfg.border}`}>
                  {cfg.label}
                </span>
              );
            })()}
          </div>

          {/* Phone */}
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
              <PhoneIcon className="w-3.5 h-3.5 text-slate-600" />
            </div>
            {lead.phone_number ? (
              <span className="text-[11px] text-slate-300">{lead.phone_number}</span>
            ) : (
              <span className="text-[11px] text-slate-600 italic">No phone</span>
            )}
          </div>

          {/* Overall verification status pill */}
          {(lead as any).verification?.overall && (
            <div className="flex items-center gap-2 pt-2 border-t border-white/[0.05]">
              <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Verification:</span>
              {(() => {
                const ov = (lead as any).verification.overall;
                const OV: Record<string, string> = {
                  verified: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
                  partial: 'text-amber-400   bg-amber-500/10   border-amber-500/30',
                  failed: 'text-red-400     bg-red-500/10     border-red-500/30',
                };
                return (
                  <span className={`px-2 py-0.5 rounded-full border text-[9px] font-black capitalize ${OV[ov] ?? OV.failed}`}>
                    {ov}
                  </span>
                );
              })()}
            </div>
          )}
        </div>

        {reasoning && (
          <div className="px-5 py-4 border-b border-white/[0.06]">
            <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.15em] mb-2">Signal</p>
            <p className="text-[11px] text-slate-400 leading-relaxed italic">"{reasoning}"</p>
          </div>
        )}

        {dm?.name && (
          <div className="px-5 py-4 border-b border-white/[0.06]">
            <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.15em] mb-3">Decision Maker</p>
            <div className="flex items-center gap-3 p-3 bg-white/[0.02] rounded-xl border border-white/[0.06]">
              <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white text-sm font-black shrink-0">
                {dm.name.charAt(0)}
              </div>
              <div>
                <p className="text-white font-bold text-[12px] leading-tight">{dm.name}</p>
                {dm.title && <p className="text-[10px] text-indigo-400 font-bold mt-0.5">{dm.title}</p>}
                {dm.linkedin_url && (
                  <a href={dm.linkedin_url} target="_blank" rel="noreferrer"
                    className="text-[9px] text-cyan-400 hover:text-cyan-300 font-bold mt-0.5 block transition-colors">LinkedIn →</a>
                )}
              </div>
            </div>
          </div>
        )}

        {auditSummary && (
          <div className="px-5 py-4 border-b border-white/[0.06]">
            <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.15em] mb-2">Audit Summary</p>
            <p className="text-[11px] text-slate-400 leading-relaxed">{auditSummary}</p>
          </div>
        )}

        <div className="px-5 py-4">
          <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.15em] mb-3">Meta</p>
          <div className="space-y-2">
            <div className="flex justify-between text-[10px]">
              <span className="text-slate-600">Acquired</span>
              <span className="text-slate-400">{new Date(lead.acquired_at).toLocaleDateString()}</span>
            </div>
            {source && (
              <div className="flex justify-between text-[10px]">
                <span className="text-slate-600">Source</span>
                <span className="text-slate-400 capitalize">{source.replace(/_/g, ' ')}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
const UserDashboard = ({
  onNavigate, currentUser, campaigns, globalLeads,
  setNiche, setCity, setServiceOffered, setIdealCompanyType,
  setLeads, setNicheIntel, onBulkAudit,
  isBulkAuditing,
  bulkAuditProgress,
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
  onBulkAudit: (leads?: any[]) => void;
 isBulkAuditing: boolean;
  bulkAuditProgress: { done: number; total: number };
}) => {
  const [activeTab, setActiveTab] = useState<DashTab>('overview');
  const [myLeads, setMyLeads] = useState<MyLead[]>([]);
  const [pagination, setPagination] = useState<LeadsPagination | null>(null);
  const [isLoadingLeads, setIsLoadingLeads] = useState(false);
  const [leadsError, setLeadsError] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<MyLead | null>(null);
  const [filters, setFilters] = useState<LeadFilters>({ page: 1, per_page: 10, sort_by: 'created_at', order: 'desc' });
  const [nicheOptions, setNicheOptions] = useState<string[]>([]);
  const [cityOptions, setCityOptions] = useState<string[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // ── Export modal state ────────────────────────────────────────────────────
  const [showExport, setShowExport] = useState(false);

  const detailScrollRef = useRef<HTMLDivElement>(null);
  const planInfo = currentUser?.plan_info ?? null;
  const isTrialExpired = planInfo?.trial_expired === true;
  const panelOpen = selectedLead !== null;
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === myLeads.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(myLeads.map(l => l.id)));
    }
  };

  const clearSelection = () => setSelectedIds(new Set());

  useEffect(() => {
    const run = async () => {
      setIsLoadingStats(true);
      try { setStats(await getDashboardStats()); }
      catch { /* non-fatal */ }
      finally { setIsLoadingStats(false); }
    };
    run();
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
      .then(m => { setNicheOptions(m.niches); setCityOptions(m.cities); })
      .catch(() => { });
  }, []);

  useEffect(() => {
    if (activeTab === 'leads') fetchLeads();
  }, [activeTab, fetchLeads]);

  useEffect(() => {
    if (selectedLead && !myLeads.find(l => l.id === selectedLead.id)) setSelectedLead(null);
  }, [myLeads]);

  useEffect(() => {
    detailScrollRef.current?.scrollTo({ top: 0 });
  }, [selectedLead?.id]);

  const updateFilter = (key: keyof LeadFilters, value: any) =>
    setFilters(prev => ({ ...prev, [key]: value, ...(key !== 'page' ? { page: 1 } : {}) }));

  const clearFilters = () =>
    setFilters({ page: 1, per_page: 10, sort_by: 'created_at', order: 'desc' });

  const hasActiveFilters = !!(filters.niche || filters.city || filters.status);
  const activeFilterCount = [filters.niche, filters.city, filters.status].filter(Boolean).length;

  const handleNewHunt = () => {
    if (isTrialExpired && !currentUser?.is_admin) return;
    setNiche(''); setCity(''); setServiceOffered(''); setIdealCompanyType('');
    setLeads([]); setNicheIntel(null);
    onNavigate('/setup');
  };

  const handleRowClick = (lead: MyLead) =>
    setSelectedLead(prev => prev?.id === lead.id ? null : lead);

  const nicheOpts = [{ label: 'All Niches', value: '' }, ...nicheOptions.map(n => ({ label: n, value: n }))];
  const cityOpts = [{ label: 'All Cities', value: '' }, ...cityOptions.map(c => ({ label: c, value: c }))];
  const statusOpts = [
    { label: 'All Statuses', value: '' },
    ...Object.keys(STATUS_CFG).map(k => ({ label: k.charAt(0).toUpperCase() + k.slice(1), value: k })),
  ];

  return (
    <div className="max-w-[1400px] w-full py-6 md:py-10 animate-in fade-in duration-500">

      {/* Export modal */}
      {showExport && (
        <DashboardExportModal
          onClose={() => setShowExport(false)}
          activeNiche={filters.niche || ''}
          activeCity={filters.city || ''}
          activeStatus={filters.status || ''}
          totalCount={pagination?.total_count ?? 0}
          nicheOptions={nicheOptions}
          cityOptions={cityOptions}
        />
      )}

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
              isTrialExpired
                ? <p className="text-xl md:text-2xl font-black text-red-400">Expired</p>
                : <p className={`text-xl md:text-2xl font-black ${(planInfo.trial_days_remaining ?? 0) <= 2 ? 'text-red-400' : (planInfo.trial_days_remaining ?? 0) <= 5 ? 'text-amber-400' : 'text-indigo-400'}`}>
                  {planInfo.trial_days_remaining ?? 0}d left
                </p>
            ) : (
              <p className="text-xl md:text-2xl font-black text-indigo-400">{currentUser?.credits ?? 0}</p>
            )}
          </div>
          <div className="flex-1 md:flex-none flex flex-col items-stretch gap-1">
            <button type="button" onClick={handleNewHunt}
              disabled={isTrialExpired && !currentUser?.is_admin}
              className={`bg-indigo-600 text-white font-bold px-4 md:px-8 py-3 md:py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/10 text-xs md:text-sm
                ${isTrialExpired && !currentUser?.is_admin ? 'opacity-40 cursor-not-allowed' : 'hover:bg-indigo-500'}`}>
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
          <button key={tab.key} type="button" onClick={() => setActiveTab(tab.key)}
            className={`px-6 py-4 text-[10px] font-black uppercase tracking-widest transition-all relative
              ${activeTab === tab.key ? 'text-white' : 'text-slate-600 hover:text-slate-400'}`}>
            {tab.label}
            {activeTab === tab.key && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />}
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
                <div className="col-span-12 lg:col-span-7 bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden">
                  <div className="p-6 border-b border-white/5 flex items-center justify-between">
                    <h3 className="text-white font-bold">Recent Leads</h3>
                    <button type="button" onClick={() => setActiveTab('leads')}
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
                          <span className={`text-[10px] font-black ${lead.score >= 70 ? 'text-emerald-400' : 'text-indigo-400'}`}>{lead.score}%</span>
                        </div>
                      </div>
                    ))}
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
                        const pct = Math.round((row.val / (stats?.stats.total_leads || 1)) * 100);
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
                    <h3 className="text-white font-bold mb-4">Top Niches</h3>
                    <div className="space-y-2">
                      {!stats?.top_niches.length ? <p className="text-slate-600 text-sm italic">No data yet</p>
                        : stats.top_niches.map((n, i) => (
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
                    <h3 className="text-white font-bold mb-4">Top Cities</h3>
                    <div className="space-y-2">
                      {!stats?.top_cities.length ? <p className="text-slate-600 text-sm italic">No data yet</p>
                        : stats.top_cities.map((c, i) => (
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
                  : 'bg-gradient-to-br from-indigo-600 to-indigo-800 shadow-indigo-600/20'}`}>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200 mb-1">Current Plan</p>
                  <h3 className="text-3xl font-black tracking-tight">{stats?.user.plan?.toUpperCase() ?? 'FREE'}</h3>
                  <p className="text-indigo-200 text-sm mt-1">
                    {planInfo?.plan === 'free' && !currentUser?.is_admin
                      ? isTrialExpired
                        ? 'Your free trial has ended — upgrade to keep hunting'
                        : `${planInfo.trial_days_remaining} day${planInfo.trial_days_remaining === 1 ? '' : 's'} remaining`
                      : `${stats?.user.credits ?? 0} credits remaining`}
                  </p>
                </div>
                <button type="button" onClick={() => onNavigate('/pricing')}
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

          {/* Filter bar */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] mr-1">
                <FunnelIcon className="w-3.5 h-3.5" />
                <span>Filter</span>
                {activeFilterCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[8px] font-black flex items-center justify-center">{activeFilterCount}</span>
                )}
              </div>
              <FilterSelect value={filters.niche || ''} onChange={v => updateFilter('niche', v)} options={nicheOpts} placeholder="Niche" accentColor="indigo" icon={<QueueListIcon className="w-3.5 h-3.5" />} />
              <FilterSelect value={filters.city || ''} onChange={v => updateFilter('city', v)} options={cityOpts} placeholder="City" accentColor="cyan" icon={<GlobeAltIcon className="w-3.5 h-3.5" />} />
              <FilterSelect value={filters.status || ''} onChange={v => updateFilter('status', v)} options={statusOpts} placeholder="Status" accentColor="amber" icon={<BoltIcon className="w-3.5 h-3.5" />} />
              <div className="w-px h-5 bg-white/10 mx-1" />
              <PerPageToggle value={filters.per_page || 10} onChange={v => updateFilter('per_page', v)} />
              <SortToggle
                sortBy={filters.sort_by || 'created_at'}
                order={filters.order || 'desc'}
                onChange={(s, o) => setFilters(prev => ({ ...prev, sort_by: s as any, order: o as any, page: 1 }))}
              />

              {/* ── EXPORT BUTTON — lives here in My Leads tab only ── */}
              <button
                type="button"
                onClick={() => setShowExport(true)}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500/20 transition-all"
              >
                <CloudArrowDownIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Export CRM</span>
              </button>
            </div>

            {hasActiveFilters && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-[9px] font-black text-slate-700 uppercase tracking-widest">Active:</span>
                {filters.niche && <FilterPill label="Niche" value={filters.niche} color="text-indigo-400 bg-indigo-500/10 border border-indigo-500/20" onRemove={() => updateFilter('niche', '')} />}
                {filters.city && <FilterPill label="City" value={filters.city} color="text-cyan-400   bg-cyan-500/10   border border-cyan-500/20" onRemove={() => updateFilter('city', '')} />}
                {filters.status && <FilterPill label="Status" value={filters.status} color="text-amber-400  bg-amber-500/10  border border-amber-500/20" onRemove={() => updateFilter('status', '')} />}
                <button type="button" onClick={clearFilters}
                  className="ml-1 text-[9px] font-black text-slate-600 uppercase tracking-widest hover:text-red-400 transition-colors flex items-center gap-1">
                  <XMarkIcon className="w-3 h-3" /> Clear all
                </button>
              </div>
            )}
          </div>

          {/* ── Bulk audit bar — shows count of leads needing audit ── */}
          {myLeads.length > 0 && (() => {
            const needsAudit = myLeads.filter(l =>
              !l.email ||
              !(l as any).verification?.overall ||
              (l as any).verification?.overall === 'failed'
            ).length;
            return needsAudit > 0 ? (
              <div className="flex items-center justify-between p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-2xl">
                <div className="flex items-center gap-3">
                  <FingerPrintIcon className="w-4 h-4 text-indigo-400" />
                  <div>
                    <p className="text-white font-bold text-sm">
                      {needsAudit} lead{needsAudit === 1 ? '' : 's'} need deep audit
                    </p>
                    <p className="text-slate-500 text-[10px]">
                      No email or email not verified — audit will search the web for contact info
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onBulkAudit}
                  disabled={isBulkAuditing}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                >
                  {isBulkAuditing ? (
                    <>
                      <ArrowPathIcon className="w-4 h-4 animate-spin" />
                      {bulkAuditProgress.done}/{bulkAuditProgress.total} auditing...
                    </>
                  ) : (
                    <>
                      <FingerPrintIcon className="w-4 h-4" />
                      Bulk Deep Audit ({needsAudit})
                    </>
                  )}
                </button>
              </div>
            ) : null;
          })()}

          {/* ── Selection action bar — slides in when rows are selected ── */}
          {selectedIds.size > 0 && (
            <div className="flex items-center justify-between gap-3 px-4 py-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                  {selectedIds.size} selected
                </span>
                <button
                  type="button"
                  onClick={clearSelection}
                  className="text-[9px] text-slate-500 hover:text-white transition-colors uppercase tracking-widest"
                >
                  Clear
                </button>
              </div>

              <div className="flex items-center gap-2">
                {/* Bulk audit selected */}
                <button
                  type="button"
                  onClick={() => {
                    const selectedLeads = myLeads.filter(l => selectedIds.has(l.id));
                    onBulkAudit(selectedLeads as any);
                    clearSelection();
                  }}
                  disabled={isBulkAuditing}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isBulkAuditing ? (
                    <>
                      <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />
                      {bulkAuditProgress.done}/{bulkAuditProgress.total}
                    </>
                  ) : (
                    <>
                      <FingerPrintIcon className="w-3.5 h-3.5" />
                      Deep Audit Selected
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Split panel */}
          <div className="flex rounded-2xl border border-white/[0.06] overflow-hidden min-h-[300px]">

            {/* Left: table */}
            <div className="flex flex-col bg-white/[0.02] transition-all duration-300"
              style={{ width: panelOpen ? 'min(55%, 100%)' : '100%' }}>

              {/* Table header */}
              {!isLoadingLeads && myLeads.length > 0 && (
                <div className={`grid px-4 py-3 border-b border-white/[0.06] bg-black/20 text-[9px] font-black text-slate-600 uppercase tracking-widest gap-3
    ${panelOpen ? 'grid-cols-[auto_1fr_auto]' : 'grid-cols-[auto_4fr_2fr_2fr_2fr_1fr_1fr]'}`}>
                  {/* Select-all checkbox */}
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={toggleSelectAll}
                      className={`w-4 h-4 rounded border flex items-center justify-center transition-all
          ${selectedIds.size === myLeads.length && myLeads.length > 0
                          ? 'bg-indigo-600 border-indigo-500'
                          : 'border-white/20 hover:border-white/40'
                        }`}
                    >
                      {selectedIds.size === myLeads.length && myLeads.length > 0 && (
                        <CheckCircleIcon className="w-3 h-3 text-white" />
                      )}
                      {selectedIds.size > 0 && selectedIds.size < myLeads.length && (
                        <div className="w-2 h-0.5 bg-indigo-400" />
                      )}
                    </button>
                  </div>
                  {panelOpen ? (
                    <>
                      <span>Company</span>
                      <span className="text-right">Status</span>
                    </>
                  ) : (
                    <>
                      <span>Company</span>
                      <span className="hidden md:block">Niche / City</span>
                      <span className="hidden lg:block">Contact</span>
                      <span>Status</span>
                      <span className="text-right">Score</span>
                      <span className="text-right hidden sm:block">Date</span>
                    </>
                  )}
                </div>
              )}

              {isLoadingLeads && (
                <div className="flex items-center justify-center py-16 flex-1">
                  <ArrowPathIcon className="w-6 h-6 text-indigo-500 animate-spin" />
                </div>
              )}
              {leadsError && !isLoadingLeads && (
                <div className="p-8 text-center text-red-400 text-sm flex-1">{leadsError}</div>
              )}
              {!isLoadingLeads && !leadsError && myLeads.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 flex-1">
                  <MagnifyingGlassIcon className="w-10 h-10 text-slate-700 mb-4" />
                  <p className="text-slate-600 text-[10px] font-black uppercase tracking-widest">
                    {hasActiveFilters ? 'No leads match your filters' : 'No leads yet — launch a hunt'}
                  </p>
                </div>
              )}

              {!isLoadingLeads && !leadsError && myLeads.map(lead => {
                const isSelected = selectedLead?.id === lead.id;
                return (
                  <div key={lead.id} onClick={() => handleRowClick(lead)}
                    className={`border-b border-white/[0.05] last:border-b-0 cursor-pointer select-none transition-colors duration-100
                      ${isSelected
                        ? 'bg-indigo-500/10 border-l-2 border-l-indigo-500'
                        : 'border-l-2 border-l-transparent hover:bg-white/[0.025]'}`}>
                    {panelOpen ? (

                      <div className="flex items-center gap-2 px-4 py-3.5">
                        {/* ── Checkbox ── */}
                        <button
                          type="button"
                          onClick={e => { e.stopPropagation(); toggleSelect(lead.id); }}
                          className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all
        ${selectedIds.has(lead.id)
                              ? 'bg-indigo-600 border-indigo-500'
                              : 'border-white/20 hover:border-white/40'
                            }`}
                        >
                          {selectedIds.has(lead.id) && <CheckCircleIcon className="w-3 h-3 text-white" />}
                        </button>

                        <div className="flex items-center justify-between gap-3 flex-1 min-w-0"
                          onClick={() => handleRowClick(lead)}>
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <div className={`w-1.5 h-8 rounded-full shrink-0 transition-all ${isSelected ? 'bg-indigo-500' : 'bg-transparent'}`} />
                            <div className="min-w-0">
                              <p className="text-white font-bold text-[12px] truncate leading-tight">{lead.name}</p>
                              <p className="text-[10px] text-slate-500 mt-0.5 truncate">{lead.city}</p>
                            </div>
                          </div>
                          <div className="shrink-0 flex items-center gap-2">
                            <span className={`text-[10px] font-black ${lead.score >= 70 ? 'text-emerald-400' : lead.score >= 40 ? 'text-indigo-400' : 'text-slate-500'}`}>
                              {lead.score}%
                            </span>
                            <StatusBadge status={lead.status} />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-12 gap-3 px-4 py-4 items-center">
                        <div className="col-span-4 min-w-0">
                          <p className="text-white font-bold text-sm truncate">{lead.name}</p>
                          <p className="text-[10px] text-indigo-400 truncate mt-0.5">
                            {lead.website?.replace(/https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
                          </p>
                        </div>
                        <div className="col-span-2 hidden md:block min-w-0">
                          <p className="text-[10px] text-slate-400 font-bold truncate">{lead.niche}</p>
                          <p className="text-[10px] text-slate-600 truncate">{lead.city}</p>
                        </div>
                        <div className="col-span-2 hidden lg:flex flex-col gap-1 min-w-0">
                          {lead.email ? (
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 truncate">
                              <EnvelopeIcon className="w-3 h-3 text-slate-600 shrink-0" />
                              <span className="truncate">{lead.email}</span>
                            </div>
                          ) : null}
                          {lead.phone_number ? (
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                              <PhoneIcon className="w-3 h-3 text-slate-600 shrink-0" />
                              <span>{lead.phone_number}</span>
                            </div>
                          ) : null}
                          {!lead.email && !lead.phone_number && (
                            <span className="text-[10px] text-slate-700 italic">No contact</span>
                          )}
                        </div>
                        <div className="col-span-2"><StatusBadge status={lead.status} /></div>
                        <div className="col-span-1 text-right">
                          <span className={`text-[10px] font-black ${lead.score >= 70 ? 'text-emerald-400' : lead.score >= 40 ? 'text-indigo-400' : 'text-slate-500'}`}>
                            {lead.score}%
                          </span>
                        </div>
                        <div className="col-span-1 text-right hidden sm:block">
                          <span className="text-[9px] text-slate-600">{new Date(lead.acquired_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Right: detail panel */}
            {
              panelOpen && (
                <div ref={detailScrollRef}
                  className="hidden lg:flex flex-col border-l border-white/[0.06] sticky top-16 self-start overflow-y-auto"
                  style={{ width: '45%', maxHeight: 'calc(100vh - 80px)' }}>
                  <LeadDetailPanel lead={selectedLead!} onClose={() => setSelectedLead(null)} />
                </div>
              )
            }
          </div>

          {/* Mobile bottom sheet */}
          {panelOpen && (
            <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedLead(null)} />
              <div className="relative bg-[#0d0e14] border-t border-white/10 rounded-t-3xl flex flex-col shadow-2xl"
                style={{ maxHeight: '82vh', animation: 'slideUp 0.22s ease-out' }}>
                <div className="flex justify-center pt-3 pb-1 shrink-0">
                  <div className="w-10 h-1 rounded-full bg-white/20" />
                </div>
                <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-white/10">
                  <LeadDetailPanel lead={selectedLead!} onClose={() => setSelectedLead(null)} />
                </div>
              </div>
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.total_pages > 1 && (
            <div className="flex items-center justify-between px-1">
              <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">
                {((pagination.page - 1) * pagination.per_page) + 1}–{Math.min(pagination.page * pagination.per_page, pagination.total_count)} of {pagination.total_count}
              </p>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => updateFilter('page', pagination.page - 1)} disabled={!pagination.has_prev}
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
                    <span key={`e${i}`} className="text-slate-600 px-1">…</span>
                  ) : (
                    <button key={p} type="button" onClick={() => updateFilter('page', p)}
                      className={`w-8 h-8 rounded-xl text-[10px] font-black transition-all
                        ${p === pagination.page ? 'bg-indigo-600 text-white' : 'bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:border-white/20'}`}>
                      {p}
                    </button>
                  ))}
                <button type="button" onClick={() => updateFilter('page', pagination.page + 1)} disabled={!pagination.has_next}
                  className="p-2 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-white hover:border-white/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                  <ChevronRightIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default UserDashboard;