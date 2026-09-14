import { useEffect } from "react";
import { activityService, ActivityEventType } from "@/lib/activities/activity-service";

export function useActivityTracker(params?: {
  eventType?: ActivityEventType;
  initiativeId?: string;
  organizationId?: string;
  metadata?: Record<string, any>;
}) {
  const eventType = params?.eventType;
  const initiativeId = params?.initiativeId;
  const organizationId = params?.organizationId;
  const metadata = params?.metadata;

  useEffect(() => {
    if (eventType) {
      activityService.logEvent({
        eventType,
        initiativeId,
        organizationId,
        metadata,
      });
    }
  }, [eventType, initiativeId, organizationId, metadata]);

  return { trackEvent: activityService.logEvent };
}
