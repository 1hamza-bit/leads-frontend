import React, { useState, useEffect, useRef } from 'react';
import {
    MagnifyingGlassIcon, SparklesIcon, ShieldCheckIcon, FingerPrintIcon,
    CloudArrowDownIcon, BoltIcon, ArrowRightIcon,
    BuildingOfficeIcon, MapPinIcon, ChartBarIcon,
    RocketLaunchIcon, GlobeAltIcon, BriefcaseIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid';

interface LandingViewProps {
    setView: (v: string) => void;
    onNavigate: (path: string) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// SCROLL REVEAL
// ─────────────────────────────────────────────────────────────────────────────
const Reveal = ({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) => {
    const ref = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const obs = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setTimeout(() => setVisible(true), delay);
                obs.disconnect();
            }
        }, { threshold: 0.15 });
        obs.observe(el);
        return () => obs.disconnect();
    }, [delay]);

    return (
        <div ref={ref} className={`reveal ${visible ? 'is-visible' : ''} ${className}`}>
            {children}
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// MOCK SEARCH PANEL — wide glass panel with real fields, sits over the
// iridescent hero banner.
// ─────────────────────────────────────────────────────────────────────────────
const DEMO_CYCLE = [
    { niche: 'Boutique Dental Clinics', city: 'Austin, TX', criteria: 'Outdated booking systems', count: 24 },
    { niche: 'Solar Installation Co.', city: 'Phoenix, AZ', criteria: 'Recently expanded service area', count: 31 },
    { niche: 'Independent Law Firms', city: 'Chicago, IL', criteria: '5–20 employees, no in-house IT', count: 18 },
];

const MockField = ({ icon: Icon, label, value, typing }: { icon: React.ElementType; label: string; value: string; typing?: boolean }) => (
    <div className="flex-1 min-w-0 px-4 py-3 md:px-5 md:py-4 first:rounded-t-2xl md:first:rounded-l-2xl md:first:rounded-tr-none last:rounded-b-2xl md:last:rounded-r-2xl md:last:rounded-bl-none border-b md:border-b-0 md:border-r last:border-r-0 last:border-b-0 border-white/40">
        <p className="text-[9px] font-black uppercase tracking-widest text-white/70 mb-1 flex items-center gap-1.5">
            <Icon className="w-3 h-3" /> {label}
        </p>
        <p className="text-[14px] font-semibold text-white truncate">
            {value}
            {typing && <span className="inline-block w-[2px] h-[1em] bg-white ml-0.5 align-middle animate-pulse" />}
        </p>
    </div>
);

const MockSearchPanel = () => {
    const [cycle, setCycle] = useState(0);
    const [typedNiche, setTypedNiche] = useState('');
    const [phase, setPhase] = useState<'typing' | 'searching' | 'results'>('typing');
    const [resultCount, setResultCount] = useState(0);
    const current = DEMO_CYCLE[cycle % DEMO_CYCLE.length];

    useEffect(() => {
        let i = 0;
        setTypedNiche('');
        setPhase('typing');
        const id = setInterval(() => {
            i++;
            setTypedNiche(current.niche.slice(0, i));
            if (i >= current.niche.length) {
                clearInterval(id);
                setTimeout(() => setPhase('searching'), 400);
            }
        }, 32);
        return () => clearInterval(id);
    }, [cycle]);

    useEffect(() => {
        if (phase !== 'searching') return;
        const t = setTimeout(() => setPhase('results'), 1300);
        return () => clearTimeout(t);
    }, [phase]);

    useEffect(() => {
        if (phase !== 'results') return;
        let i = 0;
        const id = setInterval(() => {
            i += Math.ceil(current.count / 12);
            setResultCount(Math.min(i, current.count));
            if (i >= current.count) clearInterval(id);
        }, 45);
        const next = setTimeout(() => setCycle(c => c + 1), 3600);
        return () => { clearInterval(id); clearTimeout(next); };
    }, [phase]);

    return (
        <div className="relative w-full max-w-4xl mx-auto rounded-[28px] p-2 md:p-2.5 shadow-2xl shadow-black/20"
            style={{ background: 'rgba(255,255,255,0.16)', backdropFilter: 'blur(24px) saturate(160%)', WebkitBackdropFilter: 'blur(24px) saturate(160%)', border: '1px solid rgba(255,255,255,0.35)' }}>
            <div className="flex flex-col md:flex-row rounded-[22px] overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <MockField icon={BriefcaseIcon} label="Niche / Service" value={typedNiche} typing={phase === 'typing'} />
                <MockField icon={MapPinIcon} label="City" value={current.city} />
                <MockField icon={SparklesIcon} label="Ideal Criteria" value={current.criteria} />
                <div className="flex items-center justify-center p-3 md:p-2 md:pr-3">
                    <button className="w-full md:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white text-[var(--color-ink)] text-[11px] font-black uppercase tracking-widest whitespace-nowrap hover:bg-white/90 transition-colors">
                        <MagnifyingGlassIcon className="w-4 h-4" /> Find Leads
                    </button>
                </div>
            </div>

            <div className="px-4 md:px-5 py-4 min-h-[80px] flex items-center">
                {phase === 'searching' && (
                    <div className="flex items-center gap-3" style={{ animation: 'fade-rise 0.3s ease-out' }}>
                        <span className="relative flex w-4 h-4 shrink-0">
                            <span className="absolute inset-0 rounded-full border-2 border-white/25" />
                            <span className="absolute inset-0 rounded-full border-2 border-transparent border-t-white animate-spin" />
                        </span>
                        <p className="text-[12px] font-bold text-white/90">Scanning the web for matches…</p>
                    </div>
                )}
                {phase === 'results' && (
                    <div className="w-full flex flex-wrap items-center gap-2" style={{ animation: 'fade-rise 0.35s ease-out' }}>
                        <span className="text-[12px] font-bold text-white/90 mr-1">
                            <span className="text-white font-black">{resultCount}</span> qualified leads found
                        </span>
                        {[0, 1, 2].map(i => (
                            <span key={i}
                                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/20 border border-white/30 text-[10px] font-bold text-white"
                                style={{ animation: `fade-rise 0.3s ease-out ${i * 0.08}s both` }}>
                                <BuildingOfficeIcon className="w-3 h-3" />
                                <span className="font-black">{82 - i * 6}%</span> match
                            </span>
                        ))}
                    </div>
                )}
                {phase === 'typing' && (
                    <p className="text-[11px] text-white/70 italic">The engine searches the moment you hit enter — no setup, no waiting.</p>
                )}
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// SHARED CHROME
// ─────────────────────────────────────────────────────────────────────────────
const SectionEyebrow = ({ children, color = 'var(--color-vivid)' }: { children: React.ReactNode; color?: string }) => (
    <p className="text-[11px] font-black uppercase tracking-[0.24em] mb-4 text-center" style={{ color }}>{children}</p>
);

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1 — HERO
// ─────────────────────────────────────────────────────────────────────────────
const TrustStrip = () => (
    <div className="flex flex-wrap items-center justify-center gap-x-7 gap-y-2 mt-8">
        {['No hallucinated leads', 'Verified contacts', 'Cancel anytime'].map(t => (
            <span key={t} className="flex items-center gap-1.5 text-[12px] font-semibold text-[var(--color-muted)]">
                <CheckCircleSolid className="w-4 h-4 text-[var(--color-accent)]" /> {t}
            </span>
        ))}
    </div>
);

const HeroSection = ({ onNavigate }: { onNavigate: (path: string) => void }) => (
    <section className="w-full max-w-7xl mx-auto px-6 pt-16 md:pt-24 pb-20">
        <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-[var(--color-line-strong)] text-[var(--color-ink-soft)] text-[11px] font-bold tracking-wide mb-6">
                <SparklesIcon className="w-3.5 h-3.5 text-[var(--color-vivid)]" /> New: Deep Audit for decision-makers
            </span>
            <h1 className="visionary-text text-4xl md:text-6xl normal-case leading-[1.05] mb-5">
                Find leads that are actually
                <br />
                <span style={{ color: 'var(--color-vivid)' }}>ready to buy.</span>
            </h1>
            <p className="text-[15px] md:text-[17px] text-[var(--color-muted)] leading-relaxed max-w-xl mx-auto">
                IntentIQ scans the open web for real, verifiable businesses that match your ideal customer — scored, contacted, and audited automatically.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
                <button onClick={() => onNavigate('/register')}
                    className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-[var(--color-ink)] text-white font-black text-[12px] uppercase tracking-widest hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
                    <RocketLaunchIcon className="w-4 h-4" /> Start Free Hunt
                </button>
                <button onClick={() => onNavigate('/login')}
                    className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl border border-[var(--color-line-strong)] text-[var(--color-ink-soft)] font-black text-[12px] uppercase tracking-widest hover:border-[var(--color-ink)] hover:text-[var(--color-ink)] transition-all duration-200">
                    Sign In
                </button>
            </div>
            <TrustStrip />
        </div>

        <div className="iridescent-banner relative rounded-[36px] p-6 md:p-12 min-h-[420px] md:min-h-[460px] flex flex-col items-center justify-center">
            <MockSearchPanel />

            <div className="absolute bottom-6 left-6 hidden sm:flex items-center gap-2.5 bg-white/85 backdrop-blur-md rounded-full pl-1.5 pr-4 py-1.5 shadow-lg">
                <div className="flex -space-x-2">
                    {['#3b82c4', '#8b5cf6', '#ec6f9b'].map((c, i) => (
                        <div key={i} className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-white text-[10px] font-black" style={{ background: c }}>
                            {['A', 'B', 'C'][i]}
                        </div>
                    ))}
                </div>
                <span className="text-[11px] font-bold text-[var(--color-ink)]">Trusted by 2,400+ teams</span>
            </div>

            <div className="absolute top-6 right-6 hidden md:block bg-white/90 backdrop-blur-md rounded-2xl px-5 py-3.5 shadow-lg text-left">
                <p className="text-2xl font-black text-[var(--color-ink)] leading-none">12x</p>
                <p className="text-[10px] font-bold text-[var(--color-muted)] uppercase tracking-wide mt-1">Faster than manual</p>
            </div>
        </div>
    </section>
);

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2 — DISCOVERY: iridescent 3D ring center + glassmorphism signal
// cards, tied together with animated connector lines and traveling light
// pulses so the layout reads as one system, not four cards near a circle.
// ─────────────────────────────────────────────────────────────────────────────

const ROAM_DRIFTS = ['roam-drift-1', 'roam-drift-2', 'roam-drift-3'];

// Glossy 3D-look orb that drifts slowly — used only behind the discovery
// section's signal cards, matching the reference's roaming sphere field.
const RoamSphere = ({
    size, color, top, left, right, bottom, drift = 0, duration = 22, delay = 0, opacity = 0.55, z = 0,
}: {
    size: number; color: string;
    top?: string; left?: string; right?: string; bottom?: string;
    drift?: number; duration?: number; delay?: number; opacity?: number; z?: number;
}) => (
    <div
        className="roam-sphere"
        style={{
            width: size, height: size, top, left, right, bottom, zIndex: z,
            background: `radial-gradient(circle at 32% 28%, ${color}, ${color}cc 55%, ${color}80 100%)`,
            boxShadow: `inset -6px -8px 16px rgba(0,0,0,0.16), 0 10px 26px -6px ${color}55`,
            animation: `${ROAM_DRIFTS[drift % ROAM_DRIFTS.length]} ${duration}s ease-in-out ${delay}s infinite`,
            opacity,
        }}
    />
);

const IridescentOrb = () => (
    <div className="relative w-[220px] h-[220px] md:w-[240px] md:h-[240px]">
        {/* Layered ambient halo — bigger + softer than the orb itself for depth */}
        <div className="absolute inset-[-70px] rounded-full pointer-events-none"
            style={{
                background: 'radial-gradient(ellipse at 38% 42%, rgba(167,139,250,0.5) 0%, rgba(249,168,212,0.38) 35%, rgba(147,197,253,0.32) 65%, transparent 100%)',
                animation: 'halo-pulse 5s ease-in-out infinite',
                filter: 'blur(6px)',
            }}
        />
        <div className="absolute inset-[-30px] rounded-full pointer-events-none"
            style={{
                background: 'radial-gradient(circle, rgba(255,255,255,0.5) 0%, transparent 70%)',
                animation: 'halo-pulse 5s ease-in-out infinite 0.4s',
            }}
        />

        {/* Solid glossy iridescent orb — same shading language as the
            roaming spheres, no donut hole, no icon badge */}
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"
            className="relative w-full h-full"
            style={{ animation: 'ring-spin 18s linear infinite' }}>
            <defs>
                <linearGradient id="iriGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%"   stopColor="#e0d7f5"/>
                    <stop offset="18%"  stopColor="#f9c8d4"/>
                    <stop offset="36%"  stopColor="#fde8c8"/>
                    <stop offset="54%"  stopColor="#c7e8fb"/>
                    <stop offset="72%"  stopColor="#c5d9f8"/>
                    <stop offset="90%"  stopColor="#ddc9f5"/>
                    <stop offset="100%" stopColor="#e0d7f5"/>
                </linearGradient>
                <linearGradient id="iriGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%"   stopColor="#f5c8e8"/>
                    <stop offset="25%"  stopColor="#c8d8fb"/>
                    <stop offset="50%"  stopColor="#e8f4fc"/>
                    <stop offset="75%"  stopColor="#f9d5c0"/>
                    <stop offset="100%" stopColor="#d4c8f5"/>
                </linearGradient>
                <radialGradient id="ringHighlight" cx="34%" cy="26%" r="60%">
                    <stop offset="0%"   stopColor="white" stopOpacity="0.9"/>
                    <stop offset="40%"  stopColor="white" stopOpacity="0.25"/>
                    <stop offset="100%" stopColor="white" stopOpacity="0"/>
                </radialGradient>
                <radialGradient id="ringShadow" cx="64%" cy="76%" r="55%">
                    <stop offset="0%"   stopColor="#6b72b8" stopOpacity="0.4"/>
                    <stop offset="100%" stopColor="#6b72b8" stopOpacity="0"/>
                </radialGradient>
            </defs>
            <circle cx="100" cy="100" r="98" fill="url(#iriGrad1)"/>
            <circle cx="100" cy="100" r="98" fill="url(#iriGrad2)" opacity={0.55}/>
            <circle cx="100" cy="100" r="98" fill="url(#ringHighlight)"/>
            <circle cx="100" cy="100" r="98" fill="url(#ringShadow)"/>
            <circle cx="100" cy="100" r="98" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="0.8"/>
        </svg>
    </div>
);

// Connector system: SVG paths from the ring's center to each card's anchor,
// drawn once on scroll-in, with a traveling pulse looping along each path
// afterward. Coordinates are tuned to the 720×480 stage used below.
const STAGE_W = 820, STAGE_H = 560, CENTER_X = 410, CENTER_Y = 280;

const CONNECTOR_PATHS: Record<string, string> = {
    'top-left': `M ${CENTER_X} ${CENTER_Y} C ${CENTER_X - 100} ${CENTER_Y - 70}, ${CENTER_X - 170} ${CENTER_Y - 130}, 140 95`,
    'top-right': `M ${CENTER_X} ${CENTER_Y} C ${CENTER_X + 100} ${CENTER_Y - 70}, ${CENTER_X + 170} ${CENTER_Y - 130}, 680 95`,
    'bottom-left': `M ${CENTER_X} ${CENTER_Y} C ${CENTER_X - 100} ${CENTER_Y + 70}, ${CENTER_X - 170} ${CENTER_Y + 130}, 140 465`,
    'bottom-right': `M ${CENTER_X} ${CENTER_Y} C ${CENTER_X + 100} ${CENTER_Y + 70}, ${CENTER_X + 170} ${CENTER_Y + 130}, 680 465`,
};

const ConnectorLines = ({ visible }: { visible: boolean }) => (
    <svg viewBox={`0 0 ${STAGE_W} ${STAGE_H}`} className="absolute inset-0 w-full h-full pointer-events-none z-[3]" preserveAspectRatio="xMidYMid meet">
        <defs>
            <linearGradient id="connectorFade" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#8b7ce8" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#8b7ce8" stopOpacity="0.05" />
            </linearGradient>
        </defs>
        {Object.entries(CONNECTOR_PATHS).map(([key, d]) => (
            <g key={key}>
                <path d={d} fill="none" stroke="url(#connectorFade)" strokeWidth="1.5" strokeDasharray="4 5"
                    style={visible ? { animation: `connector-pulse 1.4s ease-out both` } : { opacity: 0 }} />
                {visible && (
                    <circle r="3.5" fill="#fff" opacity="0.95">
                        <animateMotion dur="3.2s" repeatCount="indefinite" path={d} begin={`${Object.keys(CONNECTOR_PATHS).indexOf(key) * 0.5}s`} />
                    </circle>
                )}
            </g>
        ))}
    </svg>
);

const SIGNAL_CARDS = [
    {
        icon: <BoltIcon className="w-5 h-5" />,
        title: 'Intent Detection',
        desc: 'Real buying signals from web behavior, listings, and review activity — not guesswork.',
        badge: 'Live signals',
        accent: '#5b8fd9',
        anim: 'tilt-float-1',
        pos: 'top-[2%] left-[0%] md:left-[1%]',
    },
    {
        icon: <ShieldCheckIcon className="w-5 h-5" />,
        title: 'Email Verified',
        desc: 'MX record lookup + SMTP handshake confirms deliverability before you ever hit send.',
        badge: 'MX + SMTP passed',
        accent: '#4f6f4a',
        anim: 'tilt-float-2',
        pos: 'top-[2%] right-[0%] md:right-[1%]',
    },
    {
        icon: <FingerPrintIcon className="w-5 h-5" />,
        title: 'Decision Maker',
        desc: 'Names, titles, and LinkedIn profiles surfaced for the actual buyer — not the front desk.',
        badge: 'Name + title found',
        accent: '#8b5cf6',
        anim: 'tilt-float-3',
        pos: 'bottom-[4%] left-[0%] md:left-[1%]',
    },
    {
        icon: <GlobeAltIcon className="w-5 h-5" />,
        title: 'Site Live & Healthy',
        desc: '200 OK check, load time, and tech-stack detection — filter dead or broken businesses instantly.',
        badge: '200 OK · verified',
        accent: '#ec6f9b',
        anim: 'tilt-float-1',
        pos: 'bottom-[4%] right-[0%] md:right-[1%]',
    },
];

// Shared glass-card visual treatment: real glass opacity (not near-invisible),
// consistent prefix values, plus an internal radial wash tinted from the
// card's own accent so the glassmorphism reads even where roaming spheres
// might not be directly behind it at a given moment.
const glassCardStyle = (accent: string): React.CSSProperties => ({
    background: `linear-gradient(150deg, ${accent}30, rgba(255,255,255,0.22) 55%, ${accent}22), rgba(255,255,255,0.30)`,
    backdropFilter: 'blur(26px) saturate(180%)',
    WebkitBackdropFilter: 'blur(26px) saturate(180%)',
    border: '1px solid rgba(255,255,255,0.55)',
    boxShadow: `0 14px 42px ${accent}26, 0 2px 10px rgba(99,120,180,0.08), inset 0 1px 0 rgba(255,255,255,0.65)`,
});

const DiscoverySection = () => {
    const stageRef = useRef<HTMLDivElement>(null);
    const [active, setActive] = useState(false);

    useEffect(() => {
        const el = stageRef.current;
        if (!el) return;
        const obs = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) { setActive(true); obs.disconnect(); }
        }, { threshold: 0.2 });
        obs.observe(el);
        return () => obs.disconnect();
    }, []);

    return (
        <section className="dot-grid relative w-full py-24 md:py-32 overflow-hidden">
            {/* Roaming sphere field */}
            <RoamSphere size={170} color="#3b82c4" top="2%" left="-4%" drift={0} duration={24} opacity={0.65} z={1} />
            <RoamSphere size={95} color="#8b5cf6" top="55%" left="10%" drift={1} duration={19} delay={1.2} opacity={0.6} z={1} />
            <RoamSphere size={64} color="#ec6f9b" top="10%" left="34%" drift={2} duration={16} delay={0.6} opacity={0.55} z={1} />
            <RoamSphere size={180} color="#5b8fd9" top="-10%" right="-8%" drift={1} duration={26} delay={2} opacity={0.65} z={6} />
            <RoamSphere size={80} color="#4f6f4a" bottom="6%" right="18%" drift={2} duration={18} delay={0.8} opacity={0.55} z={1} />
            <RoamSphere size={56} color="#f5a623" bottom="14%" left="42%" drift={0} duration={15} delay={1.6} opacity={0.55} z={1} />
            <RoamSphere size={120} color="#ec6f9b" bottom="-8%" left="-6%" drift={2} duration={21} delay={0.4} opacity={0.6} z={1} />
            <RoamSphere size={88} color="#8b5cf6" top="30%" right="6%" drift={0} duration={20} delay={1.8} opacity={0.55} z={1} />
            <RoamSphere size={50} color="#3b82c4" bottom="32%" right="40%" drift={1} duration={14} delay={1} opacity={0.5} z={1} />
            <RoamSphere size={40} color="#4f6f4a" top="40%" left="60%" drift={2} duration={17} delay={2.4} opacity={0.5} z={1} />

            <div className="absolute inset-0 pointer-events-none"
                // style={{ background: 'linear-gradient(to bottom, white 0%, transparent 12%, transparent 88%, white 100%)' }}
                 />

            <div className="absolute inset-0 opacity-[0.025] pointer-events-none mix-blend-multiply"
                style={{
                    backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
                    animation: 'grain-shift 6s ease-in-out infinite',
                }} />

            <div className="relative max-w-3xl mx-auto px-6 text-center mb-10">
                <Reveal>
                    <SectionEyebrow color="var(--color-violet)">Always Scanning</SectionEyebrow>
                    <h2 className="visionary-text text-3xl md:text-5xl normal-case leading-tight mb-4">
                        One engine, every signal that matters.
                    </h2>
                    <p className="text-[15px] text-[var(--color-muted)] leading-relaxed max-w-lg mx-auto">
                        IntentIQ cross-references search, listings, and live site data so every lead is real — not a database scrape.
                    </p>
                </Reveal>
            </div>

            {/* ── MOBILE LAYOUT (< md): orb centered, cards stacked, no
                absolute positioning or connector lines. ─────────────────── */}
            <div className="md:hidden relative px-6">
                <div className="flex justify-center mb-8">
                    <Reveal>
                        <div className="scale-[0.7]"><IridescentOrb /></div>
                    </Reveal>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto">
                    {SIGNAL_CARDS.map((card, i) => (
                        <Reveal key={card.title} delay={i * 80}>
                            <div className="relative rounded-[24px] px-6 py-7 min-h-[160px] flex flex-col" style={glassCardStyle(card.accent)}>
                                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                                    style={{ background: `${card.accent}24`, color: card.accent }}>
                                    {card.icon}
                                </div>
                                <p className="text-[15px] font-black text-[var(--color-ink)] mb-1.5 leading-tight">{card.title}</p>
                                <p className="text-[12.5px] text-[var(--color-ink-soft)] leading-[1.55] flex-1">{card.desc}</p>
                                <span className="inline-flex items-center gap-1.5 mt-3 px-2.5 py-1 rounded-full text-[10px] font-black self-start"
                                    style={{ background: `${card.accent}28`, color: card.accent }}>
                                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: card.accent }} />
                                    {card.badge}
                                </span>
                            </div>
                        </Reveal>
                    ))}
                </div>
            </div>

            {/* ── DESKTOP LAYOUT (md+): orbit stage with connector lines ──── */}
            <div ref={stageRef} className="hidden md:block relative max-w-5xl mx-auto px-6" style={{ aspectRatio: `${STAGE_W} / ${STAGE_H}` }}>
                <ConnectorLines visible={active} />

                {SIGNAL_CARDS.map((card, i) => (
                    <div
                        key={card.title}
                        className={`absolute rounded-[26px] z-[8] ${card.pos}`}
                        style={{
                            width: 'clamp(220px, 26vw, 280px)',
                            minHeight: '190px',
                            padding: '28px',
                            ...glassCardStyle(card.accent),
                            animation: active ? `${card.anim} 7.5s ease-in-out infinite, fade-rise 0.5s ease-out ${i * 0.12}s both` : 'none',
                            opacity: active ? undefined : 0,
                        }}
                    >
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                            style={{ background: `${card.accent}24`, color: card.accent }}>
                            {card.icon}
                        </div>
                        <p className="text-[16px] font-black text-[var(--color-ink)] mb-2 leading-tight">{card.title}</p>
                        <p className="text-[13px] text-[var(--color-ink-soft)] leading-[1.55]">{card.desc}</p>
                        <span className="inline-flex items-center gap-1.5 mt-3.5 px-2.5 py-1 rounded-full text-[10px] font-black"
                            style={{ background: `${card.accent}28`, color: card.accent }}>
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: card.accent }} />
                            {card.badge}
                        </span>
                    </div>
                ))}

                <div className="absolute inset-0 flex items-center justify-center z-[5]">
                    <Reveal delay={150}>
                        <IridescentOrb />
                    </Reveal>
                </div>
            </div>
        </section>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3 — SKILLIFY-STYLE: huge overlapping editorial type
// ─────────────────────────────────────────────────────────────────────────────
const STEPS = [
    { icon: MagnifyingGlassIcon, title: 'Define your market', desc: 'Tell the engine your niche, city, and ideal customer in plain language.' },
    { icon: ShieldCheckIcon, title: 'Verify every contact', desc: 'Email and website checks run automatically, before you ever reach out.' },
    { icon: FingerPrintIcon, title: 'Audit decision makers', desc: 'Names, titles, and outreach angles surfaced for the people who buy.' },
];

// ─────────────────────────────────────────────────────────────────────────────
// SECTION — STATS BENTO: asymmetric panels (tall stat, photo-style sphere
// panel, avatar-strip, metric card, tall comparison card), reusing our
// existing palette + glossy sphere motif rather than stock photography.
// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// STATS BENTO — Rivly-style with purple ribbon leaves, circular spinning
// badge, scattered outline dot-rings, and asymmetric 4-col bento grid.
// ─────────────────────────────────────────────────────────────────────────────

const StatsSection = () => (
    <section className="w-full max-w-7xl mx-auto px-6 py-24 md:py-32 relative overflow-hidden">

        {/* ── DECORATIVE LEAVES ── */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
            {/* Leaf 1 — top centre large */}
            <svg className="absolute" style={{ top: -18, left: '36%', width: 52, opacity: 0.8, animation: 'leaf-sway 8s ease-in-out infinite' }} viewBox="0 0 90 120" fill="none">
                <defs><linearGradient id="lg1" x1="0%" y1="0%" x2="60%" y2="100%"><stop offset="0%" stopColor="#a78bfa"/><stop offset="100%" stopColor="#7c5cbf"/></linearGradient></defs>
                <path d="M45 5 C70 5,85 30,82 55 C79 80,60 105,45 115 C30 105,11 80,8 55 C5 30,20 5,45 5Z" fill="url(#lg1)"/>
            </svg>
            {/* Leaf 2 — upper right rotated */}
            <svg className="absolute" style={{ top: 14, right: 86, width: 38, opacity: 0.7, animation: 'leaf-sway 10s ease-in-out 1.2s infinite' }} viewBox="0 0 60 80" fill="none">
                <defs><linearGradient id="lg2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#c4b5fd"/><stop offset="100%" stopColor="#8b5cf6"/></linearGradient></defs>
                <path d="M30 4 C50 4,57 22,56 40 C55 58,42 72,30 76 C18 72,5 58,4 40 C3 22,10 4,30 4Z" fill="url(#lg2)" transform="rotate(-28 30 40)"/>
            </svg>
            {/* Leaf 3 — bottom left wide */}
            <svg className="absolute" style={{ bottom: 24, left: -10, width: 42, opacity: 0.64, animation: 'leaf-sway 12s ease-in-out 0.8s infinite' }} viewBox="0 0 100 70" fill="none">
                <defs><linearGradient id="lg3" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#ddd6fe"/><stop offset="100%" stopColor="#7c3aed"/></linearGradient></defs>
                <path d="M5 35 C5 15,30 5,50 5 C70 5,95 15,95 35 C95 55,70 65,50 65 C30 65,5 55,5 35Z" fill="url(#lg3)" transform="rotate(15 50 35)"/>
            </svg>
            {/* Leaf 4 — mid right thin */}
            <svg className="absolute hidden md:block" style={{ top: '44%', right: 2, width: 20, opacity: 0.6, animation: 'leaf-sway 9s ease-in-out 2s infinite' }} viewBox="0 0 50 130" fill="none">
                <defs><linearGradient id="lg4" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#ede9fe"/><stop offset="100%" stopColor="#8b5cf6"/></linearGradient></defs>
                <path d="M25 3 C42 3,47 35,47 65 C47 95,42 127,25 127 C8 127,3 95,3 65 C3 35,8 3,25 3Z" fill="url(#lg4)"/>
            </svg>
            {/* Leaf 5 — small bottom centre */}
            <svg className="absolute" style={{ bottom: 8, left: '52%', width: 12, opacity: 0.55, animation: 'leaf-sway 7s ease-in-out 1.5s infinite' }} viewBox="0 0 50 70" fill="none">
                <defs><linearGradient id="lg5" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#c4b5fd"/><stop offset="100%" stopColor="#6d28d9"/></linearGradient></defs>
                <path d="M25 3 C40 3,47 20,47 35 C47 50,40 67,25 67 C10 67,3 50,3 35 C3 20,10 3,25 3Z" fill="url(#lg5)" transform="rotate(-40 25 35)"/>
            </svg>
            {/* Outline dot rings */}
            {([
                { s: 20, style: { top: 22, left: '22%' }, c: 'rgba(139,92,246,.35)', d: '0s' },
                { s: 13, style: { top: '38%', left: '5%' }, c: 'rgba(99,102,241,.28)', d: '1s' },
                { s: 17, style: { bottom: 20, left: '30%' }, c: 'rgba(167,139,250,.36)', d: '0.5s' },
                { s: 10, style: { top: 16, right: '18%' }, c: 'rgba(139,92,246,.4)', d: '2s' },
                { s: 26, style: { bottom: 38, right: '11%' }, c: 'rgba(124,92,191,.26)', d: '0.8s' },
            ] as const).map((d, i) => (
                <div key={i} className="absolute rounded-full hidden md:block"
                    style={{ width: d.s, height: d.s, border: `2px solid ${d.c}`, animation: `dot-pulse 5s ease-in-out ${d.d} infinite`, ...d.style }}/>
            ))}
        </div>

        {/* ── CIRCULAR SPINNING BADGE ── */}
        <div className="absolute z-20 hidden sm:block" style={{ top: 88, right: 24 }}>
            <svg viewBox="0 0 74 74" fill="none" style={{ width: 68, height: 68, animation: 'badge-spin 18s linear infinite' }}>
                <circle cx="37" cy="37" r="34" stroke="#7c5cbf" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.5"/>
                <circle cx="37" cy="37" r="28" fill="#fff" stroke="#e9d8ff" strokeWidth="1"/>
                <text x="37" y="32" textAnchor="middle" fontSize="10.5" fontWeight="900" fill="#6d28d9" fontFamily="inherit">200K+</text>
                <text x="37" y="43" textAnchor="middle" fontSize="7" fontWeight="700" fill="#9ca3af" fontFamily="inherit">LEADS</text>
                <text x="37" y="52" textAnchor="middle" fontSize="6.5" fontWeight="700" fill="#9ca3af" fontFamily="inherit">FOUND</text>
                <defs><path id="tc2" d="M37,37 m-26,0 a26,26 0 1,1 52,0 a26,26 0 1,1-52,0"/></defs>
                <text fontSize="6" fontWeight="800" fill="#8b5cf6" opacity="0.65" fontFamily="inherit" letterSpacing="2">
                    <textPath href="#tc2">INTENTIQ · LIVE DATA · VERIFIED ·&nbsp;</textPath>
                </text>
            </svg>
        </div>

        <Reveal>
            <SectionEyebrow color="var(--color-accent)">By The Numbers</SectionEyebrow>
            <h2 className="visionary-text text-3xl md:text-5xl normal-case text-center max-w-2xl mx-auto mb-16 leading-tight">
                Built to be trusted, not just fast.
            </h2>
        </Reveal>

        {/* ── ARC GRID: align-items:end so all cards bottom-anchor, heights = arc ── */}
        <div className="relative z-10 hidden md:grid gap-3"
            style={{ gridTemplateColumns: '1.05fr 0.88fr 1.08fr 1fr', alignItems: 'end', minHeight: 560 }}>

            {/* COL 1 — tall purple, h=520 (tallest = arc edge) */}
            <Reveal>
                <div className="relative rounded-[22px] overflow-hidden" style={{ height: 520, background: 'linear-gradient(165deg,#7c5cbf 0%,#6448a8 45%,#513a8f 100%)' }}>
                    <svg className="absolute pointer-events-none" style={{ top: -18, right: -18, width: 100, opacity: 0.14 }} viewBox="0 0 120 160" fill="none">
                        <path d="M60 5 C95 5,115 45,112 80 C109 115,85 150,60 158 C35 150,11 115,8 80 C5 45,25 5,60 5Z" fill="white"/>
                    </svg>
                    <div className="h-full p-7 flex flex-col justify-between relative z-10">
                        <div>
                            <div className="flex gap-1 mb-4">
                                {[0,1,2,3].map(i => <svg key={i} className="w-3.5 h-3.5 text-amber-400" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>)}
                            </div>
                            <p className="text-[54px] font-black text-white leading-none">+15K</p>
                            <p className="text-[11.5px] font-bold text-white/62 mt-1">Lead searches run</p>
                        </div>
                        <div>
                            <p className="text-[15px] font-black text-white leading-snug mb-2">Real identity-verified leads you can trust</p>
                            <p className="text-[11.5px] font-medium text-white/58 leading-relaxed">Every business cross-checked against live web data — zero stale records, ever.</p>
                        </div>
                    </div>
                </div>
            </Reveal>

            {/* COL 2 — short stacked pair, total h=380 (arc dip) */}
            <Reveal delay={80}>
                <div className="flex flex-col gap-3" style={{ height: 380 }}>
                    {/* B-top: orb sphere */}
                    <div className="relative rounded-[22px] overflow-hidden flex-1 flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg,#d6caff 0%,#e8d6f5 40%,#f5ccd8 100%)' }}>
                        <div className="absolute top-3 left-3 flex items-center gap-2 rounded-[10px] px-2.5 py-1.5 z-10"
                            style={{ background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(10px)' }}>
                            <div className="w-5 h-5 rounded-[5px] flex items-center justify-center flex-shrink-0"
                                style={{ background: 'linear-gradient(135deg,#c5d9f8,#ddc9f5)' }}>
                                <BoltIcon className="w-3 h-3 text-violet-700"/>
                            </div>
                            <p className="text-[9.5px] font-black text-[var(--color-ink)] leading-tight">Why use IntentIQ?</p>
                        </div>
                        <div style={{ animation: 'orb-hover 6s ease-in-out infinite', marginTop: 16 }}>
                            <div className="scale-[0.6]"><IridescentOrb /></div>
                        </div>
                        <p className="absolute bottom-2 inset-x-0 text-center text-[9.5px] font-black text-violet-900">Quality leads from live businesses</p>
                    </div>
                    {/* B-bot: 5000+ */}
                    <div className="rounded-[22px] bg-white border border-[var(--color-line)] p-5 flex flex-col justify-between" style={{ minHeight: 130 }}>
                        <div>
                            <div className="flex -space-x-2 mb-2">
                                {(['#3b82c4','#8b5cf6','#ec6f9b','#4f6f4a'] as const).map((c,i) => (
                                    <div key={i} className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-white text-[9px] font-black flex-shrink-0" style={{ background: c }}>{['A','B','C','D'][i]}</div>
                                ))}
                            </div>
                            <p className="text-[24px] font-black text-[var(--color-ink)] leading-none">5,000+</p>
                            <p className="text-[10.5px] font-bold text-[var(--color-muted)] mt-1">Hunts run this month</p>
                        </div>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9.5px] font-black self-start"
                            style={{ background: '#ede9fe', color: '#6d28d9', border: '1px solid #ddd6fe' }}>
                            <span className="w-1.5 h-1.5 rounded-full bg-violet-500"/>Free &amp; accurate
                        </span>
                    </div>
                </div>
            </Reveal>

            {/* COL 3 — medium tall comparison, h=460 */}
            <Reveal delay={140}>
                <div className="relative rounded-[22px] bg-white border border-[var(--color-line)] p-7 flex flex-col justify-between" style={{ height: 460 }}>
                    <div>
                        <p className="text-[9.5px] font-black uppercase tracking-[0.18em] text-[var(--color-muted)] mb-3">IntentIQ vs. the rest</p>
                        <p className="text-[17px] font-black text-[var(--color-ink)] leading-[1.28] mb-4">
                            See how IntentIQ compares to sites like Apollo, ZoomInfo, and others
                        </p>
                        <div className="divide-y divide-[var(--color-line)]">
                            {['Real-time web data','Zero hallucinated leads','Live SMTP verification','Decision-maker audit','AI intent scoring'].map(f => (
                                <div key={f} className="flex items-center justify-between py-[9px]">
                                    <span className="text-[11.5px] font-semibold text-[var(--color-ink)]">{f}</span>
                                    <div className="w-[17px] h-[17px] rounded-full flex items-center justify-center text-[9.5px] font-black flex-shrink-0"
                                        style={{ background: '#dcfce7', color: '#15803d' }}>✓</div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="flex items-center gap-3 pt-4 border-t border-[var(--color-line)]">
                        <span className="text-[11px] font-black text-[var(--color-ink)] uppercase tracking-wider">Learn more</span>
                        <div className="w-7 h-7 rounded-full bg-[var(--color-ink)] flex items-center justify-center">
                            <ArrowRightIcon className="w-3 h-3 text-white"/>
                        </div>
                    </div>
                </div>
            </Reveal>

            {/* COL 4 — tall stacked pair, h=520 (mirrors col 1) */}
            <Reveal delay={200}>
                <div className="flex flex-col gap-3" style={{ height: 520 }}>
                    {/* D-top: dark 10x+ */}
                    <div className="relative rounded-[22px] overflow-hidden flex-1 bg-[var(--color-ink)]">
                        <div className="absolute w-[110px] h-[110px] rounded-full pointer-events-none top-[-28px] right-[-28px]"
                            style={{ background: 'radial-gradient(circle at 35% 30%,#8b5cf655,transparent)' }}/>
                        <div className="h-full p-6 flex flex-col justify-between relative z-10">
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-[0.15em] text-white/42 mb-1">Prospecting speed</p>
                                <p className="text-[44px] font-black text-white leading-none">10x+</p>
                                <p className="text-[11px] font-medium text-white/52 mt-2 leading-snug">Up to 10x faster than manual outbound work</p>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-[9px] font-black uppercase tracking-wider text-white/32">Benchmark</span>
                                <div className="w-7 h-7 rounded-full flex items-center justify-center"
                                    style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)' }}>
                                    <ArrowRightIcon className="w-3 h-3 text-white"/>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* D-bot: 100% verified */}
                    <div className="relative rounded-[22px] overflow-hidden" style={{ background: '#eef4ff', minHeight: 160 }}>
                        <svg className="absolute pointer-events-none" style={{ bottom: -18, right: -18, width: 72, opacity: 0.15 }} viewBox="0 0 90 120" fill="none">
                            <path d="M45 5 C68 5,82 28,80 52 C78 76,60 100,45 108 C30 100,12 76,10 52 C8 28,22 5,45 5Z" fill="#3b82f6"/>
                        </svg>
                        <div className="h-full p-5 flex flex-col justify-between relative z-10">
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-[0.15em] text-blue-500 mb-1">Verified contacts</p>
                                <p className="text-[28px] font-black text-[var(--color-ink)] leading-none">100%</p>
                                <p className="text-[10.5px] font-bold text-[var(--color-muted)] mt-1">SMTP + MX before delivery</p>
                            </div>
                            <div>
                                <div className="w-full h-1 rounded-full bg-blue-100 overflow-hidden">
                                    <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-400"
                                        style={{ width: '83%', animation: 'progress-in 1.3s cubic-bezier(0.22,1,0.36,1) 0.4s both' }}/>
                                </div>
                                <div className="flex justify-between mt-1.5">
                                    <span className="text-[9px] font-bold text-[var(--color-muted)]">Others ~60%</span>
                                    <span className="text-[9px] font-black text-blue-500">IntentIQ 100%</span>
                                </div>
                                <p className="text-[9.5px] font-bold text-[var(--color-muted)] mt-2">Free, fast, and reliable data</p>
                            </div>
                        </div>
                    </div>
                </div>
            </Reveal>
        </div>

        {/* ── MOBILE LAYOUT (< md): stacked, full width ── */}
        <div className="md:hidden flex flex-col gap-3 relative z-10">
            {/* Purple stat — full width */}
            <div className="relative rounded-[22px] overflow-hidden" style={{ background: 'linear-gradient(165deg,#7c5cbf 0%,#6448a8 45%,#513a8f 100%)', minHeight: 240 }}>
                <div className="h-full p-6 flex flex-col justify-between">
                    <div className="flex gap-1 mb-3">{[0,1,2,3].map(i => <svg key={i} className="w-3.5 h-3.5 text-amber-400" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>)}</div>
                    <p className="text-[44px] font-black text-white leading-none">+15K</p>
                    <p className="text-[11px] font-bold text-white/62 mt-1 mb-4">Lead searches run</p>
                    <p className="text-[14px] font-black text-white leading-snug mb-1">Real identity-verified leads you can trust</p>
                    <p className="text-[11px] font-medium text-white/58 leading-relaxed">Every business cross-checked against live web data — zero stale records.</p>
                </div>
            </div>
            {/* Row: orb + 5000+ side by side */}
            <div className="grid grid-cols-2 gap-3">
                <div className="relative rounded-[22px] overflow-hidden flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg,#d6caff 0%,#e8d6f5 40%,#f5ccd8 100%)', minHeight: 160 }}>
                    <div style={{ animation: 'orb-hover 6s ease-in-out infinite' }}>
                        <div className="scale-[0.55]"><IridescentOrb /></div>
                    </div>
                    <p className="absolute bottom-2 inset-x-0 text-center text-[9px] font-black text-violet-900">Quality leads</p>
                </div>
                <div className="rounded-[22px] bg-white border border-[var(--color-line)] p-4 flex flex-col justify-between" style={{ minHeight: 160 }}>
                    <div>
                        <div className="flex -space-x-2 mb-2">{(['#3b82c4','#8b5cf6','#ec6f9b'] as const).map((c,i) => <div key={i} className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-white text-[9px] font-black flex-shrink-0" style={{ background: c }}>{['A','B','C'][i]}</div>)}</div>
                        <p className="text-[22px] font-black text-[var(--color-ink)] leading-none">5,000+</p>
                        <p className="text-[10px] font-bold text-[var(--color-muted)] mt-1">Hunts this month</p>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-black self-start" style={{ background: '#ede9fe', color: '#6d28d9' }}><span className="w-1.5 h-1.5 rounded-full bg-violet-500"/>Accurate</span>
                </div>
            </div>
            {/* Comparison — full width */}
            <div className="rounded-[22px] bg-white border border-[var(--color-line)] p-6">
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[var(--color-muted)] mb-2">IntentIQ vs. the rest</p>
                <p className="text-[16px] font-black text-[var(--color-ink)] leading-[1.28] mb-4">See how IntentIQ compares to Apollo, ZoomInfo, and others</p>
                <div className="divide-y divide-[var(--color-line)]">
                    {['Real-time web data','Zero hallucinated leads','Live SMTP verification','Decision-maker audit','AI intent scoring'].map(f => (
                        <div key={f} className="flex items-center justify-between py-2">
                            <span className="text-[11.5px] font-semibold text-[var(--color-ink)]">{f}</span>
                            <div className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black flex-shrink-0" style={{ background: '#dcfce7', color: '#15803d' }}>✓</div>
                        </div>
                    ))}
                </div>
                <div className="flex items-center gap-3 pt-4 mt-2 border-t border-[var(--color-line)]">
                    <span className="text-[11px] font-black text-[var(--color-ink)] uppercase tracking-wider">Learn more</span>
                    <div className="w-7 h-7 rounded-full bg-[var(--color-ink)] flex items-center justify-center"><ArrowRightIcon className="w-3 h-3 text-white"/></div>
                </div>
            </div>
            {/* Row: 10x+ + 100% side by side */}
            <div className="grid grid-cols-2 gap-3">
                <div className="relative rounded-[22px] overflow-hidden bg-[var(--color-ink)] p-4 flex flex-col justify-between" style={{ minHeight: 170 }}>
                    <div>
                        <p className="text-[8.5px] font-black uppercase tracking-wider text-white/40 mb-1">Speed</p>
                        <p className="text-[36px] font-black text-white leading-none">10x+</p>
                        <p className="text-[10.5px] font-medium text-white/52 mt-1 leading-snug">Faster than manual prospecting</p>
                    </div>
                    <div className="flex justify-end">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.12)' }}>
                            <ArrowRightIcon className="w-3 h-3 text-white"/>
                        </div>
                    </div>
                </div>
                <div className="relative rounded-[22px] p-4 flex flex-col justify-between" style={{ background: '#eef4ff', minHeight: 170 }}>
                    <div>
                        <p className="text-[8.5px] font-black uppercase tracking-wider text-blue-500 mb-1">Verified</p>
                        <p className="text-[28px] font-black text-[var(--color-ink)] leading-none">100%</p>
                        <p className="text-[10px] font-bold text-[var(--color-muted)] mt-1">SMTP + MX checked</p>
                    </div>
                    <div>
                        <div className="w-full h-1 rounded-full bg-blue-100 overflow-hidden">
                            <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-400" style={{ width: '83%', animation: 'progress-in 1.3s cubic-bezier(0.22,1,0.36,1) 0.4s both' }}/>
                        </div>
                        <div className="flex justify-between mt-1">
                            <span className="text-[8.5px] font-bold text-[var(--color-muted)]">Others ~60%</span>
                            <span className="text-[8.5px] font-black text-blue-500">Us 100%</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
);

const HowItWorksSection = () => (
    <section className="relative w-full bg-[var(--color-ink)] py-28 md:py-40 overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
            <span className="text-[18vw] font-black uppercase leading-none whitespace-nowrap" style={{ color: 'rgba(255,255,255,0.04)', fontFamily: 'var(--font-display)' }}>
                HOW IT WORKS
            </span>
        </div>

        <div className="relative max-w-5xl mx-auto px-6">
            <Reveal>
                <SectionEyebrow color="#9fb8e0">The Process</SectionEyebrow>
            </Reveal>
            <Reveal delay={80}>
                <h2 className="visionary-text text-5xl md:text-7xl normal-case text-white leading-[0.95] text-center mb-20">
                    Search.
                    <br />
                    <span style={{ color: 'var(--color-amber-bright)' }}>Verify.</span> Audit.
                </h2>
            </Reveal>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {STEPS.map((s, i) => (
                    <Reveal key={s.title} delay={i * 100}>
                        <div className="p-7 rounded-3xl bg-white/[0.06] border border-white/10 backdrop-blur-sm hover:bg-white/[0.09] transition-all duration-300 hover:-translate-y-1.5 h-full">
                            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white mb-5">
                                <s.icon className="w-6 h-6" />
                            </div>
                            <h3 className="text-[17px] font-bold text-white mb-2">{s.title}</h3>
                            <p className="text-[13px] text-white/55 leading-relaxed">{s.desc}</p>
                        </div>
                    </Reveal>
                ))}
            </div>
        </div>
    </section>
);

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 4 — FEATURE GRID
// ─────────────────────────────────────────────────────────────────────────────
const FEATURES = [
    { icon: BoltIcon, title: 'Intent Detection', desc: 'Surface businesses showing real buying signals, not a directory match.', tint: 'bg-[var(--color-vivid-soft)] text-[var(--color-vivid)]' },
    { icon: ShieldCheckIcon, title: 'Contact Verification', desc: 'MX, SMTP, and live-site checks run on every lead before you reach out.', tint: 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]' },
    { icon: FingerPrintIcon, title: 'Deep Audit', desc: 'Identify the actual decision-maker — name, title, and LinkedIn — per lead.', tint: 'bg-[#efe9f4] text-[var(--color-violet)]' },
    { icon: CloudArrowDownIcon, title: 'CRM Export', desc: 'One-click export to HubSpot, Salesforce, CSV, or JSON — no reformatting.', tint: 'bg-[var(--color-gold-soft)] text-[var(--color-gold)]' },
    { icon: ChartBarIcon, title: 'Lead Scoring', desc: 'Every result ranked against your ideal customer profile, not a generic filter.', tint: 'bg-[#fdeaf0] text-[var(--color-pink)]' },
    { icon: GlobeAltIcon, title: 'Grounded Search', desc: 'Real-time web data — never fabricated companies or invented contacts.', tint: 'bg-[var(--color-rose-soft)] text-[var(--color-rose)]' },
];

const FeatureGrid = () => (
    <section className="w-full max-w-6xl mx-auto px-6 py-24 md:py-32">
        <Reveal>
            <SectionEyebrow>Built For Outbound</SectionEyebrow>
            <h2 className="visionary-text text-3xl md:text-5xl normal-case text-center max-w-2xl mx-auto mb-16 leading-tight">
                Everything you need, nothing you don't.
            </h2>
        </Reveal>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
                <Reveal key={f.title} delay={i * 60}>
                    <div className="group p-6 rounded-2xl bg-white border border-[var(--color-line)] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-black/[0.06] h-full">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110 ${f.tint}`}>
                            <f.icon className="w-5 h-5" />
                        </div>
                        <h3 className="text-[15px] font-bold text-[var(--color-ink)] mb-1.5">{f.title}</h3>
                        <p className="text-[13px] text-[var(--color-muted)] leading-relaxed">{f.desc}</p>
                    </div>
                </Reveal>
            ))}
        </div>
    </section>
);

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 5 — MARQUEE STRIP
// ─────────────────────────────────────────────────────────────────────────────
const MARQUEE_ITEMS = [
    '10x faster prospecting', '0 hallucinated leads', '24/7 discovery engine',
    'Verified contacts only', 'Deep audit included', 'Export to any CRM',
];

const MarqueeStrip = () => (
    <section className="w-full bg-[var(--color-surface-sunk)] border-y border-[var(--color-line)] py-6 overflow-hidden">
        <div className="flex whitespace-nowrap" style={{ animation: 'marquee-scroll 22s linear infinite', width: 'max-content' }}>
            {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
                <span key={i} className="flex items-center gap-3 mx-6 text-[13px] font-bold text-[var(--color-ink-soft)]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-vivid)]" /> {item}
                </span>
            ))}
        </div>
    </section>
);

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 6 — FINAL CTA
// ─────────────────────────────────────────────────────────────────────────────
const FinalCTA = ({ onNavigate }: { onNavigate: (path: string) => void }) => (
    <section className="w-full max-w-5xl mx-auto px-6 py-24 md:py-32 text-center">
        <Reveal>
            <div className="iridescent-banner relative overflow-hidden rounded-[40px] p-12 md:p-20">
                <div className="relative z-10">
                    <SectionEyebrow color="rgba(255,255,255,0.85)">Ready When You Are</SectionEyebrow>
                    <h2 className="visionary-text text-3xl md:text-5xl normal-case text-white mb-4 leading-tight">
                        Start finding leads that actually convert.
                    </h2>
                    <p className="text-[14px] text-white/80 max-w-md mx-auto mb-8 leading-relaxed">
                        No credit card required. Run your first discovery hunt in under two minutes.
                    </p>
                    <button onClick={() => onNavigate('/register')}
                        className="inline-flex items-center gap-2 px-7 py-4 rounded-2xl bg-white text-[var(--color-ink)] font-black text-[12px] uppercase tracking-widest hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
                        <RocketLaunchIcon className="w-4 h-4" /> Start Free Hunt <ArrowRightIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </Reveal>
    </section>
);

// ═══════════════════════════════════════════════════════════════════════════
// MAIN LANDING VIEW
// ═══════════════════════════════════════════════════════════════════════════
const LandingView: React.FC<LandingViewProps> = ({ setView, onNavigate }) => {
    return (
        <div className="w-full flex flex-col items-center">
            <HeroSection onNavigate={onNavigate} />
            <DiscoverySection />
            <StatsSection />
            <HowItWorksSection />
            <FeatureGrid />
            <MarqueeStrip />
            <FinalCTA onNavigate={onNavigate} />
        </div>
    );
};

export default LandingView;