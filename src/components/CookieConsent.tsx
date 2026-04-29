import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { acceptAllCookies, getCookieConsent } from '../services/cookieService';

const CookieConsent = ({ onManage }: { onManage: () => void }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = getCookieConsent();
    if (!consent) {
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    acceptAllCookies();
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
        >
          <div className="bg-white rounded-[32px] p-10 max-w-xl w-full shadow-2xl animate-in zoom-in-95 duration-300">
            <h2 className="text-2xl font-bold text-black mb-6">Cookies Policy</h2>
            
            <div className="space-y-4 text-slate-600 text-sm leading-relaxed mb-8">
              <p>
                We use our own cookies, as well as those of third parties, for individual as well as 
                repeated sessions, in order to make the navigation of our website easy and safe for our users.
              </p>
              <p>
                In turn, we use cookies to measure and obtain statistical data about the navigation of 
                the users. You can configure and accept the use of cookies and modify your consent options, at any time.
              </p>
              <button 
                onClick={onManage}
                className="text-black underline font-medium block mt-4 hover:opacity-70 transition-opacity"
              >
                Learn more about how we use cookies
              </button>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <button 
                onClick={handleAcceptAll}
                className="w-full sm:w-auto bg-black text-white px-8 py-4 rounded-full font-bold text-sm hover:bg-slate-800 transition-all"
              >
                Accept All Cookies
              </button>
              
              <button 
                onClick={() => {
                  setIsVisible(false);
                  onManage();
                }}
                className="text-black underline font-bold text-sm hover:opacity-70 transition-opacity"
              >
                Manage Settings
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CookieConsent;
