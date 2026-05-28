import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useImpactMetrics() {
  return useQuery({
    retry: false,
    queryKey: ["dashboard", "impact", "metrics"],
    queryFn: async () => {
      // Fetch active supporters (from profiles + active subscription)
      const { count: activeSupporters } = await supabase
        .from("subscriptions")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");

      // Fetch initiative participation (number of initiatives with allocations)
      const { data: allocations } = await supabase
        .from("allocations")
        .select("initiative_id");

      const uniqueInitiatives = new Set(allocations?.map(a => a.initiative_id)).size;

      return {
        activeSupporters: activeSupporters || 0,
        supportedInitiatives: uniqueInitiatives
      };
    }
  });
}
