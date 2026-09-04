import { supabase } from "@/integrations/supabase/client";
import { subscriptionEngine } from "./subscription-engine";
import { toast } from "sonner";

export const simulatePaymentEvent = async (params: { data: any }) => {
  const { data } = params;
  try {
    await subscriptionEngine.handlePaymentEvent({
      type: data.type,
      userId: data.userId,
      subscriptionId: data.subscriptionId,
      transactionId: data.transactionId || `sim_${Math.random().toString(36).substring(7)}`,
      amount: data.amount,
      payload: { simulated: true, ...data },
    });
    return { success: true };
  } catch (error: any) {
    console.error("Simulation failed:", error);
    throw error;
  }
};

export const simulateBillingCycle = async () => {
  try {
    await subscriptionEngine.runBillingCycle();
    return { success: true };
  } catch (error: any) {
    console.error("Billing cycle failed:", error);
    throw error;
  }
};

export const simulateSuccessfulPayment = async (userId: string, amount: number) => {
  try {
    await simulatePaymentEvent({
      data: {
        type: "payment.success",
        userId,
        amount,
      },
    });
    toast.success("Payment simulation successful. Check the ledger for events.");
  } catch (error: any) {
    toast.error(`Simulation failed: ${(error as any).message}`);
  }
};

export const runBillingCycleSimulation = async () => {
  try {
    await simulateBillingCycle();
    toast.success("Billing cycle simulation triggered.");
  } catch (error: any) {
    toast.error(`Billing cycle failed: ${(error as any).message}`);
  }
};
