import React, { useState } from 'react';
import { 
    BoltIcon, SparklesIcon,
    ArrowPathIcon, BriefcaseIcon,
    MapPinIcon, BeakerIcon, BuildingOfficeIcon,
    QueueListIcon
} from '@heroicons/react/24/outline';
import { DailyLimitBanner } from './UpgradeWall';

const MarketSetupView = ({ 
    niche, setNiche, city, setCity, serviceOffered, setServiceOffered, 
    idealCompanyType, setIdealCompanyType, runDiscovery, loading, limitInfo, 
}: { 
    niche: string, setNiche: (s: string) => void, city: string, setCity: (s: string) => void, 
    serviceOffered: string, setServiceOffered: (s: string) => void, 
    idealCompanyType: string, setIdealCompanyType: (s: string) => void,
    runDiscovery: (count: number) => void, // Updated to accept count
    loading: boolean ,
    limitInfo: string,
}) => {
    // Local state for lead count
    const [leadCount, setLeadCount] = useState<number>(10);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        runDiscovery(leadCount); // Pass the count to your hunt function
    };

    return (
        <div className="max-w-xl w-full py-10 md:py-20 animate-in slide-in-from-bottom-8 duration-700">
            <div className="text-center mb-8 md:mb-12">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-indigo-600/10 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-4 md:mb-6">
                    <BeakerIcon className="w-6 h-6 md:w-8 md:h-8" />
                </div>
                <h2 className="text-3xl md:text-4xl font-black text-white mb-2 tracking-tighter">Market Criteria</h2>
                <p className="text-slate-500 text-[10px] md:text-sm uppercase font-bold tracking-widest">Identify your target boutique gems</p>
            </div>

            <form 
                onSubmit={handleSubmit}
                className="bg-white/[0.02] border border-white/5 p-6 md:p-10 rounded-3xl md:rounded-[40px] shadow-2xl space-y-6 md:space-y-8"
            >
                <div className="space-y-4 md:space-y-6">
                    
                    {/* Target Niche & City (Grid for desktop) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label htmlFor="niche" className="text-[9px] md:text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1 flex items-center gap-2">
                                <BriefcaseIcon className="w-3 h-3"/> Niche <span className="text-red-500">*</span>
                            </label>
                            <input 
                                id="niche"
                                type="text" 
                                required
                                placeholder="Solar Installation" 
                                className="w-full bg-white/[0.03] border border-white/5 py-3 md:py-4 px-4 rounded-xl text-white text-sm outline-none focus:border-indigo-500/50 transition-all placeholder:text-slate-700"
                                value={niche}
                                onChange={e => setNiche(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="city" className="text-[9px] md:text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1 flex items-center gap-2">
                                <MapPinIcon className="w-3 h-3"/> City <span className="text-red-500">*</span>
                            </label>
                            <input 
                                id="city"
                                type="text" 
                                required
                                placeholder="Austin, TX" 
                                className="w-full bg-white/[0.03] border border-white/5 py-3 md:py-4 px-4 rounded-xl text-white text-sm outline-none focus:border-indigo-500/50 transition-all placeholder:text-slate-700"
                                value={city}
                                onChange={e => setCity(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Target Volume (5 or 10) */}
                    <div className="space-y-3">
                        <label className="text-[9px] md:text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1 flex items-center gap-2">
                            <QueueListIcon className="w-3 h-3"/> Target Volume
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                            {[5, 10].map((num) => (
                                <button
                                    key={num}
                                    type="button"
                                    onClick={() => setLeadCount(num)}
                                    className={`py-3 rounded-xl border font-bold text-xs transition-all ${
                                        leadCount === num 
                                        ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.1)]' 
                                        : 'bg-white/[0.02] border-white/5 text-slate-500 hover:border-white/10'
                                    }`}
                                >
                                    {num} Leads
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Service Offered */}
                    <div className="space-y-2">
                        <label htmlFor="service" className="text-[9px] md:text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1 flex items-center gap-2">
                            <BoltIcon className="w-3 h-3"/> Service You Offer <span className="text-red-500">*</span>
                        </label>
                        <textarea 
                            id="service"
                            rows={2}
                            required
                            placeholder="AI-driven lead nurturing" 
                            className="w-full bg-white/[0.03] border border-white/5 py-3 px-4 rounded-xl text-white text-sm outline-none focus:border-indigo-500/50 transition-all placeholder:text-slate-700 resize-none"
                            value={serviceOffered}
                            onChange={e => setServiceOffered(e.target.value)}
                        />
                    </div>

                    {/* Ideal Company Profile */}
                    <div className="space-y-2">
                        <label htmlFor="icp" className="text-[9px] md:text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1 flex items-center gap-2">
                            <BuildingOfficeIcon className="w-3 h-3"/> Ideal Company Profile <span className="text-red-500">*</span>
                        </label>
                        <textarea 
                            id="icp"
                            rows={3}
                            required
                            placeholder="High revenue with poor online presence" 
                            className="w-full bg-white/[0.03] border border-white/5 py-3 px-4 rounded-xl text-white text-sm outline-none focus:border-indigo-500/50 transition-all placeholder:text-slate-700 resize-none"
                            value={idealCompanyType}
                            onChange={e => setIdealCompanyType(e.target.value)}
                        />
                    </div>
                </div>

                {limitInfo?.plan === 'free' && limitInfo?.daily_remaining === 0 && (
  <DailyLimitBanner 
    limitInfo={limitInfo} 
    onUpgrade={() => onNavigate('/pricing')}
  />
)}


                <button 
                    type="submit" 
                    disabled={!niche || !city || !serviceOffered || !idealCompanyType || loading}
                    className="w-full bg-indigo-600 py-4 md:py-5 rounded-xl md:rounded-2xl text-white font-black text-[10px] md:text-xs uppercase tracking-[0.2em] shadow-lg shadow-indigo-600/10 hover:bg-indigo-500 transition-all flex items-center justify-center gap-3 disabled:opacity-30"
                >
                    {loading ? (
                        <ArrowPathIcon className="w-4 h-4 animate-spin"/>
                    ) : (
                        <>
                            <SparklesIcon className="w-4 h-4 md:w-5 md:h-5"/> 
                            Analyze {leadCount} Intelligence Gems
                        </>
                    )}
                </button>
            </form>
        </div>
    );
};

export default MarketSetupView;