import { Tables } from "@/integrations/supabase/types";

export interface SimulatedAllocation {
  grossAmount: number;
  feeAmount: number;
  netAmount: number;
  platformShare: number;
  organizationPool: number;
  allocations: {
    initiativeId: string;
    title: string;
    amount: number;
    isOverflow: boolean;
  }[];
  impactPoolAmount: number;
}

export interface SimulationInput {
  amount: number;
  preferences: {
    initiativeId: string;
    title: string;
    monthlyTarget: number;
    currentReceived: number;
  }[];
}

export function simulateAllocation(input: SimulationInput): SimulatedAllocation {
  const { amount, preferences } = input;

  // 1. Mock Fee Calculation (Hybrid model from DB defaults)
  // 3.5% + Rs 10
  const percentageFee = amount * 0.035;
  const fixedFee = 10;
  const feeAmount = percentageFee + fixedFee;

  const netAmount = amount - feeAmount;

  // 2. 20/80 Split with Rounding Protection
  const platformShare = Math.round(netAmount * 0.2 * 100) / 100;
  const organizationPool = netAmount - platformShare;

  let remainingPool = organizationPool;
  const allocations: SimulatedAllocation["allocations"] = [];

  // 3. Priority Allocation
  for (const pref of preferences) {
    if (remainingPool <= 0) break;

    const cycleSpace = Math.max(0, pref.monthlyTarget - pref.currentReceived);

    // If target is 0, it behaves as unlimited or handles all remaining in P1
    const toAllocate = pref.monthlyTarget > 0 ? Math.min(remainingPool, cycleSpace) : remainingPool;

    if (toAllocate > 0) {
      allocations.push({
        initiativeId: pref.initiativeId,
        title: pref.title,
        amount: toAllocate,
        isOverflow: false,
      });
      remainingPool -= toAllocate;
    }

    if (remainingPool > 0 && cycleSpace === 0 && pref.monthlyTarget > 0) {
      // Documenting potential overflow path if needed
    }
  }

  // 4. Impact Pool Fallback
  const impactPoolAmount = remainingPool > 0 ? remainingPool : 0;

  return {
    grossAmount: amount,
    feeAmount,
    netAmount,
    platformShare,
    organizationPool,
    allocations,
    impactPoolAmount,
  };
}
