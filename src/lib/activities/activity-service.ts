import { supabase } from "@/integrations/supabase/client";

export type ActivityEventType =
  | 'homepage_view' | 'initiative_view' | 'share_click' | 'signup_started'
  | 'user_signup' | 'subscription_started' | 'payment_completed' | 'lead_captured' | 'referral_visit'
  | 'payment_failed' | 'subscription_cancelled';

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
  },

  /**
   * Unified Timeline Query Service
   * Aggregates from activities and initiative_events
   */
  async getUnifiedTimeline(params: {
    userId?: string;
    initiativeId?: string;
    organizationId?: string;
    limit?: number;
  }) {
    const { userId, initiativeId, organizationId, limit = 50 } = params;

    let activityQuery = supabase.from('activities').select('*, profiles(full_name, avatar_url)').order('created_at', { ascending: false }).limit(limit);
    let eventQuery = supabase.from('initiative_events').select('*, initiatives(title)').order('created_at', { ascending: false }).limit(limit);

    if (userId) {
      activityQuery = activityQuery.eq('user_id', userId);
      eventQuery = eventQuery.eq('user_id', userId);
    }
    if (initiativeId) {
      activityQuery = activityQuery.eq('initiative_id', initiativeId);
      eventQuery = eventQuery.eq('initiative_id', initiativeId);
    }
    if (organizationId) {
      activityQuery = activityQuery.eq('organization_id', organizationId);
      // initiative_events doesn't have organization_id directly, would need join or filter by initiative
    }

    const [activitiesRes, eventsRes] = await Promise.all([activityQuery, eventQuery]);

    if (activitiesRes.error) throw activitiesRes.error;
    if (eventsRes.error) throw eventsRes.error;

    const merged = [
      ...(activitiesRes.data || []).map(a => ({ ...a, source_table: 'activities' })),
      ...(eventsRes.data || []).map(e => ({ ...e, source_table: 'initiative_events' }))
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return merged.slice(0, limit);
  }
};
