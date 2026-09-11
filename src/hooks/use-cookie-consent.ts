import { useState, useEffect } from "react";
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
  const [state, setState] = useState(() => ({
    consent: null as ReturnType<typeof getStoredConsent>,
    isBannerOpen: false,
    isModalOpen: false,
  }));

  useEffect(() => {
    const stored = getStoredConsent();
    setState(
      stored
        ? { consent: stored, isBannerOpen: false, isModalOpen: false }
        : { consent: null, isBannerOpen: true, isModalOpen: false },
    );

    const unsubscribe = subscribeConsent(() => {
      setState({ ...getConsentState() });
    });

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
