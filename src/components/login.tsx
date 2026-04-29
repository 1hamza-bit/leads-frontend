import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useGoogleLogin } from '@react-oauth/google';
import {
    ShieldCheckIcon, EnvelopeIcon, UserIcon,
    ExclamationTriangleIcon, CheckCircleIcon,
    XCircleIcon,
} from '@heroicons/react/24/outline';

import { useAuth } from '../contexts/AuthContext';

interface LoginInputProps {
    onLogin: (email: string, pass: string, mode: 'login' | 'register') => void;
    initialMode?: 'login' | 'register';
}

// ── CHANGED: Toast state is now a typed object (or null), never a bare string ─
// BEFORE: useState('') — caused setToast({ message, type }) to silently fail
//         because the state was typed as string, so the object was stored but
//         the conditional `{toast && ...}` rendered nothing (object is truthy
//         but .message was never read correctly in some render paths).
// NOW:    typed as { message: string; type: 'success' | 'error' | 'info' } | null
// ─────────────────────────────────────────────────────────────────────────────
interface ToastState {
    message: string;
    type: 'success' | 'error' | 'info';
}

const NeuralToast = ({ message, type = 'error', onRemove }: {
    message: string;
    type?: 'success' | 'error' | 'info';
    onRemove: () => void;
}) => {
    // Auto-dismiss after 6 seconds
    useEffect(() => {
        const t = setTimeout(onRemove, 6000);
        return () => clearTimeout(t);
    }, [onRemove]);

    const config = {
        success: {
            border: 'border-emerald-500/30',
            bg: 'bg-emerald-500/20',
            text: 'text-emerald-400',
            bar: 'bg-emerald-500',
            icon: <CheckCircleIcon className="w-5 h-5" />,
            label: 'Success'
        },
        error: {
            border: 'border-red-500/30',
            bg: 'bg-red-500/20',
            text: 'text-red-400',
            bar: 'bg-red-500',
            icon: <XCircleIcon className="w-5 h-5" />,
            label: 'System Error'
        },
        info: {
            border: 'border-indigo-500/30',
            bg: 'bg-indigo-500/20',
            text: 'text-indigo-400',
            bar: 'bg-indigo-500',
            icon: <ExclamationTriangleIcon className="w-5 h-5" />,
            label: 'Info'
        },
    };

    const style = config[type] ?? config.error;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className={`glass-card p-5 rounded-2xl border ${style.border} shadow-2xl flex items-start gap-4 min-w-[320px] max-w-md pointer-events-auto relative overflow-hidden`}
        >
            <div className={`w-10 h-10 ${style.bg} rounded-xl flex items-center justify-center ${style.text} shrink-0`}>
                {style.icon}
            </div>
            <div className="flex-1 pr-4">
                <div className="flex items-center justify-between mb-1">
                    <span className={`text-[10px] font-black ${style.text} uppercase tracking-widest`}>
                        {style.label}
                    </span>
                    <button
                        onClick={onRemove}
                        className="text-slate-500 hover:text-white transition-colors text-lg leading-none"
                    >
                        ×
                    </button>
                </div>
                <p className="text-[13px] text-white font-medium leading-relaxed">{message}</p>
            </div>
            <motion.div
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 6, ease: 'linear' }}
                className={`absolute bottom-0 left-0 h-[3px] ${style.bar}`}
            />
        </motion.div>
    );
};

const LoginInput = ({ onLogin, initialMode = 'login' }: LoginInputProps) => {
    const [email, setEmail]       = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [mode, setMode]         = useState<'login' | 'register'>(initialMode);
    const [isLoading, setIsLoading] = useState(false);

    // ── CHANGED: typed as ToastState | null instead of string ────────────────
    const [toast, setToast] = useState<ToastState | null>(null);

    const { loginWithGoogle, login, register } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        setMode(initialMode);
    }, [initialMode]);

    const showToast = (message: string, type: ToastState['type'] = 'error') => {
        setToast({ message, type });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            if (mode === 'login') {
                const loggedInUser = await login({ email, password });

                showToast(`Welcome back, ${loggedInUser.username}!`, 'success');
                setEmail('');
                setPassword('');

                if (loggedInUser?.is_admin) {
                    navigate('/admin');
                } else {
                    navigate('/dashboard');
                }

            } else {
                // ── CHANGED: Registration flow completely rewritten ────────────
                // BEFORE:
                //   1. show toast
                //   2. setMode('login')  ← immediately overwrote the screen,
                //      hiding the toast under a full re-render before the user
                //      could read it.
                //
                // NOW:
                //   1. call register()
                //   2. clear fields
                //   3. show toast with the confirmation email message
                //   4. wait 3 seconds so the user can READ the message
                //   5. THEN switch to login tab
                //
                // The toast auto-dismisses after 6s (handled in NeuralToast),
                // but we only delay the tab-switch for 3s — enough to read it.
                // ─────────────────────────────────────────────────────────────
                await register({
                    email,
                    password,
                    username: username || email.split('@')[0],
                });

                // Clear fields immediately
                setEmail('');
                setPassword('');
                setUsername('');

                // Show the confirmation message BEFORE switching mode
                showToast(
                    `Account created! Check ${email} for a verification link before logging in.`,
                    'success'
                );

                // Give the user 3 seconds to read the toast, then slide to login
                setTimeout(() => {
                    setMode('login');
                }, 3000);
            }

        } catch (err: any) {
            const msg = err.response?.data?.msg || err.message || 'Authentication failed';
            showToast(msg, 'error');
            // Don't clear fields on error so the user can fix their input
        } finally {
            setIsLoading(false);
        }
    };

    const handleCustomGoogleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            try {
                await loginWithGoogle(tokenResponse.access_token);
                navigate('/dashboard');
            } catch {
                showToast('Google login failed. Please try again.', 'error');
            }
        },
        onError: () => showToast('Google Login Failed', 'error'),
    });

    return (
        <div className="flex-1 w-full flex overflow-x-hidden min-h-[600px] bg-slate-950">

            {/* ── Toast container ── */}
            {/* CHANGED: wrapped in AnimatePresence so exit animation plays */}
            <div className="fixed bottom-8 right-8 z-[9999] flex flex-col gap-4 pointer-events-none">
                <AnimatePresence>
                    {toast && (
                        <NeuralToast
                            key="toast"
                            message={toast.message}
                            type={toast.type}
                            onRemove={() => setToast(null)}
                        />
                    )}
                </AnimatePresence>
            </div>

            {/* ── Left panel ── */}
            <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-center py-20 px-20 overflow-hidden border-r border-white/5">
                <BackgroundDecor />

                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="relative z-10 bg-white/5 backdrop-blur-xl p-8 rounded-[32px] border border-white/10 shadow-2xl max-w-sm mb-12"
                >
                    <ProfileCardHeader />
                    <ExperienceBar progress="30%" />
                    <div className="mt-6 flex justify-between items-center">
                        <div className="flex gap-1">
                            {['bg-emerald-500', 'bg-amber-500', 'bg-red-500'].map(color => (
                                <div key={color} className={`w-1.5 h-1.5 rounded-full ${color}`} />
                            ))}
                        </div>
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                            Stats loading...
                        </span>
                    </div>
                </motion.div>

                <div className="relative z-10">
                    <h2 className="text-5xl font-black text-white mb-6 leading-[0.9] tracking-tighter">
                        Your lead hunting <br />
                        <span className="text-indigo-500">
                            {mode === 'login' ? 'continues' : 'starts'} here.
                        </span>
                    </h2>
                    <p className="text-slate-400 text-lg max-w-md leading-relaxed font-medium">
                        Manage campaigns, build lists, and gain intelligence in real-time.
                    </p>
                </div>
            </div>

            {/* ── Right panel: form ── */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 md:px-12 lg:px-24 py-12">
                <div className="max-w-md w-full mx-auto">

                    <header className="mb-8 md:mb-12">
                        <h3 className="text-3xl md:text-4xl font-black text-white mb-2 tracking-tighter">
                            {mode === 'login' ? 'Welcome Back' : 'Join the Realm'}
                        </h3>
                        <p className="text-slate-500 text-xs md:text-sm font-medium">
                            {mode === 'login' ? 'Ready to continue your quest?' : 'Start your journey today.'}
                        </p>
                    </header>

                    {/* Mode tabs */}
                    <div className="flex border-b border-white/5 mb-10">
                        {(['login', 'register'] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setMode(tab)}
                                className={`flex-1 py-4 text-xs font-black uppercase tracking-[0.2em] transition-all relative ${
                                    mode === tab ? 'text-white' : 'text-slate-600 hover:text-slate-400'
                                }`}
                            >
                                {tab === 'login' ? 'Login' : 'Sign Up'}
                                {mode === tab && (
                                    <motion.div
                                        layoutId="auth-tab"
                                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500"
                                    />
                                )}
                            </button>
                        ))}
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="space-y-6">
                            {mode === 'register' && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    <InputGroup
                                        label="Username"
                                        type="text"
                                        placeholder="GrandHunter_01"
                                        value={username}
                                        onChange={setUsername}
                                        Icon={UserIcon}
                                    />
                                </motion.div>
                            )}
                            <InputGroup
                                label="Email Address"
                                type="email"
                                placeholder="hunter@leadgen.ai"
                                value={email}
                                onChange={setEmail}
                                Icon={EnvelopeIcon}
                            />
                            <InputGroup
                                label="Password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={setPassword}
                                Icon={ShieldCheckIcon}
                                showForgot={mode === 'login'}
                            />
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-indigo-600 py-5 rounded-2xl text-white font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-indigo-600/20 hover:bg-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                        >
                            {/* ── CHANGED: spinner shown while loading ── */}
                            {isLoading ? (
                                <>
                                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                                    </svg>
                                    {mode === 'login' ? 'Authenticating...' : 'Creating account...'}
                                </>
                            ) : (
                                mode === 'login' ? 'Enter World' : 'Create Character'
                            )}
                        </motion.button>
                    </form>

                    {/* Social logins */}
                    <div className="mt-8 space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="h-px bg-white/5 flex-1" />
                            <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">
                                Social Entry
                            </span>
                            <div className="h-px bg-white/5 flex-1" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <button
                                type="button"
                                disabled={isLoading}
                                onClick={() => handleCustomGoogleLogin()}
                                className="flex items-center justify-center gap-3 bg-white/[0.02] border border-white/10 py-4 rounded-xl text-white font-bold text-[10px] uppercase tracking-widest hover:bg-white/5 transition-all disabled:opacity-50"
                            >
                                <svg className="w-4 h-4" viewBox="0 0 24 24">
                                    <path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.273 0 3.191 2.727 1.227 6.709l4.039 3.056z"/>
                                    <path fill="#FBBC05" d="M1.227 6.709L5.266 9.765a7.075 7.075 0 0 1 0 4.47l-4.039 3.056c-.773-1.573-1.227-3.327-1.227-5.182 0-1.854.454-3.609 1.227-5.182z"/>
                                    <path fill="#4285F4" d="M12 24c3.127 0 5.728-1.036 7.636-2.809l-3.9-3.018c-1.045.7-2.382 1.109-3.736 1.109-2.882 0-5.327-1.945-6.2-4.564l-4.039 3.056C3.191 21.273 7.273 24 12 24z"/>
                                    <path fill="#34A853" d="M17.764 16.173A7.077 7.077 0 0 1 12 19.091c-2.882 0-5.327-1.945-6.2-4.564l-4.039 3.056C3.191 21.273 7.273 24 12 24c3.127 0 5.728-1.036 7.636-2.809l-3.9-3.018z"/>
                                    <path fill="#4285F4" d="M23.491 9.5c.345 1.5.509 3.045.509 4.5 0 1.5-.164 3-.509 4.5H12V9.5h11.491z"/>
                                </svg>
                                Google
                            </button>

                            <button
                                type="button"
                                className="flex items-center justify-center gap-3 bg-white/[0.02] border border-white/10 py-4 rounded-xl text-white font-bold text-[10px] uppercase tracking-widest hover:bg-white/5 transition-all"
                            >
                                GitHub
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

// ── Sub-components ────────────────────────────────────────────────────────────

const BackgroundDecor = () => (
    <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-transparent opacity-50" />
        <div className="absolute bottom-[-10%] left-[-10%] right-[-10%] h-[60%] opacity-20">
            <svg viewBox="0 0 1000 1000" className="w-full h-full text-indigo-500 fill-current">
                <path d="M0,1000 L0,800 Q250,600 500,800 T1000,800 L1000,1000 Z" />
            </svg>
        </div>
    </div>
);

const ProfileCardHeader = () => (
    <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center shadow-lg">
            <UserIcon className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
            <div className="flex items-center justify-between">
                <h4 className="text-white font-bold text-sm">New Explorer</h4>
                <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-2 py-0.5 rounded">
                    Init...
                </span>
            </div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Level 0</p>
        </div>
    </div>
);

const ExperienceBar = ({ progress }: { progress: string }) => (
    <div className="space-y-2">
        <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-500">
            <span>Experience</span>
            <span>0 / 100 XP</span>
        </div>
        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <motion.div
                initial={{ width: 0 }}
                animate={{ width: progress }}
                className="h-full bg-indigo-500"
            />
        </div>
    </div>
);

const InputGroup = ({ label, type, placeholder, value, onChange, Icon, showForgot }: any) => (
    <div className="space-y-2">
        <div className="flex justify-between items-center ml-1">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                {label}
            </label>
            {showForgot && (
                <button
                    type="button"
                    className="text-[10px] font-black text-indigo-500 uppercase tracking-widest hover:text-indigo-400"
                >
                    Forgot?
                </button>
            )}
        </div>
        <div className="relative group">
            <Icon className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 group-focus-within:text-indigo-500 transition-colors" />
            <input
                type={type}
                placeholder={placeholder}
                value={value}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/5 py-5 pl-14 pr-6 rounded-2xl text-white outline-none focus:border-indigo-500/50 transition-all text-sm"
                required
            />
        </div>
    </div>
);

export default LoginInput;