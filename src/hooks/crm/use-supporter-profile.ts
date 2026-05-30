import { useQuery } from "@tanstack/react-query";
import { supporterService } from "@/lib/crm/supporter-service";

export function useSupporterProfile(profileId: string) {
  return useQuery({
    retry: false,
    queryKey: ["supporter-profile", profileId],
    queryFn: () => supporterService.getSupporterProfile(profileId),
    enabled: !!profileId,
  });
}

export function useSupporterTimeline(profileId: string) {
  return useQuery({
    retry: false,
    queryKey: ["supporter-timeline", profileId],
    queryFn: () => supporterService.getTimeline(profileId),
    enabled: !!profileId,
  });
}
