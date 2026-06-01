import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useImpactMetrics() {
  return useQuery({
    retry: false,
    queryKey: ["dashboard", "impact", "metrics"],
    queryFn: async () => {
      const [subscriptionsRes, allocationsRes, initiativesRes, organizationsRes] =
        await Promise.all([
          supabase
            .from("subscriptions")
            .select("*", { count: "exact", head: true })
            .eq("status", "active"),
          supabase.from("allocations").select("initiative_id"),
          supabase.from("initiatives").select("id, current_amount_mur, is_published, is_approved"),
          supabase
            .from("organizations")
            .select("id", { count: "exact", head: true })
            .eq("is_verified", true),
        ]);

      const activeSupporters = subscriptionsRes.count || 0;
      const allocations = allocationsRes.data || [];
      const uniqueInitiatives = new Set(allocations?.map((a) => a.initiative_id)).size;
      const initiatives = initiativesRes.data || [];
      const activeCount = initiatives.filter(
        (initiative) => initiative.is_published && initiative.is_approved,
      ).length;
      const totalImpact = initiatives.reduce(
        (sum, initiative) => sum + Number(initiative.current_amount_mur || 0),
        0,
      );

      return {
        activeSupporters,
        supportedInitiatives: uniqueInitiatives,
        totalImpact,
        activeCount,
        verifiedOrgs: organizationsRes.count || 0,
        engagementScore:
          activeSupporters > 0
            ? Math.min(100, Math.round((uniqueInitiatives / activeSupporters) * 100))
            : 0,
      };
    },
  });
}
