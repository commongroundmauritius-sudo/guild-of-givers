import { supabase } from "@/integrations/supabase/client";

const ATTRIBUTION_KEY = "cg_attribution";
const EXPIRY_DAYS = 30;

export interface AttributionData {
  tracking_code?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  landing_page: string;
  referrer: string;
  timestamp: number;
}

export const attributionService = {
  /**
   * Capture attribution data from URL parameters
   */
  captureFromUrl() {
    if (typeof window === 'undefined') return;

    const urlParams = new URLSearchParams(window.location.search);
    const tracking_code = urlParams.get('ref');
    const utm_source = urlParams.get('utm_source');

    // Only update if we have new attribution data
    if (!tracking_code && !utm_source) return;

    const data: AttributionData = {
      tracking_code: tracking_code || undefined,
      utm_source: utm_source || undefined,
      utm_medium: urlParams.get('utm_medium') || undefined,
      utm_campaign: urlParams.get('utm_campaign') || undefined,
      utm_content: urlParams.get('utm_content') || undefined,
      utm_term: urlParams.get('utm_term') || undefined,
      landing_page: window.location.pathname,
      referrer: document.referrer,
      timestamp: Date.now()
    };

    localStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(data));
  },

  /**
   * Get stored attribution data
   */
  getStored(): AttributionData | null {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem(ATTRIBUTION_KEY);
    if (!stored) return null;

    try {
      const data = JSON.parse(stored) as AttributionData;
      // Check for expiry
      const ageInDays = (Date.now() - data.timestamp) / (1000 * 60 * 60 * 24);
      if (ageInDays > EXPIRY_DAYS) {
        localStorage.removeItem(ATTRIBUTION_KEY);
        return null;
      }
      return data;
    } catch (e) {
      return null;
    }
  }
};
