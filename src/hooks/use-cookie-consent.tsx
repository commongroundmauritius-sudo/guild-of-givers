import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  getStoredConsent,
  saveConsentPreferences,
} from "@/lib/cookie-consent";

type CookieConsent = ReturnType<typeof getStoredConsent>;
type CookieConsentContextValue = ReturnType<typeof createCookieConsentController>;

const CookieConsentContext = createContext<CookieConsentContextValue | null>(null);

function useCookieConsentController() {
  const [consent, setConsent] = useState<CookieConsent>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setConsent(getStoredConsent());
    setIsHydrated(true);
  }, []);

  const value = useMemo(() => {
    const acceptAll = () => {
      setConsent(saveConsentPreferences(true));
      setIsModalOpen(false);
    };
    const rejectOptional = () => {
      setConsent(saveConsentPreferences(false));
      setIsModalOpen(false);
    };
    const updatePreferences = (analytics: boolean) => {
      setConsent(saveConsentPreferences(analytics));
      setIsModalOpen(false);
    };
    return {
      consent,
      hasResponded: consent !== null,
      isAnalyticsAllowed: consent?.analytics ?? false,
      isBannerOpen: isHydrated && consent === null && !isModalOpen,
      isModalOpen,
      isHydrated,
      acceptAll,
      rejectOptional,
      updatePreferences,
      openBanner: () => { setConsent(null); setIsModalOpen(false); },
      openModal: () => setIsModalOpen(true),
      closeModal: () => setIsModalOpen(false),
    };
  }, [consent, isHydrated, isModalOpen]);

  return value;
}

export function CookieConsentProvider({ children }: { children: React.ReactNode }) {
  const value = useCookieConsentController();
  return <CookieConsentContext.Provider value={value}>{children}</CookieConsentContext.Provider>;
}

export function useCookieConsent() {
  const context = useContext(CookieConsentContext);
  if (!context) throw new Error("useCookieConsent must be used within CookieConsentProvider");
  return context;
}
