import { supabase } from "@/integrations/supabase/client";
import { PaymentEvent } from "./types";

export class SubscriptionEngine {
  async handlePaymentEvent(event: PaymentEvent): Promise<void> {
    const { type, userId, subscriptionId, transactionId, amount } = event;

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

    // 2. Trigger atomic PostgreSQL allocation engine
    // This is the single source of truth for all money flow
    const { error: allocError } = await supabase.rpc("allocate_payment_funds", {
        p_payment_id: payment.id,
        p_user_id: userId,
        p_total_amount: amount
    });

    if (allocError) {
        console.error("CRITICAL: Atomic financial allocation failed:", allocError);
        // We do NOT fall back to TS engine anymore to maintain ledger integrity
        // Instead, we log this for admin intervention
    }

    // 3. Activate Membership role
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
    const { error } = await supabase.rpc("process_recurring_billing");
    if (error) {
        console.error("Failed to trigger DB billing cycle:", error);
        throw error;
    }
  }
}

export const subscriptionEngine = new SubscriptionEngine();
