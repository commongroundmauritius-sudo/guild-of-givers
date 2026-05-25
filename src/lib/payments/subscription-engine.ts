import { supabase } from "@/integrations/supabase/client";
import { PaymentEvent } from "./types";

export class SubscriptionEngine {
  async handlePaymentEvent(event: PaymentEvent): Promise<void> {
    const { type, userId, subscriptionId, transactionId, amount } = event;

    switch (type) {
      case "payment.success":
      case "subscription.renewal":
        await this.processSuccessfulPayment(userId, subscriptionId, transactionId, amount);
        break;

      case "subscription.cancelled":
        if (await this.updateSubscriptionStatus(subscriptionId, "cancelled")) {
          await this.recordSupporterStatusEvent(userId, "supporter_deactivated");
        }
        break;

      case "subscription.resumed":
        if (await this.updateSubscriptionStatus(subscriptionId, "active")) {
          await this.recordSupporterStatusEvent(userId, "supporter_activated");
        }
        break;

      case "payment.failed":
        if (await this.updateSubscriptionStatus(subscriptionId, "past_due")) {
          await this.recordSupporterStatusEvent(userId, "supporter_deactivated");
        }
        break;
    }
  }

  private async recordSupporterStatusEvent(userId: string | undefined, eventType: string): Promise<void> {
    if (!userId) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("primary_initiative_id")
      .eq("id", userId)
      .maybeSingle();

    if (profile?.primary_initiative_id) {
      await supabase.from("initiative_events").insert({
        initiative_id: profile.primary_initiative_id,
        event_type: eventType,
        user_id: userId,
      });
    }
  }

  private async processSuccessfulPayment(
    userId: string,
    subscriptionId: string | undefined,
    transactionId: string | undefined,
    amount: number | undefined,
  ): Promise<void> {
    if (!amount) return;

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

    const { error: allocError } = await supabase.rpc("allocate_payment_funds", {
        p_payment_id: payment.id,
        p_user_id: userId,
        p_total_amount: amount
    });

    if (allocError) {
        console.error("CRITICAL: Atomic financial allocation failed:", allocError);
    }

    const { error: activateError } = await supabase.rpc("activate_membership", {
        p_user_id: userId
    });
    if (activateError) {
        console.error("Failed to activate membership role:", activateError);
    }

    if (subscriptionId) {
      const wasUpdated = await this.updateSubscriptionStatus(subscriptionId, "active");
      // If it was previously cancelled or past_due and now becomes active, record activation
      // but only if it wasn't already active (to avoid double counting on renewals)
      // Actually updateSubscriptionStatus handles the check.
      if (wasUpdated) {
          // This would be a resume or a recovery from past_due
          await this.recordSupporterStatusEvent(userId, "supporter_activated");
      }
    }
  }

  /**
   * Updates subscription status and returns true if the status was actually changed.
   */
  private async updateSubscriptionStatus(
    subscriptionId: string | undefined,
    newStatus: string,
  ): Promise<boolean> {
    if (!subscriptionId) return false;

    // Fetch current status to check for change
    const { data: current } = await supabase
      .from("subscriptions")
      .select("status")
      .eq("peach_subscription_id", subscriptionId)
      .maybeSingle();

    if (!current || current.status === newStatus) {
      return false;
    }

    const { error } = await supabase
      .from("subscriptions")
      .update({ status: newStatus as any, updated_at: new Date().toISOString() })
      .eq("peach_subscription_id", subscriptionId);

    return !error;
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
