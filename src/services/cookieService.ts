export type CookieSettings = {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
};

const COOKIE_CONSENT_KEY = 'lg_cookie_consent_v2';

export const getCookieConsent = (): CookieSettings | null => {
  const saved = localStorage.getItem(COOKIE_CONSENT_KEY);
  return saved ? JSON.parse(saved) : null;
};

export const saveCookieConsent = (settings: CookieSettings) => {
  localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(settings));
};

export const acceptAllCookies = () => {
  const allAccepted: CookieSettings = {
    essential: true,
    analytics: true,
    marketing: true,
    preferences: true,
  };
  saveCookieConsent(allAccepted);
  return allAccepted;
};

export const declineAllCookies = () => {
  const allDeclined: CookieSettings = {
    essential: true, // Essential cookies are always true
    analytics: false,
    marketing: false,
    preferences: false,
  };
  saveCookieConsent(allDeclined);
  return allDeclined;
};
