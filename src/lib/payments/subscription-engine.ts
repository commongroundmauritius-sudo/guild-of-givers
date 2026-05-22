import { supabase } from "@/integrations/supabase/client";
import { allocationEngine } from "../allocations/engine";
import { PaymentEvent } from "./types";
import { MockPaymentProvider } from "./mock-provider";

export class SubscriptionEngine {
  async handlePaymentEvent(event: PaymentEvent): Promise<void> {
    const { type, userId, subscriptionId, transactionId, amount, payload } = event;

    switch (type) {
      case "payment.success":
        await this.processSuccessfulPayment(userId, subscriptionId, transactionId, amount);
        break;

      case "subscription.renewal":
        await this.processSuccessfulPayment(userId, subscriptionId, transactionId, amount);
        break;

      case "subscription.cancelled":
        await this.updateSubscriptionStatus(subscriptionId, "cancelled");
        break;

      case "subscription.resumed":
        await this.updateSubscriptionStatus(subscriptionId, "active");
        break;

      case "payment.failed":
        await this.handleFailedPayment(subscriptionId);
        break;
    }
  }

  private async processSuccessfulPayment(
    userId: string,
    subscriptionId: string | undefined,
    transactionId: string | undefined,
    amount: number | undefined,
  ): Promise<void> {
    if (!amount) return;

    // 1. Record payment in DB
    const { data: payment, error: pError } = await supabase
      .from("payments")
      .insert({
        user_id: userId,
        subscription_id: null,
        amount_mur: amount,
        status: "success",
        peach_payment_id: transactionId || null,
        paid_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (pError) {
      console.error("Error recording payment:", pError);
      return;
    }

    // 2. Trigger allocations
    const { error: allocError } = await supabase.rpc("allocate_payment_funds", {
        p_payment_id: payment.id,
        p_user_id: userId,
        p_total_amount: amount
    });

    if (allocError) {
        console.error("RPC Allocation failed, falling back to TS engine:", allocError);
        await allocationEngine.processPayment(payment.id, userId, amount);
    }

    // 3. Activate Membership (Decoupling logic: Role assignment now happens here)
    const { error: activateError } = await supabase.rpc("activate_membership", {
        p_user_id: userId
    });
    if (activateError) {
        console.error("Failed to activate membership role:", activateError);
    }

    // 4. Update subscription status
    if (subscriptionId) {
      await this.updateSubscriptionStatus(subscriptionId, "active");
    }
  }

  private async updateSubscriptionStatus(
    subscriptionId: string | undefined,
    status: string,
  ): Promise<void> {
    if (!subscriptionId) return;
    await supabase
      .from("subscriptions")
      .update({ status: status as any, updated_at: new Date().toISOString() })
      .eq("peach_subscription_id", subscriptionId);
  }

  private async handleFailedPayment(subscriptionId: string | undefined): Promise<void> {
    if (!subscriptionId) return;
    await this.updateSubscriptionStatus(subscriptionId, "past_due");
  }

  async runBillingCycle(): Promise<void> {
    console.log("[SubscriptionEngine] Triggering database billing cycle...");
    const { error } = await supabase.rpc("process_recurring_billing");
    if (error) {
        console.error("Failed to trigger DB billing cycle:", error);
        throw error;
    }
  }
}

export const subscriptionEngine = new SubscriptionEngine();
