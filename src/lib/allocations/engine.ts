import { supabase } from "@/integrations/supabase/client";

interface AllocationResult {
  initiativeId: string;
  organizationId: string;
  amount: number;
  potentialAmount: number;
  isOverflow: boolean;
}

export class AllocationEngine {
  private readonly CG_FEE_PERCENT = 0.20;
  private readonly Organization_POOL_PERCENT = 0.80;

  async calculateAllocations(userId: string, netAmount: number): Promise<AllocationResult[]> {
    // 1. Get member preferences (priorities)
    const { data: preferences, error: prefError } = await supabase
      .from("member_preferences")
      .select("initiative_id, initiatives(id, organization_id, goal_amount_mur, current_amount_mur, is_impact_pool)")
      .eq("user_id", userId)
      .order("priority_level", { ascending: true });

    if (prefError || !preferences) {
      console.error("Error fetching preferences:", prefError);
      return [];
    }

    // 2. Identify Impact Pool (always final fallback)
    const { data: impactPools } = await supabase
      .from("initiatives")
      .select("id, organization_id")
      .eq("is_impact_pool", true)
      .limit(1);

    const impactPoolId = impactPools?.[0]?.id;
    const impactPoolOrgId = impactPools?.[0]?.organization_id;

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

      // Potential is what they WANTED to give to this initiative
      const potential = netAmount / Math.max(1, preferences.length);

      const toAllocate = Math.min(remainingPool, space);

      if (toAllocate > 0) {
        allocations.push({
          initiativeId: initiative.id,
          organizationId: initiative.organization_id,
          amount: toAllocate,
          potentialAmount: potential,
          isOverflow: toAllocate < potential
        });
        remainingPool -= toAllocate;
      }
    }

    // 4. Final Fallback to Impact Pool
    if (remainingPool > 0 && impactPoolId) {
      allocations.push({
        initiativeId: impactPoolId,
        organizationId: impactPoolOrgId,
        amount: remainingPool,
        potentialAmount: 0,
        isOverflow: true
      });
    }

    return allocations;
  }

  async processPayment(paymentId: string, userId: string, totalAmount: number): Promise<void> {
    const netAmount = totalAmount * this.Organization_POOL_PERCENT;
    const cgShare = totalAmount * this.CG_FEE_PERCENT;

    const results = await this.calculateAllocations(userId, netAmount);

    for (const res of results) {
      await supabase.from("allocations").insert({
        payment_id: paymentId,
        initiative_id: res.initiativeId,
        organization_id: res.organizationId,
        amount_mur: res.amount,
        potential_amount_mur: res.potentialAmount,
        is_overflow: res.isOverflow
      });

      // Update initiative progress
      await supabase.rpc("increment_initiative_amount", {
        initiative_id: res.initiativeId,
        increment_by: res.amount
      });
    }

    console.log(`[AllocationEngine] Processed payment ${paymentId}. CG Share: ${cgShare}, Organization Pool: ${netAmount}`);
  }
}

export const allocationEngine = new AllocationEngine();
