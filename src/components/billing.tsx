import { PLANS, PlanType, User, PricingPlan } from "@/types";
import { BoltIcon, CheckBadgeIcon, ClockIcon, SparklesIcon, CircleStackIcon } from "@heroicons/react/24/outline";
import { motion } from "framer-motion";

interface BillingViewProps {
  currentUser: User | null;
  plans?: PricingPlan[];
  onUpgrade: (id: PlanType) => void;
  isProcessing?: boolean;
  processingPlanId?: PlanType | null;
}

const BillingView = ({ 
  currentUser, 
  plans = PLANS,
  onUpgrade, 
  isProcessing = false, 
  processingPlanId = null 
}: BillingViewProps) => {
  
  const currentPlanId = currentUser?.plan ?? 'free';
  const planInfo = currentUser?.plan_info;

  return (
    <div className="max-w-7xl w-full py-10 md:py-20 px-4 mx-auto min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500/30">
      
      {/* ── SUBSCRIPTION CONTEXT SYSTEM META BANNER ──────────────────────── */}
      {currentUser && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto mb-16 p-6 rounded-2xl border border-white/5 bg-white/[0.01] backdrop-blur-xl flex flex-col lg:flex-row items-center justify-between gap-6"
        >
          <div className="flex items-center gap-4 text-center lg:text-left">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0">
              <SparklesIcon className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-black text-xs uppercase tracking-wider text-slate-400">
                Active Tier Assignment: <span className="text-indigo-400 underline decoration-indigo-500/50 underline-offset-4">{currentUser.plan}</span>
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Session user identifier: <span className="text-slate-300 font-medium">{currentUser.username}</span> ({currentUser.email})
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 justify-center lg:justify-end">
            <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-xs font-bold flex items-center gap-2 text-slate-300">
              <BoltIcon className="w-4 h-4 text-indigo-400" />
              <span>{currentUser.credits} Global Credits Available</span>
            </div>

            {planInfo?.trial_active && planInfo.trial_days_remaining !== null && (
              <div className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border ${
                planInfo.trial_days_remaining <= 3 
                  ? 'bg-red-500/10 border-red-500/20 text-red-400' 
                  : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
              }`}>
                <ClockIcon className="w-4 h-4" />
                <span>{planInfo.trial_days_remaining} Day Evaluation Window Open</span>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* ── HEADER ────────────────────────────────────────────────────────── */}
      <div className="text-center mb-16 md:mb-24">
        <motion.h2 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tighter"
        >
          Choose Your <span className="text-indigo-500">Tier</span>
        </motion.h2>
        <motion.p 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="text-slate-400 text-sm md:text-lg max-w-xl mx-auto font-medium leading-relaxed"
        >
          Unlock hyper-targeted pipeline searches, precise deep engine auditing, and global automated data export pathways.
        </motion.p>
      </div>

      {/* ── 4-COLUMN RESPONSIVE LAYOUT GRID ───────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 xl:gap-8 items-stretch">
        {plans.map((plan, index) => {
          const isCurrentPlan = currentPlanId === plan.id;
          const isTargetProcessing = processingPlanId === plan.id;
          const isProTier = plan.id === 'pro'; // Flagship Revenue Driver Highlight

          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
              whileHover={{ y: isCurrentPlan ? 0 : -5 }}
              className={`relative p-0.5 bg-gradient-to-br flex flex-col ${
                isProTier 
                  ? 'from-indigo-500 via-purple-500 to-cyan-500 shadow-xl shadow-indigo-500/10 z-10 lg:-translate-y-2' 
                  : 'from-white/10 to-white/[0.02]'
              } rounded-[28px] md:rounded-[36px]`}
            >
              {isProTier && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-black text-[8px] uppercase tracking-[0.25em] px-3.5 py-1.5 rounded-full shadow-md">
                  Most Popular
                </div>
              )}

              <div className="bg-[#090a10] rounded-[26px] md:rounded-[34px] p-6 xl:p-8 flex flex-col h-full justify-between">
                <div>
                  {/* Name Headers */}
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-white font-black text-lg md:text-xl uppercase tracking-widest">
                      {plan.name}
                    </h3>
                    {isCurrentPlan && (
                      <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-md">
                        Active
                      </span>
                    )}
                  </div>

                  {/* Pricing Matrix */}
                  <div className="flex items-baseline gap-1.5 mb-6 border-b border-white/5 pb-5">
                    <span className="text-3xl md:text-4xl font-black text-white tracking-tight">
                      {plan.price}
                    </span>
                    <span className="text-slate-600 font-bold uppercase text-[9px] tracking-widest">
                      / Mo
                    </span>
                  </div>

                  {/* Core Allocation Matrix Metrics */}
                  <div className="space-y-3 mb-8">
                    <div className="p-3 rounded-xl bg-white/[0.01] border border-white/5 text-indigo-400 font-black text-sm flex items-center gap-2.5">
                      <BoltIcon className="w-5 h-5 text-indigo-400 shrink-0" />
                      <span>{plan.searches} / Mo</span>
                    </div>

                    <div className="p-3 rounded-xl bg-white/[0.01] border border-white/5 text-slate-300 font-bold text-xs flex items-center gap-2.5">
                      <CircleStackIcon className="w-5 h-5 text-slate-500 shrink-0" />
                      <span>{plan.leadsPerSearch} Leads Per Hunt</span>
                    </div>

                    {plan.deepAudits > 0 && (
                      <div className="px-3 py-1.5 rounded-lg border border-indigo-500/10 bg-indigo-500/[0.02] text-[10px] font-black text-indigo-300 tracking-wider uppercase w-max">
                        🚀 {plan.deepAudits} Deep Audits Included
                      </div>
                    )}
                  </div>

                  {/* Feature Checklist */}
                  <div className="space-y-3.5 mb-8 border-t border-white/5 pt-5">
                    {plan.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-slate-400 text-xs font-medium leading-normal">
                        <CheckBadgeIcon className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Processing Trigger CTA */}
                <button
                  type="button"
                  disabled={isCurrentPlan || isProcessing}
                  onClick={() => onUpgrade(plan.id)}
                  className={`w-full py-3.5 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${
                    isCurrentPlan
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 cursor-not-allowed'
                      : isProTier
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 active:scale-95 disabled:opacity-50'
                      : 'bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10 hover:text-white active:scale-95 disabled:opacity-50'
                  }`}
                >
                  {isTargetProcessing ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      <span>Routing Transaction...</span>
                    </>
                  ) : isCurrentPlan ? (
                    'Current Active Plan'
                  ) : (
                    'Select Tier'
                  )}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default BillingView;