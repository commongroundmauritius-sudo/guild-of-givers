import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  getStoredConsent,
  saveConsentPreferences,
} from "@/lib/cookie-consent";

type CookieConsent = ReturnType<typeof getStoredConsent>;

type CookieConsentContextValue = {
  consent: CookieConsent;
  hasResponded: boolean;
  isAnalyticsAllowed: boolean;
  isBannerOpen: boolean;
  isModalOpen: boolean;
  isHydrated: boolean;
  acceptAll: () => void;
  rejectOptional: () => void;
  updatePreferences: (analytics: boolean) => void;
  openBanner: () => void;
  openModal: () => void;
  closeModal: () => void;
};

const CookieConsentContext = createContext<CookieConsentContextValue | null>(null);

export function CookieConsentProvider({ children }: { children: React.ReactNode }) {
  const [consent, setConsent] = useState<CookieConsent>(null);
  const [isBannerOpen, setIsBannerOpen] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const stored = getStoredConsent();
    setConsent(stored);
    setIsBannerOpen(stored === null);
    setIsHydrated(true);
  }, []);

  const acceptAll = () => {
    const next = saveConsentPreferences(true);
    setConsent(next);
    setIsBannerOpen(false);
    setIsModalOpen(false);
  };

  const rejectOptional = () => {
    const next = saveConsentPreferences(false);
    setConsent(next);
    setIsBannerOpen(false);
    setIsModalOpen(false);
  };

  const updatePreferences = (analytics: boolean) => {
    const next = saveConsentPreferences(analytics);
    setConsent(next);
    setIsBannerOpen(false);
    setIsModalOpen(false);
  };

  const openBanner = () => {
    setIsModalOpen(false);
    setIsBannerOpen(true);
  };

  const openModal = () => {
    setIsBannerOpen(false);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const value = useMemo<CookieConsentContextValue>(
    () => ({
      consent,
      hasResponded: consent !== null,
      isAnalyticsAllowed: consent?.analytics ?? false,
      isBannerOpen: isHydrated && isBannerOpen,
      isModalOpen,
      isHydrated,
      acceptAll,
      rejectOptional,
      updatePreferences,
      openBanner,
      openModal,
      closeModal,
    }),
    [consent, isBannerOpen, isModalOpen, isHydrated],
  );

  return <CookieConsentContext.Provider value={value}>{children}</CookieConsentContext.Provider>;
}

export function useCookieConsent() {
  const context = useContext(CookieConsentContext);
  if (!context) {
    throw new Error("useCookieConsent must be used within CookieConsentProvider");
  }
  return context;
}
