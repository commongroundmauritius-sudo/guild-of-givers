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
    // Reconcile the client-side consent state after hydration. The initial
    // server render cannot read localStorage, so an untouched client must
    // explicitly open the banner when no consent exists.
    const current = getConsentState();
    if (current.consent === null && !current.isModalOpen) {
      openConsentBanner();
    }

    return subscribeConsent(() => {
      setState({ ...getConsentState() });
    });
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
