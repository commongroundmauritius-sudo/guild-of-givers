import { supabase } from "@/integrations/supabase/client";

export type ActivityEventType =
  | 'homepage_view' | 'initiative_view' | 'share_click' | 'signup_started'
  | 'user_signup' | 'subscription_started' | 'payment_completed' | 'lead_captured' | 'referral_visit';

export const activityService = {
  async logEvent(params: {
    eventType: ActivityEventType;
    initiativeId?: string;
    organizationId?: string;
    metadata?: Record<string, any>;
    source?: 'frontend' | 'backend';
  }) {
    const { eventType, initiativeId, organizationId, metadata = {}, source = 'frontend' } = params;
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    await supabase.from("activities").insert({
      event_type: eventType,
      user_id: userId,
      initiative_id: initiativeId,
      organization_id: organizationId,
      source,
      metadata: {
        ...metadata,
        url: typeof window !== 'undefined' ? window.location.href : undefined,
        referrer: typeof document !== 'undefined' ? document.referrer : undefined,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      }
    });
  }
};
