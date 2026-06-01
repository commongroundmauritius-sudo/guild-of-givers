import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useHomepageAnalytics(versionId: string | undefined) {
  useEffect(() => {
    if (!versionId) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const sectionId = entry.target.getAttribute('data-section');
          if (sectionId) {
            trackEvent(sectionId, 'view');
          }
        }
      });
    }, { threshold: 0.5 });

    const sections = document.querySelectorAll('[data-section]');
    sections.forEach(s => observer.observe(s));

    return () => observer.disconnect();
  }, [versionId]);

  const trackEvent = async (sectionId: string, eventType: string, metadata: any = {}) => {
    if (!versionId) return;

    await supabase.from("homepage_analytics").insert({
      version_id: versionId,
      section_id: sectionId,
      event_type: eventType,
      metadata
    });
  };

  return { trackEvent };
}
