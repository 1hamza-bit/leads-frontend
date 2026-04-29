import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheckIcon, ArrowLeftIcon, CheckIcon } from '@heroicons/react/24/outline';
import { getCookieConsent, saveCookieConsent, CookieSettings as CookieSettingsType } from '../services/cookieService';

const CookieSettings = ({ onBack }: { onBack: () => void }) => {
  const [settings, setSettings] = useState<CookieSettingsType>({
    essential: true,
    analytics: false,
    marketing: false,
    preferences: false,
  });

  useEffect(() => {
    const saved = getCookieConsent();
    if (saved) {
      setSettings(saved);
    }
  }, []);

  const handleToggle = (key: keyof CookieSettingsType) => {
    if (key === 'essential') return; // Cannot toggle essential
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    saveCookieConsent(settings);
    onBack();
  };

  return (
    <div className="max-w-3xl mx-auto py-20 px-6 animate-in fade-in duration-700">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-slate-500 hover:text-white transition-all mb-12 text-xs font-black uppercase tracking-widest"
      >
        <ArrowLeftIcon className="w-4 h-4" /> Back to App
      </button>

      <div className="glass-card p-10 rounded-[40px] border-white/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-10">
          <ShieldCheckIcon className="w-32 h-32 text-indigo-500" />
        </div>

        <div className="relative z-10">
          <h2 className="text-4xl font-black text-white mb-4 tracking-tighter">Cookie Preferences</h2>
          <p className="text-slate-400 text-sm mb-12 max-w-xl leading-relaxed">
            We use cookies to enhance your experience. You can choose which categories of cookies you wish to allow. 
            Essential cookies are necessary for the application to function and cannot be disabled.
          </p>

          <div className="space-y-6 mb-12">
            <CookieToggle 
              title="Essential Cookies" 
              description="Required for the site to function properly. These cannot be disabled."
              active={settings.essential}
              disabled={true}
              onToggle={() => {}}
            />
            <CookieToggle 
              title="Analytics Cookies" 
              description="Help us understand how visitors interact with the site, helping us identify areas for improvement."
              active={settings.analytics}
              onToggle={() => handleToggle('analytics')}
            />
            <CookieToggle 
              title="Marketing Cookies" 
              description="Used to track visitors across websites to allow us to display relevant and engaging ads."
              active={settings.marketing}
              onToggle={() => handleToggle('marketing')}
            />
            <CookieToggle 
              title="Preference Cookies" 
              description="Allow the site to remember choices you make (such as your user name, language or the region you are in)."
              active={settings.preferences}
              onToggle={() => handleToggle('preferences')}
            />
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <button 
              onClick={handleSave}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase text-xs tracking-[0.2em] py-5 px-10 rounded-2xl transition-all shadow-xl shadow-indigo-600/20"
            >
              Save Preferences
            </button>
            <button 
              onClick={() => {
                const all = { essential: true, analytics: true, marketing: true, preferences: true };
                setSettings(all);
                saveCookieConsent(all);
                onBack();
              }}
              className="bg-white/5 hover:bg-white/10 text-white font-black uppercase text-xs tracking-[0.2em] py-5 px-10 rounded-2xl border border-white/10 transition-all"
            >
              Accept All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const CookieToggle = ({ title, description, active, onToggle, disabled = false }: { 
  title: string, 
  description: string, 
  active: boolean, 
  onToggle: () => void,
  disabled?: boolean
}) => (
  <div className={`flex items-center justify-between p-6 rounded-3xl border transition-all ${active ? 'bg-indigo-500/5 border-indigo-500/20' : 'bg-white/[0.02] border-white/5'}`}>
    <div className="pr-8">
      <h4 className="text-white font-bold text-sm mb-1">{title}</h4>
      <p className="text-[10px] text-slate-500 leading-relaxed max-w-md">{description}</p>
    </div>
    <button 
      onClick={onToggle}
      disabled={disabled}
      className={`w-14 h-8 rounded-full relative transition-all ${active ? 'bg-indigo-600' : 'bg-slate-800'} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <motion.div 
        animate={{ x: active ? 24 : 4 }}
        className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg flex items-center justify-center"
      >
        {active && <CheckIcon className="w-3 h-3 text-indigo-600" />}
      </motion.div>
    </button>
  </div>
);

export default CookieSettings;
