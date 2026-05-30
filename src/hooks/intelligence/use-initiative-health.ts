import { useQuery } from "@tanstack/react-query";
import { intelligenceService } from "@/lib/crm/intelligence-service";

export function useInitiativeHealth(initiativeId: string) {
  return useQuery({
    retry: false,
    queryKey: ["initiative-health", initiativeId],
    queryFn: () => intelligenceService.getLatestHealthScore(initiativeId),
    enabled: !!initiativeId,
  });
}

export function useInitiativeHealthHistory(initiativeId: string) {
  return useQuery({
    retry: false,
    queryKey: ["initiative-health-history", initiativeId],
    queryFn: () => intelligenceService.getHealthHistory(initiativeId),
    enabled: !!initiativeId,
  });
}
