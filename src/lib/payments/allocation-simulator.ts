export interface SimulatedAllocation {
  grossAmount: number;
  feeAmount: number;
  netAmount: number;
  platformShare: number;
  organizationPool: number;
  allocations: { initiativeId: string; title: string; amount: number; isOverflow: boolean }[];
  impactPoolAmount: number;
}

export interface SimulationInput {
  amount: number;
  feeType?: "percentage" | "fixed" | "hybrid";
  percentageFee?: number;
  fixedFee?: number;
  preferences: {
    initiativeId: string;
    title: string;
    monthlyTarget: number;
    currentReceived: number;
    isActive?: boolean;
    isApproved?: boolean;
    isPublished?: boolean;
    isImpactPool?: boolean;
  }[];
}

export function simulateAllocation(input: SimulationInput): SimulatedAllocation {
  const {
    amount,
    preferences,
    feeType = "hybrid",
    percentageFee = 0.035,
    fixedFee = 10,
  } = input;

  const percentageAmount = amount * percentageFee;
  const feeAmount =
    feeType === "percentage"
      ? Math.round(percentageAmount * 100) / 100
      : feeType === "fixed"
        ? fixedFee
        : Math.round((percentageAmount + fixedFee) * 100) / 100;

  const netAmount = Math.max(0, amount - feeAmount);
  const platformShare = Math.round(netAmount * 0.2 * 100) / 100;
  const organizationPool = Math.max(0, netAmount - platformShare);

  let remainingPool = organizationPool;
  const allocations: SimulatedAllocation["allocations"] = [];

  for (const pref of preferences) {
    if (remainingPool <= 0) break;
    if (
      pref.isActive === false ||
      pref.isApproved === false ||
      pref.isPublished === false ||
      pref.isImpactPool === true
    ) {
      continue;
    }

    const cycleSpace = Math.max(0, pref.monthlyTarget - pref.currentReceived);
    const toAllocate =
      pref.monthlyTarget > 0
        ? Math.min(remainingPool, cycleSpace)
        : remainingPool;

    if (toAllocate > 0) {
      allocations.push({
        initiativeId: pref.initiativeId,
        title: pref.title,
        amount: toAllocate,
        isOverflow: toAllocate < remainingPool,
      });
      remainingPool -= toAllocate;
    }
  }

  return {
    grossAmount: amount,
    feeAmount,
    netAmount,
    platformShare,
    organizationPool,
    allocations,
    impactPoolAmount: Math.max(0, remainingPool),
  };
}
