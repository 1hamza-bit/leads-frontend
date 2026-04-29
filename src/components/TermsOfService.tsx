import React from 'react';
import { ArrowLeftIcon, ScaleIcon, ExclamationTriangleIcon, CreditCardIcon, HandThumbUpIcon, ShieldExclamationIcon, RocketLaunchIcon } from '@heroicons/react/24/outline';

const TermsOfService = ({ onBack }: { onBack: () => void }) => {
  return (
    <div className="max-w-4xl mx-auto py-10 md:py-20 px-4 md:px-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-slate-500 hover:text-white transition-all mb-8 md:mb-12 text-xs font-black uppercase tracking-widest"
      >
        <ArrowLeftIcon className="w-4 h-4" /> Back to App
      </button>

      <div className="glass-card p-6 md:p-16 rounded-3xl md:rounded-[40px] border-white/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 md:p-10 opacity-5 hidden sm:block">
          <ScaleIcon className="w-32 md:w-64 h-32 md:h-64 text-indigo-500" />
        </div>

        <div className="relative z-10">
          <h1 className="text-3xl md:text-5xl font-black text-white mb-4 tracking-tighter">Terms of Service</h1>
          <p className="text-slate-500 text-[10px] md:text-xs font-bold uppercase tracking-widest mb-8 md:mb-12">Effective Date: March 2025</p>

          <div className="space-y-12">
            <section>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400">
                  <HandThumbUpIcon className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-white">1. Acceptance of Terms</h2>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">
                By accessing or using LEADGEN AI PRO, you agree to be bound by these Terms of Service. 
                If you do not agree to all of these terms, do not use our services. 
                We reserve the right to update these terms at any time.
              </p>
            </section>

            <section>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400">
                  <RocketLaunchIcon className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-white">2. Description of Service</h2>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">
                LEADGEN AI PRO provides AI-powered lead generation, market analysis, and prospect auditing tools. 
                Our service utilizes Large Language Models (LLMs) to automate and enhance business development workflows.
              </p>
            </section>

            <section>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400">
                  <ExclamationTriangleIcon className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-white">3. AI Limitations & Disclaimers</h2>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                Our platform uses generative AI. While we strive for accuracy, the output (leads, audits, contact info) 
                may contain inaccuracies or "hallucinations." You are responsible for verifying all lead data 
                before initiating outreach.
              </p>
              <div className="bg-amber-500/5 border border-amber-500/20 p-4 rounded-2xl">
                <p className="text-amber-500 text-[11px] font-bold leading-relaxed italic">
                  LEADGEN AI PRO is not liable for any business decisions or outreach actions taken based on AI-generated insights.
                </p>
              </div>
            </section>

            <section>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400">
                  <CreditCardIcon className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-white">4. Subscription & Billing</h2>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">
                Access to premium features is provided on a subscription basis. All fees are non-refundable 
                unless required by law. Subscriptions automatically renew unless cancelled at least 24 hours 
                before the end of the current billing period.
              </p>
            </section>

            <section>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400">
                  <ShieldExclamationIcon className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-white">5. Prohibited Use</h2>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">
                You may not use our service for spamming, harassment, or any illegal activities. 
                Automated scraping of our platform is strictly prohibited. We reserve the right 
                to terminate accounts that violate these policies without notice.
              </p>
            </section>

            <div className="pt-12 border-t border-white/5">
              <p className="text-slate-500 text-[10px] font-medium leading-relaxed italic">
                Questions about these terms? Reach out to legal@leadgen-ai-pro.com
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
