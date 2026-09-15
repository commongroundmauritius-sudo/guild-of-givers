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

type CookieConsentState = {
  consent: ReturnType<typeof getStoredConsent>;
  isBannerOpen: boolean;
  isModalOpen: boolean;
};

const emptyState = (): CookieConsentState => ({
  consent: null,
  isBannerOpen: false,
  isModalOpen: false,
});

export function useCookieConsent() {
  const [state, setState] = useState<CookieConsentState>(emptyState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const syncFromStorage = () => {
      const consent = getStoredConsent();
      setState((current) => ({
        consent,
        isBannerOpen: consent === null && !current.isModalOpen,
        isModalOpen: current.isModalOpen,
      }));
    };

    const handleAction = (action?: ConsentAction) => {
      if (action === "open-modal") {
        setState((current) => ({
          ...current,
          consent: getStoredConsent(),
          isBannerOpen: false,
          isModalOpen: true,
        }));
        return;
      }

      if (action === "close-modal") {
        setState((current) => ({ ...current, isModalOpen: false }));
        return;
      }

      if (action === "open-banner") {
        setState((current) => ({
          ...current,
          consent: getStoredConsent(),
          isBannerOpen: true,
          isModalOpen: false,
        }));
        return;
      }

      syncFromStorage();
      setState((current) => ({ ...current, isModalOpen: false }));
    };

    syncFromStorage();
    setHydrated(true);
    return subscribeConsent(handleAction);
  }, []);

  return {
    consent: state.consent,
    hasResponded: state.consent !== null,
    isAnalyticsAllowed: state.consent?.analytics ?? false,
    isBannerOpen: state.isBannerOpen,
    isModalOpen: state.isModalOpen,
    isHydrated: hydrated,
    acceptAll: () => saveConsentPreferences(true),
    rejectOptional: () => saveConsentPreferences(false),
    updatePreferences: (analytics: boolean) => saveConsentPreferences(analytics),
    openBanner: openConsentBanner,
    openModal: openConsentModal,
    closeModal: closeConsentModal,
  };
}
