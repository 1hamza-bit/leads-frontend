import { PLANS, PlanType, User } from "@/types";
import { BoltIcon, CheckBadgeIcon } from "@heroicons/react/24/outline";

const BillingView = ({ currentUser, onUpgrade }: { currentUser: User | null, onUpgrade: (id: PlanType) => void }) => (
  <div className="max-w-6xl w-full py-10 md:py-20 animate-in slide-in-from-bottom-8 duration-1000">
    <div className="text-center mb-10 md:mb-16">
      <h2 className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tighter">Choose Your <span className="text-indigo-500">Tier</span></h2>
      <p className="text-slate-500 text-sm md:text-lg">Scale your growth with dedicated lead hunting credits.</p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10">
      {PLANS.map((plan) => (
        <div key={plan.id} className={`p-1 bg-gradient-to-br ${plan.id === 'pro' ? 'from-indigo-500 to-cyan-500 scale-100 lg:scale-105 z-10' : 'from-white/10 to-transparent'} rounded-3xl md:rounded-[40px] shadow-2xl`}>
          <div className="bg-[#0b0c14] rounded-[22px] md:rounded-[38px] p-8 md:p-12 flex flex-col h-full">
            <h3 className="text-white font-black text-xl md:text-2xl uppercase tracking-widest mb-2">{plan.name}</h3>
            <div className="flex items-baseline gap-2 mb-6 md:mb-8">
              <span className="text-4xl md:text-5xl font-black text-white">{plan.price}</span>
              <span className="text-slate-600 font-bold uppercase text-[9px] md:text-[10px] tracking-widest">/ Mo</span>
            </div>
            <div className="space-y-4 md:space-y-5 mb-8 md:mb-12 flex-1">
              <div className="pb-4 md:pb-5 border-b border-white/5 text-indigo-400 font-black text-base md:text-lg flex items-center gap-2">
                <BoltIcon className="w-5 h-5 md:w-6 md:h-6"/> {plan.credits} Credits
              </div>
              {plan.features.map((f, j) => (
                <div key={j} className="flex items-center gap-3 text-slate-400 text-xs md:text-sm">
                  <CheckBadgeIcon className="w-4 h-4 md:w-5 md:h-5 text-indigo-500 shrink-0"/> {f}
                </div>
              ))}
            </div>
            <button 
              onClick={() => onUpgrade(plan.id)}
              className={`w-full py-4 md:py-5 rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-[0.2em] transition-all ${plan.id === 'pro' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10 hover:text-white'}`}
            >
              {currentUser?.plan === plan.id ? 'Current Plan' : 'Select Plan'}
            </button>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default BillingView;