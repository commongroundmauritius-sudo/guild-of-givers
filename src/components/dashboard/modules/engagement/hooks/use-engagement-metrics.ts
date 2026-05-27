import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useEngagementMetrics() {
  return useQuery({
    queryKey: ["dashboard", "engagement", "metrics"],
    queryFn: async () => {
      // Fetch share clicks
      const { count: shares } = await supabase
        .from("activities")
        .select("*", { count: "exact", head: true })
        .eq("event_type", "share_click");

      // Fetch repeat visits (users with >1 homepage_view)
      // This is a naive implementation for the placeholder
      const { data: repeatData } = await supabase
        .from("activities")
        .select("user_id")
        .eq("event_type", "homepage_view")
        .not("user_id", "is", null);

      const userCounts: Record<string, number> = {};
      repeatData?.forEach(r => {
        if (r.user_id) userCounts[r.user_id] = (userCounts[r.user_id] || 0) + 1;
      });
      const repeatVisitors = Object.values(userCounts).filter(count => count > 1).length;

      return {
        shares: shares || 0,
        repeatVisitors,
        engagementEvents: repeatData?.length || 0
      };
    }
  });
}
