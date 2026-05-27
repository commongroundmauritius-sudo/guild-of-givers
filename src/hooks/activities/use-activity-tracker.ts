import { useEffect } from "react";
import { activityService, ActivityEventType } from "@/lib/activities/activity-service";

export function useActivityTracker(params?: {
  eventType?: ActivityEventType;
  initiativeId?: string;
  organizationId?: string;
  metadata?: Record<string, any>;
}) {
  useEffect(() => {
    if (params?.eventType) {
      activityService.logEvent({
        eventType: params.eventType,
        initiativeId: params.initiativeId,
        organizationId: params.organizationId,
        metadata: params.metadata,
      });
    }
  }, [params?.eventType, params?.initiativeId]);
  return { trackEvent: activityService.logEvent };
}
