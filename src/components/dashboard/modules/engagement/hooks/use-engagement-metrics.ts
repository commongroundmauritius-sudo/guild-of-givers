import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useEngagementMetrics() {
  return useQuery({
    queryKey: ["dashboard", "engagement", "metrics"],
    queryFn: async () => {
      // 1. Fetch share clicks
      const { count: shares } = await supabase
        .from("activities")
        .select("*", { count: "exact", head: true })
        .eq("event_type", "share_click");

      // 2. Fetch repeat engagement (users with >1 activity)
      const { data: activityData } = await supabase
        .from("activities")
        .select("user_id")
        .not("user_id", "is", null);

      const userCounts: Record<string, number> = {};
      activityData?.forEach(a => {
        if (a.user_id) userCounts[a.user_id] = (userCounts[a.user_id] || 0) + 1;
      });
      const repeatEngagers = Object.values(userCounts).filter(count => count > 1).length;

      // 3. Fetch multi-initiative participation
      const { data: preferenceData } = await supabase
        .from("member_preferences")
        .select("user_id");

      const preferenceCounts: Record<string, number> = {};
      preferenceData?.forEach(p => {
        if (p.user_id) preferenceCounts[p.user_id] = (preferenceCounts[p.user_id] || 0) + 1;
      });
      const multiInitiativeSupporters = Object.values(preferenceCounts).filter(count => count > 1).length;

      // 4. Fetch 7-day active supporters (at least one activity in last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: recentActivity } = await supabase
        .from("activities")
        .select("user_id")
        .gte("created_at", sevenDaysAgo.toISOString())
        .not("user_id", "is", null);

      const activeSupporters7d = new Set(recentActivity?.map(a => a.user_id)).size;

      return {
        shares: shares || 0,
        repeatEngagers,
        multiInitiativeSupporters,
        activeSupporters7d
      };
    }
  });
}
