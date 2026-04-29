import React, { useState } from 'react';
import { ArrowLeftIcon, ShieldCheckIcon, LockClosedIcon, EyeIcon, UserGroupIcon, CpuChipIcon } from '@heroicons/react/24/outline';
import CookieSettings from './CookieSettings';

const PrivacyPolicy = ({ onBack }: { onBack: () => void }) => {
  const [activeTab, setActiveTab] = useState<'policy' | 'cookies'>('policy');

  return (
    <div className="max-w-4xl mx-auto py-10 md:py-20 px-4 md:px-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-slate-500 hover:text-white transition-all mb-8 md:mb-12 text-xs font-black uppercase tracking-widest"
      >
        <ArrowLeftIcon className="w-4 h-4" /> Back to App
      </button>

      <div className="flex flex-wrap gap-3 md:gap-4 mb-8">
        <button 
          onClick={() => setActiveTab('policy')}
          className={`px-5 md:px-6 py-2.5 md:py-3 rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'policy' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
        >
          Privacy Policy
        </button>
        <button 
          onClick={() => setActiveTab('cookies')}
          className={`px-5 md:px-6 py-2.5 md:py-3 rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'cookies' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
        >
          Cookie Settings
        </button>
      </div>

      {activeTab === 'policy' ? (
        <div className="glass-card p-6 md:p-16 rounded-3xl md:rounded-[40px] border-white/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 md:p-10 opacity-5 hidden sm:block">
            <ShieldCheckIcon className="w-32 md:w-64 h-32 md:h-64 text-indigo-500" />
          </div>

          <div className="relative z-10">
            <h1 className="text-3xl md:text-5xl font-black text-white mb-4 tracking-tighter">Privacy Protocol</h1>
            <p className="text-slate-500 text-[10px] md:text-xs font-bold uppercase tracking-widest mb-8 md:mb-12">Last Updated: March 2025</p>

            <div className="space-y-12">
              <section>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400">
                    <EyeIcon className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-bold text-white">1. Data Collection Overview</h2>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed mb-4">
                  LEADGEN AI PRO collects data necessary to provide high-performance lead generation and auditing services. 
                  This includes information you provide directly and data collected through our AI-driven discovery processes.
                </p>
                <ul className="list-disc list-inside text-slate-400 text-sm space-y-2 ml-4">
                  <li>Account Information: Name, email, and billing details.</li>
                  <li>Lead Data: Business names, URLs, and contact info processed for your campaigns.</li>
                  <li>Usage Data: Interaction logs, IP addresses, and browser telemetry.</li>
                </ul>
              </section>

              <section>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400">
                    <CpuChipIcon className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-bold text-white">2. AI Processing & Neural Logic</h2>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Our platform utilizes advanced Large Language Models (LLMs) to analyze market niches and audit prospects. 
                  While we process data through these models, we do not use your proprietary lead lists to train public AI models. 
                  Your strategic search criteria and results remain isolated within your neural sector.
                </p>
              </section>

              <section>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400">
                    <LockClosedIcon className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-bold text-white">3. Security Infrastructure</h2>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed">
                  We implement enterprise-grade encryption for data at rest and in transit. Our infrastructure is monitored 
                  24/7 for unauthorized access attempts. Access to your data is strictly limited to authorized personnel 
                  required for maintenance and support.
                </p>
              </section>

              <section>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400">
                    <UserGroupIcon className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-bold text-white">4. Third-Party Integration</h2>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed">
                  We integrate with trusted partners (e.g., Google Gemini, Stripe) to provide core functionality. 
                  These partners are vetted for compliance with global privacy standards (GDPR, CCPA). 
                  We never sell your data to third-party brokers.
                </p>
              </section>

              <div className="pt-12 border-t border-white/5">
                <p className="text-slate-500 text-[10px] font-medium leading-relaxed italic">
                  For specific inquiries regarding your data rights or to request data deletion, 
                  please contact our Privacy Officer at privacy@leadgen-ai-pro.com
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <CookieSettings onBack={() => setActiveTab('policy')} />
      )}
    </div>
  );
};

export default PrivacyPolicy;
