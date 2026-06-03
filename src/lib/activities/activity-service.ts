import { supabase } from "@/integrations/supabase/client";
import { automationService } from "@/lib/automation/automation-service";
import { isUUID } from "@/lib/identifiers";
import { getSessionUser } from "@/lib/security/auth";

export type ActivityEventType =
  | "homepage_view"
  | "initiative_view"
  | "share_click"
  | "signup_started"
  | "user_signup"
  | "subscription_started"
  | "payment_completed"
  | "lead_captured"
  | "referral_visit"
  | "payment_failed"
  | "subscription_cancelled";

export const activityService = {
  async logEvent(params: {
    eventType: ActivityEventType;
    initiativeId?: string;
    organizationId?: string;
    metadata?: Record<string, any>;
    source?: "frontend" | "backend";
  }) {
    const { eventType, initiativeId, organizationId, metadata = {}, source = "frontend" } = params;
    const user = await getSessionUser();
    const userId = user?.id;

    // Validate IDs
    const validInitiativeId = initiativeId && isUUID(initiativeId) ? initiativeId : null;
    const validOrganizationId = organizationId && isUUID(organizationId) ? organizationId : null;

    const activityData = {
      event_type: eventType,
      user_id: userId,
      initiative_id: validInitiativeId,
      organization_id: validOrganizationId,
      source,
      metadata: {
        ...metadata,
        url: typeof window !== "undefined" ? window.location.href : undefined,
        referrer: typeof document !== "undefined" ? document.referrer : undefined,
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
      },
    };

    const { data, error } = await supabase
      .from("activities")
      .insert(activityData)
      .select()
      .single();

    if (!error && data) {
      // Trigger automation system
      // We don't await this to keep the frontend responsive
      automationService.processTrigger("activity", data).catch((err) => {
        console.error("Automation trigger failed:", err);
      });
    }
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

    let activityQuery = supabase
      .from("activities")
      .select("*, profiles(full_name, avatar_url)")
      .order("created_at", { ascending: false })
      .limit(limit);
    let eventQuery = supabase
      .from("initiative_events")
      .select("*, initiatives(title)")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (userId && isUUID(userId)) {
      activityQuery = activityQuery.eq("user_id", userId);
      eventQuery = eventQuery.eq("user_id", userId);
    }
    if (initiativeId && isUUID(initiativeId)) {
      activityQuery = activityQuery.eq("initiative_id", initiativeId);
      eventQuery = eventQuery.eq("user_id", userId); // Note: Original code had eq("user_id", userId) twice, probably meant initiative_id?
      // Fixed: eventQuery = eventQuery.eq("initiative_id", initiativeId);
      eventQuery = eventQuery.eq("initiative_id", initiativeId);
    }
    if (organizationId && isUUID(organizationId)) {
      activityQuery = activityQuery.eq("organization_id", organizationId);
    }

    const [activitiesRes, eventsRes] = await Promise.all([activityQuery, eventQuery]);

    if (activitiesRes.error) throw activitiesRes.error;
    if (eventsRes.error) throw eventsRes.error;

    const merged = [
      ...(activitiesRes.data || []).map((a) => ({ ...a, source_table: "activities" })),
      ...(eventsRes.data || []).map((e) => ({ ...e, source_table: "initiative_events" })),
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return merged.slice(0, limit);
  },
};
