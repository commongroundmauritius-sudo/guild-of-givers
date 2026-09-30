import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { simulateAllocation, SimulationInput } from "@/lib/payments/allocation-simulator";

export function useAllocationSimulation(amount: number, userId?: string) {
  return useQuery({
    queryKey: ["allocation-simulation", userId, amount],
    queryFn: async () => {
      if (!userId || !amount) return null;

      // 1. Fetch user preferences with current cycle stats
      const { data: prefs } = await supabase
        .from("member_preferences")
        .select(
          `
          initiative_id,
          priority_level,
          initiatives (
            id,
            title,
            monthly_target_mur,
            status,
            is_approved,
            is_published,
            is_impact_pool,
            initiative_funding_cycles (
              received_amount_mur
            )
          )
        `,
        )
        .eq("user_id", userId)
        .order("priority_level", { ascending: true });

      if (!prefs) return null;

      const input: SimulationInput = {
        amount,
        preferences: (prefs || []).map((p: any) => ({
          initiativeId: p.initiative_id,
          title: p.initiatives?.title || "Unknown Initiative",
          monthlyTarget: Number(p.initiatives?.monthly_target_mur || 0),
          currentReceived: Number(
            p.initiatives?.initiative_funding_cycles?.[0]?.received_amount_mur || 0,
          ),
          isActive: p.initiatives?.status === "active",
          isApproved: p.initiatives?.is_approved === true,
          isPublished: p.initiatives?.is_published === true,
          isImpactPool: p.initiatives?.is_impact_pool === true,
        })),
      };

      return simulateAllocation(input);
    },
    enabled: !!userId && amount > 0,
  });
}
