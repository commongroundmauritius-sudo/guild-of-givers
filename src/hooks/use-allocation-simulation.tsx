import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { simulateAllocation, SimulationInput } from "@/lib/payments/allocation-simulator";

export function useAllocationSimulation(amount: number, userId?: string) {
  return useQuery({
    queryKey: ["allocation-simulation", userId, amount],
    queryFn: async () => {
      if (!userId || !amount) return null;

      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();

      const [{ data: prefs, error: prefsError }, { data: feeConfig, error: feeError }] =
        await Promise.all([
          supabase
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
                  received_amount_mur,
                  month,
                  year
                )
              )
            `,
            )
            .eq("user_id", userId)
            .order("priority_level", { ascending: true }),
          supabase
            .from("fee_configurations")
            .select("fee_type, percentage_value, fixed_amount_mur")
            .eq("active", true)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
        ]);

      if (prefsError) throw prefsError;
      if (feeError) throw feeError;
      if (!prefs) return null;

      const input: SimulationInput = {
        amount,
        feeType: (feeConfig?.fee_type as SimulationInput["feeType"]) || "fixed",
        percentageFee: Number(feeConfig?.percentage_value || 0) / 100,
        fixedFee: Number(feeConfig?.fixed_amount_mur || 0),
        preferences: (prefs || []).map((p: any) => {
          const cycle = p.initiatives?.initiative_funding_cycles?.find(
            (item: any) => Number(item.month) === month && Number(item.year) === year,
          );

          return {
            initiativeId: p.initiative_id,
            title: p.initiatives?.title || "Unknown Initiative",
            monthlyTarget: Number(p.initiatives?.monthly_target_mur || 0),
            currentReceived: Number(cycle?.received_amount_mur || 0),
            isActive: p.initiatives?.status === "active",
            isApproved: p.initiatives?.is_approved === true,
            isPublished: p.initiatives?.is_published === true,
            isImpactPool: p.initiatives?.is_impact_pool === true,
          };
        }),
      };

      return simulateAllocation(input);
    },
    enabled: !!userId && amount > 0,
  });
}
