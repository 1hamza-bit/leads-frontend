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
  FingerPrintIcon, ChartBarIcon, SparklesIcon,
  ShieldCheckIcon, CalendarDaysIcon, LockClosedIcon,
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
// TINY HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const fmt = (n: number | null | undefined) => (n ?? 0).toLocaleString();

const pct = (used: number, limit: number | null | undefined) =>
  limit && limit < 999999 ? Math.min(100, Math.round((used / limit) * 100)) : null;

// Ring-style circular progress (SVG, 40×40)
const Ring = ({
  value, max, color, size = 40, stroke = 4,
}: { value: number; max: number; color: string; size?: number; stroke?: number }) => {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pctVal = max > 0 ? Math.min(1, value / max) : 0;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} stroke="rgba(28,26,22,0.07)" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke}
        stroke="currentColor" className={color}
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - pctVal)}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.7s ease' }}
      />
    </svg>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// BIG RING CARD — signature centerpiece ring motif (large %, label inside)
// Inspired by repeated progress-ring devices: a bold ring is the whole card.
// ─────────────────────────────────────────────────────────────────────────────
const BigRingCard = ({
  pctValue, label, sub, ringColor, trackColor, bg, border, icon: Icon,
}: {
  pctValue: number; label: string; sub?: string;
  ringColor: string; trackColor?: string; bg: string; border: string;
  icon?: React.ElementType;
}) => {
  const size = 96, stroke = 8;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const [animPct, setAnimPct] = useState(0);
  useEffect(() => { const t = setTimeout(() => setAnimPct(Math.max(0, Math.min(100, pctValue))), 100); return () => clearTimeout(t); }, [pctValue]);
  return (
    <div className={`group relative ${bg} border ${border} rounded-2xl p-5 flex items-center gap-4 overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#7c3aed]/[0.08]`}>
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90 transition-transform duration-300 group-hover:scale-[1.04]">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} stroke={trackColor ?? 'rgba(124,58,237,0.08)'} />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke}
            stroke={ringColor} strokeLinecap="round"
            strokeDasharray={circ} strokeDashoffset={circ * (1 - animPct / 100)}
            style={{ transition: 'stroke-dashoffset 0.9s cubic-bezier(0.4,0,0.2,1)' }} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-black text-[var(--color-ink)]">{Math.round(pctValue)}%</span>
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-1">
          {Icon && <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: ringColor }} />}
          <p className="text-[11px] font-black text-[var(--color-ink)] uppercase tracking-widest">{label}</p>
        </div>
        {sub && <p className="text-[10px] text-[var(--color-muted)] leading-relaxed">{sub}</p>}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// WAVE CARD — line-illustration style stat card (sparkline as the visual anchor)
// ─────────────────────────────────────────────────────────────────────────────
const WaveCard = ({
  points, value, valueLabel, label, sub, strokeColor, fillColor, bg, border,
}: {
  points: number[]; value: string | number; valueLabel?: string; label: string; sub?: string;
  strokeColor: string; fillColor: string; bg: string; border: string;
}) => {
  const w = 280, h = 64;
  const max = Math.max(...points, 1);
  const min = Math.min(...points, 0);
  const range = max - min || 1;
  const stepX = w / (points.length - 1 || 1);
  const coords = points.map((p, i) => [i * stepX, h - ((p - min) / range) * (h - 8) - 4]);
  const path = coords.map((c, i) => (i === 0 ? `M ${c[0]},${c[1]}` : `L ${c[0]},${c[1]}`)).join(' ');
  const fillPath = `${path} L ${w},${h} L 0,${h} Z`;
  return (
    <div className={`group relative ${bg} border ${border} rounded-2xl p-5 overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#7c3aed]/[0.08]`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-[9px] font-black text-[var(--color-muted)] uppercase tracking-widest mb-1">{label}</p>
          <p className="text-2xl font-black text-[var(--color-ink)] leading-none">
            {value}{valueLabel && <span className="text-xs font-bold text-[var(--color-muted)] ml-1">{valueLabel}</span>}
          </p>
        </div>
        {sub && <span className="text-[9px] font-bold text-[var(--color-muted)] text-right max-w-[40%] leading-tight">{sub}</span>}
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-14 transition-transform duration-300 group-hover:scale-[1.02]" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`wave-fill-${label.replace(/\s/g, '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={fillColor} stopOpacity="0.35" />
            <stop offset="100%" stopColor={fillColor} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={fillPath} fill={`url(#wave-fill-${label.replace(/\s/g, '')})`} />
        <path d={path} fill="none" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {coords.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={i === coords.length - 1 ? 3.5 : 0} fill={strokeColor} className={i === coords.length - 1 ? 'animate-pulse' : ''} />
        ))}
      </svg>
    </div>
  );
};

// Thin horizontal bar
const Bar = ({ used, limit, color }: { used: number; limit: number | null | undefined; color: string }) => {
  const p = pct(used, limit);
  return (
    <div className="h-1 w-full bg-[var(--color-surface-sunk)] rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all duration-700 ${color}`}
        style={{ width: p !== null ? `${p}%` : '0%' }} />
    </div>
  );
};

// Feature capability dot
const FeatureDot = ({ on, label }: { on: boolean; label: string }) => (
  <div className="flex items-center gap-1.5 group">
    <div className={`relative w-1.5 h-1.5 rounded-full ${on ? 'bg-[#7c3aed]' : 'bg-[var(--color-line-strong)]'}`}>
      {on && <span className="absolute inset-0 rounded-full bg-[#7c3aed] animate-ping opacity-60" style={{ animationDuration: '2.5s' }} />}
    </div>
    <span className={`text-[9px] font-bold uppercase tracking-wider transition-colors ${on ? 'text-[var(--color-ink-soft)] group-hover:text-[#7c3aed]' : 'text-[var(--color-faint)]'}`}>{label}</span>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// TRIAL / PLAN BANNER
// ─────────────────────────────────────────────────────────────────────────────
const TrialBanner = ({ planInfo, onUpgrade }: { planInfo: PlanInfo; onUpgrade: () => void }) => {
  if (planInfo.plan !== 'free' && planInfo.plan !== 'trial') return null;
  if (planInfo.trial_expired) {
    return (
      <div className="flex items-center justify-between gap-4 bg-[var(--color-rose-soft)] border border-[var(--color-rose)]/25 rounded-2xl px-5 py-4 mb-6">
        <div className="flex items-center gap-3">
          <ExclamationTriangleIcon className="w-5 h-5 text-[var(--color-rose)] shrink-0" />
          <div>
            <p className="text-[var(--color-rose)] font-black text-sm">Free trial expired</p>
            <p className="text-[var(--color-rose)]/70 text-[11px] mt-0.5">Upgrade to continue finding leads</p>
          </div>
        </div>
        <button onClick={onUpgrade} className="shrink-0 bg-[var(--color-rose)] text-white font-black px-5 py-2 rounded-xl text-xs uppercase tracking-widest hover:opacity-90 transition-all">
          Upgrade
        </button>
      </div>
    );
  }
  const days = planInfo.trial_days_remaining ?? 0;
  const p = Math.round(((14 - days) / 14) * 100);
  const color = days <= 2 ? 'text-[var(--color-rose)]' : days <= 5 ? 'text-[var(--color-gold)]' : 'text-[#7c3aed]';
  const bar = days <= 2 ? 'bg-[var(--color-rose)]' : days <= 5 ? 'bg-[var(--color-gold)]' : 'bg-[#7c3aed]';
  return (
    <div className="flex items-center justify-between gap-4 bg-[var(--color-surface)] border border-[var(--color-line)] rounded-2xl px-5 py-4 mb-6">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <ClockIcon className={`w-5 h-5 shrink-0 ${color}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1.5">
            <p className={`font-black text-sm ${color}`}>
              {days === 0 ? 'Trial expires today' : `${days} day${days === 1 ? '' : 's'} left`}
            </p>
            <span className="text-[10px] text-[var(--color-muted)] font-bold uppercase tracking-widest ml-4 shrink-0">
              {planInfo.daily_leads_remaining ?? 0} leads today
            </span>
          </div>
          <div className="h-1 bg-[var(--color-surface-sunk)] rounded-full overflow-hidden">
            <div className={`h-full ${bar} rounded-full transition-all duration-700`} style={{ width: `${p}%` }} />
          </div>
        </div>
      </div>
      <button onClick={onUpgrade} className="shrink-0 bg-[#7c3aed] text-white font-black px-5 py-2 rounded-xl text-xs uppercase tracking-widest hover:bg-[#6d28d9] transition-all">
        Upgrade
      </button>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// USAGE QUOTA CARD  — used for searches + deep audits
// ─────────────────────────────────────────────────────────────────────────────
const QuotaCard = ({
  icon: Icon,
  title,
  todayUsed,
  todayLimit,
  monthUsed,
  monthLimit,
  monthLabel,
  accentColor,
  ringColor,
  barColor,
  locked = false,
  extra,
}: {
  icon: React.ElementType;
  title: string;
  todayUsed: number;
  todayLimit: number | null;
  monthUsed: number;
  monthLimit: number | null;
  monthLabel?: string;
  accentColor: string;
  ringColor: string;
  barColor: string;
  locked?: boolean;
  extra?: React.ReactNode;
}) => {
  const todayPct = todayLimit ? Math.min(100, Math.round((todayUsed / todayLimit) * 100)) : null;
  const monthPct = monthLimit ? Math.min(100, Math.round((monthUsed / monthLimit) * 100)) : null;
  const nearLimit = (todayPct ?? 0) >= 80 || (monthPct ?? 0) >= 80;

  return (
    <div className={`group relative bg-[var(--color-surface)] border rounded-2xl p-4 overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#7c3aed]/[0.08]
      ${nearLimit && !locked ? 'border-[var(--color-gold)]/40' : 'border-[var(--color-line)]'}`}>
      {locked && (
        <div className="absolute inset-0 bg-[var(--color-surface)]/80 backdrop-blur-[1px] flex items-center justify-center rounded-2xl z-10">
          <span className="text-[9px] font-black text-[var(--color-muted)] uppercase tracking-widest">Not on your plan</span>
        </div>
      )}

      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${accentColor}`}>
            <Icon className="w-4 h-4" />
          </div>
          <p className="text-[11px] font-black text-[var(--color-ink)] uppercase tracking-widest">{title}</p>
        </div>
        {nearLimit && !locked && (
          <span className="text-[8px] font-black text-[var(--color-gold)] bg-[var(--color-gold-soft)] border border-[var(--color-gold)]/30 px-2 py-0.5 rounded-full uppercase tracking-widest">
            Near limit
          </span>
        )}
      </div>

      {/* Today row */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[9px] font-bold text-[var(--color-muted)] uppercase tracking-widest">Today</span>
          <span className="text-[11px] font-black text-[var(--color-ink)]">
            {fmt(todayUsed)}
            {todayLimit !== null && <span className="text-[var(--color-faint)]"> / {fmt(todayLimit)}</span>}
          </span>
        </div>
        {todayLimit !== null
          ? <Bar used={todayUsed} limit={todayLimit} color={barColor} />
          : <div className="h-1 w-full bg-[var(--color-surface-sunk)] rounded-full">
            <div className={`h-full w-0 rounded-full ${barColor}`} />
          </div>
        }
      </div>

      {/* Month row */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[9px] font-bold text-[var(--color-muted)] uppercase tracking-widest">
            {monthLabel ?? 'This month'}
          </span>
          <span className="text-[11px] font-black text-[var(--color-ink)]">
            {fmt(monthUsed)}
            {monthLimit !== null && <span className="text-[var(--color-faint)]"> / {fmt(monthLimit)}</span>}
          </span>
        </div>
        {monthLimit !== null
          ? <Bar used={monthUsed} limit={monthLimit} color={barColor} />
          : <div className="text-[9px] text-[var(--color-faint)] italic mt-1">Unlimited</div>
        }
      </div>

      {extra && <div className="mt-3 pt-3 border-t border-[var(--color-line)]">{extra}</div>}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// PLAN FEATURES PILL ROW
// ─────────────────────────────────────────────────────────────────────────────
const PlanFeatures = ({ features }: { features: Record<string, boolean> }) => {
  const MAP: [string, string][] = [
    ['social_layers', 'Social'],
    ['intent_detection', 'Intent AI'],
    ['verification', 'Verify'],
    ['feedback', 'Pipeline'],
    ['bulk_search', 'Bulk'],
    ['deep_audit', 'Deep Audit'],
    ['export', 'Export'],
  ];
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-2">
      {MAP.map(([k, label]) => <FeatureDot key={k} on={!!features[k]} label={label} />)}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// PLAN BADGE
// ─────────────────────────────────────────────────────────────────────────────
const PLAN_COLORS: Record<string, string> = {
  free: 'text-[var(--color-muted)] bg-[var(--color-surface-sunk)] border-[var(--color-line-strong)]',
  trial: 'text-[#7c3aed]  bg-[#f2edfc]    border-[#7c3aed]/30',
  tester: 'text-[#8a6fa8] bg-[#efe9f4] border-[#8a6fa8]/30',
  starter: 'text-[#3f8ea0] bg-[#e3eef0] border-[#3f8ea0]/30',
  pro: 'text-[#7c3aed] bg-[#f2edfc] border-[#7c3aed]/30',
  agency: 'text-[var(--color-gold)]  bg-[var(--color-gold-soft)]    border-[var(--color-gold)]/30',
  admin: 'text-[var(--color-rose)]  bg-[var(--color-rose-soft)]    border-[var(--color-rose)]/30',
};

const PlanBadge = ({ plan }: { plan: string }) => (
  <span className={`px-2.5 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest ${PLAN_COLORS[plan] ?? PLAN_COLORS.free}`}>
    {plan}
  </span>
);

// ─────────────────────────────────────────────────────────────────────────────
// AUDITED BADGE — shown on leads that have completed a deep audit pass
// ─────────────────────────────────────────────────────────────────────────────
const AuditedBadge = () => (
  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-[#7c3aed]/30 bg-[#f2edfc] text-[#7c3aed] text-[9px] font-black uppercase tracking-widest shrink-0">
    <FingerPrintIcon className="w-3 h-3" /> Audited
  </span>
);

// ─────────────────────────────────────────────────────────────────────────────
// STAT TILE — compact number + label, with tint + hover lift
// ─────────────────────────────────────────────────────────────────────────────
const StatTile = ({ label, value, sub, color = 'text-[var(--color-ink)]', tint }: {
  label: string; value: string | number; sub?: string; color?: string;
  tint?: { bg: string; border: string; bar: string };
}) => {
  const t = tint ?? { bg: 'bg-[var(--color-surface)]', border: 'border-[var(--color-line)]', bar: 'bg-[var(--color-line-strong)]' };
  return (
    <div className={`group relative ${t.bg} border ${t.border} rounded-2xl p-4 overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#7c3aed]/[0.08] cursor-default`}>
      <div className={`absolute top-0 left-0 right-0 h-[3px] ${t.bar} opacity-70 group-hover:opacity-100 transition-opacity`} />
      <p className="text-[9px] font-black text-[var(--color-muted)] uppercase tracking-widest mb-1">{label}</p>
      <p className={`text-2xl font-black leading-none transition-transform duration-300 group-hover:scale-[1.04] origin-left ${color}`}>{value}</p>
      {sub && <p className="text-[10px] text-[var(--color-muted)] mt-1.5">{sub}</p>}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// FILTER SELECT
// ─────────────────────────────────────────────────────────────────────────────
const FilterSelect = ({
  value, onChange, options, placeholder, icon, accentColor = 'purple',
}: {
  value: string; onChange: (v: string) => void;
  options: { label: string; value: string }[];
  placeholder: string; icon?: React.ReactNode;
  accentColor?: 'purple' | 'cyan' | 'amber';
}) => {
  const [open, setOpen] = useState(false);
  const selected = options.find(o => o.value === value);
  const accent: Record<string, { ring: string; text: string; bg: string }> = {
    purple: { ring: 'border-[#7c3aed]/50', text: 'text-[#7c3aed]', bg: 'bg-[#f2edfc]' },
    cyan: { ring: 'border-[#3f8ea0]/60', text: 'text-[#3f8ea0]', bg: 'bg-[#e3eef0]' },
    amber: { ring: 'border-[var(--color-gold)]/60', text: 'text-[var(--color-gold)]', bg: 'bg-[var(--color-gold-soft)]' },
  };
  const a = accent[accentColor];
  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap
          ${value ? `${a.bg} ${a.ring} ${a.text}` : 'bg-[var(--color-surface)] border-[var(--color-line)] text-[var(--color-muted)] hover:border-[var(--color-line-strong)] hover:text-[var(--color-ink-soft)]'}`}>
        {icon && <span className="shrink-0 opacity-70">{icon}</span>}
        <span>{selected?.label ?? placeholder}</span>
        <ChevronDownIcon className={`w-3 h-3 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1.5 z-50 min-w-[180px] max-h-56 overflow-y-auto
            bg-[var(--color-surface)] border border-[var(--color-line)] rounded-2xl shadow-2xl shadow-[#7c3aed]/10 py-1.5">
            {options.map(opt => (
              <button key={opt.value} type="button" onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`w-full text-left px-4 py-2.5 text-[11px] font-bold flex items-center gap-2.5 transition-colors
                  ${opt.value === value ? `${a.text} ${a.bg}` : 'text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-sunk)]'}`}>
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
        className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] text-[var(--color-muted)] hover:border-[var(--color-line-strong)] hover:text-[var(--color-ink-soft)] text-[10px] font-black uppercase tracking-widest transition-all">
        <ArrowsUpDownIcon className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">{current.label}</span>
        <ChevronDownIcon className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full right-0 mt-1.5 z-50 min-w-[160px] bg-[var(--color-surface)] border border-[var(--color-line)] rounded-2xl shadow-2xl shadow-[#7c3aed]/10 py-1.5">
            {opts.map(opt => {
              const active = opt.sort === sortBy && opt.ord === order;
              return (
                <button key={`${opt.sort}-${opt.ord}`} type="button"
                  onClick={() => { onChange(opt.sort, opt.ord); setOpen(false); }}
                  className={`w-full text-left px-4 py-2.5 text-[11px] font-bold flex items-center gap-2.5 transition-colors
                    ${active ? 'text-[#7c3aed] bg-[#f2edfc]' : 'text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-sunk)]'}`}>
                  {active ? <CheckCircleIcon className="w-3.5 h-3.5 shrink-0 text-[#7c3aed]" /> : <span className="w-3.5" />}
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

const PerPageToggle = ({ value, onChange }: { value: number; onChange: (v: number) => void }) => (
  <div className="flex items-center gap-1 bg-[var(--color-surface)] border border-[var(--color-line)] rounded-xl p-1">
    {[10, 25, 50].map(n => (
      <button key={n} type="button" onClick={() => onChange(n)}
        className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all
          ${value === n ? 'bg-[#7c3aed] text-white' : 'text-[var(--color-faint)] hover:text-[var(--color-ink-soft)]'}`}>
        {n}
      </button>
    ))}
  </div>
);

const FilterPill = ({ label, value, color, onRemove }: {
  label: string; value: string; color: string; onRemove: () => void;
}) => (
  <span className={`flex items-center gap-1.5 pl-3 pr-2 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest ${color}`}>
    <span className="opacity-60">{label}:</span>
    <span>{value}</span>
    <button type="button" onClick={onRemove}
      className="ml-0.5 w-4 h-4 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center transition-all">
      <XMarkIcon className="w-2.5 h-2.5" />
    </button>
  </span>
);

// ─────────────────────────────────────────────────────────────────────────────
// STATUS + SOURCE BADGES
// ─────────────────────────────────────────────────────────────────────────────
const STATUS_CFG: Record<string, { color: string; bg: string; border: string; dot: string }> = {
  new: { color: 'text-[#7c3aed]', bg: 'bg-[#f2edfc]', border: 'border-[#7c3aed]/25', dot: 'bg-[#7c3aed]' },
  contacted: { color: 'text-[var(--color-gold)]', bg: 'bg-[var(--color-gold-soft)]', border: 'border-[var(--color-gold)]/30', dot: 'bg-[var(--color-gold)]' },
  replied: { color: 'text-[var(--color-accent)]', bg: 'bg-[var(--color-accent-soft)]', border: 'border-[var(--color-accent)]/25', dot: 'bg-[var(--color-accent)]' },
  qualified: { color: 'text-[#3f8ea0]', bg: 'bg-[#e3eef0]', border: 'border-[#3f8ea0]/30', dot: 'bg-[#3f8ea0]' },
  rejected: { color: 'text-[var(--color-rose)]', bg: 'bg-[var(--color-rose-soft)]', border: 'border-[var(--color-rose)]/30', dot: 'bg-[var(--color-rose)]' },
  verified: { color: 'text-[var(--color-accent)]', bg: 'bg-[var(--color-accent-soft)]', border: 'border-[var(--color-accent)]/25', dot: 'bg-[var(--color-accent)]' },
  saved: { color: 'text-[#8a6fa8]', bg: 'bg-[#efe9f4]', border: 'border-[#8a6fa8]/30', dot: 'bg-[#8a6fa8]' },
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
  vault: { label: 'Vault', cls: 'text-[var(--color-muted)] border-[var(--color-line-strong)]' },
  google_search: { label: 'Google', cls: 'text-[#7c3aed]  border-[#7c3aed]/40' },
  facebook_graph: { label: 'Facebook', cls: 'text-[#5b6e9b] border-[#5b6e9b]/40' },
  facebook_gemini: { label: 'Facebook', cls: 'text-[#5b6e9b] border-[#5b6e9b]/40' },
  linkedin_signal: { label: 'LinkedIn', cls: 'text-[#3f8ea0] border-[#3f8ea0]/40' },
  news_signal: { label: 'News', cls: 'text-[var(--color-gold)] border-[var(--color-gold)]/40' },
  ai_search: { label: 'AI', cls: 'text-[#8a6fa8] border-[#8a6fa8]/40' },
  csv_import: { label: 'Imported', cls: 'text-[var(--color-accent)] border-[var(--color-accent)]/40' },
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
// EXPORT MODAL
// ─────────────────────────────────────────────────────────────────────────────
const DashboardExportModal = ({
  onClose, activeNiche, activeCity, activeStatus,
  totalCount, nicheOptions, cityOptions, allowedFormats,
}: {
  onClose: () => void; activeNiche: string; activeCity: string; activeStatus: string;
  totalCount: number; nicheOptions: string[]; cityOptions: string[];
  allowedFormats: string[];
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

  useEffect(() => {
    if (scope === 'filtered') { setNiche(activeNiche); setCity(activeCity); setStatus(activeStatus); }
    else { setNiche(''); setCity(''); setStatus(''); }
  }, [scope]);

  // Normalize plan-allowed formats (lowercase, deduped) — comes from
  // stats.plan_quota.export_formats via the /dashboard-stats API.
  const normalizedAllowed = (allowedFormats || []).map(f => f.toLowerCase());

  // If the currently selected format becomes unavailable (e.g. plan
  // downgraded mid-session), fall back to the first allowed format.
  useEffect(() => {
    if (normalizedAllowed.length > 0 && !normalizedAllowed.includes(format)) {
      setFormat(normalizedAllowed[0] as any);
    }
  }, [normalizedAllowed.join(',')]);

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

  const ALL_FORMATS = [
    { id: 'csv', label: 'CSV', sub: 'Universal — Excel / Google Sheets', color: 'text-[#7c3aed] border-[#7c3aed]/30 bg-[#f2edfc]' },
    { id: 'json', label: 'JSON', sub: 'All fields + deep audit data', color: 'text-[#6d28d9]   border-[#6d28d9]/30   bg-[#efe9fb]' },
    { id: 'hubspot', label: 'HubSpot CSV', sub: 'Direct import — HubSpot contacts', color: 'text-[var(--color-gold)]   border-[var(--color-gold)]/30   bg-[var(--color-gold-soft)]' },
    { id: 'salesforce', label: 'Salesforce CSV', sub: 'Direct import — Salesforce leads', color: 'text-[#3f8ea0]   border-[#3f8ea0]/30   bg-[#e3eef0]' },
  ] as const;

  // Only formats the user's plan allows (from /dashboard-stats → plan_quota.export_formats)
  const FORMATS = ALL_FORMATS.filter(f => normalizedAllowed.includes(f.id));
  const LOCKED_FORMATS = ALL_FORMATS.filter(f => !normalizedAllowed.includes(f.id));

  const FIELDS: Record<string, string> = {
    csv: 'Name, Email, Phone, Website, City, Niche, Score, Status, Reasoning, Email Verified, Decision Maker',
    json: 'All fields + verification, deep audit, decision maker, social profiles, activity signals',
    hubspot: 'First Name, Last Name, Email, Phone, Website URL, City, Industry, Lead Status, Notes, Score',
    salesforce: 'Last Name, First Name, Email, Phone, Website, City, Industry, Lead Status, Description, Rating',
  };

  const nicheOpts = [{ label: 'All Niches', value: '' }, ...nicheOptions.map(n => ({ label: n, value: n }))];
  const cityOpts = [{ label: 'All Cities', value: '' }, ...cityOptions.map(c => ({ label: c, value: c }))];
  const statusOpts = [{ label: 'All Statuses', value: '' }, ...Object.keys(STATUS_CFG).map(k => ({ label: k[0].toUpperCase() + k.slice(1), value: k }))];

  const doExport = async () => {
    if (!normalizedAllowed.includes(format)) {
      alert('This export format is not available on your current plan.');
      return;
    }
    setExporting(true);
    try {
      const params = new URLSearchParams({ format });
      if (niche) params.set('niche', niche);
      if (city) params.set('city', city);
      if (status) params.set('status', status);
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token') || localStorage.getItem('token') || '';
      const response = await fetch(
        `${(api.defaults as any).baseURL || ''}/my-leads/export?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!response.ok) { const err = await response.json().catch(() => ({})); throw new Error((err as any).error || `Export failed: ${response.status}`); }
      const disposition = response.headers.get('Content-Disposition') || '';
      const match = disposition.match(/filename=(.+)/);
      const filename = match ? match[1] : `intentiq-export.${format === 'json' ? 'json' : 'csv'}`;
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
      setDone(true); setTimeout(() => setDone(false), 3000);
    } catch (err: any) { alert(err.message || 'Export failed.'); }
    finally { setExporting(false); }
  };

  const exportCount = countLoading ? '…' : (previewCount ?? totalCount);

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 bg-[#1d1b17]/45 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg bg-[var(--color-surface)] border border-[var(--color-line)] rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-[var(--color-line)] flex items-center gap-4 shrink-0">
          <div className="w-10 h-10 bg-[#f2edfc] rounded-2xl flex items-center justify-center">
            <CloudArrowDownIcon className="w-5 h-5 text-[#7c3aed]" />
          </div>
          <div><h3 className="text-[var(--color-ink)] font-bold text-base">Export Leads to CRM</h3><p className="text-[var(--color-muted)] text-[10px]">Choose format and scope</p></div>
          <button onClick={onClose} className="ml-auto text-[var(--color-faint)] hover:text-[var(--color-ink)] transition-colors text-xl">×</button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
          <div>
            <p className="eyebrow mb-3">What to export</p>
            <div className="grid grid-cols-2 gap-2">
              {[{ id: 'all', label: 'All my leads', sub: 'Every lead in your account' }, { id: 'filtered', label: 'Filtered', sub: 'Choose niche, city or status' }].map(s => (
                <button key={s.id} type="button" onClick={() => setScope(s.id as any)}
                  className={`p-4 rounded-2xl border text-left transition-all ${scope === s.id ? 'bg-[#f2edfc] border-[#7c3aed]/40' : 'bg-[var(--color-surface-sunk)] border-[var(--color-line)] hover:border-[var(--color-line-strong)]'}`}>
                  <div className={`w-3.5 h-3.5 rounded-full border-2 mb-2 flex items-center justify-center ${scope === s.id ? 'border-[#7c3aed]' : 'border-[var(--color-line-strong)]'}`}>
                    {scope === s.id && <div className="w-1.5 h-1.5 rounded-full bg-[#7c3aed]" />}
                  </div>
                  <p className={`font-bold text-[11px] ${scope === s.id ? 'text-[var(--color-ink)]' : 'text-[var(--color-ink-soft)]'}`}>{s.label}</p>
                  <p className="text-[9px] text-[var(--color-muted)] mt-0.5">{s.sub}</p>
                </button>
              ))}
            </div>
          </div>
          {scope === 'filtered' && (
            <div className="p-4 bg-[var(--color-surface-sunk)] rounded-2xl border border-[var(--color-line)] space-y-3">
              <div className="flex flex-wrap gap-2">
                <FilterSelect value={niche} onChange={setNiche} options={nicheOpts} placeholder="Niche" accentColor="purple" icon={<QueueListIcon className="w-3.5 h-3.5" />} />
                <FilterSelect value={city} onChange={setCity} options={cityOpts} placeholder="City" accentColor="cyan" icon={<GlobeAltIcon className="w-3.5 h-3.5" />} />
                <FilterSelect value={status} onChange={setStatus} options={statusOpts} placeholder="Status" accentColor="amber" icon={<BoltIcon className="w-3.5 h-3.5" />} />
              </div>
              <div className="flex items-center gap-2">
                {countLoading ? <ArrowPathIcon className="w-3.5 h-3.5 text-[var(--color-muted)] animate-spin" /> :
                  <span className="text-[9px] font-black text-[var(--color-muted)]">Matching: <span className="text-[#7c3aed]">{previewCount ?? '—'}</span></span>}
              </div>
            </div>
          )}
          <div>
            <p className="eyebrow mb-3">Format</p>
            {FORMATS.length === 0 ? (
              <div className="p-4 bg-[var(--color-gold-soft)] border border-[var(--color-gold)]/30 rounded-2xl flex items-start gap-3">
                <LockClosedIcon className="w-4 h-4 text-[var(--color-gold)] shrink-0 mt-0.5" />
                <div>
                  <p className="text-[var(--color-gold)] font-bold text-[11px]">No export formats on your plan</p>
                  <p className="text-[var(--color-muted)] text-[10px] mt-0.5">Upgrade to Starter or above to export your leads.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {FORMATS.map(f => (
                  <button key={f.id} type="button" onClick={() => setFormat(f.id as any)}
                    className={`w-full flex items-center gap-4 p-3.5 rounded-2xl border transition-all text-left ${format === f.id ? f.color : 'bg-[var(--color-surface-sunk)] border-[var(--color-line)] hover:border-[var(--color-line-strong)]'}`}>
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${format === f.id ? 'border-current' : 'border-[var(--color-line-strong)]'}`}>
                      {format === f.id && <div className="w-2 h-2 rounded-full bg-current" />}
                    </div>
                    <div><p className={`font-bold text-sm ${format === f.id ? '' : 'text-[var(--color-ink-soft)]'}`}>{f.label}</p><p className="text-[10px] text-[var(--color-muted)] mt-0.5">{f.sub}</p></div>
                  </button>
                ))}
              </div>
            )}

            {/* Locked formats — visible but disabled, nudges upgrade */}
            {LOCKED_FORMATS.length > 0 && (
              <div className="mt-3 space-y-2">
                {LOCKED_FORMATS.map(f => (
                  <div key={f.id} title="Not available on your plan"
                    className="w-full flex items-center gap-4 p-3.5 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface-sunk)]/60 opacity-60 cursor-not-allowed">
                    <LockClosedIcon className="w-4 h-4 text-[var(--color-faint)] shrink-0" />
                    <div className="flex-1">
                      <p className="font-bold text-sm text-[var(--color-muted)]">{f.label}</p>
                      <p className="text-[10px] text-[var(--color-faint)] mt-0.5">{f.sub}</p>
                    </div>
                    <span className="text-[8px] font-black text-[var(--color-gold)] uppercase tracking-widest shrink-0">Upgrade</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          {FORMATS.length > 0 && (
            <div className="p-3 bg-[var(--color-surface-sunk)] border border-[var(--color-line)] rounded-xl">
              <p className="eyebrow mb-1">Fields included</p>
              <p className="text-[10px] text-[var(--color-ink-soft)] leading-relaxed">{FIELDS[format]}</p>
            </div>
          )}
        </div>
        <div className="p-6 border-t border-[var(--color-line)] shrink-0">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] text-[var(--color-muted)]">Leads to export</span>
            <span className="text-[10px] font-black text-[var(--color-ink)]">{countLoading ? <ArrowPathIcon className="w-3.5 h-3.5 text-[var(--color-muted)] animate-spin inline" /> : <>{exportCount} lead{Number(exportCount) !== 1 ? 's' : ''}</>}</span>
          </div>
          <button onClick={doExport} disabled={exporting || done || exportCount === 0 || FORMATS.length === 0}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-40">
            {FORMATS.length === 0
              ? <><LockClosedIcon className="w-4 h-4" /> Upgrade to Export</>
              : exporting ? <><ArrowPathIcon className="w-4 h-4 animate-spin" /> Preparing…</>
                : done ? <><CheckCircleIcon className="w-4 h-4" /> Downloaded!</>
                  : <><CloudArrowDownIcon className="w-4 h-4" /> Download {format.toUpperCase()} ({exportCount})</>}
          </button>
          <button onClick={onClose} className="mt-3 w-full text-[var(--color-muted)] text-[9px] font-bold uppercase tracking-widest hover:text-[var(--color-ink)] transition-colors">Cancel</button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// LEAD DETAIL PANEL
// ─────────────────────────────────────────────────────────────────────────────
const LeadDetailPanel = ({ lead, onClose, isAudited, isAuditing }: { lead: MyLead; onClose: () => void; isAudited?: boolean; isAuditing?: boolean; }) => {
  const scoreColor = lead.score >= 80 ? 'text-[var(--color-accent)]' : lead.score >= 60 ? 'text-[#7c3aed]' : lead.score >= 40 ? 'text-[var(--color-gold)]' : 'text-[var(--color-rose)]';
  const scoreBorder = lead.score >= 80 ? 'border-[var(--color-accent)]/30 bg-[var(--color-accent-soft)]' : lead.score >= 60 ? 'border-[#7c3aed]/30 bg-[#f2edfc]' : lead.score >= 40 ? 'border-[var(--color-gold)]/30 bg-[var(--color-gold-soft)]' : 'border-[var(--color-rose)]/30 bg-[var(--color-rose-soft)]';
  const dm = (lead as any).decision_maker;
  const reasoning = (lead as any).reasoning;
  const auditSummary = (lead as any).deep_audit_summary;
  const source = (lead as any).source;
  const STATUS_BADGE: Record<string, { label: string; color: string; bg: string; border: string }> = {
    verified: { label: 'Verified', color: 'text-[var(--color-accent)]', bg: 'bg-[var(--color-accent-soft)]', border: 'border-[var(--color-accent)]/30' },
    audit_verified: { label: 'Audited', color: 'text-[#7c3aed]', bg: 'bg-[#f2edfc]', border: 'border-[#7c3aed]/30' },
    mx_verified: { label: 'MX OK', color: 'text-[#7c3aed]', bg: 'bg-[#f2edfc]', border: 'border-[#7c3aed]/30' },
    probable: { label: 'Probable', color: 'text-[var(--color-gold)]', bg: 'bg-[var(--color-gold-soft)]', border: 'border-[var(--color-gold)]/30' },
    catchall_server: { label: 'Catch-All', color: 'text-[var(--color-gold)]', bg: 'bg-[var(--color-gold-soft)]', border: 'border-[var(--color-gold)]/30' },
    undeliverable: { label: 'Bad Email', color: 'text-[var(--color-rose)]', bg: 'bg-[var(--color-rose-soft)]', border: 'border-[var(--color-rose)]/30' },
    no_mx_record: { label: 'No MX', color: 'text-[var(--color-rose)]', bg: 'bg-[var(--color-rose-soft)]', border: 'border-[var(--color-rose)]/30' },
    no_email: { label: 'No Email', color: 'text-[var(--color-muted)]', bg: 'bg-[var(--color-surface-sunk)]', border: 'border-[var(--color-line)]' },
  };
  return (
    <div className="flex flex-col h-full bg-[var(--color-surface)]">
      {isAuditing && (
        <div className="absolute inset-0 z-20 bg-[var(--color-surface)]/85 backdrop-blur-[2px] flex flex-col items-center justify-center gap-3">
          <ArrowPathIcon className="w-6 h-6 text-[#7c3aed] animate-spin" />
          <p className="text-[10px] font-black text-[#7c3aed] uppercase tracking-widest">Running deep audit…</p>
        </div>
      )}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--color-line)] bg-[var(--color-surface-sunk)]/50 shrink-0">
        <p className="eyebrow">Lead Detail</p>
        <button type="button" onClick={onClose} className="w-7 h-7 rounded-lg bg-[var(--color-surface-sunk)] hover:bg-[var(--color-line)] flex items-center justify-center text-[var(--color-muted)] hover:text-[var(--color-ink)] transition-all">
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-[var(--color-line)]">
          <div className="flex items-start gap-3 mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="visionary-text normal-case text-xl leading-tight break-words mb-2">{lead.name}</h3>
              <div className="flex flex-wrap items-center gap-2"><StatusBadge status={lead.status} />{isAudited && <AuditedBadge />}{source && <SourceBadge source={source} />}</div>
            </div>
            <div className={`shrink-0 flex flex-col items-center justify-center w-14 h-14 rounded-2xl border ${scoreBorder}`}>
              <span className={`text-xl font-black leading-none ${scoreColor}`}>{lead.score}</span>
              <span className="text-[8px] text-[var(--color-muted)] font-bold uppercase mt-0.5">score</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {lead.niche && <span className="flex items-center gap-1 px-2 py-1 bg-[#f2edfc] border border-[#7c3aed]/20 text-[#7c3aed] rounded-full text-[9px] font-black uppercase tracking-widest"><BuildingOfficeIcon className="w-3 h-3" />{lead.niche}</span>}
            {lead.city && <span className="flex items-center gap-1 px-2 py-1 bg-[var(--color-surface-sunk)] border border-[var(--color-line)] text-[var(--color-ink-soft)] rounded-full text-[9px] font-black uppercase tracking-widest"><MapPinIcon className="w-3 h-3" />{lead.city}</span>}
          </div>
        </div>
        {/* Contact */}
        <div className="px-5 py-4 border-b border-[var(--color-line)] space-y-3">
          <p className="eyebrow">Contact</p>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-[var(--color-surface-sunk)] flex items-center justify-center shrink-0"><LinkIcon className="w-3.5 h-3.5 text-[var(--color-muted)]" /></div>
              {lead.website ? <a href={lead.website} target="_blank" rel="noreferrer" className="text-[11px] text-[#7c3aed] hover:opacity-80 truncate">{lead.website.replace(/https?:\/\/(www\.)?/, '').replace(/\/$/, '')}</a>
                : <span className="text-[11px] text-[var(--color-faint)] italic">No website</span>}
            </div>
            {(lead as any).verification?.website?.is_live !== undefined && (
              (lead as any).verification.website.is_live
                ? <span className="shrink-0 px-2 py-0.5 rounded-full text-[9px] font-black border bg-[var(--color-accent-soft)] border-[var(--color-accent)]/30 text-[var(--color-accent)]">Live</span>
                : <span className="shrink-0 px-2 py-0.5 rounded-full text-[9px] font-black border bg-[var(--color-rose-soft)] border-[var(--color-rose)]/30 text-[var(--color-rose)]">Down</span>
            )}
          </div>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-[var(--color-surface-sunk)] flex items-center justify-center shrink-0"><EnvelopeIcon className="w-3.5 h-3.5 text-[var(--color-muted)]" /></div>
              {lead.email ? <span className="text-[11px] text-[var(--color-ink-soft)] truncate">{lead.email}</span>
                : <span className="text-[11px] text-[var(--color-faint)] italic">No email</span>}
            </div>
            {(lead as any).verification?.email?.status && (() => {
              const cfg = STATUS_BADGE[(lead as any).verification.email.status] ?? { label: (lead as any).verification.email.status, color: 'text-[var(--color-muted)]', bg: 'bg-[var(--color-surface-sunk)]', border: 'border-[var(--color-line)]' };
              return <span className={`shrink-0 px-2 py-0.5 rounded-full text-[9px] font-black border ${cfg.color} ${cfg.bg} ${cfg.border}`}>{cfg.label}</span>;
            })()}
          </div>
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-[var(--color-surface-sunk)] flex items-center justify-center shrink-0"><PhoneIcon className="w-3.5 h-3.5 text-[var(--color-muted)]" /></div>
            {lead.phone_number ? <span className="text-[11px] text-[var(--color-ink-soft)]">{lead.phone_number}</span>
              : <span className="text-[11px] text-[var(--color-faint)] italic">No phone</span>}
          </div>
          {(lead as any).verification?.overall && (() => {
            const OV: Record<string, string> = { verified: 'text-[var(--color-accent)] bg-[var(--color-accent-soft)] border-[var(--color-accent)]/30', partial: 'text-[var(--color-gold)] bg-[var(--color-gold-soft)] border-[var(--color-gold)]/30', failed: 'text-[var(--color-rose)] bg-[var(--color-rose-soft)] border-[var(--color-rose)]/30' };
            return (
              <div className="flex items-center gap-2 pt-2 border-t border-[var(--color-line)]">
                <span className="text-[9px] font-black text-[var(--color-muted)] uppercase tracking-widest">Verification:</span>
                <span className={`px-2 py-0.5 rounded-full border text-[9px] font-black capitalize ${OV[(lead as any).verification.overall] ?? OV.failed}`}>{(lead as any).verification.overall}</span>
              </div>
            );
          })()}
        </div>
        {reasoning && <div className="px-5 py-4 border-b border-[var(--color-line)]"><p className="eyebrow mb-2">Signal</p><p className="text-[11px] text-[var(--color-ink-soft)] leading-relaxed italic">"{reasoning}"</p></div>}
        {dm?.name && (
          <div className="px-5 py-4 border-b border-[var(--color-line)]">
            <p className="eyebrow mb-3">Decision Maker</p>
            <div className="flex items-center gap-3 p-3 bg-[var(--color-surface-sunk)] rounded-xl border border-[var(--color-line)]">
              <div className="w-9 h-9 bg-[#7c3aed] rounded-xl flex items-center justify-center text-white text-sm font-black shrink-0">{dm.name.charAt(0)}</div>
              <div><p className="text-[var(--color-ink)] font-bold text-[12px]">{dm.name}</p>{dm.title && <p className="text-[10px] text-[#7c3aed] font-bold mt-0.5">{dm.title}</p>}{dm.linkedin_url && <a href={dm.linkedin_url} target="_blank" rel="noreferrer" className="text-[9px] text-[#3f8ea0] hover:opacity-80 font-bold mt-0.5 block">LinkedIn →</a>}</div>
            </div>
          </div>
        )}
        {auditSummary && <div className="px-5 py-4 border-b border-[var(--color-line)]"><p className="eyebrow mb-2">Audit Summary</p><p className="text-[11px] text-[var(--color-ink-soft)] leading-relaxed">{auditSummary}</p></div>}
        <div className="px-5 py-4">
          <p className="eyebrow mb-3">Meta</p>
          <div className="space-y-2">
            <div className="flex justify-between text-[10px]"><span className="text-[var(--color-muted)]">Acquired</span><span className="text-[var(--color-ink-soft)]">{new Date(lead.acquired_at).toLocaleDateString()}</span></div>
            {source && <div className="flex justify-between text-[10px]"><span className="text-[var(--color-muted)]">Source</span><span className="text-[var(--color-ink-soft)] capitalize">{source.replace(/_/g, ' ')}</span></div>}
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
  setLeads, setNicheIntel, onBulkAudit, isBulkAuditing, bulkAuditProgress,
  auditedLeads = {},
}: {
  onNavigate: (v: string) => void; currentUser: User | null;
  campaigns: Campaign[]; globalLeads: Lead[];
  setNiche: (s: string) => void; setCity: (s: string) => void;
  setServiceOffered: (s: string) => void; setIdealCompanyType: (s: string) => void;
  setLeads: (l: Lead[]) => void; setNicheIntel: (i: NicheIntel | null) => void;
  onBulkAudit: (leads?: any[]) => void;
  isBulkAuditing: boolean; bulkAuditProgress: { done: number; total: number };
  auditedLeads?: Record<string, any>;
}) => {
  const [activeTab, setActiveTab] = useState<DashTab>('overview');
  const [myLeads, setMyLeads] = useState<MyLead[]>([]);
  const [pagination, setPagination] = useState<LeadsPagination | null>(null);
  const [isLoadingLeads, setIsLoadingLeads] = useState(false);
  const [leadsError, setLeadsError] = useState<string | null>(null);
  // const [selectedLead, setSelectedLead] = useState<MyLead | null>(null);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [auditingIds, setAuditingIds] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<LeadFilters>({ page: 1, per_page: 10, sort_by: 'created_at', order: 'desc' });
  const [nicheOptions, setNicheOptions] = useState<string[]>([]);
  const [cityOptions, setCityOptions] = useState<string[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const detailScrollRef = useRef<HTMLDivElement>(null);

  const planInfo = currentUser?.plan_info ?? null;
  const isTrialExpired = planInfo?.trial_expired === true;


  // A lead is "audited" if this session's deep-audit run has completed for it.
  // Once audited, it can no longer be re-selected for another bulk audit pass.
  const isAudited = useCallback((id: string) => !!auditedLeads?.[id]?.audited, [auditedLeads]);

  // Merge live audit patches (email/phone/website/status) into the fetched
  // leads list so the table reflects deep-audit results immediately, without
  // waiting for the next full refetch from the backend.
  const displayLeads = myLeads.map(l => auditedLeads[l.id] ? { ...l, ...auditedLeads[l.id] } : l);
  const selectedLead = selectedLeadId ? displayLeads.find(l => l.id === selectedLeadId) ?? null : null;
  const panelOpen = selectedLead !== null; // (remove the old `const panelOpen = selectedLead !== null;` line below, keep only this one, positioned after displayLeads)
  const toggleSelect = (id: string, lead?: MyLead) => {
    if (isAudited(id)) return;
    setSelectedIds(prev => {
      const n = new Set(prev);
      if (n.has(id)) {
        n.delete(id);
      } else {
        n.add(id);
        setSelectedLeadId(id); // open this lead on the right when checked
      }
      return n;
    });
  };
  const selectableLeads = displayLeads.filter(l => !isAudited(l.id));
  const selectableIds = new Set(selectableLeads.map(l => l.id));
  const selectedSelectableCount = [...selectedIds].filter(id => selectableIds.has(id)).length;
  const allSelected = selectableLeads.length > 0 && selectedSelectableCount === selectableLeads.length;
  const someSelected = selectedSelectableCount > 0 && !allSelected;

  const toggleSelectAll = () => {
    setSelectedIds(prev => {
      const selectableIds = displayLeads.filter(l => !isAudited(l.id)).map(l => l.id);
      if (selectableIds.length === 0) return prev;

      // Check against `prev`, not against a render-time variable —
      // this is guaranteed to reflect the latest state, even if other
      // effects (audit completion, filter changes, etc.) touched
      // selectedIds in between renders.
      const allCurrentlySelected = selectableIds.every(id => prev.has(id));

      const next = new Set(prev);
      if (allCurrentlySelected) {
        selectableIds.forEach(id => next.delete(id));
      } else {
        selectableIds.forEach(id => next.add(id));
      }
      return next;
    });
  };
  const clearSelection = () => setSelectedIds(new Set());

  useEffect(() => {
    if (selectedLeadId && !myLeads.find(l => l.id === selectedLeadId)) setSelectedLeadId(null);
  }, [myLeads]);
  useEffect(() => { detailScrollRef.current?.scrollTo({ top: 0 }); }, [selectedLeadId]);

  // ── Pull dashboard stats
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
    setIsLoadingLeads(true); setLeadsError(null);
    try { const res = await getMyLeads(filters); setMyLeads(res.data); setPagination(res.pagination); }
    catch (e: any) { setLeadsError(e.response?.data?.error || 'Failed to load leads'); }
    finally { setIsLoadingLeads(false); }
  }, [filters]);

  useEffect(() => { getMyLeadsMeta().then(m => { setNicheOptions(m.niches); setCityOptions(m.cities); }).catch(() => { }); }, []);
  useEffect(() => { if (activeTab === 'leads') fetchLeads(); }, [activeTab, fetchLeads]);
  // Only refetch when a bulk-audit batch actually FINISHES (true -> false),
  // never when it starts. Refetching on start caused isLoadingLeads to flash
  // true->false almost instantly (since that fetch has nothing to wait on),
  // which made the UI look like the audit had already stopped while the
  // real per-lead loop was still running in the background.
  const prevBulkAuditingRef = useRef(false);
  useEffect(() => {
    if (prevBulkAuditingRef.current && !isBulkAuditing) {
      fetchLeads();
      setAuditingIds(new Set());
    }
    prevBulkAuditingRef.current = isBulkAuditing;
  }, [isBulkAuditing, fetchLeads]);
  useEffect(() => { if (selectedLead && !myLeads.find(l => l.id === selectedLead.id)) setSelectedLead(null); }, [myLeads]);
  useEffect(() => { detailScrollRef.current?.scrollTo({ top: 0 }); }, [selectedLead?.id]);
  // Drop any selection that becomes audited mid-flight (e.g. batch finished while user still had it checked)
  useEffect(() => {
    setSelectedIds(prev => {
      let changed = false;
      const next = new Set(prev);
      prev.forEach(id => { if (isAudited(id)) { next.delete(id); changed = true; } });
      return changed ? next : prev;
    });
  }, [auditedLeads, isAudited]);

  const updateFilter = (key: keyof LeadFilters, value: any) =>
    setFilters(prev => ({ ...prev, [key]: value, ...(key !== 'page' ? { page: 1 } : {}) }));
  const clearFilters = () => setFilters({ page: 1, per_page: 10, sort_by: 'created_at', order: 'desc' });

  const hasActiveFilters = !!(filters.niche || filters.city || filters.status);
  const activeFilterCount = [filters.niche, filters.city, filters.status].filter(Boolean).length;

  const handleNewHunt = () => {
    if (isTrialExpired && !currentUser?.is_admin) return;
    setNiche(''); setCity(''); setServiceOffered(''); setIdealCompanyType('');
    setLeads([]); setNicheIntel(null); onNavigate('/setup');
  };

  // Shorthand aliases into API response
  const pq = stats?.plan_quota;
  const u = stats?.usage;
  const features = pq?.features;

  const nicheOpts = [{ label: 'All Niches', value: '' }, ...nicheOptions.map(n => ({ label: n, value: n }))];
  const cityOpts = [{ label: 'All Cities', value: '' }, ...cityOptions.map(c => ({ label: c, value: c }))];
  const statusOpts = [{ label: 'All Statuses', value: '' }, ...Object.keys(STATUS_CFG).map(k => ({ label: k[0].toUpperCase() + k.slice(1), value: k }))];

  return (
    <div className="max-w-[1400px] w-full py-6 md:py-10 animate-in fade-in duration-500">

      {showExport && (
        <DashboardExportModal onClose={() => setShowExport(false)}
          activeNiche={filters.niche || ''} activeCity={filters.city || ''} activeStatus={filters.status || ''}
          totalCount={pagination?.total_count ?? 0} nicheOptions={nicheOptions} cityOptions={cityOptions}
          allowedFormats={(pq?.export_formats ?? []) as string[]} />
      )}

      {planInfo && !currentUser?.is_admin && <TrialBanner planInfo={planInfo} onUpgrade={() => onNavigate('/pricing')} />}

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-[var(--color-surface)] border border-[var(--color-line)] rounded-3xl p-5 flex flex-wrap items-center justify-between gap-4 mb-6 shadow-sm">
        <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-[#a78bfa] via-[#7c3aed] to-[#6d28d9]" />
        <div>
          <h2 className="visionary-text normal-case text-2xl">Welcome back, {currentUser?.username}</h2>
          <p className="text-xs text-[var(--color-muted)] mt-0.5">{currentUser?.email}</p>
        </div>
        <div className="flex items-center gap-3">
          <PlanBadge plan={stats?.user.plan ?? currentUser?.plan_info?.plan ?? 'free'} />
          <button onClick={handleNewHunt}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#7c3aed] text-white text-xs font-black uppercase tracking-widest hover:bg-[#6d28d9] hover:-translate-y-0.5 hover:shadow-md hover:shadow-[#7c3aed]/30 transition-all duration-200">
            <MagnifyingGlassIcon className="w-3.5 h-3.5" /> New Hunt
          </button>
          <button onClick={() => onNavigate('/pricing')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[var(--color-line)] text-[var(--color-ink-soft)] text-xs font-black uppercase tracking-widest hover:border-[#7c3aed]/40 hover:text-[#7c3aed] hover:-translate-y-0.5 transition-all duration-200">
            Upgrade
          </button>
        </div>
      </div>

      {/* ── TABS ───────────────────────────────────────────────────────────── */}
      <div className="flex border-b border-[var(--color-line)] mb-8">
        {([
          { key: 'overview', label: 'Overview' },
          { key: 'leads', label: `My Leads${pagination ? ` (${pagination.total_count})` : ''}` },
        ] as { key: DashTab; label: string }[]).map(tab => (
          <button key={tab.key} type="button" onClick={() => setActiveTab(tab.key)}
            className={`px-6 py-4 text-[10px] font-black uppercase tracking-widest transition-all relative
              ${activeTab === tab.key ? 'text-[#7c3aed]' : 'text-[var(--color-faint)] hover:text-[var(--color-muted)]'}`}>
            {tab.label}
            {activeTab === tab.key && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#7c3aed] origin-left animate-in" style={{ animation: 'tabIn 0.25s ease-out' }} />}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          OVERVIEW TAB
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {isLoadingStats ? (
            <div className="flex items-center justify-center py-20">
              <ArrowPathIcon className="w-6 h-6 text-[var(--color-muted)] animate-spin" />
            </div>
          ) : (
            <>
              {/* ── Hero Row: Plan card (tall) + ring stats + wave trend ──── */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 items-stretch">
                {/* Plan summary — layered purple gradient with sheen, like a hero panel. Spans full height of the row. */}
                <div className="lg:row-span-2 group relative overflow-hidden rounded-2xl p-5 flex flex-col justify-between gap-4 min-h-[320px] transition-all duration-300 hover:-translate-y-1"
                  style={{
                    background: 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 35%, #7c3aed 70%, #6d28d9 100%)',
                    boxShadow: '0 1px 2px rgba(28,26,22,0.06), 0 12px 28px -10px rgba(124,58,237,0.35)',
                  }}>
                  {/* Sheen overlay — curved highlight for depth, shifts subtly on hover like catching light */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none transition-transform duration-500 group-hover:scale-105 group-hover:rotate-1" viewBox="0 0 300 320" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="sheen" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.35" />
                        <stop offset="45%" stopColor="#ffffff" stopOpacity="0.08" />
                        <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path d="M -20 90 Q 90 0 200 80 T 340 50 L 340 -20 L -20 -20 Z" fill="url(#sheen)" />
                    <ellipse cx="240" cy="280" rx="160" ry="100" fill="#ffffff" opacity="0.06" />
                  </svg>

                  <div className="relative z-10">
                    <p className="text-[9px] font-black text-white/75 uppercase tracking-widest mb-1">Current Plan</p>
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="visionary-text normal-case text-3xl text-white drop-shadow-sm">{stats?.user.plan ?? 'Free'}</h3>
                      <span className="px-2.5 py-1 rounded-full border border-white/40 bg-white/15 text-white text-[9px] font-black uppercase tracking-widest backdrop-blur-sm">
                        {stats?.user.plan ?? 'free'}
                      </span>
                    </div>
                    <p className="text-[11px] text-white/85 leading-relaxed">
                      {pq?.leads_per_search} leads/search · {pq?.searches_month_limit ?? '∞'} searches/month
                    </p>
                    {pq?.monthly_resets_at && (
                      <p className="text-[10px] text-white/70 mt-1 flex items-center gap-1">
                        <CalendarDaysIcon className="w-3 h-3" />
                        Resets {new Date(pq.monthly_resets_at).toLocaleDateString()}
                      </p>
                    )}

                    {/* Plan feature pills moved into the hero so this card carries more weight, like the workout card's program info */}
                    <div className="mt-5 pt-4 border-t border-white/20">
                      <p className="text-[9px] font-black text-white/70 uppercase tracking-widest mb-2.5">Includes</p>
                      <div className="flex flex-wrap gap-2">
                        {features && Object.entries(features).filter(([, on]) => on).slice(0, 4).map(([k]) => (
                          <span key={k} className="px-2.5 py-1 rounded-full bg-white/15 border border-white/30 text-white text-[9px] font-black uppercase tracking-widest backdrop-blur-sm">
                            {k.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <button onClick={() => onNavigate('/pricing')}
                    className="relative z-10 w-full py-2.5 rounded-xl bg-white text-[#6d28d9] text-[10px] font-black uppercase tracking-widest hover:bg-white/90 transition-all shadow-sm">
                    {isTrialExpired ? 'Upgrade Now' : 'View Plans'}
                  </button>
                </div>

                {/* Ring stats — signature repeated motif, 2 across */}
                <BigRingCard
                  pctValue={stats?.stats.avg_score ?? 0}
                  label="Avg Score" sub="Quality across all leads"
                  ringColor="#8b5cf6" bg="bg-[#f2edfc]" border="border-[#7c3aed]/20"
                  icon={ChartBarIcon}
                />
                <BigRingCard
                  pctValue={stats?.stats.total_leads ? Math.round(((stats?.stats.high_quality ?? 0) / stats.stats.total_leads) * 100) : 0}
                  label="High Quality Rate" sub={`${fmt(stats?.stats.high_quality)} leads scoring 70+`}
                  ringColor="#6d28d9" bg="bg-[#efe9fb]" border="border-[#6d28d9]/20"
                  icon={SparklesIcon}
                />

                {/* Wave card — score trend across recent leads, line-illustration style */}
                <WaveCard
                  points={
                    (stats?.recent_leads?.length ?? 0) > 1
                      ? [...(stats!.recent_leads.map(l => l.score))].reverse()
                      : [stats?.stats.avg_score ?? 0, stats?.stats.avg_score ?? 0]
                  }
                  value={fmt(stats?.stats.total_leads)} valueLabel="leads"
                  label="Lead Score Trend" sub={`${fmt(stats?.stats.leads_today)} today · ${fmt(stats?.stats.leads_this_month)} this month`}
                  strokeColor="#7c3aed" fillColor="#7c3aed"
                  bg="bg-[#f2edfc]" border="border-[#7c3aed]/20"
                />
              </div>

              {/* ── Quota row: searches + deep audits, plus With Email tile for variety ── */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Searches quota */}
                <QuotaCard
                  icon={MagnifyingGlassIcon}
                  title="Searches"
                  accentColor="bg-[#f2edfc] text-[#7c3aed]"
                  ringColor="text-[#7c3aed]"
                  barColor="bg-[#7c3aed]"
                  todayUsed={pq?.searches_today ?? 0}
                  todayLimit={pq?.searches_today_limit ?? null}
                  monthUsed={pq?.searches_this_month ?? 0}
                  monthLimit={pq?.searches_month_limit ?? null}
                  extra={
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-[9px] text-[var(--color-muted)] uppercase tracking-widest mb-0.5">Today left</p>
                        <p className="text-[13px] font-black text-[var(--color-ink)]">{pq?.searches_today_remaining ?? '∞'}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-[var(--color-muted)] uppercase tracking-widest mb-0.5">Month left</p>
                        <p className="text-[13px] font-black text-[var(--color-ink)]">
                          {pq?.searches_month_remaining !== null && pq?.searches_month_remaining !== undefined ? pq.searches_month_remaining : '∞'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] text-[var(--color-muted)] uppercase tracking-widest mb-0.5">Lifetime</p>
                        <p className="text-[13px] font-black text-[var(--color-ink)]">{fmt(u?.searches.lifetime.used)}</p>
                      </div>
                    </div>
                  }
                />

                {/* Deep Audit quota */}
                <QuotaCard
                  icon={FingerPrintIcon}
                  title="Deep Audits"
                  accentColor="bg-[#efe9f4] text-[#8a6fa8]"
                  ringColor="text-[#8a6fa8]"
                  barColor="bg-[#8a6fa8]"
                  locked={!features?.deep_audit}
                  todayUsed={pq?.deep_audits_today ?? 0}
                  todayLimit={pq?.deep_audits_today_limit ?? null}
                  monthUsed={pq?.deep_audits_this_month ?? 0}
                  monthLimit={pq?.deep_audit_credits_limit ?? null}
                  monthLabel="Credits used"
                  extra={
                    <div className="grid grid-cols-2 gap-2 text-center">
                      <div>
                        <p className="text-[9px] text-[var(--color-muted)] uppercase tracking-widest mb-0.5">Credits left</p>
                        <p className="text-[13px] font-black text-[var(--color-ink)]">
                          {pq?.deep_audit_credits_remaining !== null && pq?.deep_audit_credits_remaining !== undefined
                            ? pq.deep_audit_credits_remaining : '∞'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] text-[var(--color-muted)] uppercase tracking-widest mb-0.5">Today left</p>
                        <p className="text-[13px] font-black text-[var(--color-ink)]">
                          {pq?.deep_audits_today_remaining !== null && pq?.deep_audits_today_remaining !== undefined
                            ? pq.deep_audits_today_remaining : '∞'}
                        </p>
                      </div>
                    </div>
                  }
                />

                {/* Total leads + with-email tile, kept as a compact stat for grid balance */}
                <div className="grid grid-rows-2 gap-3">
                  <StatTile label="Total Leads" value={fmt(stats?.stats.total_leads)} sub={`${fmt(stats?.stats.leads_today)} today`}
                    tint={{ bg: 'bg-[var(--color-surface)]', border: 'border-[var(--color-line)]', bar: 'bg-[#7c3aed]' }} />
                  <StatTile label="With Email" value={fmt(stats?.stats.leads_with_email)} sub={`${fmt(stats?.stats.leads_with_phone)} with phone`} color="text-[#3f8ea0]"
                    tint={{ bg: 'bg-[#e3eef0]', border: 'border-[#3f8ea0]/20', bar: 'bg-[#3f8ea0]' }} />
                </div>
              </div>

              {/* ── Features card — standalone row now that hero card carries the top feature pills ── */}
              <div className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-2xl p-5 transition-all duration-300 hover:shadow-lg hover:shadow-[#7c3aed]/[0.06]">
                <p className="eyebrow mb-4">Plan Features</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-3 mb-5">
                  {features && <PlanFeatures features={features} />}
                </div>
                <div className="pt-4 border-t border-[var(--color-line)]">
                  <p className="eyebrow mb-2">Export Formats</p>
                  {(pq?.export_formats?.length ?? 0) > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {pq!.export_formats.map(f => (
                        <span key={f} className="px-2 py-0.5 rounded-full border border-[#7c3aed]/30 bg-[#f2edfc] text-[#7c3aed] text-[9px] font-black uppercase tracking-widest transition-transform duration-200 hover:scale-105 hover:-translate-y-0.5 cursor-default inline-block">{f}</span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[10px] text-[var(--color-faint)] italic">No export on this plan</span>
                  )}
                </div>
              </div>

              {/* ── Row 4: Pipeline + Recent + Niches/Cities ─────────────── */}
              <div className="grid grid-cols-12 gap-4">
                {/* Recent Leads */}
                <div className="col-span-12 lg:col-span-7 bg-[var(--color-surface)] border border-[var(--color-line)] rounded-3xl overflow-hidden transition-shadow duration-300 hover:shadow-lg hover:shadow-[#7c3aed]/[0.06]">
                  <div className="p-5 border-b border-[var(--color-line)] flex items-center justify-between">
                    <h3 className="text-[var(--color-ink)] font-bold text-sm">Recent Leads</h3>
                    <button type="button" onClick={() => setActiveTab('leads')}
                      className="text-[10px] font-black text-[#7c3aed] uppercase tracking-widest hover:text-[var(--color-ink)] transition-all">View All →</button>
                  </div>
                  <div className="divide-y divide-[var(--color-line)]">
                    {!stats?.recent_leads.length ? (
                      <div className="p-12 text-center text-[var(--color-faint)] text-sm italic">No leads yet — launch a hunt</div>
                    ) : stats.recent_leads.map(lead => (
                      <div key={lead.id} className="group px-5 py-3.5 flex items-center justify-between hover:bg-[var(--color-surface-sunk)]/50 transition-all duration-200 hover:px-6 border-l-2 border-l-transparent hover:border-l-[#7c3aed] cursor-default">
                        <div className="flex-1 min-w-0">
                          <p className="text-[var(--color-ink)] font-bold text-sm truncate">{lead.name}</p>
                          <p className="text-[10px] text-[var(--color-muted)] truncate">{lead.niche} · {lead.city}</p>
                        </div>
                        <div className="flex items-center gap-3 ml-4 shrink-0">
                          <StatusBadge status={lead.status ?? 'new'} />
                          <span className={`text-[10px] font-black transition-transform duration-200 group-hover:scale-110 inline-block ${lead.score >= 70 ? 'text-[var(--color-accent)]' : 'text-[#7c3aed]'}`}>{lead.score}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right column: pipeline + niches + cities */}
                <div className="col-span-12 lg:col-span-5 space-y-4">
                  {/* Pipeline */}
                  <div className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-2xl p-5 transition-shadow duration-300 hover:shadow-lg hover:shadow-[#7c3aed]/[0.06]">
                    <h3 className="text-[var(--color-ink)] font-bold text-sm mb-4">Pipeline</h3>
                    <div className="space-y-2.5">
                      {[
                        { label: 'New', val: stats?.stats.status_breakdown?.new ?? 0, color: 'bg-[#7c3aed]' },
                        { label: 'Contacted', val: stats?.stats.status_breakdown?.contacted ?? 0, color: 'bg-[var(--color-gold)]' },
                        { label: 'Replied', val: stats?.stats.status_breakdown?.replied ?? 0, color: 'bg-[#3f8ea0]' },
                        { label: 'Qualified', val: stats?.stats.status_breakdown?.qualified ?? 0, color: 'bg-[var(--color-accent)]' },
                        { label: 'Rejected', val: stats?.stats.status_breakdown?.rejected ?? 0, color: 'bg-[var(--color-rose)]' },
                      ].map(row => {
                        const p = Math.round((row.val / (stats?.stats.total_leads || 1)) * 100);
                        return (
                          <div key={row.label} className="group">
                            <div className="flex justify-between text-[10px] font-bold mb-1">
                              <span className="text-[var(--color-muted)] uppercase tracking-widest group-hover:text-[var(--color-ink-soft)] transition-colors">{row.label}</span>
                              <span className="text-[var(--color-ink)] transition-transform duration-200 group-hover:scale-110 inline-block">{row.val}</span>
                            </div>
                            <div className="h-1 bg-[var(--color-surface-sunk)] rounded-full overflow-hidden">
                              <div className={`h-full ${row.color} rounded-full transition-all duration-700 group-hover:h-1.5 group-hover:-mt-px`} style={{ width: `${p}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Top Niches + Cities in 2-col mini list */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-2xl p-4 transition-shadow duration-300 hover:shadow-lg hover:shadow-[#7c3aed]/[0.06]">
                      <p className="eyebrow mb-3">Top Niches</p>
                      <div className="space-y-1">
                        {!stats?.top_niches.length ? <p className="text-[var(--color-faint)] text-[10px] italic">None yet</p>
                          : stats.top_niches.slice(0, 4).map((n, i) => (
                            <div key={n.niche} className="flex items-center justify-between gap-2 px-1.5 py-1 rounded-lg hover:bg-[#f2edfc] transition-colors -mx-1.5">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-[9px] font-black text-[var(--color-faint)] w-3 shrink-0">{i + 1}</span>
                                <span className="text-[10px] text-[var(--color-ink-soft)] truncate">{n.niche}</span>
                              </div>
                              <span className="text-[10px] font-black text-[#7c3aed] shrink-0">{n.count}</span>
                            </div>
                          ))}
                      </div>
                    </div>
                    <div className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-2xl p-4 transition-shadow duration-300 hover:shadow-lg hover:shadow-[#7c3aed]/[0.06]">
                      <p className="eyebrow mb-3">Top Cities</p>
                      <div className="space-y-1">
                        {!stats?.top_cities.length ? <p className="text-[var(--color-faint)] text-[10px] italic">None yet</p>
                          : stats.top_cities.slice(0, 4).map((c, i) => (
                            <div key={c.city} className="flex items-center justify-between gap-2 px-1.5 py-1 rounded-lg hover:bg-[#e3eef0] transition-colors -mx-1.5">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-[9px] font-black text-[var(--color-faint)] w-3 shrink-0">{i + 1}</span>
                                <span className="text-[10px] text-[var(--color-ink-soft)] truncate">{c.city}</span>
                              </div>
                              <span className="text-[10px] font-black text-[#3f8ea0] shrink-0">{c.count}</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MY LEADS TAB
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'leads' && (
        <div className="space-y-4">
          {/* Persistent Deep Audit progress banner — stays visible for the
              entire batch, independent of the leads table's own loading
              state, so it never looks like the audit "stopped" mid-run. */}
          {isBulkAuditing && (
            <div className="flex items-center gap-4 p-4 bg-[#f2edfc] border border-[#7c3aed]/30 rounded-2xl">
              <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shrink-0 border border-[#7c3aed]/20">
                <ArrowPathIcon className="w-4 h-4 text-[#7c3aed] animate-spin" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-[#7c3aed] font-black text-[11px] uppercase tracking-widest">
                    Deep Audit running — {bulkAuditProgress.done} of {bulkAuditProgress.total} leads
                  </p>
                  <span className="text-[9px] font-black text-[#7c3aed]/70 uppercase tracking-widest shrink-0 ml-3">
                    {bulkAuditProgress.total > 0 ? Math.round((bulkAuditProgress.done / bulkAuditProgress.total) * 100) : 0}%
                  </span>
                </div>
                <div className="h-1.5 bg-white rounded-full overflow-hidden border border-[#7c3aed]/15">
                  <div className="h-full bg-[#7c3aed] rounded-full transition-all duration-500"
                    style={{ width: `${bulkAuditProgress.total > 0 ? (bulkAuditProgress.done / bulkAuditProgress.total) * 100 : 0}%` }} />
                </div>
              </div>
            </div>
          )}

          {/* Filter bar */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 text-[9px] font-black text-[var(--color-faint)] uppercase tracking-[0.2em] mr-1">
                <FunnelIcon className="w-3.5 h-3.5" />
                <span>Filter</span>
                {activeFilterCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-[#7c3aed] text-white text-[8px] font-black flex items-center justify-center">{activeFilterCount}</span>
                )}
              </div>
              <FilterSelect value={filters.niche || ''} onChange={v => updateFilter('niche', v)} options={nicheOpts} placeholder="Niche" accentColor="purple" icon={<QueueListIcon className="w-3.5 h-3.5" />} />
              <FilterSelect value={filters.city || ''} onChange={v => updateFilter('city', v)} options={cityOpts} placeholder="City" accentColor="cyan" icon={<GlobeAltIcon className="w-3.5 h-3.5" />} />
              <FilterSelect value={filters.status || ''} onChange={v => updateFilter('status', v)} options={statusOpts} placeholder="Status" accentColor="amber" icon={<BoltIcon className="w-3.5 h-3.5" />} />
              <div className="w-px h-5 bg-[var(--color-line-strong)] mx-1" />
              <PerPageToggle value={filters.per_page || 10} onChange={v => updateFilter('per_page', v)} />
              <SortToggle sortBy={filters.sort_by || 'created_at'} order={filters.order || 'desc'} onChange={(s, o) => setFilters(prev => ({ ...prev, sort_by: s as any, order: o as any, page: 1 }))} />
              <button type="button" onClick={() => setShowExport(true)}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-[#f2edfc] border border-[#7c3aed]/25 text-[#7c3aed] text-[10px] font-black uppercase tracking-widest hover:bg-[#7c3aed]/15 transition-all">
                <CloudArrowDownIcon className="w-3.5 h-3.5" /><span className="hidden sm:inline">Export CRM</span>
              </button>
            </div>
            {hasActiveFilters && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-[9px] font-black text-[var(--color-faint)] uppercase tracking-widest">Active:</span>
                {filters.niche && <FilterPill label="Niche" value={filters.niche} color="text-[#7c3aed]   bg-[#f2edfc]   border border-[#7c3aed]/25" onRemove={() => updateFilter('niche', '')} />}
                {filters.city && <FilterPill label="City" value={filters.city} color="text-[#3f8ea0]   bg-[#e3eef0]   border border-[#3f8ea0]/30" onRemove={() => updateFilter('city', '')} />}
                {filters.status && <FilterPill label="Status" value={filters.status} color="text-[var(--color-gold)]  bg-[var(--color-gold-soft)]  border border-[var(--color-gold)]/30" onRemove={() => updateFilter('status', '')} />}
                <button type="button" onClick={clearFilters} className="ml-1 text-[9px] font-black text-[var(--color-faint)] uppercase tracking-widest hover:text-[var(--color-rose)] transition-colors flex items-center gap-1">
                  <XMarkIcon className="w-3 h-3" /> Clear all
                </button>
              </div>
            )}
          </div>

          {/* Bulk audit banner */}
          {displayLeads.length > 0 && (() => {
            const needsAudit = displayLeads.filter(l => !isAudited(l.id) && (!l.email || !(l as any).verification?.overall || (l as any).verification?.overall === 'failed')).length;
            return needsAudit > 0 ? (
              <div className="flex items-center justify-between p-4 bg-[#f2edfc] border border-[#7c3aed]/25 rounded-2xl">
                <div className="flex items-center gap-3">
                  <FingerPrintIcon className="w-4 h-4 text-[#7c3aed]" />
                  <div>
                    <p className="text-[var(--color-ink)] font-bold text-sm">{needsAudit} lead{needsAudit === 1 ? '' : 's'} need deep audit</p>
                    <p className="text-[var(--color-muted)] text-[10px]">No email or unverified — audit searches the web for contact info</p>
                  </div>
                </div>
                {/* <button type="button" onClick={() => onBulkAudit()} disabled={isBulkAuditing}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#7c3aed] text-white text-[10px] font-black uppercase tracking-widest hover:bg-[#6d28d9] transition-all disabled:opacity-40 shrink-0">
                  {isBulkAuditing ? <><ArrowPathIcon className="w-4 h-4 animate-spin" />{bulkAuditProgress.done}/{bulkAuditProgress.total} auditing…</> : <><FingerPrintIcon className="w-4 h-4" />Bulk Audit ({needsAudit})</>}
                </button> */}
              </div>
            ) : null;
          })()}

          {/* Selection bar */}
          {selectedIds.size > 0 && (
            <div className="flex items-center justify-between gap-3 px-4 py-3 bg-[#f2edfc] border border-[#7c3aed]/25 rounded-xl">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black text-[#7c3aed] uppercase tracking-widest">{selectedIds.size} selected</span>
                <button type="button" onClick={clearSelection} className="text-[9px] text-[var(--color-muted)] hover:text-[var(--color-ink)] transition-colors uppercase tracking-widest">Clear</button>
              </div>
              <button type="button" onClick={() => {
                const ids = new Set(selectedIds);
                setAuditingIds(ids);
                onBulkAudit(displayLeads.filter(l => selectedIds.has(l.id)) as any);
                clearSelection();
              }} disabled={isBulkAuditing}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#7c3aed] text-white text-[10px] font-black uppercase tracking-widest hover:bg-[#6d28d9] transition-all disabled:opacity-40">
                {isBulkAuditing ? <><ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />{bulkAuditProgress.done}/{bulkAuditProgress.total}</> : <><FingerPrintIcon className="w-3.5 h-3.5" />Deep Audit Selected</>}
              </button>
            </div>
          )}

          {/* Split panel */}
          <div className="flex rounded-2xl border border-[var(--color-line)] overflow-hidden min-h-[300px]">
            <div className="flex flex-col bg-[var(--color-surface)] transition-all duration-300" style={{ width: panelOpen ? 'min(55%, 100%)' : '100%' }}>
              {/* Table header */}
              {!isLoadingLeads && displayLeads.length > 0 && (
                <div className={`grid px-4 py-3 border-b border-[var(--color-line)] bg-[var(--color-surface-sunk)]/60 text-[9px] font-black text-[var(--color-faint)] uppercase tracking-widest gap-3
                  ${panelOpen ? 'grid-cols-[auto_1fr_auto]' : 'grid-cols-[auto_4fr_2fr_2fr_2fr_1fr_1fr]'}`}>
                  <div className="flex items-center">
                    <button type="button" onClick={toggleSelectAll} disabled={selectableLeads.length === 0}
                      className={`w-4 h-4 rounded border flex items-center justify-center transition-all disabled:opacity-30
    ${allSelected ? 'bg-[#7c3aed] border-[#7c3aed]' : 'border-[var(--color-line-strong)] hover:border-[var(--color-muted)]'}`}>
                      {allSelected && <CheckCircleIcon className="w-3 h-3 text-white" />}
                      {someSelected && <div className="w-2 h-0.5 bg-[#7c3aed]" />}
                    </button>
                  </div>
                  {panelOpen ? (
                    <><span>Company</span><span className="text-right">Status</span></>
                  ) : (
                    <><span>Company</span><span className="hidden md:block">Niche / City</span><span className="hidden lg:block">Contact</span><span>Status</span><span className="text-right">Score</span><span className="text-right hidden sm:block">Date</span></>
                  )}
                </div>
              )}

              {isLoadingLeads && <div className="flex items-center justify-center py-16 flex-1"><ArrowPathIcon className="w-6 h-6 text-[var(--color-muted)] animate-spin" /></div>}
              {leadsError && !isLoadingLeads && <div className="p-8 text-center text-[var(--color-rose)] text-sm flex-1">{leadsError}</div>}
              {!isLoadingLeads && !leadsError && displayLeads.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 flex-1">
                  <MagnifyingGlassIcon className="w-10 h-10 text-[var(--color-line-strong)] mb-4" />
                  <p className="text-[var(--color-faint)] text-[10px] font-black uppercase tracking-widest">{hasActiveFilters ? 'No leads match your filters' : 'No leads yet — launch a hunt'}</p>
                </div>
              )}

              {!isLoadingLeads && !leadsError && displayLeads.map(lead => {
                const isSelected = selectedLead?.id === lead.id;
                const audited = isAudited(lead.id) || lead.deep_audit_ran;
                return (
                  <div key={lead.id} onClick={() => setSelectedLeadId(prev => prev === lead.id ? null : lead.id)}
                    className={`group border-b border-[var(--color-line)] last:border-b-0 cursor-pointer select-none transition-all duration-200
                      ${isSelected ? 'bg-[#f2edfc] border-l-2 border-l-[#7c3aed]' : 'border-l-2 border-l-transparent hover:bg-[var(--color-surface-sunk)]/50 hover:border-l-[var(--color-line-strong)]'}`}>
                    {panelOpen ? (
                      <div className="flex items-center gap-2 px-4 py-3.5">
                        {audited ? (
                          <div className="w-4 h-4 rounded border border-[#7c3aed]/40 bg-[#f2edfc] flex items-center justify-center shrink-0" title="Already audited">
                            <FingerPrintIcon className="w-2.5 h-2.5 text-[#7c3aed]" />
                          </div>
                        ) : (
                          <button type="button" onClick={e => { e.stopPropagation(); toggleSelect(lead.id, lead); }}
                            className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all ${selectedIds.has(lead.id) ? 'bg-[#7c3aed] border-[#7c3aed]' : 'border-[var(--color-line-strong)] hover:border-[var(--color-muted)]'}`}>
                            {selectedIds.has(lead.id) && <CheckCircleIcon className="w-3 h-3 text-white" />}
                          </button>
                        )}
                        <div className="flex items-center justify-between gap-3 flex-1 min-w-0">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <div className={`w-1.5 h-8 rounded-full shrink-0 transition-colors duration-200 ${isSelected ? 'bg-[#7c3aed]' : 'bg-transparent'}`} />
                            <div className="min-w-0"><p className="text-[var(--color-ink)] font-bold text-[12px] truncate">{lead.name}</p><p className="text-[10px] text-[var(--color-muted)] mt-0.5 truncate">{lead.city}</p></div>
                          </div>
                          <div className="shrink-0 flex items-center gap-2">
                            {audited && <AuditedBadge />}
                            <span className={`text-[10px] font-black transition-transform duration-200 group-hover:scale-110 inline-block ${lead.score >= 70 ? 'text-[var(--color-accent)]' : lead.score >= 40 ? 'text-[#7c3aed]' : 'text-[var(--color-faint)]'}`}>{lead.score}%</span>
                            <StatusBadge status={lead.status} />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-12 gap-3 px-4 py-4 items-center">
                        <div className="col-span-4 min-w-0 flex items-center gap-2">
                          {audited ? (
                            <div className="w-4 h-4 rounded border border-[#7c3aed]/40 bg-[#f2edfc] flex items-center justify-center shrink-0" title="Already audited">
                              <FingerPrintIcon className="w-2.5 h-2.5 text-[#7c3aed]" />
                            </div>
                          ) : (
                            <button type="button" onClick={e => { e.stopPropagation(); toggleSelect(lead.id, lead); }}
                              className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all ${selectedIds.has(lead.id) ? 'bg-[#7c3aed] border-[#7c3aed]' : 'border-[var(--color-line-strong)] hover:border-[var(--color-muted)]'}`}>
                              {selectedIds.has(lead.id) && <CheckCircleIcon className="w-3 h-3 text-white" />}
                            </button>
                          )}
                          <div className="min-w-0">
                            <p className="text-[var(--color-ink)] font-bold text-sm truncate">{lead.name}</p>
                            <p className="text-[10px] text-[#7c3aed] truncate mt-0.5">{lead.website?.replace(/https?:\/\/(www\.)?/, '').replace(/\/$/, '')}</p>
                          </div>
                        </div>
                        <div className="col-span-2 hidden md:block min-w-0">
                          <p className="text-[10px] text-[var(--color-ink-soft)] font-bold truncate">{lead.niche}</p>
                          <p className="text-[10px] text-[var(--color-muted)] truncate">{lead.city}</p>
                        </div>
                        <div className="col-span-2 hidden lg:flex flex-col gap-1 min-w-0">
                          {lead.email ? <div className="flex items-center gap-1.5 text-[10px] text-[var(--color-ink-soft)] truncate"><EnvelopeIcon className="w-3 h-3 text-[var(--color-muted)] shrink-0" /><span className="truncate">{lead.email}</span></div> : null}
                          {lead.phone_number ? <div className="flex items-center gap-1.5 text-[10px] text-[var(--color-ink-soft)]"><PhoneIcon className="w-3 h-3 text-[var(--color-muted)] shrink-0" /><span>{lead.phone_number}</span></div> : null}
                          {!lead.email && !lead.phone_number && <span className="text-[10px] text-[var(--color-faint)] italic">No contact</span>}
                        </div>
                        <div className="col-span-2 flex items-center gap-1.5 flex-wrap">
                          <StatusBadge status={lead.status} />
                          {audited && <AuditedBadge />}
                        </div>
                        <div className="col-span-1 text-right">
                          <span className={`text-[10px] font-black ${lead.score >= 70 ? 'text-[var(--color-accent)]' : lead.score >= 40 ? 'text-[#7c3aed]' : 'text-[var(--color-faint)]'}`}>{lead.score}%</span>
                        </div>
                        <div className="col-span-1 text-right hidden sm:block">
                          <span className="text-[9px] text-[var(--color-muted)]">{new Date(lead.acquired_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Detail panel */}
            {panelOpen && (
              <div ref={detailScrollRef} className="hidden lg:flex flex-col border-l border-[var(--color-line)] sticky top-16 self-start overflow-y-auto"
                style={{ width: '45%', maxHeight: 'calc(100vh - 80px)' }}>
                <LeadDetailPanel
                  lead={selectedLead!}
                  onClose={() => setSelectedLeadId(null)}
                  isAudited={isAudited(selectedLead!.id)}
                  isAuditing={isBulkAuditing && auditingIds.has(selectedLead!.id) && !isAudited(selectedLead!.id)}
                />
              </div>
            )}
          </div>

          {/* Mobile bottom sheet */}
          {panelOpen && (
            <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end">
              <div className="absolute inset-0 bg-[#1d1b17]/45 backdrop-blur-sm" onClick={() => setSelectedLeadId(null)} />
              <div className="relative bg-[var(--color-surface)] border-t border-[var(--color-line)] rounded-t-3xl flex flex-col shadow-2xl" style={{ maxHeight: '82vh', animation: 'slideUp 0.22s ease-out' }}>
                <div className="flex justify-center pt-3 pb-1 shrink-0"><div className="w-10 h-1 rounded-full bg-[var(--color-line-strong)]" /></div>
                <div className="flex-1 overflow-y-auto custom-scrollbar"><LeadDetailPanel
                  lead={selectedLead!}
                  onClose={() => setSelectedLeadId(null)}
                  isAudited={isAudited(selectedLead!.id)}
                  isAuditing={isBulkAuditing && auditingIds.has(selectedLead!.id) && !isAudited(selectedLead!.id)}
                /></div>
              </div>
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.total_pages > 1 && (
            <div className="flex items-center justify-between px-1">
              <p className="text-[10px] text-[var(--color-faint)] font-bold uppercase tracking-widest">
                {((pagination.page - 1) * pagination.per_page) + 1}–{Math.min(pagination.page * pagination.per_page, pagination.total_count)} of {pagination.total_count}
              </p>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => updateFilter('page', pagination.page - 1)} disabled={!pagination.has_prev}
                  className="p-2 bg-[var(--color-surface)] border border-[var(--color-line)] rounded-xl text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] hover:border-[var(--color-line-strong)] transition-all disabled:opacity-30">
                  <ChevronLeftIcon className="w-4 h-4" />
                </button>
                {Array.from({ length: pagination.total_pages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === pagination.total_pages || Math.abs(p - pagination.page) <= 1)
                  .reduce<(number | '...')[]>((acc, p, i, arr) => { if (i > 0 && (p as number) - (arr[i - 1] as number) > 1) acc.push('...'); acc.push(p); return acc; }, [])
                  .map((p, i) => p === '...' ? <span key={`e${i}`} className="text-[var(--color-faint)] px-1">…</span> : (
                    <button key={p} type="button" onClick={() => updateFilter('page', p)}
                      className={`w-8 h-8 rounded-xl text-[10px] font-black transition-all ${p === pagination.page ? 'bg-[#7c3aed] text-white' : 'bg-[var(--color-surface)] border border-[var(--color-line)] text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]'}`}>{p}</button>
                  ))}
                <button type="button" onClick={() => updateFilter('page', pagination.page + 1)} disabled={!pagination.has_next}
                  className="p-2 bg-[var(--color-surface)] border border-[var(--color-line)] rounded-xl text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] hover:border-[var(--color-line-strong)] transition-all disabled:opacity-30">
                  <ChevronRightIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes tabIn { from { transform: scaleX(0); opacity: 0; } to { transform: scaleX(1); opacity: 1; } }
      `}</style>
    </div>
  );
};

export default UserDashboard;