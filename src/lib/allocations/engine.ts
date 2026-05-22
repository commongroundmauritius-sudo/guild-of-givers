import { supabase } from "@/integrations/supabase/client";

interface AllocationResult {
  initiativeId: string;
  amount: number;
  isOverflow: boolean;
}

export class AllocationEngine {
  private readonly CG_FEE_PERCENT = 0.2;
  private readonly NGO_POOL_PERCENT = 0.8;

  async calculateAllocations(userId: string, netAmount: number): Promise<AllocationResult[]> {
    // 1. Get member preferences (priorities)
    const { data: preferences, error: prefError } = await supabase
      .from("member_preferences")
      .select("initiative_id, initiatives(id, goal_amount_mur, current_amount_mur, is_impact_pool)")
      .eq("user_id", userId)
      .order("priority_level", { ascending: true }); // Simplification for priority order

    if (prefError || !preferences) {
      console.error("Error fetching preferences:", prefError);
      return [];
    }

    // 2. Identify Impact Pool (always final fallback)
    const { data: impactPools } = await supabase
      .from("initiatives")
      .select("id")
      .eq("is_impact_pool", true)
      .limit(1);

    const impactPoolId = impactPools?.[0]?.id;

    const allocations: AllocationResult[] = [];
    let remainingPool = netAmount;

    // 3. Allocation logic: P1 -> P2 -> P3 -> Fallback
    for (const pref of preferences) {
      if (remainingPool <= 0) break;

      const initiative = pref.initiatives as any;
      if (!initiative) continue;

      const cap = Number(initiative.goal_amount_mur) || Infinity;
      const current = Number(initiative.current_amount_mur) || 0;
      const space = Math.max(0, cap - current);

      const toAllocate = Math.min(remainingPool, space);

      if (toAllocate > 0) {
        allocations.push({
          initiativeId: initiative.id,
          amount: toAllocate,
          isOverflow: false,
        });
        remainingPool -= toAllocate;
      }
    }

    // 4. Final Fallback to Impact Pool
    if (remainingPool > 0 && impactPoolId) {
      allocations.push({
        initiativeId: impactPoolId,
        amount: remainingPool,
        isOverflow: true,
      });
    }

    return allocations;
  }

  async processPayment(paymentId: string, userId: string, totalAmount: number): Promise<void> {
    const netAmount = totalAmount * this.NGO_POOL_PERCENT;
    const cgShare = totalAmount * this.CG_FEE_PERCENT;

    const results = await this.calculateAllocations(userId, netAmount);

    for (const res of results) {
      await supabase.from("allocations").insert({
        payment_id: paymentId,
        initiative_id: res.initiativeId,
        amount_mur: res.amount,
      });

      // Update initiative progress
      await supabase.rpc("increment_initiative_amount", {
        initiative_id: res.initiativeId,
        increment_by: res.amount,
      });
    }

    console.log(
      `[AllocationEngine] Processed payment ${paymentId}. CG Share: ${cgShare}, NGO Pool: ${netAmount}`,
    );
  }
}

export const allocationEngine = new AllocationEngine();
