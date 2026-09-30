import { supabase } from "@/integrations/supabase/client";
import { subscriptionEngine } from "./subscription-engine";
import { toast } from "sonner";

export const simulatePaymentEvent = async (params: { data: any }) => {
  const { data } = params;
  try {
    let transactionId = data.transactionId;
    if (data.type === "payment.success" && data.userId && typeof data.amount === "number") {
      const { data: paymentId, error } = await supabase.rpc("create_test_payment" as any, {
        p_user_id: data.userId,
        p_amount_mur: data.amount,
      });
      if (error) throw error;
      transactionId = paymentId;
    }

    await subscriptionEngine.handlePaymentEvent({
      type: data.type,
      userId: data.userId,
      subscriptionId: data.subscriptionId,
      transactionId: transactionId || `sim_${Math.random().toString(36).substring(7)}`,
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
