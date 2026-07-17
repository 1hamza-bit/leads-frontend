import React, { useState, useEffect, useRef } from 'react';
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
import { VerificationResult } from './src/services/authService';
import { LeadStoreProvider, useLeadStore } from './src/store/LeadStoreContext';
import { useToasts } from './src/hooks/useToasts';
import { useLeadDiscovery } from './src/hooks/useLeadDiscovery';
import { useLeadAudit } from './src/hooks/useLeadAudit';

// ─── Helpers ────────────────────────────────────────────────────────────────

const normalizeUrl = (url: string) =>
  (url || '').toLowerCase()
    .replace(/https?:\/\/(www\.)?/, '')
    .replace(/\/$/, '')
    .trim();

// ─── Atmosphere ─────────────────────────────────────────────────────────────
// Quiet warm-light wash behind the app — no neon blobs, no scan lines.

const Atmosphere = () => (
  <div className="atmosphere" />
);

// NeuralGrid is retired in the light theme — kept as a no-op export so any
// remaining references elsewhere don't break, but it renders nothing.
const NeuralGrid = () => null;

type ToastType = 'tip' | 'success' | 'info' | 'progress';

const TOAST_STYLES: Record<ToastType, {
  icon: React.ElementType; label: string; iconBg: string; iconColor: string; labelColor: string; barColor: string;
}> = {
  tip: {
    icon: CpuChipIcon, label: 'Pro Tip',
    iconBg: 'bg-[var(--color-gold-soft)]', iconColor: 'text-[var(--color-gold)]',
    labelColor: 'text-[var(--color-gold)]', barColor: 'bg-[var(--color-gold)]',
  },
  success: {
    icon: CheckCircleIcon, label: 'Success',
    iconBg: 'bg-[var(--color-accent-soft)]', iconColor: 'text-[var(--color-accent)]',
    labelColor: 'text-[var(--color-accent)]', barColor: 'bg-[var(--color-accent)]',
  },
  info: {
    icon: ExclamationTriangleIcon, label: 'Heads Up',
    iconBg: 'bg-[var(--color-surface-sunk)]', iconColor: 'text-[var(--color-muted)]',
    labelColor: 'text-[var(--color-muted)]', barColor: 'bg-[var(--color-line-strong)]',
  },
  progress: {
    icon: ArrowPathIcon, label: 'In Progress',
    iconBg: 'bg-[#f2edfc]', iconColor: 'text-[#7c3aed]',
    labelColor: 'text-[#7c3aed]', barColor: 'bg-[#7c3aed]',
  },
};

const NeuralToast = ({ message, type = 'tip', onRemove }: { message: string; type?: ToastType; onRemove: () => void }) => {
  const s = TOAST_STYLES[type] ?? TOAST_STYLES.tip;
  const Icon = s.icon;
  return (
    <motion.div
      initial={{ opacity: 0, x: 60, scale: 0.96 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 60, scale: 0.96 }}
      className="glass-card relative p-4 rounded-2xl flex items-start gap-4 max-w-sm pointer-events-auto overflow-hidden"
    >
      <div className={`w-8 h-8 ${s.iconBg} ${s.iconColor} rounded-lg flex items-center justify-center shrink-0`}>
        <Icon className={`w-4 h-4 ${type === 'progress' ? 'animate-spin' : ''}`} />
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className={`eyebrow ${s.labelColor}`}>{s.label}</span>
          <button onClick={onRemove} className="text-[var(--color-faint)] hover:text-[var(--color-ink)] transition-colors">×</button>
        </div>
        <p className="text-[11px] text-[var(--color-ink)] font-medium leading-relaxed">{message}</p>
      </div>
      <motion.div
        initial={{ width: '0%' }}
        animate={{ width: '100%' }}
        transition={{ duration: 5, ease: 'linear' }}
        className={`absolute bottom-0 left-0 h-[2px] ${s.barColor}`}
      />
    </motion.div>
  );
};

// ─── Neural Loading Screen ───────────────────────────────────────────────────
// Full-viewport Three.js scene: 3D nodes scattered through space, firing
// connection beams to nearest neighbors in a cascading chain-reaction sequence.
// Runs while `isLoading` is true, then unmounts cleanly.

const NeuralLoadingScreen = () => {
    const mountRef = useRef<HTMLDivElement>(null);
    const [textVisible, setTextVisible] = useState(false);

    useEffect(() => {
        const el = mountRef.current;
        if (!el) return;

        // Lazy-import Three.js so it doesn't bloat the main bundle
        import('three').then((THREE) => {
            const W = window.innerWidth, H = window.innerHeight;

            // ── Renderer
            const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
            renderer.setSize(W, H);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            el.appendChild(renderer.domElement);

            // ── Scene + camera
            const scene = new THREE.Scene();
            const camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 1000);
            camera.position.z = 18;

            // ── 40 node positions scattered in 3D space
            const NODE_COUNT = 40;
            const positions: THREE.Vector3[] = Array.from({ length: NODE_COUNT }, () =>
                new THREE.Vector3(
                    (Math.random() - 0.5) * 28,
                    (Math.random() - 0.5) * 18,
                    (Math.random() - 0.5) * 12,
                )
            );

            // Palette from our existing token colors
            const PALETTE = [0x8b5cf6, 0x7c3aed, 0xa78bfa, 0x6d28d9, 0xf5a623, 0x8b5cf6, 0x3b82c4];

            // ── Static dim node spheres
            const nodeMeshes: THREE.Mesh[] = positions.map((pos) => {
                const geo = new THREE.SphereGeometry(0.12, 10, 10);
                const mat = new THREE.MeshBasicMaterial({ color: 0x8b7ce8, transparent: true, opacity: 0.25 });
                const mesh = new THREE.Mesh(geo, mat);
                mesh.position.copy(pos);
                scene.add(mesh);
                return mesh;
            });

            // ── Precompute 3 nearest neighbors per node
            const neighbors: number[][] = positions.map((pos, i) =>
                positions
                    .map((p, j) => ({ j, d: i === j ? Infinity : pos.distanceTo(p) }))
                    .sort((a, b) => a.d - b.d)
                    .slice(0, 3)
                    .map(x => x.j)
            );

            // ── Active beams: line segments that appear and fade
            interface Beam {
                line: THREE.Line;
                pulse: THREE.Mesh;
                progress: number;
                speed: number;
                from: THREE.Vector3;
                to: THREE.Vector3;
                color: number;
            }
            const beams: Beam[] = [];

            const spawnBeam = (fromIdx: number, toIdx: number, color: number) => {
                const from = positions[fromIdx], to = positions[toIdx];
                const points = [from.clone(), to.clone()];
                const geo = new THREE.BufferGeometry().setFromPoints(points);
                const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.55 });
                const line = new THREE.Line(geo, mat);
                scene.add(line);

                // Traveling pulse dot
                const pGeo = new THREE.SphereGeometry(0.08, 6, 6);
                const pMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 1.0 });
                const pulse = new THREE.Mesh(pGeo, pMat);
                pulse.position.copy(from);
                scene.add(pulse);

                beams.push({ line, pulse, progress: 0, speed: 0.012 + Math.random() * 0.010, from, to, color });
            };

            // ── Fire sequence: node lights up, cascades to neighbors
            const fired = new Set<number>();
            let fireQueue: Array<{ idx: number; delay: number }> = [];
            let elapsed = 0;

            const fireNode = (idx: number) => {
                if (fired.has(idx)) return;
                fired.add(idx);

                // Flash the node bright
                const mesh = nodeMeshes[idx];
                const mat = mesh.material as THREE.MeshBasicMaterial;
                const col = PALETTE[Math.floor(Math.random() * PALETTE.length)];
                mat.color.set(col);
                mat.opacity = 1.0;

                // Spawn beams to neighbors
                neighbors[idx].forEach((nIdx, i) => {
                    spawnBeam(idx, nIdx, col);
                    // Queue neighbors to fire after the beam reaches them
                    const travelTime = 0.06 + i * 0.03;
                    fireQueue.push({ idx: nIdx, delay: elapsed + travelTime });
                });
            };

            // Seed the first few nodes to kick off the cascade
            [0, 15, 28].forEach((i, idx) =>
                fireQueue.push({ idx: i, delay: idx * 0.15 })
            );

            // ── Slow camera drift for depth
            let cameraAngle = 0;

            // ── Animation loop
            let animId: number;
            const tick = () => {
                animId = requestAnimationFrame(tick);
                elapsed += 0.016;
                cameraAngle += 0.0008;
                camera.position.x = Math.sin(cameraAngle) * 2;
                camera.position.y = Math.cos(cameraAngle * 0.7) * 1;
                camera.lookAt(0, 0, 0);

                // Fire queued nodes
                const remaining: typeof fireQueue = [];
                for (const item of fireQueue) {
                    if (elapsed >= item.delay) {
                        fireNode(item.idx);
                    } else {
                        remaining.push(item);
                    }
                }
                fireQueue = remaining;

                // Update beams: advance pulse, fade line when done
                for (let i = beams.length - 1; i >= 0; i--) {
                    const b = beams[i];
                    b.progress = Math.min(b.progress + b.speed, 1);
                    b.pulse.position.lerpVectors(b.from, b.to, b.progress);
                    (b.pulse.material as THREE.MeshBasicMaterial).opacity = b.progress < 0.95 ? 1 : 1 - (b.progress - 0.95) / 0.05;
                    (b.line.material as THREE.LineBasicMaterial).opacity = 0.18 + (1 - b.progress) * 0.37;

                    if (b.progress >= 1) {
                        scene.remove(b.line, b.pulse);
                        b.line.geometry.dispose();
                        (b.line.material as THREE.Material).dispose();
                        b.pulse.geometry.dispose();
                        (b.pulse.material as THREE.Material).dispose();
                        beams.splice(i, 1);
                    }
                }

                // Gently pulse all fired nodes
                nodeMeshes.forEach((m, i) => {
                    if (fired.has(i)) {
                        const mat = m.material as THREE.MeshBasicMaterial;
                        mat.opacity = 0.4 + Math.sin(elapsed * 3 + i) * 0.25;
                    }
                });

                // Occasionally re-fire a random already-fired node to keep scene alive
                if (Math.random() < 0.012 && fired.size > 0) {
                    const firedArr = Array.from(fired);
                    const pick = firedArr[Math.floor(Math.random() * firedArr.length)];
                    const col = PALETTE[Math.floor(Math.random() * PALETTE.length)];
                    neighbors[pick].forEach(nIdx => spawnBeam(pick, nIdx, col));
                }

                renderer.render(scene, camera);
            };

            tick();

            // Show text after 0.8s — enough time for the network to feel alive
            const textTimer = setTimeout(() => setTextVisible(true), 800);

            // Resize handler
            const onResize = () => {
                const nW = window.innerWidth, nH = window.innerHeight;
                camera.aspect = nW / nH;
                camera.updateProjectionMatrix();
                renderer.setSize(nW, nH);
            };
            window.addEventListener('resize', onResize);

            return () => {
                cancelAnimationFrame(animId);
                clearTimeout(textTimer);
                window.removeEventListener('resize', onResize);
                renderer.dispose();
                if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
            };
        });
    }, []);

    return (
        <div className="fixed inset-0 z-[50] flex items-center justify-center overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #f3f4f6 0%, #f7f8f9 35%, #fbfbfc 65%, #ffffff 100%)' }}>
            <div ref={mountRef} className="absolute inset-0" />
            <div className="relative z-10 flex flex-col items-center gap-3 pointer-events-none"
                style={{ transition: 'opacity 0.6s ease', opacity: textVisible ? 1 : 0 }}>
                <p className="text-[10px] font-black text-[var(--color-muted)] uppercase tracking-[0.3em]">
                    Loading your workspace…
                </p>
            </div>
        </div>
    );
};

// ─── Hunt Flow Loader ────────────────────────────────────────────────────────
// Animated process flow diagram shown while leads are being discovered.
// Design language: soft clay/neumorphic cards, purple animated connector lines
// with a traveling light pulse, colored status dots, dotted grid background.
// Mirrors the reference image's exact visual language applied to our actual
// lead-discovery process: Query → LLM → Google → Directories → Map →
// Profiles → Ranking → Scoring → Results

interface FlowNode {
    id: string; label: string; sublabel?: string;
    col: number; row: number;    // grid position (0-indexed)
    dot: 'green' | 'blue' | 'orange' | 'gray';
    wide?: boolean;              // pill-style wide card like the "Userflow" card
}

const FLOW_NODES: FlowNode[] = [
    { id: 'query',       label: 'Query Received', sublabel: 'Niche + City + ICP',      col: 0, row: 0, dot: 'green', wide: true },
    { id: 'llm',         label: 'LLM Analysis',   sublabel: 'Intent extraction',        col: 1, row: 0, dot: 'blue',  wide: true },
    { id: 'google',      label: 'Google Search',  sublabel: 'Live web scrape',          col: 2, row: 0, dot: 'orange' },
    { id: 'directories', label: 'Directories',    sublabel: 'Yelp · Yellow · BBB',      col: 2, row: 1, dot: 'gray'  },
    { id: 'maps',        label: 'Map Listings',   sublabel: 'Google Maps API',          col: 3, row: 0, dot: 'gray'  },
    { id: 'profiles',    label: 'Biz Profiles',   sublabel: 'Site + contact scrape',    col: 3, row: 1, dot: 'gray'  },
    { id: 'ranking',     label: 'Ranking Engine', sublabel: 'Fit score algorithm',      col: 4, row: 0, dot: 'orange' },
    { id: 'scoring',     label: 'Lead Scoring',   sublabel: 'Intent · Site · Email',    col: 4, row: 1, dot: 'gray'  },
    { id: 'results',     label: 'Results Ready',  sublabel: 'Verified leads surfaced',  col: 5, row: 0, dot: 'green', wide: true },
];

// Connector pairs: [fromId, toId]
const FLOW_EDGES: [string, string][] = [
    ['query', 'llm'],
    ['llm', 'google'],
    ['llm', 'directories'],
    ['google', 'maps'],
    ['directories', 'profiles'],
    ['maps', 'ranking'],
    ['profiles', 'scoring'],
    ['ranking', 'results'],
    ['scoring', 'results'],
];

const DOT_COLOR: Record<FlowNode['dot'], string> = {
    green: '#4f6f4a',
    blue: '#7c3aed',
    orange: '#f5a623',
    gray: '#b0aaa0',
};

const HuntFlowLoader = ({ niche, city }: { niche: string; city: string }) => {
    const [activeEdge, setActiveEdge] = useState(0);
    const [litNodes, setLitNodes] = useState<Set<string>>(new Set(['query']));
    const [step, setStep] = useState(0);

    // Step through edges sequentially, lighting nodes as we go
    useEffect(() => {
        const id = setInterval(() => {
            setStep(s => {
                const next = (s + 1) % FLOW_EDGES.length;
                setActiveEdge(next);
                setLitNodes(prev => {
                    const n = new Set(prev);
                    n.add(FLOW_EDGES[next][0]);
                    n.add(FLOW_EDGES[next][1]);
                    return n;
                });
                return next;
            });
        }, 900);
        return () => clearInterval(id);
    }, []);

    // Grid layout constants
    const COLS = 6, ROWS = 2;
    const CW = 160, RH = 110;   // cell width / row height
    const PX = 24, PY = 60;     // padding
    const W = COLS * CW + PX * 2;
    const H = ROWS * RH + PY * 2 + 40;

    // Node center positions
    const nodeCenter = (n: FlowNode) => ({
        x: PX + n.col * CW + (n.wide ? CW : CW / 2),
        y: PY + n.row * RH + RH / 2,
    });

    const allCenters = Object.fromEntries(
        FLOW_NODES.map(n => [n.id, nodeCenter(n)])
    );

    // Build SVG path between two node centers (curved connector)
    const makePath = (fromId: string, toId: string) => {
        const f = allCenters[fromId], t = allCenters[toId];
        const dx = t.x - f.x, dy = t.y - f.y;
        // Bezier control points for smooth elbow-style curves
        const cx1 = f.x + dx * 0.5, cy1 = f.y;
        const cx2 = t.x - dx * 0.5, cy2 = t.y;
        return `M ${f.x} ${f.y} C ${cx1} ${cy1} ${cx2} ${cy2} ${t.x} ${t.y}`;
    };

    return (
        <div className="w-full flex flex-col items-center justify-center py-12">
            <div className="mb-10 text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--color-muted)] mb-2">Discovery Engine Active</p>
                <p className="visionary-text text-2xl md:text-3xl normal-case text-[var(--color-ink)]">
                    Hunting <span style={{ color: 'var(--color-vivid)' }}>{niche}</span> leads in <span style={{ color: 'var(--color-vivid)' }}>{city}</span>
                </p>
            </div>

            <div className="w-full overflow-x-auto pb-4">
                <div style={{ minWidth: W, margin: '0 auto', position: 'relative' }}>

                    {/* Dotted grid background — key reference detail */}
                    <svg width={W} height={H} className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
                        <defs>
                            <pattern id="dotgrid" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
                                <circle cx="12" cy="12" r="1" fill="rgba(0,0,0,0.08)" />
                            </pattern>
                        </defs>
                        <rect width={W} height={H} fill="url(#dotgrid)" />
                    </svg>

                    {/* Connector SVG layer */}
                    <svg width={W} height={H} className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
                        <defs>
                            <linearGradient id="pulse-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#7c3aed" stopOpacity="0" />
                                <stop offset="50%" stopColor="#7c3aed" stopOpacity="1" />
                                <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
                            </linearGradient>
                        </defs>
                        {FLOW_EDGES.map(([f, t], i) => {
                            const d = makePath(f, t);
                            const isActive = i === activeEdge;
                            const isLit = litNodes.has(f) && litNodes.has(t);
                            return (
                                <g key={`${f}-${t}`}>
                                    {/* Base line — dim until lit */}
                                    <path d={d} fill="none"
                                        stroke={isLit ? '#7c3aed' : '#d0cdc8'}
                                        strokeWidth={isLit ? 1.8 : 1.2}
                                        style={{ transition: 'stroke 0.4s ease, stroke-width 0.4s ease' }} />
                                    {/* Traveling pulse on the active edge */}
                                    {isActive && (
                                        <circle r="4" fill="#7c3aed" opacity="0.9"
                                            filter="url(#glow)">
                                            <animateMotion dur="0.85s" repeatCount="indefinite" path={d} />
                                        </circle>
                                    )}
                                </g>
                            );
                        })}
                        {/* Glow filter for the pulse dot */}
                        <defs>
                            <filter id="glow" x="-100%" y="-100%" width="300%" height="300%">
                                <feGaussianBlur stdDeviation="2.5" result="blur" />
                                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                            </filter>
                        </defs>
                    </svg>

                    {/* Node cards layer */}
                    <div style={{ position: 'relative', zIndex: 2, width: W, height: H }}>
                        {FLOW_NODES.map(node => {
                            const cx = allCenters[node.id];
                            const w = node.wide ? CW * 1.5 : CW - 28;
                            const h = RH - 28;
                            const x = cx.x - w / 2;
                            const y = cx.y - h / 2;
                            const isLit = litNodes.has(node.id);
                            const isActive = FLOW_EDGES[activeEdge][1] === node.id;

                            return (
                                <div key={node.id} style={{
                                    position: 'absolute',
                                    left: x, top: y, width: w, height: h,
                                    borderRadius: node.wide ? 40 : 16,
                                    background: isActive
                                        ? 'linear-gradient(135deg, #ece3fb 0%, #f2edfc 100%)'
                                        : 'white',
                                    boxShadow: isActive
                                        ? '0 0 0 2px #7c3aed, 0 6px 20px rgba(124,58,237,0.15), 0 2px 6px rgba(0,0,0,0.06)'
                                        : isLit
                                            ? '0 4px 14px rgba(0,0,0,0.07), 0 1px 3px rgba(0,0,0,0.05)'
                                            : '0 2px 8px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.04)',
                                    transition: 'all 0.45s cubic-bezier(0.4,0,0.2,1)',
                                    display: 'flex', flexDirection: 'column',
                                    alignItems: 'flex-start',
                                    justifyContent: 'flex-end',
                                    padding: '10px 14px',
                                    overflow: 'hidden',
                                }}>
                                    {/* Soft inner highlight — key to the clay feel */}
                                    <div style={{
                                        position: 'absolute', top: 0, left: 0, right: 0, height: '40%',
                                        background: 'linear-gradient(180deg, rgba(255,255,255,0.6) 0%, transparent 100%)',
                                        borderRadius: 'inherit', pointerEvents: 'none',
                                    }} />

                                    {/* Status dot + label */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                                        <span style={{
                                            width: 7, height: 7, borderRadius: '50%',
                                            background: isLit ? DOT_COLOR[node.dot] : '#ccc',
                                            boxShadow: isLit ? `0 0 6px ${DOT_COLOR[node.dot]}88` : 'none',
                                            transition: 'all 0.4s ease',
                                            flexShrink: 0,
                                        }} />
                                        <span style={{
                                            fontSize: 11, fontWeight: 700,
                                            color: isLit ? '#1d1b17' : '#aaa',
                                            letterSpacing: '0.01em',
                                            transition: 'color 0.4s ease',
                                            fontFamily: 'Inter, sans-serif',
                                        }}>{node.label}</span>
                                    </div>
                                    {node.sublabel && (
                                        <span style={{
                                            fontSize: 10, color: isLit ? '#7a7672' : '#bbb',
                                            fontFamily: 'Inter, sans-serif',
                                            transition: 'color 0.4s ease',
                                        }}>{node.sublabel}</span>
                                    )}

                                    {/* Active node: animated gradient pill (like the "Userflow" card) */}
                                    {isActive && node.wide && (
                                        <div style={{
                                            position: 'absolute', top: 10, right: 14,
                                            width: 32, height: 32, borderRadius: '50%',
                                            background: 'linear-gradient(135deg, #a78bfa, #8b5cf6, #7c3aed)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            animation: 'spin 3s linear infinite',
                                        }}>
                                            <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#ece3fb' }} />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Status strip at the bottom */}
            <div className="mt-8 flex items-center gap-3 text-[11px] font-bold text-[var(--color-muted)] uppercase tracking-widest">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] animate-pulse" />
                {['Querying', 'Analyzing', 'Searching', 'Scanning directories', 'Mapping listings', 'Scraping profiles', 'Ranking', 'Scoring', 'Finalizing'][Math.min(step, 8)]}
            </div>

            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    );
};

// ─── Route Guards ────────────────────────────────────────────────────────────

const ProtectedRoute = ({ children, currentUser, isLoading }: {
  children: React.ReactNode; currentUser: User | null; isLoading: boolean;
}) => {
  if (isLoading) return (
    <div className="flex items-center justify-center w-full py-40">
      <ArrowPathIcon className="w-8 h-8 text-[var(--color-muted)] animate-spin" />
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
      <ArrowPathIcon className="w-8 h-8 text-[var(--color-muted)] animate-spin" />
    </div>
  );
  if (!currentUser) return <Navigate to="/login" replace />;
  if (!currentUser.is_admin) return <Navigate to="/" replace />;
  return <>{children}</>;
};

// ─── Circular Progress ──────────────────────────────────────────────────────

const CircularProgress = ({
  value, size = 80, strokeWidth = 6, label, sublabel, color = '#4f6f4a', isSpinning = false,
  trackColor = 'rgba(28,26,22,0.06)', textColor = 'var(--color-ink)', subColor = 'var(--color-muted)',
}: {
  value: number; size?: number; strokeWidth?: number;
  label?: React.ReactNode; sublabel?: string; color?: string; isSpinning?: boolean;
  trackColor?: string; textColor?: string; subColor?: string;
}) => {
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  const [animPct, setAnimPct] = useState(0);
  useEffect(() => { const t = setTimeout(() => setAnimPct(pct), 80); return () => clearTimeout(t); }, [pct]);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className={isSpinning ? 'animate-spin' : ''} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={trackColor} strokeWidth={strokeWidth} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${(animPct / 100) * c} ${c}`}
          style={{ transition: 'stroke-dasharray 0.7s cubic-bezier(0.4,0,0.2,1)', filter: `drop-shadow(0 0 6px ${color}90)` }}
        />
      </svg>
      {!isSpinning && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {label !== undefined ? label : <span className="font-black text-lg leading-none" style={{ color: textColor }}>{pct}</span>}
          {sublabel && <span className="text-[8px] font-bold uppercase tracking-widest mt-0.5" style={{ color: subColor }}>{sublabel}</span>}
        </div>
      )}
    </div>
  );
};

// ─── Email Status Badge ──────────────────────────────────────────────────────

const EMAIL_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  verified: { label: 'Verified', color: 'text-[var(--color-accent)]', bg: 'bg-[var(--color-accent-soft)] border-[var(--color-accent)]/20' },
  probable: { label: 'Probable', color: 'text-[var(--color-gold)]', bg: 'bg-[var(--color-gold-soft)] border-[var(--color-gold)]/30' },
  mx_verified: { label: 'MX OK', color: 'text-[#7c3aed]', bg: 'bg-[#f2edfc] border-[#7c3aed]/25' },
  catchall_server: { label: 'Catch-All', color: 'text-[var(--color-gold)]', bg: 'bg-[var(--color-gold-soft)] border-[var(--color-gold)]/30' },
  undeliverable: { label: 'Bad Email', color: 'text-[var(--color-rose)]', bg: 'bg-[var(--color-rose-soft)] border-[var(--color-rose)]/30' },
  no_mx_record: { label: 'No MX', color: 'text-[var(--color-rose)]', bg: 'bg-[var(--color-rose-soft)] border-[var(--color-rose)]/30' },
  invalid_format: { label: 'Invalid', color: 'text-[var(--color-rose)]', bg: 'bg-[var(--color-rose-soft)] border-[var(--color-rose)]/30' },
  disposable: { label: 'Disposable', color: 'text-[var(--color-rose)]', bg: 'bg-[var(--color-rose-soft)] border-[var(--color-rose)]/30' },
};

const EmailStatusBadge = ({ status }: { status?: string }) => {
  const info = EMAIL_STATUS[status || ''] || { label: status || '—', color: 'text-[var(--color-muted)]', bg: 'bg-[var(--color-surface-sunk)] border-[var(--color-line)]' };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${info.bg} ${info.color}`}>
      {info.label}
    </span>
  );
};

const WebsiteBadge = ({ isLive, httpStatus }: { isLive?: boolean; httpStatus?: number }) => {
  if (isLive === undefined) return null;
  return isLive
    ? <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border bg-[var(--color-accent-soft)] border-[var(--color-accent)]/20 text-[var(--color-accent)]">Live {httpStatus}</span>
    : <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border bg-[var(--color-rose-soft)] border-[var(--color-rose)]/30 text-[var(--color-rose)]">Down</span>;
};

// ─── Source Badge ────────────────────────────────────────────────────────────

const SOURCE_CONFIG: Record<string, { label: string; color: string }> = {
  vault: { label: 'Vault', color: 'text-[var(--color-muted)] border-[var(--color-line-strong)]' },
  google_search: { label: 'Google', color: 'text-[#7c3aed] border-[#7c3aed]/40' },
  facebook_graph: { label: 'Facebook', color: 'text-[#5b6e9b] border-[#5b6e9b]/40' },
  facebook_gemini: { label: 'Facebook', color: 'text-[#5b6e9b] border-[#5b6e9b]/40' },
  linkedin_signal: { label: 'LinkedIn', color: 'text-[#3f8ea0] border-[#3f8ea0]/40' },
  news_signal: { label: 'News', color: 'text-[var(--color-gold)] border-[var(--color-gold)]/40' },
  ai_search: { label: 'AI Search', color: 'text-[#8a6fa8] border-[#8a6fa8]/40' },
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
    className="w-full p-5 rounded-2xl border border-[var(--color-gold)]/25 bg-[var(--color-gold-soft)] flex flex-col gap-4"
  >
    <div className="flex items-start gap-4">
      <div className="w-10 h-10 rounded-xl bg-[var(--color-surface)] flex items-center justify-center shrink-0 border border-[var(--color-gold)]/20">
        <ExclamationTriangleIcon className="w-5 h-5 text-[var(--color-gold)]" />
      </div>
      <div className="flex-1">
        <p className="text-[var(--color-ink)] font-bold text-sm">Market Exhausted</p>
        <p className="text-[var(--color-ink-soft)] text-[11px] mt-0.5 leading-relaxed">
          All known <span className="text-[var(--color-gold)] font-bold">{niche}</span> leads in{' '}
          <span className="text-[var(--color-gold)] font-bold">{city}</span> have been discovered.
        </p>
      </div>
    </div>
    {suggestedCities.length > 0 && (
      <div className="flex flex-wrap gap-2 pl-14">
        <span className="text-[9px] font-black text-[var(--color-muted)] uppercase tracking-widest self-center">Try nearby:</span>
        {suggestedCities.map(sc => (
          <button key={sc} onClick={() => onExpandCity(sc)}
            className="px-3 py-1.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-line)] text-[var(--color-ink-soft)] text-[10px] font-bold hover:border-[var(--color-gold)]/40 hover:text-[var(--color-gold)] transition-all">
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
  const [reason, setReason] = useState('');
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
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 bg-[#1d1b17]/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
        className="w-full max-w-md bg-[var(--color-surface)] border border-[var(--color-line)] rounded-3xl p-6 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-[var(--color-ink)] font-bold text-base mb-1">Lead Feedback</h3>
        <p className="text-[var(--color-muted)] text-[11px] mb-5">Your feedback trains the AI to find better leads for this niche.</p>
        <div className="flex gap-3 mb-5">
          <button onClick={() => submit('qualified')} disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[var(--color-accent-soft)] border border-[var(--color-accent)]/30 text-[var(--color-accent)] text-[10px] font-black uppercase tracking-widest hover:bg-[var(--color-accent)]/15 transition-all disabled:opacity-40">
            ✓ Qualified
          </button>
          <button onClick={() => reason ? submit('rejected') : undefined} disabled={loading || !reason}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[var(--color-rose-soft)] border border-[var(--color-rose)]/30 text-[var(--color-rose)] text-[10px] font-black uppercase tracking-widest hover:bg-[var(--color-rose)]/15 transition-all disabled:opacity-40">
            ✕ Reject
          </button>
        </div>
        <textarea
          value={reason} onChange={e => setReason(e.target.value)}
          placeholder="Why is this lead poor quality? (required for rejection)"
          rows={3}
          className="w-full bg-[var(--color-surface-sunk)] border border-[var(--color-line)] rounded-xl p-3 text-[var(--color-ink-soft)] text-[11px] placeholder-[var(--color-faint)] resize-none outline-none focus:border-[var(--color-accent)]/50 transition-colors"
        />
        <button onClick={onClose} className="mt-4 w-full text-[var(--color-muted)] text-[10px] font-bold uppercase tracking-widest hover:text-[var(--color-ink)] transition-colors">
          Cancel
        </button>
      </motion.div>
    </motion.div>
  );
};

// ─── Deep Audit Result Panel ──────────────────────────────────────────────────

const DeepAuditPanel = ({ audit }: { audit: any }) => {
  if (!audit) return null;

  const dm = audit.decision_maker;
  const socials = audit.social_profiles;
  const signals = audit.activity_signals || [];
  const updates = audit.update_summary || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="mt-6 space-y-4"
    >
      {/* Summary */}
      {audit.audit_summary && (
        <div className="p-4 bg-[#f2edfc] border border-[#7c3aed]/20 rounded-2xl">
          <p className="eyebrow text-[#7c3aed] mb-2">Audit Summary</p>
          <p className="text-[11px] text-[var(--color-ink-soft)] leading-relaxed">{audit.audit_summary}</p>
          {audit.source_notes && (
            <p className="text-[10px] text-[var(--color-muted)] mt-2 italic">{audit.source_notes}</p>
          )}
        </div>
      )}

      {/* Updates applied */}
      {updates.length > 0 && (
        <div className="p-4 bg-[var(--color-accent-soft)] border border-[var(--color-accent)]/20 rounded-2xl">
          <p className="eyebrow text-[var(--color-accent)] mb-2">Data Updated</p>
          {updates.map((u: string, i: number) => (
            <p key={i} className="text-[11px] text-[var(--color-accent)] leading-relaxed">✓ {u}</p>
          ))}
        </div>
      )}

      {/* Decision Maker */}
      {dm?.name && (
        <div className="p-4 bg-[#f2edfc] border border-[#7c3aed]/20 rounded-2xl flex items-start gap-4">
          <div className="w-10 h-10 bg-gradient-to-br from-[#a78bfa] to-[#6d28d9] rounded-xl flex items-center justify-center text-white text-base font-black shrink-0 shadow-sm shadow-[#7c3aed]/25">
            {dm.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[var(--color-ink)] font-bold text-sm">{dm.name}</p>
            {dm.title && <p className="text-[10px] text-[#7c3aed] font-black uppercase tracking-widest">{dm.title}</p>}
            {dm.email && <p className="text-[11px] text-[var(--color-ink-soft)] mt-1">{dm.email}</p>}
            {dm.linkedin_url && (
              <a href={dm.linkedin_url} target="_blank" rel="noreferrer"
                className="text-[10px] text-[#3f8ea0] hover:opacity-80 font-bold mt-1 block transition-colors">
                LinkedIn Profile →
              </a>
            )}
            {dm.note && <p className="text-[10px] text-[var(--color-muted)] italic mt-1">{dm.note}</p>}
          </div>
        </div>
      )}

      {/* Alternative contacts */}
      {(audit.contact_form_url || audit.whatsapp || audit.wechat_id) && (
        <div className="p-4 bg-[var(--color-gold-soft)] border border-[var(--color-gold)]/25 rounded-2xl space-y-2">
          <p className="eyebrow text-[var(--color-gold)] mb-3">Alternative Contacts</p>
          {audit.contact_form_url && (
            <a href={audit.contact_form_url} target="_blank" rel="noreferrer"
              className="flex items-center gap-2 text-[11px] text-[#7c3aed] hover:opacity-80 transition-colors">
              <LinkIcon className="w-3.5 h-3.5 shrink-0" /> Contact Form
            </a>
          )}
          {audit.whatsapp && (
            <p className="flex items-center gap-2 text-[11px] text-[var(--color-accent)]">
              <span className="text-[10px]">📱</span> WhatsApp: {audit.whatsapp}
            </p>
          )}
          {audit.wechat_id && (
            <p className="flex items-center gap-2 text-[11px] text-[var(--color-ink-soft)]">
              <span className="text-[10px]">💬</span> WeChat: {audit.wechat_id}
            </p>
          )}
        </div>
      )}

      {/* Social profiles */}
      {socials && Object.values(socials).some(Boolean) && (
        <div className="p-4 bg-[#e3eef0] border border-[#3f8ea0]/25 rounded-2xl space-y-2">
          <p className="eyebrow text-[#3f8ea0] mb-3">Social Profiles</p>
          {socials.linkedin_company && (
            <a href={socials.linkedin_company} target="_blank" rel="noreferrer"
              className="flex items-center gap-2 text-[11px] text-[#3f8ea0] hover:opacity-80 transition-colors">
              <LinkIcon className="w-3.5 h-3.5 shrink-0" /> LinkedIn Company
            </a>
          )}
          {socials.facebook && (
            <a href={socials.facebook} target="_blank" rel="noreferrer"
              className="flex items-center gap-2 text-[11px] text-[#5b6e9b] hover:opacity-80 transition-colors">
              <LinkIcon className="w-3.5 h-3.5 shrink-0" /> Facebook
            </a>
          )}
          {socials.twitter && (
            <a href={socials.twitter} target="_blank" rel="noreferrer"
              className="flex items-center gap-2 text-[11px] text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] transition-colors">
              <LinkIcon className="w-3.5 h-3.5 shrink-0" /> Twitter / X
            </a>
          )}
          {(socials.alibaba || socials.made_in_china) && (
            <a href={socials.alibaba || socials.made_in_china} target="_blank" rel="noreferrer"
              className="flex items-center gap-2 text-[11px] text-[var(--color-gold)] hover:opacity-80 transition-colors">
              <LinkIcon className="w-3.5 h-3.5 shrink-0" /> Trade Directory
            </a>
          )}
        </div>
      )}

      {/* Activity signals */}
      {signals.length > 0 && (
        <div className="p-4 bg-[var(--color-accent-soft)] border border-[var(--color-accent)]/20 rounded-2xl space-y-2">
          <p className="eyebrow text-[var(--color-accent)] mb-3">Activity Signals</p>
          {signals.map((s: string, i: number) => (
            <div key={i} className="flex items-start gap-2.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-gold)] mt-1.5 shrink-0" />
              <p className="text-[11px] text-[var(--color-ink-soft)] leading-relaxed">{s}</p>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

// ─── CRM Export Modal ─────────────────────────────────────────────────────────

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
  const [format, setFormat] = useState<'csv' | 'json' | 'hubspot' | 'salesforce'>('csv');
  const [status, setStatus] = useState<'all' | 'new' | 'contacted' | 'qualified' | 'verified'>('all');
  const [exporting, setExporting] = useState(false);
  const [done, setDone] = useState(false);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [countLoading, setCountLoading] = useState(false);

  const FORMATS = [
    { id: 'csv', label: 'CSV', sub: 'Universal — opens in Excel/Sheets', color: 'text-[#7c3aed] border-[#7c3aed]/30 bg-[#f2edfc]' },
    { id: 'json', label: 'JSON', sub: 'All fields incl. deep audit data', color: 'text-[#6d28d9] border-[#6d28d9]/30 bg-[#efe9fb]' },
    { id: 'hubspot', label: 'HubSpot CSV', sub: 'Direct import — HubSpot contacts', color: 'text-[var(--color-gold)] border-[var(--color-gold)]/30 bg-[var(--color-gold-soft)]' },
    { id: 'salesforce', label: 'Salesforce CSV', sub: 'Direct import — Salesforce leads', color: 'text-[#3f8ea0] border-[#3f8ea0]/30 bg-[#e3eef0]' },
  ] as const;

  const STATUSES = [
    { id: 'all', label: 'All leads' },
    { id: 'new', label: 'New only' },
    { id: 'contacted', label: 'Contacted' },
    { id: 'qualified', label: 'Qualified' },
    { id: 'verified', label: 'Verified only' },
  ] as const;

  useEffect(() => {
    setCountLoading(true);
    const params = new URLSearchParams({ format: 'json' });
    if (status !== 'all') params.set('status', status);
    if (filterNiche) params.set('niche', filterNiche);
    if (filterCity) params.set('city', filterCity);

    api.get(`/my-leads?${params.toString()}&per_page=1`)
      .then(res => setTotalCount(res.data.pagination?.total_count ?? null))
      .catch(() => setTotalCount(scope === 'session' ? leads.length : null))
      .finally(() => setCountLoading(false));
  }, [status, filterNiche, filterCity]);

  const FIELD_LABELS: Record<string, string> = {
    csv: 'Name, Email, Phone, Website, City, Niche, Score, Status, Reasoning, Email Verified, Website Live, Decision Maker',
    json: 'All fields including deep audit, decision maker, social profiles, activity signals',
    hubspot: 'First Name, Last Name, Email, Phone, Website URL, City, Industry, Lead Status, Notes, Score, Email Verified',
    salesforce: 'Last Name, First Name, Email, Phone, Website, City, Industry, Lead Status, Description, Rating (Hot/Warm/Cold)',
  };

  const doExport = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams({ format });
      if (status !== 'all') params.set('status', status);
      if (filterNiche) params.set('niche', filterNiche);
      if (filterCity) params.set('city', filterCity);

      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token') || '';
      const response = await fetch(`${api.defaults.baseURL || ''}/my-leads/export?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `Export failed: ${response.status}`);
      }

      const disposition = response.headers.get('Content-Disposition') || '';
      const filenameMatch = disposition.match(/filename=(.+)/);
      const filename = filenameMatch ? filenameMatch[1] : `intentiq-export.${format === 'json' ? 'json' : 'csv'}`;

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
      console.error('Export failed:', err);
      alert(err.message || 'Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const exportCount = countLoading ? '…' : (totalCount ?? leads.length);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 bg-[#1d1b17]/45 backdrop-blur-sm"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
        className="w-full max-w-lg bg-[var(--color-surface)] border border-[var(--color-line)] rounded-3xl overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="p-6 border-b border-[var(--color-line)] flex items-center gap-4">
          <div className="w-10 h-10 bg-[#f2edfc] rounded-2xl flex items-center justify-center">
            <CloudArrowDownIcon className="w-5 h-5 text-[#7c3aed]" />
          </div>
          <div>
            <h3 className="text-[var(--color-ink)] font-bold text-base">Export to CRM</h3>
            <p className="text-[var(--color-muted)] text-[10px]">
              {scope === 'all'
                ? 'Export all your saved leads from the database'
                : 'Export current search session results'}
            </p>
          </div>
          <button onClick={onClose} className="ml-auto text-[var(--color-faint)] hover:text-[var(--color-ink)] transition-colors text-xl">×</button>
        </div>

        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto custom-scrollbar">

          {/* Status filter */}
          <div>
            <p className="eyebrow mb-3">Filter by Status</p>
            <div className="flex flex-wrap gap-2">
              {STATUSES.map(s => (
                <button key={s.id} onClick={() => setStatus(s.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${status === s.id
                    ? 'bg-[#7c3aed] border-[#7c3aed] text-white'
                    : 'bg-[var(--color-surface-sunk)] border-[var(--color-line)] text-[var(--color-muted)] hover:border-[var(--color-line-strong)]'
                    }`}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Format picker */}
          <div>
            <p className="eyebrow mb-3">Export Format</p>
            <div className="space-y-2">
              {FORMATS.map(f => (
                <button key={f.id} onClick={() => setFormat(f.id as any)}
                  className={`w-full flex items-center gap-4 p-3.5 rounded-2xl border transition-all text-left ${format === f.id
                    ? f.color
                    : 'bg-[var(--color-surface-sunk)] border-[var(--color-line)] hover:border-[var(--color-line-strong)]'
                    }`}>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${format === f.id ? 'border-current' : 'border-[var(--color-line-strong)]'}`}>
                    {format === f.id && <div className="w-2 h-2 rounded-full bg-current" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-bold text-sm ${format === f.id ? '' : 'text-[var(--color-ink-soft)]'}`}>{f.label}</p>
                    <p className="text-[10px] text-[var(--color-muted)] mt-0.5">{f.sub}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Fields preview */}
          <div className="p-3 bg-[var(--color-surface-sunk)] border border-[var(--color-line)] rounded-xl space-y-1.5">
            <p className="eyebrow">Fields in this export</p>
            <p className="text-[10px] text-[var(--color-ink-soft)] leading-relaxed">{FIELD_LABELS[format]}</p>
          </div>

          {/* How to import guide */}
          {(format === 'hubspot' || format === 'salesforce') && (
            <div className="p-3 bg-[#f2edfc] border border-[#7c3aed]/15 rounded-xl">
              <p className="eyebrow text-[#7c3aed] mb-1.5">
                How to import into {format === 'hubspot' ? 'HubSpot' : 'Salesforce'}
              </p>
              {format === 'hubspot' ? (
                <ol className="text-[10px] text-[var(--color-ink-soft)] space-y-1 list-decimal list-inside">
                  <li>Go to Contacts → Import</li>
                  <li>Choose "Import file from computer"</li>
                  <li>Select "Contacts" as object type</li>
                  <li>Upload this CSV — columns map automatically</li>
                  <li>Review & confirm duplicate handling</li>
                </ol>
              ) : (
                <ol className="text-[10px] text-[var(--color-ink-soft)] space-y-1 list-decimal list-inside">
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
        <div className="p-6 pt-0 border-t border-[var(--color-line)]">
          {/* Lead count */}
          <div className="flex items-center justify-between mb-4 px-1">
            <span className="text-[10px] text-[var(--color-muted)]">Leads to export</span>
            <span className="text-[10px] font-black text-[var(--color-ink)]">
              {countLoading
                ? <ArrowPathIcon className="w-3.5 h-3.5 animate-spin inline text-[var(--color-muted)]" />
                : <>{exportCount} lead{Number(exportCount) !== 1 ? 's' : ''}</>}
            </span>
          </div>

          <button onClick={doExport} disabled={exporting || done}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50 shadow-lg shadow-[#7c3aed]/20">
            {exporting
              ? <><ArrowPathIcon className="w-4 h-4 animate-spin" /> Preparing {format.toUpperCase()}…</>
              : done
                ? <><CheckCircleIcon className="w-4 h-4" /> Downloaded — check your downloads!</>
                : <><CloudArrowDownIcon className="w-4 h-4" /> Download {format.toUpperCase()} ({exportCount} leads)</>}
          </button>
          <button onClick={onClose}
            className="mt-3 w-full text-[var(--color-muted)] text-[9px] font-bold uppercase tracking-widest hover:text-[var(--color-ink)] transition-colors">
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
  lead: Lead;
  onAudit: (l: Lead) => void;
  onVerify: (l: Lead) => void;
  isAuditing: boolean;
  isVerifying: boolean;
  verificationResult?: VerificationResult;
  isVerifyingAll?: boolean;
  onStatusUpdate?: (leadId: string, status: string) => void;
  auditResult?: any;
}) => {
  const [showRejection, setShowRejection] = useState(false);
  const [localStatus, setLocalStatus] = useState(lead.status || 'new');
  useEffect(() => { setLocalStatus(lead.status || 'new'); }, [lead.id, lead.status]);

  const emailVerif = (verificationResult as any)?.email;
  const websiteVerif = (verificationResult as any)?.website;

  const scoreColor =
    lead.score >= 80 ? '#34d399' :
      lead.score >= 60 ? '#a78bfa' :
        lead.score >= 40 ? '#fbbf24' : '#fb7185';

  const auditLabel =
    !lead.email && !(lead as any).phone_number ? 'Find Contact' :
      (verificationResult as any)?.overall === 'failed' ? 'Verify & Enrich' :
        'Deep Audit';

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
        className="relative rounded-3xl md:rounded-[40px] overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, #0b1220 0%, #101a34 45%, #0a0e1c 100%)',
          boxShadow: '0 0 0 1px rgba(139,92,246,0.18), 0 0 70px -16px rgba(91,143,217,0.4), 0 30px 60px -24px rgba(0,0,0,0.7)',
        }}
      >
        {/* Glossy sheen — top-left highlight, like light catching a glass tile */}
        <div className="pointer-events-none absolute inset-0"
          style={{ background: 'radial-gradient(120% 60% at 12% -5%, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.03) 35%, transparent 70%)' }} />

        {/* Header */}
        <div className="relative p-6 md:p-10 border-b border-white/10">
          <div className="flex flex-col sm:flex-row items-start gap-6">

            <div className="shrink-0">
              {isVerifyingAll ? (
                <CircularProgress value={0} size={80} strokeWidth={5} color="#a78bfa" isSpinning
                  trackColor="rgba(255,255,255,0.08)" textColor="#ffffff" subColor="#8b93b8"
                  label={<ArrowPathIcon className="w-6 h-6 text-[#a78bfa]" />}
                />
              ) : (
                <CircularProgress value={lead.score} size={80} strokeWidth={5} color={scoreColor} sublabel="Score"
                  trackColor="rgba(255,255,255,0.08)" textColor="#ffffff" subColor="#8b93b8" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h2 className="visionary-text text-2xl md:text-4xl truncate max-w-full normal-case text-white">
                  {lead.name}
                </h2>
                {(lead as any).deep_audit_ran && (
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black text-white uppercase tracking-widest"
                    style={{ background: 'rgba(124,58,237,0.18)', border: '1px solid rgba(167,139,250,0.55)', boxShadow: '0 0 14px -3px rgba(167,139,250,0.8)' }}>
                    <FingerPrintIcon className="w-3.5 h-3.5" /> Audited
                  </span>
                )}
                {localStatus === 'verified' && (
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black text-white uppercase tracking-widest"
                    style={{ background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(110,231,183,0.55)', boxShadow: '0 0 14px -3px rgba(52,211,153,0.8)' }}>
                    <CheckBadgeIcon className="w-3.5 h-3.5" /> Verified
                  </span>
                )}
                {localStatus === 'qualified' && (
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black text-white uppercase tracking-widest"
                    style={{ background: 'rgba(124,58,237,0.18)', border: '1px solid rgba(167,139,250,0.55)', boxShadow: '0 0 14px -3px rgba(167,139,250,0.8)' }}>
                    <CheckCircleIcon className="w-3.5 h-3.5" /> Qualified
                  </span>
                )}
                {localStatus === 'rejected' && (
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black text-white uppercase tracking-widest"
                    style={{ background: 'rgba(251,113,133,0.15)', border: '1px solid rgba(251,113,133,0.55)', boxShadow: '0 0 14px -3px rgba(251,113,133,0.8)' }}>
                    <XCircleIcon className="w-3.5 h-3.5" /> Rejected
                  </span>
                )}
                <SourceBadge source={(lead as any).source} />
              </div>

              <a href={lead.website} target="_blank" rel="noreferrer"
                className="text-[#8b93b8] text-xs hover:text-[#a78bfa] transition-colors truncate block max-w-full">
                {normalizeUrl(lead.website)}
              </a>

              <div className="flex flex-wrap gap-2 mt-3">
                <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-white"
                  style={{ background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(167,139,250,0.5)', boxShadow: '0 0 12px -3px rgba(167,139,250,0.7)' }}>
                  {lead.niche}
                </span>
                <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-[#c7cfe8]"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.14)' }}>
                  {lead.city}
                </span>
              </div>
            </div>

            <div className="flex sm:flex-col gap-2 shrink-0">
              <button onClick={() => onVerify(lead)} disabled={isVerifying || localStatus === 'verified'}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest text-[#6ee7b7] hover:text-white hover:-translate-y-0.5 transition-all disabled:opacity-30 disabled:translate-y-0"
                style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(110,231,183,0.4)', boxShadow: '0 0 16px -5px rgba(52,211,153,0.6)' }}>
                {isVerifying ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : <ShieldCheckIcon className="w-4 h-4" />}
                Verify
              </button>
              <button onClick={() => onAudit(lead)} disabled={isAuditing || !!(lead as any).deep_audit_ran}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest text-[#c4b5fd] hover:text-white hover:-translate-y-0.5 transition-all disabled:opacity-30 disabled:translate-y-0"
                style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(167,139,250,0.45)', boxShadow: '0 0 16px -5px rgba(139,92,246,0.65)' }}>
                {isAuditing ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : <FingerPrintIcon className="w-4 h-4" />}
                {isAuditing ? 'Auditing…' : (lead as any).deep_audit_ran ? 'Audited' : auditLabel}
              </button>
              <button onClick={() => setShowRejection(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest text-[#8b93b8] hover:text-[#fca5a5] hover:-translate-y-0.5 transition-all"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.15)' }}>
                <HandThumbDownIcon className="w-4 h-4" />
                Feedback
              </button>
            </div>
          </div>
        </div>

        {/* Contact + Email Deep Check */}
        <div className="relative grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/10 border-b border-white/10">

          <div className="p-6 md:p-10 space-y-5">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#a78bfa]">Contact Info</h4>

            {/* Decision maker from audit */}
            {auditResult?.decision_maker?.name ? (
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-4 p-4 rounded-2xl"
                style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(167,139,250,0.3)' }}>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-xl font-black shrink-0"
                  style={{ background: 'linear-gradient(135deg, #a78bfa, #6d28d9)', boxShadow: '0 0 18px -4px rgba(167,139,250,0.75)' }}>
                  {auditResult.decision_maker.name.charAt(0)}
                </div>
                <div>
                  <p className="text-white font-bold leading-none mb-1">{auditResult.decision_maker.name}</p>
                  <p className="text-[10px] text-[#c4b5fd] font-black uppercase tracking-widest">{auditResult.decision_maker.title}</p>
                </div>
              </motion.div>
            ) : (
              <div className="p-4 rounded-2xl flex items-center gap-3 text-[#8b93b8] text-[11px] italic"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <BriefcaseIcon className="w-4 h-4 shrink-0" />
                {isAuditing ? 'Searching for decision maker…' : 'Run Deep Audit to identify decision maker'}
              </div>
            )}

            <div className="space-y-2 pt-4 border-t border-white/10">
              <div className="flex items-center justify-between gap-3 p-2 -mx-2 rounded-xl hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <EnvelopeIcon className="w-4 h-4 text-[#a78bfa] shrink-0" />
                  <span className="text-sm text-[#dbe1f5] truncate">
                    {lead.email || <span className="italic text-[#6b7391] text-[11px]">No email found</span>}
                  </span>
                </div>
                <div className="shrink-0">
                  {isVerifyingAll
                    ? <CircularProgress value={0} size={28} strokeWidth={3} color="#a78bfa" isSpinning />
                    : emailVerif
                      ? <EmailStatusBadge status={emailVerif.status} />
                      : null
                  }
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 p-2 -mx-2 rounded-xl hover:bg-white/5 transition-colors">
                <a href={lead.website} target="_blank" rel="noreferrer"
                  className="flex items-center gap-3 text-sm text-[#a78bfa] hover:text-white transition-all min-w-0">
                  <LinkIcon className="w-4 h-4 text-[#a78bfa] shrink-0" />
                  <span className="truncate">{normalizeUrl(lead.website)}</span>
                </a>
                <div className="shrink-0">
                  {isVerifyingAll
                    ? <CircularProgress value={0} size={28} strokeWidth={3} color="#a78bfa" isSpinning />
                    : websiteVerif
                      ? <WebsiteBadge isLive={websiteVerif.is_live} httpStatus={websiteVerif.response_code} />
                      : null
                  }
                </div>
              </div>

              {(lead.phone || (lead as any).phone_number) && (
                <div className="flex items-center gap-3 text-sm text-[#dbe1f5] p-2 -mx-2 rounded-xl hover:bg-white/5 transition-colors">
                  <GlobeAltIcon className="w-4 h-4 text-[#a78bfa] shrink-0" />
                  <span>{lead.phone || (lead as any).phone_number}</span>
                </div>
              )}

              {auditResult?.decision_maker?.linkedin_url && (
                <a href={auditResult.decision_maker.linkedin_url} target="_blank" rel="noreferrer"
                  className="flex items-center gap-3 text-sm text-[#67c9de] hover:text-white transition-all font-bold p-2 -mx-2 rounded-xl hover:bg-white/5">
                  <LinkIcon className="w-4 h-4 shrink-0" /> LinkedIn Profile
                </a>
              )}
            </div>
          </div>

          {/* Email deep check */}
          <div className="p-6 md:p-10">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#a78bfa] mb-5">Email Deep Check</h4>
            {isVerifyingAll ? (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <CircularProgress value={66} size={64} strokeWidth={5} color="#a78bfa" isSpinning />
                <p className="text-[10px] font-black text-[#8b93b8] uppercase tracking-widest animate-pulse">Verifying contacts…</p>
              </div>
            ) : emailVerif?.checks ? (
              <div className="space-y-3">
                {[
                  { key: 'format', label: 'Format', val: emailVerif.checks.format },
                  { key: 'disposable', label: 'Not Disposable', val: !emailVerif.checks.disposable },
                  { key: 'mx', label: 'MX Record', val: emailVerif.checks.mx },
                  { key: 'smtp_reachable', label: 'SMTP Reach', val: emailVerif.checks.smtp_reachable },
                  { key: 'is_catchall', label: 'Not Catchall', val: !emailVerif.checks.is_catchall },
                  { key: 'mailbox_exists', label: 'Mailbox', val: emailVerif.checks.mailbox_exists },
                ].map(({ key, label, val }) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-[11px] text-[#8b93b8]">{label}</span>
                    {val === null || val === undefined
                      ? <span className="text-[10px] text-[#5b6382] font-bold">—</span>
                      : val
                        ? <span className="flex items-center gap-1 text-[10px] font-black text-[#6ee7b7]"><CheckCircleIcon className="w-3.5 h-3.5" /> Pass</span>
                        : <span className="flex items-center gap-1 text-[10px] font-black text-[#fb7185]"><XCircleIcon className="w-3.5 h-3.5" /> Fail</span>
                    }
                  </div>
                ))}
                <div className="pt-4 border-t border-white/10 flex items-center gap-4">
                  <CircularProgress
                    value={
                      emailVerif.deliverability === 'deliverable' ? 100 :
                        emailVerif.deliverability === 'probable' ? 65 :
                          emailVerif.deliverability === 'unknown' ? 40 : 10
                    }
                    size={52} strokeWidth={4}
                    trackColor="rgba(255,255,255,0.08)" textColor="#ffffff" subColor="#8b93b8"
                    color={
                      emailVerif.deliverability === 'deliverable' ? '#34d399' :
                        emailVerif.deliverability === 'probable' ? '#fbbf24' : '#fb7185'
                    }
                  />
                  <div>
                    <p className="text-white font-bold text-sm capitalize">{emailVerif.deliverability}</p>
                    <p className="text-[10px] text-[#8b93b8]">{emailVerif.status?.replace(/_/g, ' ')}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                <ShieldCheckIcon className="w-10 h-10 text-white/15" />
                <p className="text-[10px] text-[#6b7391] uppercase font-black tracking-widest">
                  Run verification to see email checks
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Strategic Analysis */}
        <div className="relative p-6 md:p-10 overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-[#a78bfa] via-[#8b5cf6] to-[#6d28d9]"
            style={{ boxShadow: '0 0 14px 1px rgba(167,139,250,0.7)' }} />
          <div className="flex items-center gap-2 mb-5">
            <SparklesIcon className="w-4 h-4 text-[#a78bfa]" />
            <h4 className="text-[10px] font-black text-[#a78bfa] uppercase tracking-[0.2em]">Strategic Analysis</h4>
          </div>
          <div className="mb-6 p-5 rounded-2xl [&_*]:!text-[#e7e9f7] [&_p]:!text-[15px] [&_p]:!leading-relaxed [&_p]:!font-medium [&_span]:!font-medium"
            style={{ background: 'rgba(124,58,237,0.09)', border: '1px solid rgba(167,139,250,0.35)', boxShadow: '0 0 32px -14px rgba(139,92,246,0.55)' }}>
            <ReasoningDisplay
              reasoning={(lead as any).reasoning || 'No reasoning provided.'}
            />
          </div>

          {isAuditing && (
            <div className="flex items-center gap-3 py-8 justify-center">
              <ArrowPathIcon className="w-5 h-5 text-[#a78bfa] animate-spin" />
              <p className="text-[11px] text-[#a78bfa] font-black uppercase tracking-widest animate-pulse">
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

const AppInner: React.FC = () => {
  const { user: currentUser, login, logout, updateUser, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // App state
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [globalLeads, setGlobalLeads] = useState<Lead[]>([]);

  // Search state
  const [niche, setNiche] = useState('');
  const [city, setCity] = useState('');
  const [serviceOffered, setServiceOffered] = useState('');
  const [idealCompanyType, setIdealCompanyType] = useState('');
  const [targetGoal, setTargetGoal] = useState(10);
  const [nicheIntel, setNicheIntel] = useState<NicheIntel | null>(null);

  // Admin state
  const [adminNiche, setAdminNiche] = useState('');
  const [adminCity, setAdminCity] = useState('');
  const [view, setView] = useState('');
  const [isAdminCrawlLoading, setIsAdminCrawlLoading] = useState(false);

  const [showExport, setShowExport] = useState(false);

  // ── Lead / audit / toast domain state — lives in the LeadStoreProvider
  // (Context + useReducer) mounted below, instead of ~18 useState calls
  // scattered through this component and hand-threaded through props.
  // Destructuring with the original names keeps the render tree below
  // untouched — only the *source* of these values changed.
  const { state: leadStore, dispatch: leadDispatch } = useLeadStore();
  const {
    leads, selectedLead, toasts, limitInfo, showUpgradeWall,
    verifyingLeadIds, verificationResults, marketExhausted, suggestedCities,
    loading, error, isAuditing, isVerifying, isFindingMore,
    auditResults, isBulkAuditing, bulkAuditProgress,
    auditPatches: dashboardAuditPatches,
  } = leadStore;
  const isVerifyingAll = verifyingLeadIds.size > 0;

  const { addToast, removeToast } = useToasts();
  const { runDiscovery, findMoreLeads } = useLeadDiscovery({ niche, city, idealCompanyType });
  const { handleVerifyLead, performAudit, bulkAuditMissingLeads } = useLeadAudit();

  const clearError = () => leadDispatch({ type: 'SET_ERROR', payload: null });
  const resetSession = () => leadDispatch({ type: 'RESET_SEARCH_SESSION' });

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
    if (view === 'setup') addToast("Tip: Be as specific as possible with your 'Ideal Company Type'.");
    if (view === 'results') addToast("Tip: Click a lead then run 'Deep Audit' to uncover outreach angles.");
  }, [view]);

  // Initialisation — load from localStorage
  useEffect(() => {
    const storedCampaigns = localStorage.getItem('lg_campaigns');
    const storedUsers = localStorage.getItem('lg_all_users');
    const storedGlobalLeads = localStorage.getItem('lg_global_leads');
    if (storedCampaigns) setCampaigns(JSON.parse(storedCampaigns));
    if (storedGlobalLeads) setGlobalLeads(JSON.parse(storedGlobalLeads));
    if (storedUsers) {
      setUsers(JSON.parse(storedUsers));
    } else {
      const initialUsers: User[] = [
        { id: 'u1', email: 'admin@intentiq.io', role: 'admin', plan: 'enterprise', credits: 9999, joinedAt: new Date().toISOString() },
        { id: 'u2', email: 'demo@user.com', role: 'user', plan: 'pro', credits: 250, joinedAt: new Date().toISOString() },
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
      leadDispatch({ type: 'SET_LOADING', payload: true });
      await login({ email });
      setView('dashboard');
    } catch {
      leadDispatch({ type: 'SET_ERROR', payload: 'Login failed. Please try again.' });
    } finally {
      leadDispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const handleLogout = () => { logout(); setView('landing'); };

  // startAnalysis — clears all state and navigates to search
  const startAnalysis = async () => {
    if (!niche || !city || !serviceOffered || !idealCompanyType) {
      leadDispatch({ type: 'SET_ERROR', payload: 'Niche, City, Service, and Ideal Profile are mandatory.' });
      return;
    }
    resetSession();
    leadDispatch({ type: 'SET_LOADING', payload: true });
    try {
      setView('search');
    } catch {
      leadDispatch({ type: 'SET_ERROR', payload: 'Market intelligence phase failed.' });
    } finally {
      leadDispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // handleStatusUpdate
  const handleStatusUpdate = (leadId: string, status: string) => {
    leadDispatch({ type: 'UPDATE_LEAD', payload: { id: leadId, patch: { status } } });
  };

  // runDiscovery and findMoreLeads now live in useLeadDiscovery(), destructured
  // above — this is the whole point of the refactor: this component no
  // longer owns the fetch/dedupe/verify logic, it just calls the hook.

  // handleVerifyLead, performAudit, and bulkAuditMissingLeads now live in
  // useLeadAudit(), destructured above.

  // Admin crawl
  const runAdminGlobalCrawl = async () => {
    if (!adminNiche || !adminCity) return;
    setIsAdminCrawlLoading(true);
    try {
      const res = await api.post('/search-leads', {
        niche: adminNiche,
        city: adminCity,
        count: 20,
        idealCompanyType: 'Any',
      });
      const found = res.data?.data || [];
      alert(`Ingestion Complete! Found ${found.length} leads.`);
      setAdminNiche('');
      setAdminCity('');
    } catch {
      leadDispatch({ type: 'SET_ERROR', payload: 'Admin ingestion crawl failed.' });
    } finally {
      setIsAdminCrawlLoading(false);
    }
  };

  const handlePlanUpgrade = (planId: PlanType) => {
    if (!currentUser) return;
    const plan = PLANS.find(p => p.id === planId)!;
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
    resetSession();
    navigate('/setup');
  };

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════════

  return (
    <>
      {isLoading ? (
        <NeuralLoadingScreen />
      ) : (
        <div className="canvas-gradient min-h-screen text-[var(--color-ink-soft)] flex flex-col font-sans selection:bg-[#7c3aed]/30 overflow-x-hidden">
          <Atmosphere />

          {/* Toasts */}
          <div className="fixed bottom-4 md:bottom-10 right-4 md:right-10 z-[100] flex flex-col gap-4 pointer-events-none max-w-[calc(100vw-2rem)] md:max-w-sm">
            <AnimatePresence>
              {toasts.map(t => (
                <NeuralToast key={t.id} message={t.message} type={t.type} onRemove={() => removeToast(t.id)} />
              ))}
            </AnimatePresence>
          </div>

          {/* CRM Export Modal */}
          <AnimatePresence>
            {showExport && <CRMExportModal leads={leads} onClose={() => setShowExport(false)} />}
          </AnimatePresence>

          {/* Header */}
          <header className="px-4 md:px-10 py-4 md:py-5 flex items-center justify-between border-b border-[var(--color-line)] bg-white/55 backdrop-blur-xl sticky top-0 z-50">
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate(currentUser ? '/dashboard' : '/')}>
              <div className="bg-[var(--color-surface)] p-2 rounded-xl border border-[var(--color-line)] group-hover:border-[#7c3aed]/40 transition-all">
                <RocketLaunchIcon className="w-5 h-5 text-[#7c3aed]" />
              </div>
              <h1 className="text-xs md:text-sm font-bold tracking-[0.05em] text-[var(--color-ink)]">
                Intent<span className="text-[#7c3aed]">IQ</span>
              </h1>
            </div>

            <nav className="flex items-center gap-3 md:gap-8">
              {currentUser ? (
                <>
                  <button onClick={() => navigate('/dashboard')}
                    className={`text-[9px] md:text-[10px] font-bold uppercase tracking-widest transition-all ${location.pathname === '/dashboard' ? 'text-[#7c3aed]' : 'text-[var(--color-muted)] hover:text-[var(--color-ink)]'}`}>
                    Dash
                  </button>
                  {currentUser.is_admin && (
                    <button onClick={() => navigate('/admin')}
                      className={`hidden sm:block text-[9px] md:text-[10px] font-bold uppercase tracking-widest transition-all ${location.pathname === '/admin' ? 'text-[var(--color-gold)]' : 'text-[var(--color-muted)] hover:text-[var(--color-ink)]'}`}>
                      Admin
                    </button>
                  )}
                  <button onClick={() => navigate('/pricing')}
                    className={`text-[9px] md:text-[10px] font-bold uppercase tracking-widest transition-all ${location.pathname === '/pricing' ? 'text-[#7c3aed]' : 'text-[var(--color-muted)] hover:text-[var(--color-ink)]'}`}>
                    Billing
                  </button>
                  <div className="w-px h-4 bg-[var(--color-line-strong)] mx-1 md:mx-2" />
                  <div className="flex items-center gap-2 md:gap-4">
                    <div className="text-right hidden xs:block">
                      <p className="text-[9px] md:text-[10px] font-black text-[var(--color-ink)] uppercase tracking-tighter truncate max-w-[80px] md:max-w-none">
                        {currentUser.email?.split('@')[0]}
                      </p>
                      {!currentUser.is_admin && (
                        <p className="text-[8px] md:text-[9px] font-bold text-[#7c3aed] uppercase">
                          {currentUser.credits} CR
                        </p>
                      )}
                    </div>
                    <button onClick={handleLogout}
                      className="p-2 bg-[var(--color-surface)] border border-[var(--color-line)] rounded-lg hover:border-[var(--color-rose)]/30 hover:text-[var(--color-rose)] transition-all">
                      <ArrowLeftOnRectangleIcon className="w-4 h-4" />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <button onClick={() => navigate('/pricing')} className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted)] hover:text-[var(--color-ink)]">Pricing</button>
                  {location.pathname !== '/login' && location.pathname !== '/register' && (
                    <button onClick={() => navigate('/login')}
                      className="bg-[#7c3aed] text-white font-black px-4 md:px-6 py-2 md:py-2.5 rounded-xl text-[9px] md:text-[10px] uppercase tracking-widest shadow-lg shadow-[#7c3aed]/20 hover:bg-[#6d28d9] transition-all">
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
              <div className="max-w-md w-full my-8 bg-[var(--color-rose-soft)] border border-[var(--color-rose)]/25 p-5 rounded-2xl flex items-center gap-4 text-[var(--color-rose)] text-[11px] animate-in slide-in-from-top-4">
                <ExclamationTriangleIcon className="w-5 h-5" />
                <p>{error}</p>
                <button onClick={clearError} className="ml-auto text-[var(--color-rose)]/60 hover:text-[var(--color-rose)]">×</button>
              </div>
            )}

            <Routes>
              <Route path="/" element={<LandingView setView={setView} onNavigate={navigate} />} />
              <Route path="/login" element={<LoginInput onLogin={handleLogin} initialMode="login" />} />
              <Route path="/register" element={<LoginInput onLogin={handleLogin} initialMode="register" />} />

              <Route path="/dashboard" element={
                <ProtectedRoute currentUser={currentUser} isLoading={isLoading}>
                  <UserDashboard
                    onNavigate={navigate} currentUser={currentUser!} campaigns={campaigns}
                    globalLeads={globalLeads} setNiche={setNiche} setCity={setCity}
                    setServiceOffered={setServiceOffered} setIdealCompanyType={setIdealCompanyType}
                    setLeads={(l) => leadDispatch({ type: 'SET_LEADS', payload: l })} setNicheIntel={setNicheIntel}
                    onBulkAudit={(leadsToAudit) => bulkAuditMissingLeads(leadsToAudit ?? [])}
                    isBulkAuditing={isBulkAuditing}
                    bulkAuditProgress={bulkAuditProgress}
                    auditedLeads={dashboardAuditPatches}
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
                        <div className="flex items-center justify-between p-4 bg-[var(--color-surface)] border border-[var(--color-line)] rounded-2xl">
                          <h3 className="text-[var(--color-ink)] font-bold text-sm flex items-center gap-2">
                            Target List ({leads.length})
                            {isVerifyingAll && (
                              <span className="text-[9px] font-black text-[#7c3aed] uppercase tracking-widest animate-pulse">
                                · Verifying
                              </span>
                            )}
                          </h3>

                          <button onClick={() => {
                            resetSession();
                            navigate('/dashboard');
                          }}
                            className="text-[9px] font-black text-[#7c3aed] uppercase tracking-widest">
                            Close Hunt
                          </button>
                        </div>

                        <div className="space-y-3 overflow-y-auto max-h-[40vh] lg:max-h-[70vh] pr-2 custom-scrollbar">
                          {leads.map(l => {
                            const vr = verificationResults[l.id] as any;
                            const emailOk = vr?.email?.is_valid;
                            const hasAudit = !!auditResults[l.id];
                            const tier: 'high' | 'mid' | 'low' = l.score >= 70 ? 'high' : l.score >= 40 ? 'mid' : 'low';
                            const avatarGrad = tier === 'high'
                              ? 'bg-gradient-to-br from-[#5f8a58] to-[#3d5a3a]'
                              : tier === 'mid'
                                ? 'bg-gradient-to-br from-[#a78bfa] to-[#6d28d9]'
                                : 'bg-gradient-to-br from-[var(--color-muted)] to-[var(--color-ink-soft)]';
                            const barColor = tier === 'high' ? 'bg-[var(--color-accent)]' : tier === 'mid' ? 'bg-[#7c3aed]' : 'bg-[var(--color-line-strong)]';
                            const scorePill = tier === 'high'
                              ? 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]'
                              : tier === 'mid'
                                ? 'bg-[#f2edfc] text-[#7c3aed]'
                                : 'bg-[var(--color-surface-sunk)] text-[var(--color-faint)]';
                            return (
                              <div
                                key={l.id}
                                onClick={() => { leadDispatch({ type: 'SET_SELECTED_LEAD', payload: l }); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                className={`group relative overflow-hidden p-4 md:p-5 pl-5 rounded-2xl border cursor-pointer transition-all duration-200 hover:-translate-y-0.5 ${selectedLead?.id === l.id
                                  ? 'bg-gradient-to-br from-[#f2edfc] to-[var(--color-surface)] border-[#7c3aed]/40 shadow-lg shadow-[#7c3aed]/10'
                                  : 'bg-[var(--color-surface)] border-[var(--color-line)] hover:border-[#7c3aed]/30 hover:shadow-md hover:shadow-[#7c3aed]/[0.07]'
                                  }`}
                              >
                                <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${barColor} transition-all duration-200 group-hover:w-[5px]`} />
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-black shrink-0 shadow-sm transition-transform duration-200 group-hover:scale-105 ${avatarGrad}`}>
                                      {(l.name || '?').charAt(0).toUpperCase()}
                                    </div>
                                    <div className="min-w-0 flex items-center gap-1.5">
                                      {l.status === 'verified' && <CheckBadgeIcon className="w-3.5 h-3.5 text-[var(--color-accent)] shrink-0" />}
                                      {l.status === 'qualified' && <CheckCircleIcon className="w-3.5 h-3.5 text-[#7c3aed] shrink-0" />}
                                      {l.status === 'rejected' && <XCircleIcon className="w-3.5 h-3.5 text-[var(--color-rose)] shrink-0" />}
                                      <h4 className="text-[var(--color-ink)] font-bold text-sm truncate">{l.name}</h4>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    {verifyingLeadIds.has(l.id) ? (
                                      <ArrowPathIcon className="w-3 h-3 text-[#7c3aed] animate-spin" />
                                    ) : emailOk !== undefined ? (
                                      <div className={`w-2 h-2 rounded-full ${emailOk ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-rose)]'}`} />
                                    ) : null}
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black transition-transform duration-200 group-hover:scale-105 ${scorePill}`}>
                                      {l.score}%
                                    </span>
                                  </div>
                                </div>
                                <p className="text-[10px] text-[var(--color-muted)] mt-1 truncate">{normalizeUrl(l.website)}</p>
                                {(l as any).source && (
                                  <div className="mt-2">
                                    <SourceBadge source={(l as any).source} />
                                  </div>
                                )}
                                {/* Buying signal preview */}
                                {(() => {
                                  const { intentKeywords } = parseReasoning((l as any).reasoning || '');
                                  return intentKeywords.length > 0 ? (
                                    <div className="mt-2 flex items-center gap-1.5 text-[9px] font-black text-[var(--color-gold)] uppercase tracking-widest">
                                      <BoltIcon className="w-3 h-3" />
                                      {intentKeywords[0]}
                                      {intentKeywords.length > 1 && <span className="text-[var(--color-faint)]">+{intentKeywords.length - 1}</span>}
                                    </div>
                                  ) : null;
                                })()}
                                {(hasAudit || (l as any).deep_audit_ran) && (
                                  <div className="mt-2 flex items-center gap-1.5 text-[9px] font-black text-[#7c3aed] uppercase tracking-widest">
                                    <FingerPrintIcon className="w-3 h-3" /> Audited
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Find More Leads — re-runs the same hunt (same niche,
                            city, service, ICP) and appends fresh results to
                            this list instead of starting over. */}
                        <button
                          type="button"
                          onClick={findMoreLeads}
                          disabled={isFindingMore || loading}
                          className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-[#f2edfc] border border-[#7c3aed]/25 text-[#7c3aed] text-[10px] font-black uppercase tracking-widest hover:bg-[#7c3aed]/15 hover:-translate-y-0.5 transition-all disabled:opacity-40 disabled:pointer-events-none shrink-0"
                        >
                          {isFindingMore ? (
                            <><ArrowPathIcon className="w-3.5 h-3.5 animate-spin" /> Finding more…</>
                          ) : (
                            <><MagnifyingGlassIcon className="w-3.5 h-3.5" /> Find More Leads</>
                          )}
                        </button>
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
                            isVerifyingAll={verifyingLeadIds.has(selectedLead.id)}
                            onStatusUpdate={handleStatusUpdate}
                            auditResult={auditResults[selectedLead.id] ?? null}
                          />
                        ) : (
                          <div className="h-full border border-dashed border-[var(--color-line-strong)] rounded-3xl md:rounded-[40px] flex flex-col items-center justify-center py-20 md:py-40">
                            <SparklesIcon className="w-12 h-12 md:w-16 md:h-16 text-[var(--color-line-strong)] mb-6" />
                            <p className="text-[var(--color-faint)] text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em]">
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
                        <ArrowPathIcon className="w-10 h-10 text-[var(--color-muted)] animate-spin mx-auto mb-6" />
                        <h3 className="visionary-text text-3xl normal-case mb-2">Developing strategy…</h3>
                        <p className="text-[var(--color-muted)] text-sm uppercase tracking-widest font-bold">Checking Global Index First</p>
                      </div>
                    ) : (
                      <>
                        <div className="text-center mb-12">
                          <h2 className="visionary-text text-4xl md:text-5xl normal-case mb-4">Hunt Ready</h2>
                          <p className="text-[var(--color-muted)] text-sm">Identified the best strategy for <span className="text-[var(--color-ink)] font-bold">{niche}</span> in <span className="text-[var(--color-ink)] font-bold">{city}</span>.</p>
                        </div>

                        <div className="space-y-6">
                          <div className="bg-[var(--color-surface)] border border-[var(--color-line)] p-8 rounded-3xl" style={{ boxShadow: '0 1px 2px rgba(28,26,22,0.04), 0 8px 24px -8px rgba(28,26,22,0.06)' }}>
                            <h4 className="text-[var(--color-ink)] font-bold mb-4 uppercase text-xs tracking-widest flex items-center gap-2">
                              <SparklesIcon className="w-4 h-4 text-[var(--color-gold)]" /> Launch Parameters
                            </h4>
                            <div className="flex items-center justify-between mb-6">
                              <span className="text-[10px] font-bold text-[var(--color-muted)] uppercase tracking-widest">Leads to Hunt</span>
                              <div className="flex items-center gap-4">
                                <input
                                  type="number"
                                  className="bg-[var(--color-surface-sunk)] border border-[var(--color-line)] rounded-lg text-[var(--color-ink)] font-black text-lg w-16 text-center outline-none focus:border-[var(--color-line-strong)]"
                                  value={targetGoal}
                                  onChange={e => setTargetGoal(Number(e.target.value))}
                                />
                                <span className="text-[10px] font-black text-[#7c3aed] uppercase">{targetGoal} CR</span>
                              </div>
                            </div>
                            <button
                              onClick={() => runDiscovery(targetGoal)}
                              className="w-full bg-[#7c3aed] py-6 rounded-2xl text-white font-black uppercase text-xs tracking-widest shadow-xl shadow-[#7c3aed]/20 hover:bg-[#6d28d9] transition-all flex items-center justify-center gap-2"
                            >
                              Launch Fresh Batch Scrape <RocketLaunchIcon className="w-5 h-5" />
                            </button>
                            <p className="text-center text-[9px] text-[var(--color-faint)] mt-4 uppercase font-bold tracking-widest">
                              Grounded AI Hunt · No Hallucinations
                            </p>
                          </div>
                          <button onClick={() => navigate('/dashboard')}
                            className="w-full text-[10px] font-bold text-[var(--color-muted)] uppercase tracking-widest hover:text-[var(--color-ink)] transition-all">
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
              <Route path="/terms" element={<TermsOfService onBack={() => navigate(-1)} />} />
            </Routes>
          </main>

          {/* Footer */}
          {location.pathname !== '/login' && location.pathname !== '/register' && (
            <footer className="px-10 py-6 bg-transparent border-t border-[var(--color-line)] flex items-center justify-between text-[9px] font-bold text-[var(--color-faint)] uppercase tracking-widest">
              <div className="flex items-center gap-8">
                <span>&copy; 2025 INTENTIQ</span>
                <span className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)]" /> All Systems Operational
                </span>
              </div>
              <div className="flex gap-6">
                <button onClick={() => navigate('/privacy')} className="hover:text-[var(--color-ink)] transition-colors">Privacy</button>
                <button onClick={() => navigate('/terms')} className="hover:text-[var(--color-ink)] transition-colors">Terms</button>
                <a href="#" className="hover:text-[var(--color-ink)] transition-colors">Help</a>
              </div>
            </footer>
          )}
          <CookieConsent onManage={() => navigate('/privacy')} />
        </div>
      )}
    </>
  );
};

// App is mounted under a Router already (useNavigate/useLocation are used
// inside AppInner), so LeadStoreProvider only needs to wrap AppInner itself —
// it has no dependency on routing.
const App: React.FC = () => (
  <LeadStoreProvider>
    <AppInner />
  </LeadStoreProvider>
);

export default App;