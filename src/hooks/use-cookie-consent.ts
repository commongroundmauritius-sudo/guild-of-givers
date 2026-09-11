import { useState, useEffect } from "react";
import {
  getConsentState,
  subscribeConsent,
  saveConsentPreferences,
  openConsentBanner,
  openConsentModal,
  closeConsentModal,
} from "@/lib/cookie-consent";

export function useCookieConsent() {
  const [state, setState] = useState(() => getConsentState());

  useEffect(() => {
    // Subscribe before reconciling hydration so the initial banner-opening
    // event cannot be missed by the first client render.
    const unsubscribe = subscribeConsent(() => {
      setState({ ...getConsentState() });
    });

    const current = getConsentState();
    if (current.consent === null && !current.isModalOpen && !current.isBannerOpen) {
      openConsentBanner();
      setState({ ...getConsentState() });
    }

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
