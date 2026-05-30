import { useQuery } from "@tanstack/react-query";
import { intelligenceService } from "@/lib/crm/intelligence-service";

export function useRetentionStats(organizationId: string) {
  return useQuery({
    retry: false,
    queryKey: ["retention-stats", organizationId],
    queryFn: () => intelligenceService.getRetentionStats(organizationId),
    enabled: !!organizationId,
  });
}
