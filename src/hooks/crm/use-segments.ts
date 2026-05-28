import { useQuery } from "@tanstack/react-query";
import { supporterService } from "@/lib/crm/supporter-service";

export function useRecurringContributors(organizationId: string) {
  return useQuery({
    retry: false,
    queryKey: ['segments-recurring', organizationId],
    queryFn: () => supporterService.getRecurringContributors(organizationId),
    enabled: !!organizationId
  });
}

export function useDormantSupporters(organizationId: string) {
  return useQuery({
    retry: false,
    queryKey: ['segments-dormant', organizationId],
    queryFn: () => supporterService.getDormantSupporters(organizationId),
    enabled: !!organizationId
  });
}
