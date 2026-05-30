import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import {
  Lead, Campaign, NicheIntel, User, PlanType, PLANS, LimitInfo
} from './types';
import { useAuth } from './src/contexts/AuthContext';
import CookieConsent from './src/components/CookieConsent';
import PrivacyPolicy from './src/components/PrivacyPolicy';
import TermsOfService from './src/components/TermsOfService';
import {
  RocketLaunchIcon, ExclamationTriangleIcon, BoltIcon, CpuChipIcon, SparklesIcon,
  MagnifyingGlassIcon, ArrowPathIcon, ShieldCheckIcon, GlobeAltIcon, EnvelopeIcon,
  LinkIcon, QueueListIcon, PlusIcon, CheckBadgeIcon, FingerPrintIcon,
  BriefcaseIcon, CircleStackIcon, ArrowLeftOnRectangleIcon,
  XCircleIcon, HandThumbDownIcon,
  CloudArrowDownIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import LoginInput from './src/components/login';
import BillingView from './src/components/billing';
import AdminPanel, { parseReasoning, ReasoningDisplay } from './src/components/admin';
import UserDashboard from './src/components/user';
import LandingView from './src/components/landing';
import MarketSetupView from './src/components/marketCriterea';
import api from './src/components/api';
import { VerificationResult, verifyLeads } from './src/services/authService';

// ─── Helpers ────────────────────────────────────────────────────────────────

const normalizeUrl = (url: string) =>
  (url || '').toLowerCase()
    .replace(/https?:\/\/(www\.)?/, '')
    .replace(/\/$/, '')
    .trim();

// ─── Atmosphere & Grid ──────────────────────────────────────────────────────

const Atmosphere = () => (
  <div className="atmosphere">
    <div className="atmosphere-blob w-[500px] h-[500px] bg-indigo-600 top-[-10%] left-[-10%]" />
    <div className="atmosphere-blob w-[400px] h-[400px] bg-cyan-600 bottom-[-5%] right-[-5%] [animation-delay:2s]" />
    <div className="atmosphere-blob w-[300px] h-[300px] bg-violet-600 top-[40%] right-[20%] [animation-delay:4s]" />
  </div>
);

const NeuralGrid = () => (
  <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
    <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:64px_64px]" />
    <motion.div
      animate={{ top: ['-10%', '110%'] }}
      transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
      className="absolute left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent shadow-[0_0_15px_rgba(99,102,241,0.3)]"
    />
    {[...Array(20)].map((_, i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0, x: Math.random() * 100 + '%', y: Math.random() * 100 + '%' }}
        animate={{ opacity: [0, 0.3, 0], scale: [0.5, 1.2, 0.5] }}
        transition={{ duration: 3 + Math.random() * 5, repeat: Infinity, delay: Math.random() * 10, ease: 'easeInOut' }}
        className="absolute w-1 h-1 bg-indigo-400 rounded-full shadow-[0_0_8px_rgba(129,140,248,0.8)]"
      />
    ))}
  </div>
);

const NeuralToast = ({ message, onRemove }: { message: string; onRemove: () => void }) => (
  <motion.div
    initial={{ opacity: 0, x: 100, scale: 0.9 }}
    animate={{ opacity: 1, x: 0, scale: 1 }}
    exit={{ opacity: 0, x: 100, scale: 0.9 }}
    className="glass-card p-4 rounded-2xl border-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.1)] flex items-start gap-4 max-w-sm pointer-events-auto"
  >
    <div className="w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center text-indigo-400 shrink-0">
      <CpuChipIcon className="w-4 h-4" />
    </div>
    <div className="flex-1">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Pro Tip</span>
        <button onClick={onRemove} className="text-slate-600 hover:text-white transition-colors">×</button>
      </div>
      <p className="text-[11px] text-white font-medium leading-relaxed">{message}</p>
    </div>
    <motion.div
      initial={{ width: '0%' }}
      animate={{ width: '100%' }}
      transition={{ duration: 5, ease: 'linear' }}
      className="absolute bottom-0 left-0 h-[2px] bg-indigo-500"
    />
  </motion.div>
);

// ─── Route Guards ────────────────────────────────────────────────────────────

const ProtectedRoute = ({ children, currentUser, isLoading }: {
  children: React.ReactNode; currentUser: User | null; isLoading: boolean;
}) => {
  if (isLoading) return (
    <div className="flex items-center justify-center w-full py-40">
      <ArrowPathIcon className="w-8 h-8 text-indigo-500 animate-spin" />
    </div>
  );
  if (!currentUser) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const AdminRoute = ({ children, currentUser, isLoading }: {
  children: React.ReactNode; currentUser: User | null; isLoading: boolean;
}) => {
  if (isLoading) return (
    <div className="flex items-center justify-center w-full py-40">
      <ArrowPathIcon className="w-8 h-8 text-indigo-500 animate-spin" />
    </div>
  );
  if (!currentUser) return <Navigate to="/login" replace />;
  if (!currentUser.is_admin) return <Navigate to="/" replace />;
  return <>{children}</>;
};

// ─── Circular Progress ──────────────────────────────────────────────────────

const CircularProgress = ({
  value, size = 80, strokeWidth = 6, label, sublabel, color = '#6366f1', isSpinning = false,
}: {
  value: number; size?: number; strokeWidth?: number;
  label?: React.ReactNode; sublabel?: string; color?: string; isSpinning?: boolean;
}) => {
  const r   = (size - strokeWidth) / 2;
  const c   = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  const [animPct, setAnimPct] = useState(0);
  useEffect(() => { const t = setTimeout(() => setAnimPct(pct), 80); return () => clearTimeout(t); }, [pct]);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className={isSpinning ? 'animate-spin' : ''} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={strokeWidth} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${(animPct / 100) * c} ${c}`}
          style={{ transition: 'stroke-dasharray 0.7s cubic-bezier(0.4,0,0.2,1)' }}
        />
      </svg>
      {!isSpinning && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {label !== undefined ? label : <span className="text-white font-black text-lg leading-none">{pct}</span>}
          {sublabel && <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">{sublabel}</span>}
        </div>
      )}
    </div>
  );
};

// ─── Email Status Badge ──────────────────────────────────────────────────────

const EMAIL_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  verified:        { label: 'Verified',   color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' },
  probable:        { label: 'Probable',   color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/30'   },
  mx_verified:     { label: 'MX OK',      color: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-500/30'     },
  catchall_server: { label: 'Catch-All',  color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/30'   },
  undeliverable:   { label: 'Bad Email',  color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/30'       },
  no_mx_record:    { label: 'No MX',      color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/30'       },
  invalid_format:  { label: 'Invalid',    color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/30'       },
  disposable:      { label: 'Disposable', color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/30'       },
};

const EmailStatusBadge = ({ status }: { status?: string }) => {
  const info = EMAIL_STATUS[status || ''] || { label: status || '—', color: 'text-slate-400', bg: 'bg-white/5 border-white/10' };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${info.bg} ${info.color}`}>
      {info.label}
    </span>
  );
};

const WebsiteBadge = ({ isLive, httpStatus }: { isLive?: boolean; httpStatus?: number }) => {
  if (isLive === undefined) return null;
  return isLive
    ? <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border bg-emerald-500/10 border-emerald-500/30 text-emerald-400">Live {httpStatus}</span>
    : <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border bg-red-500/10 border-red-500/30 text-red-400">Down</span>;
};

// ─── Source Badge ────────────────────────────────────────────────────────────

const SOURCE_CONFIG: Record<string, { label: string; color: string }> = {
  vault:           { label: 'Vault',     color: 'text-slate-400 border-slate-600'   },
  google_search:   { label: 'Google',    color: 'text-blue-400 border-blue-600'     },
  facebook_graph:  { label: 'Facebook',  color: 'text-indigo-400 border-indigo-600' },
  facebook_gemini: { label: 'Facebook',  color: 'text-indigo-400 border-indigo-600' },
  linkedin_signal: { label: 'LinkedIn',  color: 'text-cyan-400 border-cyan-600'     },
  news_signal:     { label: 'News',      color: 'text-amber-400 border-amber-600'   },
  ai_search:       { label: 'AI Search', color: 'text-violet-400 border-violet-600' },
};

const SourceBadge = ({ source }: { source?: string }) => {
  const cfg = SOURCE_CONFIG[source || ''] || SOURCE_CONFIG['ai_search'];
  return (
    <span className={`px-2.5 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest shrink-0 ${cfg.color}`}>
      {cfg.label}
    </span>
  );
};

// ─── Exhausted Market Banner ─────────────────────────────────────────────────

const ExhaustedMarketBanner = ({
  niche, city, suggestedCities, onExpandCity,
}: {
  niche: string; city: string; suggestedCities: string[]; onExpandCity: (c: string) => void;
}) => (
  <motion.div
    initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
    className="w-full p-5 rounded-2xl border border-amber-500/20 bg-amber-500/5 flex flex-col gap-4"
  >
    <div className="flex items-start gap-4">
      <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
        <ExclamationTriangleIcon className="w-5 h-5 text-amber-400" />
      </div>
      <div className="flex-1">
        <p className="text-white font-bold text-sm">Market Exhausted</p>
        <p className="text-slate-400 text-[11px] mt-0.5 leading-relaxed">
          All known <span className="text-amber-400 font-bold">{niche}</span> leads in{' '}
          <span className="text-amber-400 font-bold">{city}</span> have been discovered.
        </p>
      </div>
    </div>
    {suggestedCities.length > 0 && (
      <div className="flex flex-wrap gap-2 pl-14">
        <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest self-center">Try nearby:</span>
        {suggestedCities.map(sc => (
          <button key={sc} onClick={() => onExpandCity(sc)}
            className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-[10px] font-bold hover:bg-amber-500/10 hover:border-amber-500/30 hover:text-amber-400 transition-all">
            {sc}
          </button>
        ))}
      </div>
    )}
  </motion.div>
);

// ─── Rejection Feedback Modal ────────────────────────────────────────────────

const RejectionModal = ({
  leadId, onClose, onSuccess,
}: {
  leadId: string; onClose: () => void; onSuccess: (status: string) => void;
}) => {
  const [reason, setReason]   = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (status: 'rejected' | 'qualified') => {
    setLoading(true);
    try {
      await api.patch(`/my-leads/${leadId}/status`, {
        status,
        rejection_reason: status === 'rejected' ? reason : '',
      });
      onSuccess(status);
      onClose();
    } catch (e) {
      console.error('Status update failed', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
        className="w-full max-w-md bg-[#0d0e14] border border-white/10 rounded-3xl p-6 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-white font-bold text-base mb-1">Lead Feedback</h3>
        <p className="text-slate-500 text-[11px] mb-5">Your feedback trains the AI to find better leads for this niche.</p>
        <div className="flex gap-3 mb-5">
          <button onClick={() => submit('qualified')} disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500/20 transition-all disabled:opacity-40">
            ✓ Qualified
          </button>
          <button onClick={() => reason ? submit('rejected') : undefined} disabled={loading || !reason}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-[10px] font-black uppercase tracking-widest hover:bg-red-500/20 transition-all disabled:opacity-40">
            ✕ Reject
          </button>
        </div>
        <textarea
          value={reason} onChange={e => setReason(e.target.value)}
          placeholder="Why is this lead poor quality? (required for rejection)"
          rows={3}
          className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-slate-300 text-[11px] placeholder-slate-600 resize-none outline-none focus:border-indigo-500/50 transition-colors"
        />
        <button onClick={onClose} className="mt-4 w-full text-slate-600 text-[10px] font-bold uppercase tracking-widest hover:text-white transition-colors">
          Cancel
        </button>
      </motion.div>
    </motion.div>
  );
};

// ─── Deep Audit Result Panel ──────────────────────────────────────────────────
// Shown inside the lead detail view after a successful deep audit API call.

const DeepAuditPanel = ({ audit }: { audit: any }) => {
  if (!audit) return null;

  const dm       = audit.decision_maker;
  const socials  = audit.social_profiles;
  const signals  = audit.activity_signals || [];
  const updates  = audit.update_summary   || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="mt-6 space-y-4"
    >
      {/* Summary */}
      {audit.audit_summary && (
        <div className="p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-2xl">
          <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-2">Audit Summary</p>
          <p className="text-[11px] text-slate-300 leading-relaxed">{audit.audit_summary}</p>
          {audit.source_notes && (
            <p className="text-[10px] text-slate-600 mt-2 italic">{audit.source_notes}</p>
          )}
        </div>
      )}

      {/* Updates applied */}
      {updates.length > 0 && (
        <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl">
          <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-2">Data Updated</p>
          {updates.map((u: string, i: number) => (
            <p key={i} className="text-[11px] text-emerald-300 leading-relaxed">✓ {u}</p>
          ))}
        </div>
      )}

      {/* Decision Maker */}
      {dm?.name && (
        <div className="p-4 bg-white/5 rounded-2xl flex items-start gap-4">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white text-base font-black shrink-0">
            {dm.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-sm">{dm.name}</p>
            {dm.title && <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest">{dm.title}</p>}
            {dm.email && <p className="text-[11px] text-slate-400 mt-1">{dm.email}</p>}
            {dm.linkedin_url && (
              <a href={dm.linkedin_url} target="_blank" rel="noreferrer"
                className="text-[10px] text-cyan-400 hover:text-cyan-300 font-bold mt-1 block transition-colors">
                LinkedIn Profile →
              </a>
            )}
            {dm.note && <p className="text-[10px] text-slate-600 italic mt-1">{dm.note}</p>}
          </div>
        </div>
      )}

      {/* Alternative contacts */}
      {(audit.contact_form_url || audit.whatsapp || audit.wechat_id) && (
        <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl space-y-2">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">Alternative Contacts</p>
          {audit.contact_form_url && (
            <a href={audit.contact_form_url} target="_blank" rel="noreferrer"
              className="flex items-center gap-2 text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors">
              <LinkIcon className="w-3.5 h-3.5 shrink-0" /> Contact Form
            </a>
          )}
          {audit.whatsapp && (
            <p className="flex items-center gap-2 text-[11px] text-emerald-400">
              <span className="text-[10px]">📱</span> WhatsApp: {audit.whatsapp}
            </p>
          )}
          {audit.wechat_id && (
            <p className="flex items-center gap-2 text-[11px] text-slate-400">
              <span className="text-[10px]">💬</span> WeChat: {audit.wechat_id}
            </p>
          )}
        </div>
      )}

      {/* Social profiles */}
      {socials && Object.values(socials).some(Boolean) && (
        <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl space-y-2">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">Social Profiles</p>
          {socials.linkedin_company && (
            <a href={socials.linkedin_company} target="_blank" rel="noreferrer"
              className="flex items-center gap-2 text-[11px] text-cyan-400 hover:text-cyan-300 transition-colors">
              <LinkIcon className="w-3.5 h-3.5 shrink-0" /> LinkedIn Company
            </a>
          )}
          {socials.facebook && (
            <a href={socials.facebook} target="_blank" rel="noreferrer"
              className="flex items-center gap-2 text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors">
              <LinkIcon className="w-3.5 h-3.5 shrink-0" /> Facebook
            </a>
          )}
          {socials.twitter && (
            <a href={socials.twitter} target="_blank" rel="noreferrer"
              className="flex items-center gap-2 text-[11px] text-slate-400 hover:text-white transition-colors">
              <LinkIcon className="w-3.5 h-3.5 shrink-0" /> Twitter / X
            </a>
          )}
          {(socials.alibaba || socials.made_in_china) && (
            <a href={socials.alibaba || socials.made_in_china} target="_blank" rel="noreferrer"
              className="flex items-center gap-2 text-[11px] text-amber-400 hover:text-amber-300 transition-colors">
              <LinkIcon className="w-3.5 h-3.5 shrink-0" /> Trade Directory
            </a>
          )}
        </div>
      )}

      {/* Activity signals */}
      {signals.length > 0 && (
        <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl space-y-2">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">Activity Signals</p>
          {signals.map((s: string, i: number) => (
            <div key={i} className="flex items-start gap-2.5">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
              <p className="text-[11px] text-slate-400 leading-relaxed">{s}</p>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

// ─── CRM Export Modal ─────────────────────────────────────────────────────────
//
// Calls GET /my-leads/export?format=xxx from the backend.
// This exports ALL of the user's saved leads — not just the current search
// session — and includes verification status, deep audit data, decision maker.
//
// Two modes:
//   scope='all'     — export everything from the database (dashboard button)
//   scope='session' — export current search results only (results page button)
//
// When scope='session' the backend is still called with the current lead IDs
// as a filter so the export still includes full DB data (verification etc).
 
const CRMExportModal = ({
  leads,
  scope = 'all',
  filterNiche,
  filterCity,
  onClose,
}: {
  leads: Lead[];
  scope?: 'all' | 'session';
  filterNiche?: string;
  filterCity?: string;
  onClose: () => void;
}) => {
  const [format, setFormat]   = useState<'csv' | 'json' | 'hubspot' | 'salesforce'>('csv');
  const [status, setStatus]   = useState<'all' | 'new' | 'contacted' | 'qualified' | 'verified'>('all');
  const [exporting, setExporting] = useState(false);
  const [done, setDone]       = useState(false);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [countLoading, setCountLoading] = useState(false);
 
  const FORMATS = [
    { id: 'csv',        label: 'CSV',           sub: 'Universal — opens in Excel/Sheets',   color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5'  },
    { id: 'json',       label: 'JSON',           sub: 'All fields incl. deep audit data',    color: 'text-blue-400 border-blue-500/30 bg-blue-500/5'           },
    { id: 'hubspot',    label: 'HubSpot CSV',    sub: 'Direct import — HubSpot contacts',    color: 'text-orange-400 border-orange-500/30 bg-orange-500/5'     },
    { id: 'salesforce', label: 'Salesforce CSV', sub: 'Direct import — Salesforce leads',    color: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/5'           },
  ] as const;
 
  const STATUSES = [
    { id: 'all',       label: 'All leads'      },
    { id: 'new',       label: 'New only'       },
    { id: 'contacted', label: 'Contacted'      },
    { id: 'qualified', label: 'Qualified'      },
    { id: 'verified',  label: 'Verified only'  },
  ] as const;
 
  // Preview count — how many leads will be exported
  useEffect(() => {
    setCountLoading(true);
    const params = new URLSearchParams({ format: 'json' });
    if (status !== 'all') params.set('status', status);
    if (filterNiche) params.set('niche', filterNiche);
    if (filterCity)  params.set('city',  filterCity);
 
    api.get(`/my-leads?${params.toString()}&per_page=1`)
      .then(res => setTotalCount(res.data.pagination?.total_count ?? null))
      .catch(() => setTotalCount(scope === 'session' ? leads.length : null))
      .finally(() => setCountLoading(false));
  }, [status, filterNiche, filterCity]);
 
  const FIELD_LABELS: Record<string, string> = {
    csv:        'Name, Email, Phone, Website, City, Niche, Score, Status, Reasoning, Email Verified, Website Live, Decision Maker',
    json:       'All fields including deep audit, decision maker, social profiles, activity signals',
    hubspot:    'First Name, Last Name, Email, Phone, Website URL, City, Industry, Lead Status, Notes, Score, Email Verified',
    salesforce: 'Last Name, First Name, Email, Phone, Website, City, Industry, Lead Status, Description, Rating (Hot/Warm/Cold)',
  };
 
  const doExport = async () => {
    setExporting(true);
    try {
      // Build URL with filters
      const params = new URLSearchParams({ format });
      if (status !== 'all')  params.set('status', status);
      if (filterNiche)       params.set('niche', filterNiche);
      if (filterCity)        params.set('city',  filterCity);
 
      // Call the backend — it returns a file directly
      const token    = localStorage.getItem('access_token') || sessionStorage.getItem('access_token') || '';
      const response = await fetch(`${api.defaults.baseURL || ''}/my-leads/export?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
 
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `Export failed: ${response.status}`);
      }
 
      // Get filename from Content-Disposition header
      const disposition = response.headers.get('Content-Disposition') || '';
      const filenameMatch = disposition.match(/filename=(.+)/);
      const filename = filenameMatch ? filenameMatch[1] : `intentiq-export.${format === 'json' ? 'json' : 'csv'}`;
 
      const blob = await response.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
 
      setDone(true);
      setTimeout(() => setDone(false), 3000);
    } catch (err: any) {
      console.error('Export failed:', err);
      alert(err.message || 'Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };
 
  const exportCount = countLoading ? '…' : (totalCount ?? leads.length);
 
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
        className="w-full max-w-lg bg-[#0d0e14] border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}>
 
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center gap-4">
          <div className="w-10 h-10 bg-indigo-500/10 rounded-2xl flex items-center justify-center">
            <CloudArrowDownIcon className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-white font-bold text-base">Export to CRM</h3>
            <p className="text-slate-500 text-[10px]">
              {scope === 'all'
                ? 'Export all your saved leads from the database'
                : 'Export current search session results'}
            </p>
          </div>
          <button onClick={onClose} className="ml-auto text-slate-600 hover:text-white transition-colors text-xl">×</button>
        </div>
 
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
 
          {/* Status filter */}
          <div>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">Filter by Status</p>
            <div className="flex flex-wrap gap-2">
              {STATUSES.map(s => (
                <button key={s.id} onClick={() => setStatus(s.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${
                    status === s.id
                      ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-400'
                      : 'bg-white/[0.02] border-white/5 text-slate-500 hover:border-white/20'
                  }`}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
 
          {/* Format picker */}
          <div>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">Export Format</p>
            <div className="space-y-2">
              {FORMATS.map(f => (
                <button key={f.id} onClick={() => setFormat(f.id as any)}
                  className={`w-full flex items-center gap-4 p-3.5 rounded-2xl border transition-all text-left ${
                    format === f.id
                      ? f.color + ' border-opacity-100'
                      : 'bg-white/[0.02] border-white/5 hover:border-white/20'
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
          <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl space-y-1.5">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Fields in this export</p>
            <p className="text-[10px] text-slate-400 leading-relaxed">{FIELD_LABELS[format]}</p>
          </div>
 
          {/* How to import guide */}
          {(format === 'hubspot' || format === 'salesforce') && (
            <div className="p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-xl">
              <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1.5">
                How to import into {format === 'hubspot' ? 'HubSpot' : 'Salesforce'}
              </p>
              {format === 'hubspot' ? (
                <ol className="text-[10px] text-slate-500 space-y-1 list-decimal list-inside">
                  <li>Go to Contacts → Import</li>
                  <li>Choose "Import file from computer"</li>
                  <li>Select "Contacts" as object type</li>
                  <li>Upload this CSV — columns map automatically</li>
                  <li>Review & confirm duplicate handling</li>
                </ol>
              ) : (
                <ol className="text-[10px] text-slate-500 space-y-1 list-decimal list-inside">
                  <li>Go to Leads → Import</li>
                  <li>Select "Insert new records"</li>
                  <li>Upload this CSV</li>
                  <li>Map columns — Last Name is required</li>
                  <li>Click Import Now</li>
                </ol>
              )}
            </div>
          )}
        </div>
 
        {/* Footer CTA */}
        <div className="p-6 pt-0 border-t border-white/5">
          {/* Lead count */}
          <div className="flex items-center justify-between mb-4 px-1">
            <span className="text-[10px] text-slate-500">Leads to export</span>
            <span className="text-[10px] font-black text-white">
              {countLoading
                ? <ArrowPathIcon className="w-3.5 h-3.5 animate-spin inline text-slate-500" />
                : <>{exportCount} lead{Number(exportCount) !== 1 ? 's' : ''}</>}
            </span>
          </div>
 
          <button onClick={doExport} disabled={exporting || done}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50 shadow-lg shadow-indigo-600/20">
            {exporting
              ? <><ArrowPathIcon className="w-4 h-4 animate-spin" /> Preparing {format.toUpperCase()}…</>
              : done
              ? <><CheckCircleIcon className="w-4 h-4" /> Downloaded — check your downloads!</>
              : <><CloudArrowDownIcon className="w-4 h-4" /> Download {format.toUpperCase()} ({exportCount} leads)</>}
          </button>
          <button onClick={onClose}
            className="mt-3 w-full text-slate-600 text-[9px] font-bold uppercase tracking-widest hover:text-white transition-colors">
            Cancel
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── Lead Details View ───────────────────────────────────────────────────────

const LeadDetailsView = ({
  lead, onAudit, onVerify, isAuditing, isVerifying,
  verificationResult, isVerifyingAll, onStatusUpdate, auditResult,
}: {
  lead:               Lead;
  onAudit:            (l: Lead) => void;
  onVerify:           (l: Lead) => void;
  isAuditing:         boolean;
  isVerifying:        boolean;
  verificationResult?: VerificationResult;
  isVerifyingAll?:    boolean;
  onStatusUpdate?:    (leadId: string, status: string) => void;
  auditResult?:       any;
}) => {
  const [showRejection, setShowRejection] = useState(false);
  const [localStatus, setLocalStatus]     = useState(lead.status || 'new');
  useEffect(() => { setLocalStatus(lead.status || 'new'); }, [lead.id, lead.status]);

  const emailVerif   = (verificationResult as any)?.email;
  const websiteVerif = (verificationResult as any)?.website;

  const scoreColor =
    lead.score >= 80 ? '#10b981' :
    lead.score >= 60 ? '#6366f1' :
    lead.score >= 40 ? '#f59e0b' : '#ef4444';

  // Determine audit button label based on lead state
  const auditLabel =
    !lead.email && !(lead as any).phone_number ? '🔍 Find Contact' :
    (verificationResult as any)?.overall === 'failed'     ? '🔍 Verify & Enrich' :
    '🔍 Deep Audit';

  return (
    <>
      <AnimatePresence>
        {showRejection && (
          <RejectionModal
            leadId={lead.id}
            onClose={() => setShowRejection(false)}
            onSuccess={(status) => {
              setLocalStatus(status);
              onStatusUpdate?.(lead.id, status);
            }}
          />
        )}
      </AnimatePresence>

      <motion.div
        key={lead.id}
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="bg-white/[0.02] border border-white/5 rounded-3xl md:rounded-[40px] overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 md:p-10 border-b border-white/5 bg-black/20">
          <div className="flex flex-col sm:flex-row items-start gap-6">

            <div className="shrink-0">
              {isVerifyingAll ? (
                <CircularProgress value={0} size={80} strokeWidth={5} color="#6366f1" isSpinning
                  label={<ArrowPathIcon className="w-6 h-6 text-indigo-400" />}
                />
              ) : (
                <CircularProgress value={lead.score} size={80} strokeWidth={5} color={scoreColor} sublabel="Score" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h2 className="text-2xl md:text-4xl font-black text-white tracking-tighter leading-none truncate max-w-full">
                  {lead.name}
                </h2>
                {localStatus === 'verified' && (
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 border border-emerald-500/40 rounded-full text-[9px] font-black text-emerald-400 uppercase tracking-widest">
                    <CheckBadgeIcon className="w-3.5 h-3.5" /> Verified
                  </span>
                )}
                {localStatus === 'qualified' && (
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-blue-500/20 border border-blue-500/40 rounded-full text-[9px] font-black text-blue-400 uppercase tracking-widest">
                    <CheckCircleIcon className="w-3.5 h-3.5" /> Qualified
                  </span>
                )}
                {localStatus === 'rejected' && (
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-red-500/20 border border-red-500/40 rounded-full text-[9px] font-black text-red-400 uppercase tracking-widest">
                    <XCircleIcon className="w-3.5 h-3.5" /> Rejected
                  </span>
                )}
                <SourceBadge source={(lead as any).source} />
              </div>

              <a href={lead.website} target="_blank" rel="noreferrer"
                className="text-slate-500 text-xs hover:text-indigo-400 transition-colors truncate block max-w-full">
                {normalizeUrl(lead.website)}
              </a>

              <div className="flex flex-wrap gap-2 mt-3">
                <span className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-full text-[9px] font-black uppercase tracking-widest">{lead.niche}</span>
                <span className="px-3 py-1 bg-white/5 border border-white/10 text-slate-400 rounded-full text-[9px] font-black uppercase tracking-widest">{lead.city}</span>
              </div>
            </div>

            <div className="flex sm:flex-col gap-2 shrink-0">
              <button onClick={() => onVerify(lead)} disabled={isVerifying || localStatus === 'verified'}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase tracking-widest hover:bg-emerald-500/20 transition-all disabled:opacity-30">
                {isVerifying ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : <ShieldCheckIcon className="w-4 h-4" />}
                Verify
              </button>
              <button onClick={() => onAudit(lead)} disabled={isAuditing}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[9px] font-black uppercase tracking-widest hover:bg-indigo-500/20 transition-all disabled:opacity-30">
                {isAuditing ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : <FingerPrintIcon className="w-4 h-4" />}
                {isAuditing ? 'Auditing…' : auditLabel}
              </button>
              <button onClick={() => setShowRejection(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 text-[9px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">
                <HandThumbDownIcon className="w-4 h-4" />
                Feedback
              </button>
            </div>
          </div>
        </div>

        {/* Contact + Email Deep Check */}
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/5 border-b border-white/5">

          <div className="p-6 md:p-10 space-y-5">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Contact Info</h4>

            {/* Decision maker from audit */}
            {auditResult?.decision_maker?.name ? (
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl">
                <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-xl font-black shrink-0">
                  {auditResult.decision_maker.name.charAt(0)}
                </div>
                <div>
                  <p className="text-white font-bold leading-none mb-1">{auditResult.decision_maker.name}</p>
                  <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest">{auditResult.decision_maker.title}</p>
                </div>
              </motion.div>
            ) : (
              <div className="p-4 bg-white/5 rounded-2xl flex items-center gap-3 text-slate-500 text-[11px] italic">
                <BriefcaseIcon className="w-4 h-4 shrink-0" />
                {isAuditing ? 'Searching for decision maker…' : 'Run Deep Audit to identify decision maker'}
              </div>
            )}

            <div className="space-y-3 pt-4 border-t border-white/5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <EnvelopeIcon className="w-4 h-4 text-slate-600 shrink-0" />
                  <span className="text-sm text-slate-300 truncate">
                    {lead.email || <span className="italic text-slate-600 text-[11px]">No email found</span>}
                  </span>
                </div>
                <div className="shrink-0">
                  {isVerifyingAll
                    ? <CircularProgress value={0} size={28} strokeWidth={3} color="#6366f1" isSpinning />
                    : emailVerif
                      ? <EmailStatusBadge status={emailVerif.status} />
                      : null
                  }
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <a href={lead.website} target="_blank" rel="noreferrer"
                  className="flex items-center gap-3 text-sm text-indigo-400 hover:text-indigo-300 transition-all min-w-0">
                  <LinkIcon className="w-4 h-4 text-slate-600 shrink-0" />
                  <span className="truncate">{normalizeUrl(lead.website)}</span>
                </a>
                <div className="shrink-0">
                  {isVerifyingAll
                    ? <CircularProgress value={0} size={28} strokeWidth={3} color="#6366f1" isSpinning />
                    : websiteVerif
                      ? <WebsiteBadge isLive={websiteVerif.is_live} httpStatus={websiteVerif.response_code} />
                      : null
                  }
                </div>
              </div>

              {(lead.phone || (lead as any).phone_number) && (
                <div className="flex items-center gap-3 text-sm text-slate-400">
                  <GlobeAltIcon className="w-4 h-4 text-slate-600 shrink-0" />
                  <span>{lead.phone || (lead as any).phone_number}</span>
                </div>
              )}

              {auditResult?.decision_maker?.linkedin_url && (
                <a href={auditResult.decision_maker.linkedin_url} target="_blank" rel="noreferrer"
                  className="flex items-center gap-3 text-sm text-cyan-400 hover:text-cyan-300 transition-all font-bold">
                  <LinkIcon className="w-4 h-4 shrink-0" /> LinkedIn Profile
                </a>
              )}
            </div>
          </div>

          {/* Email deep check */}
          <div className="p-6 md:p-10">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-5">Email Deep Check</h4>
            {isVerifyingAll ? (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <CircularProgress value={66} size={64} strokeWidth={5} color="#6366f1" isSpinning />
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest animate-pulse">Verifying contacts…</p>
              </div>
            ) : emailVerif?.checks ? (
              <div className="space-y-3">
                {[
                  { key: 'format',         label: 'Format',        val: emailVerif.checks.format },
                  { key: 'disposable',     label: 'Not Disposable',val: !emailVerif.checks.disposable },
                  { key: 'mx',             label: 'MX Record',     val: emailVerif.checks.mx },
                  { key: 'smtp_reachable', label: 'SMTP Reach',    val: emailVerif.checks.smtp_reachable },
                  { key: 'is_catchall',    label: 'Not Catchall',  val: !emailVerif.checks.is_catchall },
                  { key: 'mailbox_exists', label: 'Mailbox',       val: emailVerif.checks.mailbox_exists },
                ].map(({ key, label, val }) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-500">{label}</span>
                    {val === null || val === undefined
                      ? <span className="text-[10px] text-slate-600 font-bold">—</span>
                      : val
                        ? <span className="flex items-center gap-1 text-[10px] font-black text-emerald-400"><CheckCircleIcon className="w-3.5 h-3.5" /> Pass</span>
                        : <span className="flex items-center gap-1 text-[10px] font-black text-red-400"><XCircleIcon className="w-3.5 h-3.5" /> Fail</span>
                    }
                  </div>
                ))}
                <div className="pt-4 border-t border-white/5 flex items-center gap-4">
                  <CircularProgress
                    value={
                      emailVerif.deliverability === 'deliverable' ? 100 :
                      emailVerif.deliverability === 'probable'    ? 65  :
                      emailVerif.deliverability === 'unknown'     ? 40  : 10
                    }
                    size={52} strokeWidth={4}
                    color={
                      emailVerif.deliverability === 'deliverable' ? '#10b981' :
                      emailVerif.deliverability === 'probable'    ? '#f59e0b' : '#ef4444'
                    }
                  />
                  <div>
                    <p className="text-white font-bold text-sm capitalize">{emailVerif.deliverability}</p>
                    <p className="text-[10px] text-slate-500">{emailVerif.status?.replace(/_/g, ' ')}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                <ShieldCheckIcon className="w-10 h-10 text-slate-700" />
                <p className="text-[10px] text-slate-600 uppercase font-black tracking-widest">
                  Run verification to see email checks
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Strategic Analysis */}
        <div className="p-6 md:p-10 bg-black/20">
          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-5">Strategic Analysis</h4>
          <ReasoningDisplay
            reasoning={(lead as any).reasoning || 'No reasoning provided.'}
            className="mb-6"
          />

          {/* Deep audit results rendered inline */}
          {isAuditing && (
            <div className="flex items-center gap-3 py-8 justify-center">
              <ArrowPathIcon className="w-5 h-5 text-indigo-400 animate-spin" />
              <p className="text-[11px] text-indigo-400 font-black uppercase tracking-widest animate-pulse">
                Running deep audit…
              </p>
            </div>
          )}
          {!isAuditing && auditResult && (
            <DeepAuditPanel audit={auditResult} />
          )}
        </div>
      </motion.div>
    </>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// APP
// ═══════════════════════════════════════════════════════════════════════════════

const App: React.FC = () => {
  const { user: currentUser, login, logout, updateUser, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // App state
  const [campaigns, setCampaigns]     = useState<Campaign[]>([]);
  const [users, setUsers]             = useState<User[]>([]);
  const [globalLeads, setGlobalLeads] = useState<Lead[]>([]);

  // Search state
  const [niche, setNiche]                       = useState('');
  const [city, setCity]                         = useState('');
  const [serviceOffered, setServiceOffered]     = useState('');
  const [idealCompanyType, setIdealCompanyType] = useState('');
  const [targetGoal, setTargetGoal]             = useState(10);
  const [nicheIntel, setNicheIntel]             = useState<NicheIntel | null>(null);
  const [leads, setLeads]                       = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead]         = useState<Lead | null>(null);

  // Admin state
  const [adminNiche, setAdminNiche]                 = useState('');
  const [adminCity, setAdminCity]                   = useState('');
  const [view, setView]                             = useState('');
  const [isAdminCrawlLoading, setIsAdminCrawlLoading] = useState(false);

  // UI state
  const [toasts, setToasts]               = useState<{ id: string; message: string }[]>([]);
  const [limitInfo, setLimitInfo]         = useState<LimitInfo | null>(null);
  const [showUpgradeWall, setShowUpgradeWall] = useState(false);
  const [isVerifyingAll, setIsVerifyingAll]   = useState(false);
  const [verificationResults, setVerificationResults] = useState<Record<string, VerificationResult>>({});

  // Market exhaustion
  const [marketExhausted, setMarketExhausted] = useState(false);
  const [suggestedCities, setSuggestedCities] = useState<string[]>([]);

  // Loading / error
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [isAuditing, setIsAuditing]   = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // Per-lead deep audit results (keyed by lead id)
  const [auditResults, setAuditResults] = useState<Record<string, any>>({});
    const [showExport, setShowExport]       = useState(false);


  // Toasts
  const addToast = (message: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  };

  useEffect(() => {
    const insights = [
      "Tip: Use specific niches like 'Boutique Solar' instead of just 'Solar' for higher quality leads.",
      "Tip: The 'Deep Audit' feature searches exhaustively for decision makers and contact routes.",
      "Tip: Grounded leads have been verified against live web signals in the last 24 hours.",
      "Tip: Use the 'City' field to narrow down your search to specific high-growth regions.",
      "Tip: If a market is exhausted, try a nearby city — the AI will find new leads there.",
      "Tip: Use the Feedback button on any lead to train the AI to find better matches.",
    ];
    const interval = setInterval(() => {
      if (Math.random() > 0.7) addToast(insights[Math.floor(Math.random() * insights.length)]);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (view === 'setup')   addToast("Tip: Be as specific as possible with your 'Ideal Company Type'.");
    if (view === 'results') addToast("Tip: Click a lead then run 'Deep Audit' to uncover outreach angles.");
  }, [view]);

  // Initialisation — load from localStorage
  useEffect(() => {
    const storedCampaigns   = localStorage.getItem('lg_campaigns');
    const storedUsers       = localStorage.getItem('lg_all_users');
    const storedGlobalLeads = localStorage.getItem('lg_global_leads');
    if (storedCampaigns)   setCampaigns(JSON.parse(storedCampaigns));
    if (storedGlobalLeads) setGlobalLeads(JSON.parse(storedGlobalLeads));
    if (storedUsers) {
      setUsers(JSON.parse(storedUsers));
    } else {
      const initialUsers: User[] = [
        { id: 'u1', email: 'admin@intentiq.io', role: 'admin', plan: 'enterprise', credits: 9999, joinedAt: new Date().toISOString() },
        { id: 'u2', email: 'demo@user.com',     role: 'user',  plan: 'pro',        credits: 250,  joinedAt: new Date().toISOString() },
      ];
      setUsers(initialUsers);
      localStorage.setItem('lg_all_users', JSON.stringify(initialUsers));
    }
  }, []);

  const saveAppState = (user: User | null, camp: Campaign[], allUsers: User[], gLeads: Lead[]) => {
    if (user) {
      const updated = allUsers.map(u => u.id === user.id ? user : u);
      localStorage.setItem('lg_all_users', JSON.stringify(updated));
      setUsers(updated);
    }
    localStorage.setItem('lg_campaigns', JSON.stringify(camp));
    localStorage.setItem('lg_global_leads', JSON.stringify(gLeads));
    setGlobalLeads(gLeads);
  };

  // Auth
  const handleLogin = async (email: string) => {
    try {
      setLoading(true);
      await login({ email });
      setView('dashboard');
    } catch {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => { logout(); setView('landing'); };

  // startAnalysis — clears all state and navigates to search
  const startAnalysis = async () => {
    if (!niche || !city || !serviceOffered || !idealCompanyType) {
      setError('Niche, City, Service, and Ideal Profile are mandatory.');
      return;
    }
    setLeads([]);
    setSelectedLead(null);
    setVerificationResults({});
    setAuditResults({});
    setMarketExhausted(false);
    setSuggestedCities([]);
    setLoading(true);
    setError(null);
    try {
      setView('search');
    } catch {
      setError('Market intelligence phase failed.');
    } finally {
      setLoading(false);
    }
  };

  // handleStatusUpdate
  const handleStatusUpdate = (leadId: string, status: string) => {
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status } : l));
    setSelectedLead(prev => (prev && prev.id === leadId) ? { ...prev, status } : prev);
  };

  // runDiscovery — calls real backend
  const runDiscovery = async (count: number) => {
    setLoading(true);
    setError(null);
    setLeads([]);
    setSelectedLead(null);
    setMarketExhausted(false);
    setSuggestedCities([]);
    setVerificationResults({});
    setAuditResults({});

    try {
      const response = await api.post('/search-leads', {
        niche, city, count, idealCompanyType,
      });

      const { data: foundLeads, limit_info, market_exhausted } = response.data;

      if (limit_info) setLimitInfo(limit_info);

      const normalized = (foundLeads || []).map((l: any) => ({
        ...l,
        phone:          l.phone_number || l.phone,
        city:           l.city  || city,
        niche:          l.niche || niche,
        scoreBreakdown: l.scoreBreakdown ?? {},
        socials:        {},
        source:         l.source || 'ai_search',
        confidence:     l.score,
      }));

      if (!normalized.length) {
        setError(
          market_exhausted
            ? `Market exhausted — no more ${niche} leads found in ${city}. Try a nearby city.`
            : 'No leads found. Try a broader niche or different city.'
        );
        setLoading(false);
        return;
      }

      if (market_exhausted) setMarketExhausted(true);
      setLeads(normalized);
      setSelectedLead(normalized[0]);
      navigate('/results');

      // Background verification
      setIsVerifyingAll(true);
      const leadIds = normalized.map((l: any) => l.id);
      verifyLeads(leadIds)
        .then(({ results }: any) => {
          const map: Record<string, VerificationResult> = {};
          results.forEach((r: any) => { map[r.lead_id] = r; });
          setVerificationResults(map);
        })
        .catch((e: any) => console.error('Verification error:', e))
        .finally(() => setIsVerifyingAll(false));

      if (market_exhausted) {
        try {
          const exRes = await api.post('/market-exhaustion', { niche, city });
          if (exRes.data?.suggested_cities?.length) setSuggestedCities(exRes.data.suggested_cities);
        } catch (_) {}
      }

    } catch (e: any) {
      const errData = e.response?.data;
      if (errData?.error === 'trial_expired') { setShowUpgradeWall(true); return; }
      setError(errData?.message || errData?.error || 'Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // handleVerifyLead — calls real backend single verify
  const handleVerifyLead = async (lead: Lead) => {
    if (isVerifying) return;
    setIsVerifying(true);
    try {
      const res = await api.post(`/verify-lead/${lead.id}`);
      const result = res.data;
      const overall = result.overall;
      const updatedLeads = leads.map(l => l.id === lead.id
        ? { ...l, status: overall === 'verified' ? 'verified' : l.status }
        : l
      );
      setLeads(updatedLeads);
      const current = updatedLeads.find(l => l.id === lead.id);
      if (current) setSelectedLead(current);
      // Store verification result so the badge shows immediately
      setVerificationResults(prev => ({ ...prev, [lead.id]: result }));
    } catch (e: any) {
      const errData = e.response?.data;
      if (errData?.error === 'pro_required') {
        setError('Lead verification is available on the Pro plan.');
      } else {
        setError('Contact verification failed.');
      }
    } finally {
      setIsVerifying(false);
    }
  };

  // performAudit — calls real /deep-audit/<lead_id> backend endpoint
  const performAudit = async (lead: Lead) => {
    if (isAuditing) return;
    setIsAuditing(true);
    try {
      const res    = await api.post(`/deep-audit/${lead.id}`);
      const result = res.data;

      // Update the lead in state if backend found better data
      if (result.updated) {
        const updatedLeads = leads.map(l => l.id === lead.id
          ? {
              ...l,
              email:        result.email        ?? l.email,
              website:      result.website      ?? l.website,
              phone_number: result.phone_number ?? (l as any).phone_number,
            }
          : l
        );
        setLeads(updatedLeads);
        const current = updatedLeads.find(l => l.id === lead.id);
        if (current) setSelectedLead(current);
      }

      // Store audit result for this lead
      setAuditResults(prev => ({ ...prev, [lead.id]: result }));

    } catch (e: any) {
      const errData = e.response?.data;
      if (errData?.error === 'pro_required') {
        setError('Deep Audit is available on the Pro plan.');
      } else {
        setError('Deep audit failed. Please try again.');
      }
    } finally {
      setIsAuditing(false);
    }
  };

  // Admin crawl — kept but no longer uses geminiService
  const runAdminGlobalCrawl = async () => {
    if (!adminNiche || !adminCity) return;
    setIsAdminCrawlLoading(true);
    try {
      // Seed vault via backend search with admin account
      const res = await api.post('/search-leads', {
        niche: adminNiche,
        city:  adminCity,
        count: 20,
        idealCompanyType: 'Any',
      });
      const found = res.data?.data || [];
      alert(`Ingestion Complete! Found ${found.length} leads.`);
      setAdminNiche('');
      setAdminCity('');
    } catch {
      setError('Admin ingestion crawl failed.');
    } finally {
      setIsAdminCrawlLoading(false);
    }
  };

  const handlePlanUpgrade = (planId: PlanType) => {
    if (!currentUser) return;
    const plan        = PLANS.find(p => p.id === planId)!;
    const updatedUser = { ...currentUser, plan: planId, credits: currentUser.credits + plan.credits };
    updateUser(updatedUser);
    saveAppState(updatedUser, campaigns, users, globalLeads);
    navigate('/dashboard');
  };

  const clearDatabase = () => {
    if (window.confirm('Clear the entire global lead repository?')) {
      saveAppState(currentUser, campaigns, users, []);
    }
  };

  const handleExpandCity = (newCity: string) => {
    setCity(newCity);
    setLeads([]);
    setSelectedLead(null);
    setVerificationResults({});
    setAuditResults({});
    navigate('/setup');
  };

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════════

  return (
    <>
      {isLoading ? (
        <div className="bg-transparent z-[50] flex flex-col items-center justify-center min-h-screen">
          <ArrowPathIcon className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] animate-pulse">
            Synchronizing Neural Links...
          </p>
        </div>
      ) : (
        <div className="min-h-screen bg-[#05060a] text-slate-400 flex flex-col font-sans selection:bg-indigo-500/30 overflow-x-hidden">
          <Atmosphere />
          <NeuralGrid />

          {/* Toasts */}
          <div className="fixed bottom-4 md:bottom-10 right-4 md:right-10 z-[100] flex flex-col gap-4 pointer-events-none max-w-[calc(100vw-2rem)] md:max-w-sm">
            <AnimatePresence>
              {toasts.map(t => (
                <NeuralToast key={t.id} message={t.message} onRemove={() => setToasts(prev => prev.filter(x => x.id !== t.id))} />
              ))}
            </AnimatePresence>
          </div>

           {/* CRM Export Modal */}
          <AnimatePresence>
            {showExport && <CRMExportModal leads={leads} onClose={() => setShowExport(false)} />}
          </AnimatePresence>

          {/* Header */}
          <header className="px-4 md:px-10 py-4 md:py-5 flex items-center justify-between border-b border-white/[0.02] bg-black/50 backdrop-blur-2xl sticky top-0 z-50">
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate(currentUser ? '/dashboard' : '/')}>
              <div className="bg-indigo-500/10 p-2 rounded-xl border border-indigo-500/20 group-hover:border-indigo-500/50 transition-all">
                <RocketLaunchIcon className="w-5 h-5 text-indigo-400" />
              </div>
              <h1 className="text-xs md:text-sm font-bold tracking-[0.1em] md:tracking-[0.2em] text-white uppercase">
                Intent<span className="text-indigo-500">IQ</span>
              </h1>
            </div>

            <nav className="flex items-center gap-3 md:gap-8">
              {currentUser ? (
                <>
                  <button onClick={() => navigate('/dashboard')}
                    className={`text-[9px] md:text-[10px] font-bold uppercase tracking-widest transition-all ${location.pathname === '/dashboard' ? 'text-indigo-400' : 'text-slate-500 hover:text-white'}`}>
                    Dash
                  </button>
                  {currentUser.is_admin && (
                    <button onClick={() => navigate('/admin')}
                      className={`hidden sm:block text-[9px] md:text-[10px] font-bold uppercase tracking-widest transition-all ${location.pathname === '/admin' ? 'text-amber-400' : 'text-slate-500 hover:text-white'}`}>
                      Admin
                    </button>
                  )}
                  <button onClick={() => navigate('/pricing')}
                    className={`text-[9px] md:text-[10px] font-bold uppercase tracking-widest transition-all ${location.pathname === '/pricing' ? 'text-cyan-400' : 'text-slate-500 hover:text-white'}`}>
                    Billing
                  </button>
                  <div className="w-px h-4 bg-white/10 mx-1 md:mx-2" />
                  <div className="flex items-center gap-2 md:gap-4">
                    <div className="text-right hidden xs:block">
                      <p className="text-[9px] md:text-[10px] font-black text-white uppercase tracking-tighter truncate max-w-[80px] md:max-w-none">
                        {currentUser.email?.split('@')[0]}
                      </p>
                      {!currentUser.is_admin && (
                        <p className="text-[8px] md:text-[9px] font-bold text-indigo-500 uppercase">
                          {currentUser.credits} CR
                        </p>
                      )}
                    </div>
                    <button onClick={handleLogout}
                      className="p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400 transition-all">
                      <ArrowLeftOnRectangleIcon className="w-4 h-4" />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <button onClick={() => navigate('/pricing')} className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-white">Pricing</button>
                  {location.pathname !== '/login' && location.pathname !== '/register' && (
                    <button onClick={() => navigate('/login')}
                      className="bg-indigo-600 text-white font-black px-4 md:px-6 py-2 md:py-2.5 rounded-xl text-[9px] md:text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-600/10 hover:bg-indigo-500 transition-all">
                      Login
                    </button>
                  )}
                </>
              )}
            </nav>
          </header>

          {/* Main */}
          <main className={`flex-1 flex flex-col items-center overflow-y-auto w-full ${(location.pathname === '/login' || location.pathname === '/register') ? 'px-0' : 'px-6'}`}>

            {error && (
              <div className="max-w-md w-full my-8 bg-red-950/20 border border-red-500/20 p-5 rounded-2xl flex items-center gap-4 text-red-400 text-[11px] animate-in slide-in-from-top-4">
                <ExclamationTriangleIcon className="w-5 h-5" />
                <p>{error}</p>
                <button onClick={() => setError(null)} className="ml-auto text-red-400/50 hover:text-red-400">×</button>
              </div>
            )}

            <Routes>
              <Route path="/" element={<LandingView setView={setView} onNavigate={navigate} />} />
              <Route path="/login"    element={<LoginInput onLogin={handleLogin} initialMode="login"    />} />
              <Route path="/register" element={<LoginInput onLogin={handleLogin} initialMode="register" />} />

              <Route path="/dashboard" element={
                <ProtectedRoute currentUser={currentUser} isLoading={isLoading}>
                  <UserDashboard
                    onNavigate={navigate} currentUser={currentUser!} campaigns={campaigns}
                    globalLeads={globalLeads} setNiche={setNiche} setCity={setCity}
                    setServiceOffered={setServiceOffered} setIdealCompanyType={setIdealCompanyType}
                    setLeads={setLeads} setNicheIntel={setNicheIntel}
                  />
                </ProtectedRoute>
              } />

              <Route path="/setup" element={
                <ProtectedRoute currentUser={currentUser} isLoading={isLoading}>
                  <MarketSetupView
                    niche={niche} setNiche={setNiche} city={city} setCity={setCity}
                    serviceOffered={serviceOffered} setServiceOffered={setServiceOffered}
                    idealCompanyType={idealCompanyType} setIdealCompanyType={setIdealCompanyType}
                    startAnalysis={startAnalysis} runDiscovery={runDiscovery}
                    loading={loading} limitInfo={limitInfo}
                  />
                </ProtectedRoute>
              } />

              <Route path="/admin" element={
                <AdminRoute currentUser={currentUser} isLoading={isLoading}>
                  <AdminPanel
                    users={users} clearDatabase={clearDatabase}
                    adminNiche={adminNiche} setAdminNiche={setAdminNiche}
                    adminCity={adminCity} setAdminCity={setAdminCity}
                    isAdminCrawlLoading={isAdminCrawlLoading}
                    runAdminGlobalCrawl={runAdminGlobalCrawl}
                    globalLeads={globalLeads}
                  />
                </AdminRoute>
              } />

              {/* Results */}
              <Route path="/results" element={
                <ProtectedRoute currentUser={currentUser} isLoading={isLoading}>
                  <div className="w-full flex flex-col gap-4 py-6 md:py-10 max-w-[1600px] animate-in fade-in duration-500">

                    {marketExhausted && (
                      <ExhaustedMarketBanner
                        niche={niche} city={city}
                        suggestedCities={suggestedCities}
                        onExpandCity={handleExpandCity}
                      />
                    )}

                    <div className="grid grid-cols-12 gap-6 md:gap-8">

                      {/* Lead list panel */}
                      <div className="col-span-12 lg:col-span-4 flex flex-col gap-4">
                        <div className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                          <h3 className="text-white font-bold text-sm flex items-center gap-2">
                            Target List ({leads.length})
                            {isVerifyingAll && (
                              <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest animate-pulse">
                                · Verifying
                              </span>
                            )}
                          </h3>
                            {/* Export button */}
                            {/* {leads.length > 0 && (
                              <button onClick={() => setShowExport(true)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[9px] font-black uppercase tracking-widest hover:bg-indigo-500/20 transition-all">
                                <CloudArrowDownIcon className="w-3.5 h-3.5" /> Export
                              </button>
                            )} */} 
                            
                          <button onClick={() => {
                            setLeads([]);
                            setSelectedLead(null);
                            setVerificationResults({});
                            setAuditResults({});
                            setMarketExhausted(false);
                            setSuggestedCities([]);
                            navigate('/dashboard');
                          }}
                            className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">
                            Close Hunt
                          </button>
                        </div>

                        <div className="space-y-3 overflow-y-auto max-h-[40vh] lg:max-h-[70vh] pr-2 custom-scrollbar">
                          {leads.map(l => {
                            const vr      = verificationResults[l.id] as any;
                            const emailOk = vr?.email?.is_valid;
                            const hasAudit = !!auditResults[l.id];
                            return (
                              <div
                                key={l.id}
                                onClick={() => { setSelectedLead(l); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                className={`p-4 md:p-5 rounded-2xl border cursor-pointer transition-all ${
                                  selectedLead?.id === l.id
                                    ? 'bg-indigo-500/10 border-indigo-500/50 shadow-lg shadow-indigo-500/5'
                                    : 'bg-white/[0.02] border-white/5 hover:border-white/20'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex items-center gap-2 truncate">
                                    {l.status === 'verified'  && <CheckBadgeIcon className="w-4 h-4 text-emerald-400 shrink-0" />}
                                    {l.status === 'qualified' && <CheckCircleIcon  className="w-4 h-4 text-blue-400 shrink-0"   />}
                                    {l.status === 'rejected'  && <XCircleIcon      className="w-4 h-4 text-red-400 shrink-0"    />}
                                    <h4 className="text-white font-bold text-sm truncate">{l.name}</h4>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    {isVerifyingAll ? (
                                      <ArrowPathIcon className="w-3 h-3 text-indigo-400 animate-spin" />
                                    ) : emailOk !== undefined ? (
                                      <div className={`w-2 h-2 rounded-full ${emailOk ? 'bg-emerald-400' : 'bg-red-400'}`} />
                                    ) : null}
                                    <span className={`text-[9px] font-black ${l.score > 80 ? 'text-emerald-400' : 'text-indigo-400'}`}>
                                      {l.score}%
                                    </span>
                                  </div>
                                </div>
                                <p className="text-[10px] text-slate-500 mt-1 truncate">{normalizeUrl(l.website)}</p>
                                {(l as any).source && (
                                  <div className="mt-2">
                                    <SourceBadge source={(l as any).source} />
                                  </div>
                                )}
                                {/* Buying signal preview */}
                                {(() => {
                                  const { intentKeywords } = parseReasoning((l as any).reasoning || '');
                                  return intentKeywords.length > 0 ? (
                                    <div className="mt-2 flex items-center gap-1.5 text-[9px] font-black text-amber-400 uppercase tracking-widest">
                                      <BoltIcon className="w-3 h-3" />
                                      {intentKeywords[0]}
                                      {intentKeywords.length > 1 && <span className="text-slate-600">+{intentKeywords.length - 1}</span>}
                                    </div>
                                  ) : null;
                                })()}
                                {hasAudit && (
                                  <div className="mt-2 flex items-center gap-1.5 text-[9px] font-black text-indigo-300 uppercase tracking-widest">
                                    <FingerPrintIcon className="w-3 h-3" /> Audited
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Lead detail panel */}
                      <div className="col-span-12 lg:col-span-8">
                        {selectedLead ? (
                          <LeadDetailsView
                            lead={selectedLead}
                            onAudit={performAudit}
                            onVerify={handleVerifyLead}
                            isAuditing={isAuditing}
                            isVerifying={isVerifying}
                            verificationResult={verificationResults[selectedLead.id]}
                            isVerifyingAll={isVerifyingAll}
                            onStatusUpdate={handleStatusUpdate}
                            auditResult={auditResults[selectedLead.id] ?? null}
                          />
                        ) : (
                          <div className="h-full border border-dashed border-white/10 rounded-3xl md:rounded-[40px] flex flex-col items-center justify-center py-20 md:py-40">
                            <SparklesIcon className="w-12 h-12 md:w-16 md:h-16 text-slate-800 mb-6" />
                            <p className="text-slate-600 text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em]">
                              Select prospect for details
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </ProtectedRoute>
              } />

              {/* Search / Strategy */}
              <Route path="/search" element={
                <ProtectedRoute currentUser={currentUser} isLoading={isLoading}>
                  <div className="max-w-xl w-full py-20 animate-in fade-in duration-700">
                    {loading ? (
                      <div className="text-center py-20">
                        <ArrowPathIcon className="w-12 h-12 text-indigo-500 animate-spin mx-auto mb-6" />
                        <h3 className="text-xl font-bold text-white mb-2">Developing Strategy...</h3>
                        <p className="text-slate-500 text-sm uppercase tracking-widest font-bold">Checking Global Index First</p>
                      </div>
                    ) : (
                      <>
                        <div className="text-center mb-12">
                          <h2 className="text-4xl font-black text-white mb-4">Hunt Ready</h2>
                          <p className="text-slate-500 text-sm">Identified the best strategy for <span className="text-white font-bold">{niche}</span> in <span className="text-white font-bold">{city}</span>.</p>
                        </div>

                        <div className="space-y-6">
                          <div className="bg-indigo-500/5 border border-indigo-500/20 p-8 rounded-3xl">
                            <h4 className="text-white font-bold mb-4 uppercase text-xs tracking-widest flex items-center gap-2">
                              <SparklesIcon className="w-4 h-4" /> Launch Parameters
                            </h4>
                            <div className="flex items-center justify-between mb-6">
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Leads to Hunt</span>
                              <div className="flex items-center gap-4">
                                <input
                                  type="number"
                                  className="bg-white/5 border border-white/10 rounded-lg text-white font-black text-lg w-16 text-center outline-none"
                                  value={targetGoal}
                                  onChange={e => setTargetGoal(Number(e.target.value))}
                                />
                                <span className="text-[10px] font-black text-indigo-400 uppercase">{targetGoal} CR</span>
                              </div>
                            </div>
                            <button
                              onClick={() => runDiscovery(targetGoal)}
                              className="w-full bg-indigo-600 py-6 rounded-2xl text-white font-black uppercase text-xs tracking-widest shadow-xl shadow-indigo-600/20 hover:bg-indigo-500 transition-all flex items-center justify-center gap-2"
                            >
                              Launch Fresh Batch Scrape <RocketLaunchIcon className="w-5 h-5" />
                            </button>
                            <p className="text-center text-[9px] text-slate-600 mt-4 uppercase font-bold tracking-widest">
                              Grounded AI Hunt · No Hallucinations
                            </p>
                          </div>
                          <button onClick={() => navigate('/dashboard')}
                            className="w-full text-[10px] font-bold text-slate-600 uppercase tracking-widest hover:text-white transition-all">
                            Cancel Request
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </ProtectedRoute>
              } />

              <Route path="/pricing" element={<BillingView currentUser={currentUser} onUpgrade={handlePlanUpgrade} />} />
              <Route path="/privacy" element={<PrivacyPolicy onBack={() => navigate(-1)} />} />
              <Route path="/terms"   element={<TermsOfService onBack={() => navigate(-1)} />} />
            </Routes>
          </main>

          {/* Footer */}
          {location.pathname !== '/login' && location.pathname !== '/register' && (
            <footer className="px-10 py-6 bg-black/40 border-t border-white/[0.02] flex items-center justify-between text-[9px] font-bold text-slate-700 uppercase tracking-widest">
              <div className="flex items-center gap-8">
                <span>&copy; 2025 INTENTIQ</span>
                <span className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> All Systems Operational
                </span>
              </div>
              <div className="flex gap-6">
                <button onClick={() => navigate('/privacy')} className="hover:text-white transition-colors">Privacy</button>
                <button onClick={() => navigate('/terms')}   className="hover:text-white transition-colors">Terms</button>
                <a href="#" className="hover:text-white transition-colors">Help</a>
              </div>
            </footer>
          )}
          <CookieConsent onManage={() => navigate('/privacy')} />
        </div>
      )}
    </>
  );
};

export default App;