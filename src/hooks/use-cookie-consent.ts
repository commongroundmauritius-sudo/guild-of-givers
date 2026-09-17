import { useEffect, useState } from "react";
import {
  getStoredConsent,
  subscribeConsent,
  saveConsentPreferences,
  openConsentBanner,
  openConsentModal,
  closeConsentModal,
} from "@/lib/cookie-consent";

type ConsentAction = "save" | "open-banner" | "open-modal" | "close-modal";
type CookieConsent = ReturnType<typeof getStoredConsent>;

export function useCookieConsent() {
  const [consent, setConsent] = useState<CookieConsent>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const syncFromStorage = () => setConsent(getStoredConsent());

    const handleAction = (action?: ConsentAction) => {
      syncFromStorage();
      if (action === "open-modal") {
        setIsModalOpen(true);
        return;
      }
      if (action === "close-modal") {
        setIsModalOpen(false);
        return;
      }
      if (action === "open-banner" || action === "save") {
        setIsModalOpen(false);
      }
    };

    syncFromStorage();
    setIsHydrated(true);

    const pending = (window as unknown as { __cgPendingConsentAction?: string })
      .__cgPendingConsentAction;
    if (pending === "open-modal") {
      (window as unknown as { __cgPendingConsentAction?: string }).__cgPendingConsentAction =
        undefined;
      setIsModalOpen(true);
    }

    return subscribeConsent(handleAction);
  }, []);

  const isBannerOpen = isHydrated && consent === null && !isModalOpen;

  return {
    consent,
    hasResponded: consent !== null,
    isAnalyticsAllowed: consent?.analytics ?? false,
    isBannerOpen,
    isModalOpen,
    isHydrated,
    acceptAll: () => saveConsentPreferences(true),
    rejectOptional: () => saveConsentPreferences(false),
    updatePreferences: (analytics: boolean) => saveConsentPreferences(analytics),
    openBanner: openConsentBanner,
    openModal: openConsentModal,
    closeModal: closeConsentModal,
  };
}
