import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
    BoltIcon, SparklesIcon, ArrowPathIcon,
    BriefcaseIcon, MapPinIcon, BeakerIcon,
    BuildingOfficeIcon, QueueListIcon, ShieldCheckIcon,
    ArrowLeftIcon, ArrowRightIcon, CheckIcon,
} from '@heroicons/react/24/outline';
import { DailyLimitBanner } from './UpgradeWall';

// Definitive schema structure for the user's dynamic authorization limits
interface LimitInfo {
    plan: string;
    daily_remaining: number;
    deep_audits_remaining: number;
    max_leads_per_search: number;
}

interface MarketSetupViewProps {
    niche: string;
    setNiche: (s: string) => void;
    city: string;
    setCity: (s: string) => void;
    serviceOffered: string;
    setServiceOffered: (s: string) => void;
    idealCompanyType: string;
    setIdealCompanyType: (s: string) => void;
    runDiscovery: (count: number, useDeepAudit: boolean) => void;
    loading: boolean;
    limitInfo: LimitInfo;
    onNavigate: (path: string) => void;
}

// ═══════════════════════════════════════════════════════════════════════════
// UNDERSTANDING ENGINE — unchanged: a small, honest heuristic that reflects
// the user's own words back as structured tags + a plain-language read-out.
// ═══════════════════════════════════════════════════════════════════════════

const STOPWORDS = new Set([
    'a', 'an', 'the', 'of', 'for', 'and', 'or', 'in', 'on', 'to', 'with', 'that',
    'this', 'is', 'are', 'be', 'i', 'we', 'our', 'who', 'whose', 'who\'s', 'it',
    'its', 'at', 'by', 'as', 'from', 'into', 'than', 'then', 'have', 'has',
]);

const SCALE_WORDS = ['small', 'boutique', 'independent', 'mid-size', 'midsize', 'mid', 'large', 'enterprise', 'national', 'local', 'regional', 'family-owned', 'family owned'];
const INTENT_WORDS = ['struggling', 'looking for', 'need', 'lack', 'without', 'no ', 'outdated', 'growing', 'scaling', 'expanding', 'understaffed', 'overwhelmed'];

function extractTags(input: string, maxTags = 4): string[] {
    const clean = input.trim();
    if (!clean) return [];
    const lower = clean.toLowerCase();
    const found: string[] = [];
    for (const w of SCALE_WORDS) {
        if (lower.includes(w)) { found.push(titleCase(w)); break; }
    }
    for (const w of INTENT_WORDS) {
        if (lower.includes(w.trim())) { found.push(titleCase(w.trim())); break; }
    }
    const words = clean.split(/[\s,]+/).filter(Boolean);
    const meaningful = words.filter(w => !STOPWORDS.has(w.toLowerCase().replace(/[^\w-]/g, '')));
    const phrases: string[] = [];
    for (let i = 0; i < meaningful.length; i++) {
        if (i < meaningful.length - 1 && phrases.length < 2) {
            phrases.push(`${meaningful[i]} ${meaningful[i + 1]}`);
            i++;
        } else {
            phrases.push(meaningful[i]);
        }
    }
    for (const p of phrases) {
        const t = titleCase(p.replace(/[.,!?]+$/, ''));
        if (t && !found.includes(t) && found.length < maxTags) found.push(t);
    }
    return found.slice(0, maxTags);
}

function titleCase(s: string): string {
    return s.replace(/\b\w/g, c => c.toUpperCase());
}

function reflect(stepKey: string, value: string): string {
    const v = value.trim();
    if (!v) return '';
    switch (stepKey) {
        case 'niche':
            return `Locking in "${v}" as the target industry. Every result gets scored against this.`;
        case 'city':
            return `Search radius centers on "${v}". Results outside this area get filtered out.`;
        case 'service':
            return `Got it — leads will be scored on how well they fit a business that needs this.`;
        case 'icp':
            return `Noted. This becomes the filter for "good fit" versus "discard."`;
        default:
            return '';
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// NEURAL FIELD — the empty side margins read as a thinking mind, not static
// decoration: fixed nodes scattered through the margins, and at intervals a
// node "fires," lighting up and sending a pulse of light along connections
// to its nearest neighbors, which can in turn fire moments later — a real
// cascade, not a metaphor. Runs continuously and ambiently, independent of
// form progress.
// ─────────────────────────────────────────────────────────────────────────────

// Fixed node layout (generated once, not random per render) across a
// 0–100 coordinate space per side. Density is deliberately uneven, like a
// real network, not a grid.
const LEFT_NODES = [
    { x: 8, y: 6 }, { x: 22, y: 12 }, { x: 6, y: 22 }, { x: 30, y: 24 },
    { x: 15, y: 34 }, { x: 4, y: 44 }, { x: 26, y: 46 }, { x: 12, y: 56 },
    { x: 32, y: 60 }, { x: 8, y: 70 }, { x: 20, y: 78 }, { x: 5, y: 88 },
];
const RIGHT_NODES = [
    { x: 92, y: 8 }, { x: 76, y: 14 }, { x: 95, y: 20 }, { x: 70, y: 26 },
    { x: 86, y: 36 }, { x: 96, y: 46 }, { x: 74, y: 48 }, { x: 90, y: 58 },
    { x: 68, y: 62 }, { x: 93, y: 72 }, { x: 80, y: 80 }, { x: 96, y: 90 },
];

// Precompute each node's 2-3 nearest neighbors within the same side, so
// connections always look organic (short, locally clustered) rather than
// crossing the whole field.
function nearestNeighbors(nodes: { x: number; y: number }[], k = 2) {
    return nodes.map((n, i) => {
        const dists = nodes
            .map((m, j) => ({ j, d: i === j ? Infinity : Math.hypot(n.x - m.x, n.y - m.y) }))
            .sort((a, b) => a.d - b.d)
            .slice(0, k)
            .map(d => d.j);
        return dists;
    });
}

const LEFT_NEIGHBORS = nearestNeighbors(LEFT_NODES);
const RIGHT_NEIGHBORS = nearestNeighbors(RIGHT_NODES);

const FIELD_COLORS = ['#5b8fd9', '#8b7ce8', '#ec6f9b', '#4f6f4a', '#f5a623'];

interface FiringPulse {
    id: number;
    side: 'left' | 'right';
    from: number;
    to: number;
    color: string;
}

// One side of the field (left or right margin). Periodically picks a random
// node, "fires" it (brief bright flash), and sends a traveling pulse along a
// line to each of its nearest neighbors — which is how the cascade reads as
// connected thought rather than isolated sparks.
const NeuralSide = ({ side, nodes, neighbors }: {
    side: 'left' | 'right'; nodes: { x: number; y: number }[]; neighbors: number[][];
}) => {
    const [activeNode, setActiveNode] = useState<number | null>(null);
    const [pulses, setPulses] = useState<FiringPulse[]>([]);
    const pulseId = useRef(0);

    useEffect(() => {
        let cancelled = false;
        const fire = () => {
            if (cancelled) return;
            const i = Math.floor(Math.random() * nodes.length);
            setActiveNode(i);
            const color = FIELD_COLORS[Math.floor(Math.random() * FIELD_COLORS.length)];
            const newPulses = neighbors[i].map(j => ({
                id: pulseId.current++, side, from: i, to: j, color,
            }));
            setPulses(prev => [...prev, ...newPulses]);
            setTimeout(() => setActiveNode(curr => (curr === i ? null : curr)), 700);
            // Pulses self-remove after they finish traveling
            newPulses.forEach(p => {
                setTimeout(() => setPulses(prev => prev.filter(x => x.id !== p.id)), 1600);
            });
            // Next firing, with natural jitter so it doesn't feel metronomic
            setTimeout(fire, 900 + Math.random() * 1400);
        };
        const initial = setTimeout(fire, 400 + Math.random() * 800);
        return () => { cancelled = true; clearTimeout(initial); };
    }, [nodes, neighbors, side]);

    return (
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
            <defs>
                <filter id={`node-glow-${side}`} x="-200%" y="-200%" width="500%" height="500%">
                    <feGaussianBlur stdDeviation="1.4" result="blur" />
                    <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>

            {/* Dim base nodes */}
            {nodes.map((n, i) => (
                <circle key={i} cx={n.x} cy={n.y} r={i === activeNode ? 1.6 : 0.7}
                    fill={i === activeNode ? '#8b7ce8' : 'rgba(139,124,232,0.35)'}
                    style={{ transition: 'r 0.25s ease-out, fill 0.25s ease-out' }}
                    filter={i === activeNode ? `url(#node-glow-${side})` : undefined}
                />
            ))}

            {/* Traveling pulses: a fading line plus a bright dot moving along it */}
            {pulses.map(p => {
                const from = nodes[p.from], to = nodes[p.to];
                if (!from || !to) return null;
                return (
                    <g key={p.id}>
                        <line x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                            stroke={p.color} strokeWidth="0.3" opacity="0.45"
                            style={{ animation: 'connector-pulse 1.6s ease-out both' }} />
                        <circle r="1" fill={p.color} filter={`url(#node-glow-${side})`}>
                            <animateMotion dur="1.4s" fill="freeze"
                                path={`M ${from.x} ${from.y} L ${to.x} ${to.y}`} />
                            <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.1;0.8;1" dur="1.4s" fill="freeze" />
                        </circle>
                    </g>
                );
            })}
        </svg>
    );
};

const NeuralField = () => (
    <div className="absolute inset-0 z-0 pointer-events-none" aria-hidden="true">
        <div className="hidden md:block absolute left-0 top-0 h-full" style={{ width: '38%' }}>
            <NeuralSide side="left" nodes={LEFT_NODES} neighbors={LEFT_NEIGHBORS} />
        </div>
        <div className="hidden md:block absolute right-0 top-0 h-full" style={{ width: '38%' }}>
            <NeuralSide side="right" nodes={RIGHT_NODES} neighbors={RIGHT_NEIGHBORS} />
        </div>
    </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// KINETIC TITLE — unchanged mechanic, light ink-on-cream as before.
// ─────────────────────────────────────────────────────────────────────────────
const KineticTitle = ({ text, stepKey }: { text: string; stepKey: string }) => {
    const [shown, setShown] = useState('');
    useEffect(() => {
        setShown('');
        let i = 0;
        const id = setInterval(() => {
            i++;
            setShown(text.slice(0, i));
            if (i >= text.length) clearInterval(id);
        }, 16);
        return () => clearInterval(id);
    }, [text, stepKey]);

    return (
        <h2 className="visionary-text text-2xl md:text-3xl normal-case mb-2 leading-tight min-h-[2.2em] md:min-h-[1.3em]">
            {shown}
            {shown.length < text.length && <span className="inline-block w-[2px] h-[1.1em] bg-[var(--color-ink)] ml-0.5 align-middle animate-pulse" />}
        </h2>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// UNDERSTANDING PANEL — restored to light cream surface.
// ─────────────────────────────────────────────────────────────────────────────
const UnderstandingPanel = ({ stepKey, value }: { stepKey: string; value: string }) => {
    const [debounced, setDebounced] = useState(value);
    const [thinking, setThinking] = useState(false);

    useEffect(() => {
        setThinking(true);
        const t = setTimeout(() => { setDebounced(value); setThinking(false); }, 420);
        return () => clearTimeout(t);
    }, [value]);

    const tags = useMemo(() => extractTags(debounced), [debounced]);
    const note = useMemo(() => reflect(stepKey, debounced), [stepKey, debounced]);

    if (!value.trim()) {
        return (
            <div className="mt-5 p-4 rounded-xl bg-[var(--color-surface-sunk)] border border-[var(--color-line)] border-dashed">
                <p className="text-[11px] text-[var(--color-faint)] italic">Start typing — the engine reflects back what it hears as you go.</p>
            </div>
        );
    }

    return (
        <div className="mt-5 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-sunk)] overflow-hidden">
            <div className="px-4 pt-3.5 pb-3 border-b border-[var(--color-line)] flex items-center justify-between">
                <span className="eyebrow !text-[9px]">What the engine understood</span>
                {thinking && (
                    <span className="flex items-center gap-1">
                        {[0, 1, 2].map(i => (
                            <span key={i} className="w-1 h-1 rounded-full bg-[var(--color-muted)]" style={{ animation: `think-dot 1s ease-in-out ${i * 0.15}s infinite` }} />
                        ))}
                    </span>
                )}
            </div>
            <div className="px-4 py-3.5 space-y-3">
                <div className="flex flex-wrap gap-1.5 min-h-[26px]">
                    {tags.map((tag, i) => (
                        <span key={tag + i}
                            className="px-2.5 py-1 rounded-full bg-[var(--color-info-soft)] text-[var(--color-info)] text-[11px] font-semibold"
                            style={{ animation: `tag-pop 0.32s cubic-bezier(0.34,1.56,0.64,1) ${i * 0.06}s both` }}>
                            {tag}
                        </span>
                    ))}
                </div>
                {note && (
                    <p key={note} className="text-[12px] text-[var(--color-ink-soft)] leading-relaxed" style={{ animation: 'fade-rise 0.35s ease-out both' }}>
                        {note}
                    </p>
                )}
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// STEP SHELL — restored to light ink-on-cream chrome.
// ─────────────────────────────────────────────────────────────────────────────
const StepShell = ({
    stepKey, eyebrow, title, hint, children,
}: {
    stepKey: string; eyebrow: string; title: string; hint?: string; children: React.ReactNode;
}) => (
    <div key={stepKey} style={{ animation: 'step-enter 0.42s cubic-bezier(0.16,1,0.3,1) both' }}>
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--color-muted)] mb-2">
            {eyebrow}
        </p>
        <KineticTitle text={title} stepKey={stepKey} />
        {hint && <p className="text-[13px] text-[var(--color-muted)] mb-6 leading-relaxed">{hint}</p>}
        {!hint && <div className="mb-6" />}
        {children}
    </div>
);

const MarketSetupView: React.FC<MarketSetupViewProps> = ({
    niche, setNiche, city, setCity, serviceOffered, setServiceOffered,
    idealCompanyType, setIdealCompanyType, runDiscovery, loading, limitInfo, onNavigate
}) => {

    const maxAllowedLeads = limitInfo?.max_leads_per_search || 10;
    const initialCount = maxAllowedLeads >= 15 ? 15 : maxAllowedLeads;

    const [leadCount, setLeadCount] = useState<number>(initialCount);
    const [deepAudit, setDeepAudit] = useState<boolean>(false);
    const [step, setStep] = useState(0);
    const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
    const [launching, setLaunching] = useState(false);

    const volumeOptions = Array.from(
        new Set([Math.max(5, Math.floor(maxAllowedLeads / 3)), Math.floor(maxAllowedLeads / 2), maxAllowedLeads])
    ).filter(v => v > 0).sort((a, b) => a - b);

    const STEPS = [
        { key: 'niche', label: 'Niche' },
        { key: 'city', label: 'Location' },
        { key: 'service', label: 'Service' },
        { key: 'icp', label: 'Profile' },
        { key: 'volume', label: 'Volume' },
        { key: 'review', label: 'Launch' },
    ];

    const isStepValid = (i: number) => {
        switch (STEPS[i].key) {
            case 'niche': return !!niche;
            case 'city': return !!city;
            case 'service': return !!serviceOffered;
            case 'icp': return !!idealCompanyType;
            default: return true;
        }
    };

    const dailyBlocked = limitInfo?.daily_remaining === 0 && limitInfo?.plan === 'free';
    const canSubmit = niche && city && serviceOffered && idealCompanyType && !loading && !dailyBlocked;

    const goNext = () => { if (isStepValid(step) && step < STEPS.length - 1) setStep(s => s + 1); };
    const goBack = () => { if (step > 0) setStep(s => s - 1); };

    const handleKeyDown = (e: React.KeyboardEvent, allowEnter = true) => {
        if (e.key === 'Enter' && allowEnter && !e.shiftKey) {
            e.preventDefault();
            goNext();
        }
    };

    useEffect(() => {
        const t = setTimeout(() => inputRef.current?.focus(), 460);
        return () => clearTimeout(t);
    }, [step]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (loading || !canSubmit) return;
        setLaunching(true);
        runDiscovery(leadCount, deepAudit);
    };

    const progress = Math.round(((step + 1) / STEPS.length) * 100);

    const synthesis = useMemo(() => {
        if (!niche && !city && !serviceOffered && !idealCompanyType) return '';
        const parts: string[] = [];
        if (niche) parts.push(`hunting for ${niche.toLowerCase()} businesses`);
        if (city) parts.push(`around ${city}`);
        if (serviceOffered) parts.push(`to pitch them on ${serviceOffered.toLowerCase().replace(/\.$/, '')}`);
        if (idealCompanyType) parts.push(`prioritizing companies that look like: ${idealCompanyType.toLowerCase().replace(/\.$/, '')}`);
        return parts.join(', ') + '.';
    }, [niche, city, serviceOffered, idealCompanyType]);

    return (
        <div className="relative w-full self-stretch flex justify-center py-10 md:py-16">
            <NeuralField />

            <div className="relative max-w-xl w-full animate-in slide-in-from-bottom-8 duration-700 ease-out">

                {/* ── Header: light progress bar, as before ────────────────── */}
                <div className="mb-8 md:mb-10">
                    <div className="flex items-center justify-between mb-2.5">
                        <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-ink)]">
                            Discovery Engine
                        </span>
                        <span className="text-[10px] font-bold text-[var(--color-muted)] tabular-nums">
                            {String(step + 1).padStart(2, '0')} / {String(STEPS.length).padStart(2, '0')}
                        </span>
                    </div>
                    <div className="relative h-[3px] bg-[var(--color-surface-sunk)] rounded-full overflow-hidden">
                        <div className="absolute inset-y-0 left-0 rounded-full bg-[var(--color-ink)]"
                            style={{ width: `${progress}%`, transition: 'width 0.5s cubic-bezier(0.4,0,0.2,1)' }} />
                    </div>
                </div>

                {/* ── Form shell: back to plain light card ─────────────────── */}
                <form
                    onSubmit={handleSubmit}
                    className="relative bg-[var(--color-surface)] border border-[var(--color-line)] p-6 md:p-9 rounded-3xl overflow-hidden"
                    style={{ boxShadow: '0 1px 2px rgba(28,26,22,0.04), 0 16px 40px -16px rgba(28,26,22,0.10)' }}
                >
                    <div className="min-h-[300px] md:min-h-[320px] flex flex-col">
                        <div className="flex-1">

                            {step === 0 && (
                                <StepShell stepKey="niche" eyebrow="Step 01 · Industry" title="What market are we hunting in?"
                                    hint="Tell us the niche you want leads from — be specific for sharper results.">
                                    <div className="space-y-1.5">
                                        <label htmlFor="niche" className="text-[10px] font-bold text-[var(--color-muted)] uppercase tracking-wider ml-1 flex items-center gap-1.5">
                                            <BriefcaseIcon className="w-3.5 h-3.5" /> Niche <span className="text-[var(--color-rose)]">*</span>
                                        </label>
                                        <input
                                            ref={inputRef as React.RefObject<HTMLInputElement>}
                                            id="niche" type="text" required
                                            placeholder="e.g., Solar Installation"
                                            onKeyDown={handleKeyDown}
                                            className="w-full bg-[var(--color-surface-sunk)] border border-[var(--color-line)] focus:border-[var(--color-ink)]/30 focus:ring-2 focus:ring-[var(--color-ink)]/[0.06] py-3.5 px-4 rounded-xl text-[var(--color-ink)] text-base outline-none transition-all placeholder:text-[var(--color-faint)]"
                                            value={niche}
                                            onChange={e => setNiche(e.target.value)}
                                        />
                                    </div>
                                    <UnderstandingPanel stepKey="niche" value={niche} />
                                </StepShell>
                            )}

                            {step === 1 && (
                                <StepShell stepKey="city" eyebrow="Step 02 · Geography" title="Where should we focus the search?"
                                    hint="A city, region, or metro area — the more precise, the better the match.">
                                    <div className="space-y-1.5">
                                        <label htmlFor="city" className="text-[10px] font-bold text-[var(--color-muted)] uppercase tracking-wider ml-1 flex items-center gap-1.5">
                                            <MapPinIcon className="w-3.5 h-3.5" /> Target Location <span className="text-[var(--color-rose)]">*</span>
                                        </label>
                                        <input
                                            ref={inputRef as React.RefObject<HTMLInputElement>}
                                            id="city" type="text" required
                                            placeholder="e.g., Austin, TX"
                                            onKeyDown={handleKeyDown}
                                            className="w-full bg-[var(--color-surface-sunk)] border border-[var(--color-line)] focus:border-[var(--color-ink)]/30 focus:ring-2 focus:ring-[var(--color-ink)]/[0.06] py-3.5 px-4 rounded-xl text-[var(--color-ink)] text-base outline-none transition-all placeholder:text-[var(--color-faint)]"
                                            value={city}
                                            onChange={e => setCity(e.target.value)}
                                        />
                                    </div>
                                    <UnderstandingPanel stepKey="city" value={city} />
                                </StepShell>
                            )}

                            {step === 2 && (
                                <StepShell stepKey="service" eyebrow="Step 03 · Your Offer" title="What do you actually sell them?"
                                    hint="Describe your solution in plain terms — this shapes how leads are scored.">
                                    <div className="space-y-1.5">
                                        <label htmlFor="service" className="text-[10px] font-bold text-[var(--color-muted)] uppercase tracking-wider ml-1 flex items-center gap-1.5">
                                            <BoltIcon className="w-3.5 h-3.5" /> Core Service You Offer <span className="text-[var(--color-rose)]">*</span>
                                        </label>
                                        <textarea
                                            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                                            id="service" rows={3} required
                                            placeholder="e.g., Automated high-intent booking pipelines for service businesses..."
                                            onKeyDown={e => handleKeyDown(e, false)}
                                            className="w-full bg-[var(--color-surface-sunk)] border border-[var(--color-line)] focus:border-[var(--color-ink)]/30 focus:ring-2 focus:ring-[var(--color-ink)]/[0.06] py-3.5 px-4 rounded-xl text-[var(--color-ink)] text-base outline-none transition-all placeholder:text-[var(--color-faint)] resize-none leading-relaxed"
                                            value={serviceOffered}
                                            onChange={e => setServiceOffered(e.target.value)}
                                        />
                                        <p className="text-[10px] text-[var(--color-faint)] ml-1">Press <kbd className="px-1 py-0.5 rounded bg-[var(--color-surface-sunk)] border border-[var(--color-line)] text-[var(--color-muted)]">Shift + Enter</kbd> for a new line</p>
                                    </div>
                                    <UnderstandingPanel stepKey="service" value={serviceOffered} />
                                </StepShell>
                            )}

                            {step === 3 && (
                                <StepShell stepKey="icp" eyebrow="Step 04 · Ideal Customer" title="Who's the perfect company to find?"
                                    hint="Describe the kind of business that's the best fit for what you sell.">
                                    <div className="space-y-1.5">
                                        <label htmlFor="icp" className="text-[10px] font-bold text-[var(--color-muted)] uppercase tracking-wider ml-1 flex items-center gap-1.5">
                                            <BuildingOfficeIcon className="w-3.5 h-3.5" /> Ideal Company Persona <span className="text-[var(--color-rose)]">*</span>
                                        </label>
                                        <textarea
                                            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                                            id="icp" rows={3} required
                                            placeholder="e.g., Mid-sized organizations with outdated booking systems..."
                                            onKeyDown={e => handleKeyDown(e, false)}
                                            className="w-full bg-[var(--color-surface-sunk)] border border-[var(--color-line)] focus:border-[var(--color-ink)]/30 focus:ring-2 focus:ring-[var(--color-ink)]/[0.06] py-3.5 px-4 rounded-xl text-[var(--color-ink)] text-base outline-none transition-all placeholder:text-[var(--color-faint)] resize-none leading-relaxed"
                                            value={idealCompanyType}
                                            onChange={e => setIdealCompanyType(e.target.value)}
                                        />
                                        <p className="text-[10px] text-[var(--color-faint)] ml-1">Press <kbd className="px-1 py-0.5 rounded bg-[var(--color-surface-sunk)] border border-[var(--color-line)] text-[var(--color-muted)]">Shift + Enter</kbd> for a new line</p>
                                    </div>
                                    <UnderstandingPanel stepKey="icp" value={idealCompanyType} />
                                </StepShell>
                            )}

                            {step === 4 && (
                                <StepShell stepKey="volume" eyebrow="Step 05 · Calibration" title="How deep should we dig?"
                                    hint="Choose a batch size and decide whether to run deep contact verification.">
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-[var(--color-muted)] uppercase tracking-wider ml-1 flex items-center gap-1.5">
                                                <QueueListIcon className="w-3.5 h-3.5" /> Discovery Size
                                            </label>
                                            <div className="grid grid-cols-3 gap-3">
                                                {volumeOptions.map((num) => (
                                                    <button
                                                        key={num}
                                                        type="button"
                                                        disabled={num > maxAllowedLeads}
                                                        onClick={() => setLeadCount(num)}
                                                        className={`py-3 rounded-xl border text-sm font-bold transition-all duration-200 ${
                                                            leadCount === num
                                                                ? 'bg-[var(--color-ink)] border-[var(--color-ink)] text-white scale-[1.03]'
                                                                : 'bg-[var(--color-surface-sunk)] border-[var(--color-line)] text-[var(--color-ink-soft)] hover:border-[var(--color-line-strong)] disabled:opacity-30'
                                                        }`}
                                                    >
                                                        {num} Leads
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className={`p-4 rounded-xl border transition-all duration-300 ${
                                            deepAudit ? 'bg-[var(--color-accent-soft)] border-[var(--color-accent)]/30' : 'bg-[var(--color-surface-sunk)] border-[var(--color-line)]'
                                        }`}>
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="space-y-0.5">
                                                    <div className="flex items-center gap-2">
                                                        <ShieldCheckIcon className={`w-4 h-4 ${deepAudit ? 'text-[var(--color-accent)]' : 'text-[var(--color-muted)]'}`} />
                                                        <span className="text-sm font-bold text-[var(--color-ink)]">Activate Deep Audit Layer</span>
                                                    </div>
                                                    <p className="text-[11px] text-[var(--color-muted)] leading-normal">
                                                        Verifies contacts and maps decision-maker info for every lead found.
                                                    </p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setDeepAudit(!deepAudit)}
                                                    disabled={limitInfo?.deep_audits_remaining <= 0 && !deepAudit}
                                                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-30 ${
                                                        deepAudit ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-line-strong)]'
                                                    }`}
                                                >
                                                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                                        deepAudit ? 'translate-x-5' : 'translate-x-0'
                                                    }`} />
                                                </button>
                                            </div>
                                            <div className="mt-3 pt-3 border-t border-[var(--color-line)] flex items-center justify-between text-[11px]">
                                                <span className="text-[var(--color-muted)]">Available Audit Allocation:</span>
                                                <span className={`font-mono font-bold ${
                                                    (limitInfo?.deep_audits_remaining || 0) > 0 ? 'text-[var(--color-accent)]' : 'text-[var(--color-gold)]'
                                                }`}>
                                                    {limitInfo?.deep_audits_remaining ?? 0} Remaining Credits
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </StepShell>
                            )}

                            {step === 5 && (
                                <StepShell stepKey="review" eyebrow="Step 06 · Final Check" title="Here's what I'm about to run.">
                                    <div className="p-4 rounded-xl bg-[var(--color-surface-sunk)] border border-[var(--color-line)] mb-5">
                                        <p className="text-[14px] text-[var(--color-ink)] leading-relaxed font-medium">
                                            {synthesis}
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        {[
                                            { icon: BriefcaseIcon, label: 'Niche', value: niche || '—' },
                                            { icon: MapPinIcon, label: 'Location', value: city || '—' },
                                            { icon: BoltIcon, label: 'Service', value: serviceOffered || '—' },
                                            { icon: BuildingOfficeIcon, label: 'Ideal Customer', value: idealCompanyType || '—' },
                                            { icon: QueueListIcon, label: 'Volume', value: `${leadCount} leads` },
                                            { icon: ShieldCheckIcon, label: 'Deep Audit', value: deepAudit ? 'Enabled' : 'Off' },
                                        ].map((row, i) => (
                                            <div key={row.label}
                                                className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-[var(--color-surface-sunk)] transition-colors"
                                                style={{ animation: `fade-rise 0.3s ease-out ${i * 0.04}s both` }}>
                                                <row.icon className="w-3.5 h-3.5 text-[var(--color-muted)] mt-1 shrink-0" />
                                                <div className="min-w-0 flex-1 flex items-baseline justify-between gap-3">
                                                    <p className="text-[10px] font-black text-[var(--color-faint)] uppercase tracking-widest shrink-0">{row.label}</p>
                                                    <p className="text-[12px] text-[var(--color-ink-soft)] font-medium text-right leading-snug break-words">{row.value}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {dailyBlocked && (
                                        <div className="mt-5">
                                            <DailyLimitBanner limitInfo={limitInfo} onUpgrade={() => onNavigate('/pricing')} />
                                        </div>
                                    )}
                                </StepShell>
                            )}
                        </div>

                        {/* ── Navigation footer — light, as before ─────────────── */}
                        <div className="flex items-center gap-3 mt-8 pt-6 border-t border-[var(--color-line)]">
                            <button
                                type="button"
                                onClick={goBack}
                                disabled={step === 0}
                                className="flex items-center gap-1.5 px-4 py-3 rounded-xl text-[var(--color-muted)] text-[11px] font-black uppercase tracking-widest hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-sunk)] transition-all disabled:opacity-0 disabled:pointer-events-none"
                            >
                                <ArrowLeftIcon className="w-3.5 h-3.5" /> Back
                            </button>

                            <div className="flex-1" />

                            <div className="hidden sm:flex items-center gap-1.5 mr-2">
                                {STEPS.map((s, i) => (
                                    <span key={s.key}
                                        className="rounded-full transition-all duration-300"
                                        style={{
                                            width: i === step ? 16 : 6, height: 6,
                                            background: i <= step ? 'var(--color-ink)' : 'var(--color-line-strong)',
                                        }}
                                    />
                                ))}
                            </div>

                            {step < STEPS.length - 1 ? (
                                <button
                                    type="button"
                                    onClick={goNext}
                                    disabled={!isStepValid(step)}
                                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--color-ink)] text-white text-[11px] font-black uppercase tracking-[0.15em] transition-all disabled:opacity-25 disabled:cursor-not-allowed hover:opacity-90"
                                >
                                    Next <ArrowRightIcon className="w-3.5 h-3.5" />
                                </button>
                            ) : (
                                <button
                                    type="submit"
                                    disabled={!canSubmit}
                                    className="flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-[11px] uppercase tracking-[0.15em] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                    style={{
                                        background: 'linear-gradient(135deg, #f6cf7e 0%, #ecb24f 35%, #e89a3a 70%, #d97f2e 100%)',
                                        color: '#1d1b17',
                                        boxShadow: '0 10px 24px -8px rgba(216,140,40,0.45)',
                                    }}
                                >
                                    {loading || launching ? (
                                        <ArrowPathIcon className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <>
                                            <SparklesIcon className="w-4 h-4" />
                                            Run Discovery Hunt ({leadCount} Gems)
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                </form>

                <div className="flex justify-center gap-2 mt-5 flex-wrap">
                    {STEPS.map((s, i) => (
                        <span key={s.key}
                            className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full transition-all duration-300 ${
                                i === step
                                    ? 'bg-[var(--color-surface-sunk)] text-[var(--color-ink)]'
                                    : i < step
                                        ? 'text-[var(--color-accent)]'
                                        : 'text-[var(--color-faint)]'
                            }`}
                        >
                            {i < step && <CheckIcon className="w-2.5 h-2.5 inline mr-0.5 -mt-0.5" />}
                            {s.label}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MarketSetupView;