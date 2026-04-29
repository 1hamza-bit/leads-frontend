import { motion } from 'framer-motion';
import { RocketLaunchIcon, BoltIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { LimitInfo } from '@/types';

// ── Upgrade Wall — full block on trial expiry ─────────────────
export const UpgradeWall = ({ onUpgrade }: { onUpgrade: () => void }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-xl flex items-center justify-center p-6"
  >
    <div className="bg-[#0a0b14] border border-indigo-500/30 rounded-3xl p-10 max-w-md w-full text-center shadow-2xl shadow-indigo-500/10">
      <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-indigo-500/20">
        <RocketLaunchIcon className="w-8 h-8 text-indigo-400"/>
      </div>
      <h2 className="text-3xl font-black text-white tracking-tighter mb-3">
        Trial Ended
      </h2>
      <p className="text-slate-400 text-sm leading-relaxed mb-8">
        Your 14-day free trial has ended. Upgrade to Pro to keep hunting leads 
        with full AI search, 250 credits/month, and unlimited vault access.
      </p>

      <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 mb-8 text-left space-y-3">
        {[
          '250 leads per month',
          'Monthly credit reset',
          'Unlimited vault access',
          'Full AI-powered search',
        ].map(f => (
          <div key={f} className="flex items-center gap-3 text-sm text-slate-300">
            <BoltIcon className="w-4 h-4 text-indigo-400 shrink-0"/>
            {f}
          </div>
        ))}
      </div>

      <button
        onClick={onUpgrade}
        className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl text-xs uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20"
      >
        Upgrade to Pro — $49/mo
      </button>
    </div>
  </motion.div>
);

// ── Daily limit banner — shown inline when AI search blocked ──
export const DailyLimitBanner = ({ 
  limitInfo, 
  onUpgrade 
}: { 
  limitInfo: LimitInfo;
  onUpgrade: () => void;
}) => (
  <motion.div
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    className="w-full p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
  >
    <div>
      <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-1">
        Daily Limit Reached
      </p>
      <p className="text-[11px] text-slate-400">
        You've used {limitInfo.daily_used}/{limitInfo.daily_limit} free leads today. 
        Vault leads above are still yours — AI search resets at midnight UTC.
      </p>
    </div>
    <button
      onClick={onUpgrade}
      className="shrink-0 bg-amber-500/10 border border-amber-500/30 text-amber-400 font-black px-4 py-2 rounded-xl text-[10px] uppercase tracking-widest hover:bg-amber-500/20 transition-all"
    >
      Upgrade for more
    </button>
  </motion.div>
);

// ── Plan badge — shown in header/dashboard ────────────────────
export const PlanBadge = ({ 
  limitInfo,
  onUpgrade
}: { 
  limitInfo: LimitInfo | null;
  onUpgrade: () => void;
}) => {
  if (!limitInfo) return null;

  if (limitInfo.plan === 'free') {
    return (
      <button
        onClick={onUpgrade}
        className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-xl hover:bg-amber-500/20 transition-all"
      >
        <div className="w-1.5 h-1.5 rounded-full bg-amber-400"/>
        <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest">
          Free • {limitInfo.trial_days_left}d left
        </span>
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
      <div className="w-1.5 h-1.5 rounded-full bg-indigo-400"/>
      <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">
        Pro • {limitInfo.credits_left} CR
      </span>
    </div>
  );
};