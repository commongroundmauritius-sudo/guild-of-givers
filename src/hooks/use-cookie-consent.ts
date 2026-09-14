import { useEffect, useState } from "react";
import {
  getConsentState,
  getStoredConsent,
  subscribeConsent,
  saveConsentPreferences,
  openConsentBanner,
  openConsentModal,
  closeConsentModal,
} from "@/lib/cookie-consent";

export function useCookieConsent() {
  const [state, setState] = useState(() => {
    const consent = getStoredConsent();
    return {
      consent,
      isBannerOpen: typeof window !== "undefined" && consent === null,
      isModalOpen: false,
    };
  });

  useEffect(() => {
    const syncState = () => setState({ ...getConsentState() });
    const unsubscribe = subscribeConsent(syncState);
    syncState();
    return unsubscribe;
  }, []);

  return {
    consent: state.consent,
    hasResponded: state.consent !== null,
    isAnalyticsAllowed: state.consent?.analytics ?? false,
    isBannerOpen: state.isBannerOpen,
    isModalOpen: state.isModalOpen,
    acceptAll: () => saveConsentPreferences(true),
    rejectOptional: () => saveConsentPreferences(false),
    updatePreferences: (analytics: boolean) => saveConsentPreferences(analytics),
    openBanner: openConsentBanner,
    openModal: openConsentModal,
    closeModal: closeConsentModal,
  };
}
