import { useState, useEffect, useCallback } from 'react';
import {
  ArrowPathIcon, MagnifyingGlassIcon, ChevronLeftIcon, ChevronRightIcon,
  UserIcon, ShieldCheckIcon, CreditCardIcon, CircleStackIcon,
  ExclamationTriangleIcon, CheckBadgeIcon, XCircleIcon, ClockIcon,
  BoltIcon, XMarkIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { getAdminUsers, AdminUser } from '../services/authService';
import { Lead } from '@/types';

// ── Signal source parser ────────────────────────────────────────────────────
// Parses "[LinkedIn Signal] Company bio lists stocklots" into a colored badge
// + the rest of the reasoning text.

const SOURCE_SIGNAL_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  'linkedin signal': { label: 'LinkedIn',  color: 'text-cyan-400',    bg: 'bg-cyan-500/10',    border: 'border-cyan-500/30'    },
  'linkedin':        { label: 'LinkedIn',  color: 'text-cyan-400',    bg: 'bg-cyan-500/10',    border: 'border-cyan-500/30'    },
  'news signal':     { label: 'News',      color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/30'   },
  'news':            { label: 'News',      color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/30'   },
  'facebook':        { label: 'Facebook',  color: 'text-indigo-400',  bg: 'bg-indigo-500/10',  border: 'border-indigo-500/30'  },
  'google':          { label: 'Google',    color: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/30'    },
  'google search':   { label: 'Google',    color: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/30'    },
  'vault':           { label: 'Vault',     color: 'text-slate-400',   bg: 'bg-slate-500/10',   border: 'border-slate-500/30'   },
  'ai search':       { label: 'AI Search', color: 'text-violet-400',  bg: 'bg-violet-500/10',  border: 'border-violet-500/30'  },
};

// Keywords that indicate strong buying intent — highlighted in yellow
const BUYING_INTENT_KEYWORDS = [
  'stocklot', 'stocklots', 'procurement', 'sourcing', 'rfq', 'bulk order',
  'excess inventory', 'surplus', 'buying', 'import', 'importer', 'distributor',
  'expansion', 'new contract', 'hiring', 'tender', 'bid', 'purchase',
];

interface ParsedReasoning {
  sourceKey: string | null;
  sourceLabel: string | null;
  sourceConfig: typeof SOURCE_SIGNAL_CONFIG[string] | null;
  body: string;
  intentKeywords: string[];
}

export function parseReasoning(reasoning: string): ParsedReasoning {
  if (!reasoning) return { sourceKey: null, sourceLabel: null, sourceConfig: null, body: reasoning, intentKeywords: [] };

  // Match [Source Label] at the start
  const match = reasoning.match(/^\[([^\]]+)\]\s*/i);
  let sourceKey: string | null = null;
  let sourceConfig = null;
  let body = reasoning;

  if (match) {
    sourceKey   = match[1].toLowerCase();
    sourceConfig = SOURCE_SIGNAL_CONFIG[sourceKey] ?? {
      label: match[1], color: 'text-slate-400', bg: 'bg-white/5', border: 'border-white/10',
    };
    body = reasoning.slice(match[0].length);
  }

  // Find buying intent keywords in the body
  const lower = body.toLowerCase();
  const intentKeywords = BUYING_INTENT_KEYWORDS.filter(kw => lower.includes(kw));

  return {
    sourceKey,
    sourceLabel: sourceConfig?.label ?? null,
    sourceConfig,
    body,
    intentKeywords,
  };
}

// ── Reasoning display component ─────────────────────────────────────────────

export const ReasoningDisplay = ({ reasoning, className = '' }: { reasoning: string; className?: string }) => {
  const parsed = parseReasoning(reasoning);

  // Highlight intent keywords in the body text
  const highlightBody = (text: string, keywords: string[]) => {
    if (!keywords.length) return <span className="text-slate-400 text-sm leading-relaxed italic">"{text}"</span>;

    const regex = new RegExp(`(${keywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
    const parts = text.split(regex);

    return (
      <span className="text-slate-400 text-sm leading-relaxed italic">
        "
        {parts.map((part, i) =>
          keywords.some(kw => kw.toLowerCase() === part.toLowerCase())
            ? <mark key={i} className="bg-amber-500/20 text-amber-300 not-italic rounded px-0.5 font-bold">{part}</mark>
            : part
        )}
        "
      </span>
    );
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Source badge */}
      {parsed.sourceConfig && (
        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest ${parsed.sourceConfig.color} ${parsed.sourceConfig.bg} ${parsed.sourceConfig.border}`}>
            {parsed.sourceConfig.label}
          </span>
          {parsed.intentKeywords.length > 0 && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 border-amber-500/30">
              <BoltIcon className="w-3 h-3" />
              Buying Signal
            </span>
          )}
        </div>
      )}

      {/* Reasoning body with highlighted keywords */}
      <div className="p-4 bg-black/20 border border-white/5 rounded-2xl">
        {highlightBody(parsed.body, parsed.intentKeywords)}
      </div>

      {/* Intent keyword pills */}
      {parsed.intentKeywords.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest self-center">
            Signals:
          </span>
          {parsed.intentKeywords.map(kw => (
            <span key={kw} className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[9px] font-bold capitalize">
              {kw}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Plan badge ────────────────────────────────────────────────────────────────

const PlanBadge = ({ user }: { user: AdminUser }) => {
  if (user.is_admin) return (
    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-amber-500/10 border border-amber-500/30 text-amber-400">
      Admin
    </span>
  );
  if (user.is_pro) return (
    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
      Pro
    </span>
  );
  if (user.trial_expired) return (
    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-red-500/10 border border-red-500/30 text-red-400">
      Expired
    </span>
  );
  return (
    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-slate-500/10 border border-slate-500/30 text-slate-400">
      Free {user.trial_days_remaining != null ? `· ${user.trial_days_remaining}d` : ''}
    </span>
  );
};

// ── Admin Panel ───────────────────────────────────────────────────────────────

const AdminPanel = ({
  clearDatabase, adminNiche, setAdminNiche, adminCity, setAdminCity,
  isAdminCrawlLoading, runAdminGlobalCrawl, globalLeads,
}: {
  users:                any[];   // kept for prop compat but unused — real data from API
  clearDatabase:        () => void;
  adminNiche:           string;
  setAdminNiche:        (s: string) => void;
  adminCity:            string;
  setAdminCity:         (s: string) => void;
  isAdminCrawlLoading:  boolean;
  runAdminGlobalCrawl:  () => void;
  globalLeads:          Lead[];
}) => {
  const [apiUsers, setApiUsers]       = useState<AdminUser[]>([]);
  const [total, setTotal]             = useState(0);
  const [totalPages, setTotalPages]   = useState(1);
  const [page, setPage]               = useState(1);
  const [search, setSearch]           = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [isLoading, setIsLoading]     = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [activeTab, setActiveTab]     = useState<'users' | 'crawl'>('users');

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getAdminUsers(page, 20, search);
      setApiUsers(res.data);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch (e: any) {
      setError(e.response?.data?.error || 'Failed to load users');
    } finally {
      setIsLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Summary stats
  const totalPro      = apiUsers.filter(u => u.is_pro).length;
  const totalFree     = apiUsers.filter(u => u.is_free && !u.trial_expired).length;
  const totalExpired  = apiUsers.filter(u => u.trial_expired).length;
  const totalLeads    = apiUsers.reduce((acc, u) => acc + (u.lead_count || 0), 0);

  return (
    <div className="max-w-6xl w-full py-6 md:py-10 animate-in fade-in duration-500">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl md:text-4xl font-black text-white tracking-tighter mb-1">
            Admin Panel
          </h2>
          <p className="text-slate-500 text-sm">
            {total} registered users · {globalLeads.length} local leads cached
          </p>
        </div>
        <button onClick={fetchUsers} disabled={isLoading}
          className="p-3 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-white hover:border-white/20 transition-all disabled:opacity-40">
          <ArrowPathIcon className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Users',  val: total,        color: 'text-indigo-400', icon: <UserIcon className="w-5 h-5" /> },
          { label: 'Pro Users',    val: totalPro,      color: 'text-emerald-400', icon: <CheckBadgeIcon className="w-5 h-5" /> },
          { label: 'Active Free',  val: totalFree,     color: 'text-amber-400', icon: <ClockIcon className="w-5 h-5" /> },
          { label: 'Expired',      val: totalExpired,  color: 'text-red-400', icon: <XCircleIcon className="w-5 h-5" /> },
        ].map((s, i) => (
          <div key={i} className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl">
            <div className={`${s.color} mb-3`}>{s.icon}</div>
            <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mb-1">{s.label}</p>
            <p className={`text-3xl font-black ${s.color}`}>{s.val}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/5 mb-6">
        {([
          { key: 'users', label: `Users (${total})` },
          { key: 'crawl', label: 'Vault Crawl' },
        ] as { key: 'users' | 'crawl'; label: string }[]).map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`px-6 py-4 text-[10px] font-black uppercase tracking-widest transition-all relative
              ${activeTab === tab.key ? 'text-white' : 'text-slate-600 hover:text-slate-400'}`}>
            {tab.label}
            {activeTab === tab.key && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />}
          </button>
        ))}
      </div>

      {/* ── TAB: USERS ── */}
      {activeTab === 'users' && (
        <div className="space-y-4">

          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
            <input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Search by username or email..."
              className="w-full bg-white/[0.02] border border-white/5 rounded-2xl pl-11 pr-4 py-3 text-white text-sm placeholder-slate-600 outline-none focus:border-indigo-500/50 transition-all"
            />
            {searchInput && (
              <button onClick={() => { setSearchInput(''); setSearch(''); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-white transition-colors">
                <XMarkIcon className="w-4 h-4" />
              </button>
            )}
          </div>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm flex items-center gap-3">
              <ExclamationTriangleIcon className="w-5 h-5 shrink-0" />
              {error}
            </div>
          )}

          {/* Table */}
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">

            {/* Header row */}
            <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-white/5 bg-black/20">
              <div className="col-span-3 text-[9px] font-black text-slate-600 uppercase tracking-widest">User</div>
              <div className="col-span-2 text-[9px] font-black text-slate-600 uppercase tracking-widest">Plan</div>
              <div className="col-span-2 text-[9px] font-black text-slate-600 uppercase tracking-widest hidden md:block">Credits</div>
              <div className="col-span-2 text-[9px] font-black text-slate-600 uppercase tracking-widest hidden lg:block">Leads</div>
              <div className="col-span-2 text-[9px] font-black text-slate-600 uppercase tracking-widest hidden lg:block">Daily Used</div>
              <div className="col-span-1 text-[9px] font-black text-slate-600 uppercase tracking-widest hidden sm:block">Joined</div>
            </div>

            {isLoading && (
              <div className="flex items-center justify-center py-20">
                <ArrowPathIcon className="w-6 h-6 text-indigo-500 animate-spin" />
              </div>
            )}

            {!isLoading && apiUsers.length === 0 && (
              <div className="p-16 text-center text-slate-600 text-sm italic">
                {search ? 'No users match your search' : 'No users found'}
              </div>
            )}

            {!isLoading && apiUsers.map((user, i) => (
              <div key={user.id}
                className={`grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-white/[0.02] transition-colors
                  ${i < apiUsers.length - 1 ? 'border-b border-white/5' : ''}`}>

                <div className="col-span-3 min-w-0">
                  <p className="text-white font-bold text-sm truncate">
                    {user.username}
                    {user.is_admin && <span className="ml-2 text-amber-400">★</span>}
                  </p>
                  <p className="text-[10px] text-slate-500 truncate">{user.email || '—'}</p>
                </div>

                <div className="col-span-2">
                  <PlanBadge user={user} />
                </div>

                <div className="col-span-2 hidden md:block">
                  <p className={`text-sm font-black ${user.is_pro ? 'text-indigo-400' : 'text-slate-600'}`}>
                    {user.credits}
                  </p>
                </div>

                <div className="col-span-2 hidden lg:block">
                  <p className="text-sm font-black text-slate-300">{user.lead_count}</p>
                </div>

                <div className="col-span-2 hidden lg:block">
                  <p className="text-sm text-slate-500">{user.daily_leads_count}</p>
                </div>

                <div className="col-span-1 hidden sm:block">
                  <p className="text-[10px] text-slate-600">
                    {user.joined_at ? new Date(user.joined_at).toLocaleDateString() : '—'}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-2">
              <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">
                Page {page} of {totalPages} · {total} users
              </p>
              <div className="flex items-center gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="p-2 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                  <ChevronLeftIcon className="w-4 h-4" />
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const p = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
                  return (
                    <button key={p} onClick={() => setPage(p)}
                      className={`w-8 h-8 rounded-xl text-[10px] font-black transition-all
                        ${p === page ? 'bg-indigo-600 text-white' : 'bg-white/5 border border-white/10 text-slate-400 hover:text-white'}`}>
                      {p}
                    </button>
                  );
                })}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="p-2 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                  <ChevronRightIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: VAULT CRAWL ── */}
      {activeTab === 'crawl' && (
        <div className="space-y-6 max-w-xl">
          <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-8">
            <h3 className="text-white font-bold mb-1">Vault Ingestion</h3>
            <p className="text-slate-500 text-xs mb-6">
              Seed the global vault with leads for a niche/city combo. All users benefit from vault leads at zero AI cost.
            </p>
            <div className="space-y-4">
              <input value={adminNiche} onChange={e => setAdminNiche(e.target.value)}
                placeholder="Niche (e.g. Textile Exporter)"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-600 outline-none focus:border-indigo-500/50 transition-all" />
              <input value={adminCity} onChange={e => setAdminCity(e.target.value)}
                placeholder="City (e.g. Faisalabad)"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-600 outline-none focus:border-indigo-500/50 transition-all" />
              <button onClick={runAdminGlobalCrawl}
                disabled={isAdminCrawlLoading || !adminNiche || !adminCity}
                className="w-full bg-indigo-600 py-4 rounded-xl text-white font-black uppercase text-[10px] tracking-widest hover:bg-indigo-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {isAdminCrawlLoading
                  ? <><ArrowPathIcon className="w-4 h-4 animate-spin" /> Crawling…</>
                  : <><CircleStackIcon className="w-4 h-4" /> Seed Vault</>
                }
              </button>
            </div>
          </div>

          <div className="bg-red-500/5 border border-red-500/20 rounded-3xl p-8">
            <h3 className="text-red-400 font-bold mb-1">Danger Zone</h3>
            <p className="text-slate-500 text-xs mb-6">
              Permanently clears all locally cached leads. This cannot be undone.
            </p>
            <button onClick={clearDatabase}
              className="bg-red-500/10 border border-red-500/20 text-red-400 font-black px-6 py-3 rounded-xl text-[10px] uppercase tracking-widest hover:bg-red-500/20 transition-all">
              Clear Local Cache
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;