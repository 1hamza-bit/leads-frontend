import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRightIcon, CpuChipIcon, SparklesIcon,
  UserGroupIcon, MagnifyingGlassIcon, ShieldCheckIcon,
  FingerPrintIcon,

} from '@heroicons/react/24/outline';

interface LandingViewProps {
  onNavigate: (path: string) => void;
  setView: (view: string) => void;
}

const LandingView = ({ onNavigate, setView }: LandingViewProps) => (
  <div className="max-w-7xl w-full py-10 md:py-20 px-4 md:px-6 relative space-y-24 md:space-y-40">
    {/* Hero Section */}
    <div className="grid lg:grid-cols-2 gap-12 md:gap-20 items-center">
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="text-center lg:text-left"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full mb-6 md:mb-8"
        >
          <SparklesIcon className="w-4 h-4 text-indigo-400" />
          <span className="text-[9px] md:text-[10px] font-bold text-indigo-400 uppercase tracking-[0.2em] md:tracking-[0.3em]">The Future of B2B Discovery</span>
        </motion.div>

        <h1 className="text-[14vw] sm:text-[12vw] lg:text-[8vw] font-black text-white mb-6 md:mb-8 visionary-text leading-none">
          Hunt <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-cyan-400 to-indigo-500">Gems.</span>
        </h1>

        <p className="text-slate-500 text-lg md:text-xl lg:text-2xl max-w-xl mx-auto lg:mx-0 mb-8 md:mb-12 leading-relaxed font-light">
          Stop scraping dead lists. Our Grounded AI scours the live web to find responsive mid-market gems that actually need your services.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 md:gap-6">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onNavigate('/login')}
            className="w-full sm:w-auto bg-white text-black font-black px-8 md:px-10 py-4 md:py-5 rounded-full transition-all shadow-2xl shadow-white/10 flex items-center justify-center gap-3 uppercase text-[10px] md:text-xs tracking-widest"
          >
            Initiate Hunt <ArrowRightIcon className="w-5 h-5" />
          </motion.button>
          <button
            onClick={() => onNavigate('/pricing')}
            className="w-full sm:w-auto text-white font-bold px-8 md:px-10 py-4 md:py-5 rounded-full border border-white/10 hover:bg-white/5 transition-all uppercase text-[10px] md:text-xs tracking-widest"
          >
            View Plans
          </button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="relative hidden lg:block"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-transparent blur-3xl rounded-full" />
        <div className="glass-card p-8 rounded-[40px] relative z-10 border-white/20 shadow-2xl">
          <div className="flex items-center justify-between mb-8">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/50" />
              <div className="w-3 h-3 rounded-full bg-amber-500/50" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/50" />
            </div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Live Intelligence Stream</div>
          </div>

          <div className="h-[280px] overflow-hidden relative">
            {/* Glass Morph Overlays */}
            <div className="absolute top-0 left-0 right-0 h-16 z-10 pointer-events-none bg-gradient-to-b from-[#05060a] to-transparent backdrop-blur-sm" />
            <div className="absolute bottom-0 left-0 right-0 h-16 z-10 pointer-events-none bg-gradient-to-t from-[#05060a] to-transparent backdrop-blur-sm" />

            <motion.div
              animate={{ y: [0, -420] }}
              transition={{
                duration: 12,
                repeat: Infinity,
                ease: "linear"
              }}
              className="space-y-4"
            >
              {[
                { name: "Solar Austin", status: "Verified", score: 98 },
                { name: "Elite Roofers", status: "Auditing", score: 84 },
                { name: "Tech Solutions", status: "Grounded", score: 92 },
                { name: "Green Energy", status: "Verified", score: 95 },
                { name: "Peak Plumbing", status: "Scoping", score: 78 },
                { name: "Modern HVAC", status: "Grounded", score: 89 },
                // Duplicate for seamless loop
                { name: "Solar Austin", status: "Verified", score: 98 },
                { name: "Elite Roofers", status: "Auditing", score: 84 },
                { name: "Tech Solutions", status: "Grounded", score: 92 },
                { name: "Green Energy", status: "Verified", score: 95 },
                { name: "Peak Plumbing", status: "Scoping", score: 78 },
                { name: "Modern HVAC", status: "Grounded", score: 89 },
              ].map((item, i) => (
                <div
                  key={i}
                  className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center text-indigo-400">
                      <MagnifyingGlassIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-white font-bold text-xs">{item.name}</p>
                      <p className="text-[9px] text-slate-500 uppercase">{item.status}</p>
                    </div>
                  </div>
                  <div className="text-indigo-400 font-black text-xs">{item.score}%</div>
                </div>
              ))}
            </motion.div>
          </div>

          <div className="mt-8 pt-8 border-t border-white/5 flex items-center justify-between">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-[#05060a] bg-slate-800 overflow-hidden">
                  <img src={`https://picsum.photos/seed/${i}/32/32`} alt="user" referrerPolicy="no-referrer" />
                </div>
              ))}
            </div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Joined by 2.4k hunters</p>
          </div>
        </div>
      </motion.div>
    </div>

    {/* Features Grid */}
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
      className="grid md:grid-cols-3 gap-8"
    >
      {[
        { icon: <CpuChipIcon className="w-6 h-6" />, title: "Neural Indexing", desc: "Our engine indexes 100k+ boutique leads daily, bypassing the noise of generic scrapers." },
        { icon: <FingerPrintIcon className="w-6 h-6" />, title: "Grounded Truth", desc: "Every lead is verified against live web data, social signals, and public filings in real-time." },
        { icon: <ShieldCheckIcon className="w-6 h-6" />, title: "Deep Audit", desc: "AI researches decision makers and pain points to give you a visionary edge in outreach." }
      ].map((feat, i) => (
        <div key={i} className="glass-card p-10 rounded-[32px] group hover:border-indigo-500/50 transition-all duration-500">
          <div className="w-14 h-14 bg-indigo-500/10 text-indigo-400 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-indigo-500 group-hover:text-white transition-all duration-500">
            {feat.icon}
          </div>
          <h3 className="text-white font-bold text-2xl mb-4 tracking-tight">{feat.title}</h3>
          <p className="text-slate-500 text-sm leading-relaxed font-light">{feat.desc}</p>
        </div>
      ))}
    </motion.div>

    {/* How It Works */}
    <div className="space-y-20">
      <div className="text-center max-w-2xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tighter">The Hunting Protocol</h2>
        <p className="text-slate-500 text-lg font-light">Three stages to absolute market dominance.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-12">
        {[
          { step: "01", title: "Target Definition", desc: "Input your niche, city, and ideal client profile. Our AI constructs a custom search matrix." },
          { step: "02", title: "Neural Scoping", desc: "We scan the live web, social graphs, and directories to find leads that match your exact criteria." },
          { step: "03", title: "Strategic Audit", desc: "Get a deep-dive audit for every lead, including pain points and personalized outreach angles." }
        ].map((item, i) => (
          <div key={i} className="relative">
            <div className="text-[120px] font-black text-white/5 absolute -top-20 -left-10 select-none">{item.step}</div>
            <div className="relative z-10">
              <h3 className="text-white font-bold text-2xl mb-4 tracking-tight">{item.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed font-light">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Testimonials */}
    <div className="glass-card p-12 md:p-20 rounded-[60px] border-white/10 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-10 opacity-5">
        <UserGroupIcon className="w-64 h-64 text-indigo-500" />
      </div>

      <div className="relative z-10 grid lg:grid-cols-2 gap-20 items-center">
        <div>
          <h2 className="text-4xl md:text-5xl font-black text-white mb-8 tracking-tighter">Trusted by the <br /> Elite Hunters.</h2>
          <div className="space-y-8">
            {[
              { name: "Marcus Chen", role: "CEO, ScaleFlow", text: "We've tried every scraper out there. LEADGEN AI PRO is the only one that finds leads that actually respond." },
              { name: "Sarah Jenkins", role: "Head of Sales, Nexus", text: "The deep audit feature is a game changer. My team spends 0 minutes researching and 100% of their time closing." }
            ].map((t, i) => (
              <div key={i} className="border-l-2 border-indigo-500 pl-8">
                <p className="text-white text-lg font-medium mb-4 italic">"{t.text}"</p>
                <div>
                  <p className="text-white font-bold text-sm">{t.name}</p>
                  <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="aspect-square rounded-3xl overflow-hidden grayscale hover:grayscale-0 transition-all duration-700 border border-white/10">
              <img src={`https://picsum.photos/seed/user${i}/400/400`} alt="user" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* FAQ Section */}
    <div className="max-w-3xl mx-auto space-y-12">
      <div className="text-center">
        <h2 className="text-4xl font-black text-white mb-4 tracking-tighter">Intelligence Briefing</h2>
        <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">Frequently Asked Questions</p>
      </div>

      <div className="space-y-4">
        {[
          { q: "How is this different from Apollo or ZoomInfo?", a: "Generic databases are full of stale data. We scan the live web in real-time based on your specific search matrix, finding leads that haven't been spammed yet." },
          { q: "What is a 'Deep Audit'?", a: "It's an AI-driven research report for a specific lead. It analyzes their website, social presence, and market position to identify pain points you can solve." },
          { q: "Can I export my leads?", a: "Yes, all leads can be exported to CSV or synced directly to your CRM via our upcoming integrations." },
          { q: "How accurate is the contact data?", a: "We verify every email and social link against live signals. If a lead is 'Grounded', it means we've confirmed their active presence within the last 24 hours." }
        ].map((faq, i) => (
          <div key={i} className="bg-white/[0.02] border border-white/5 p-8 rounded-[32px] hover:bg-white/[0.04] transition-all">
            <h4 className="text-white font-bold text-lg mb-4">{faq.q}</h4>
            <p className="text-slate-500 text-sm leading-relaxed font-light">{faq.a}</p>
          </div>
        ))}
      </div>
    </div>

    {/* Final CTA */}
    <div className="text-center py-20 relative">
      <div className="absolute inset-0 bg-indigo-600/10 blur-[120px] rounded-full" />
      <div className="relative z-10">
        <h2 className="text-5xl md:text-7xl font-black text-white mb-8 tracking-tighter">Ready to Hunt?</h2>
        <p className="text-slate-500 text-xl mb-12 max-w-2xl mx-auto font-light">Join the elite hunters using Grounded AI to dominate their markets.</p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onNavigate('/login')}

          className="bg-indigo-600 text-white font-black px-12 py-6 rounded-full transition-all shadow-2xl shadow-indigo-600/40 flex items-center gap-3 uppercase text-sm tracking-[0.3em] mx-auto"
        >
          Initiate Protocol <ArrowRightIcon className="w-6 h-6" />
        </motion.button>
      </div>
    </div>
  </div>
);

export default LandingView;