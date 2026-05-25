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
        await this.recordSupporterStatusEvent(userId, "supporter_deactivated");
        break;

      case "subscription.resumed":
        await this.updateSubscriptionStatus(subscriptionId, "active");
        await this.recordSupporterStatusEvent(userId, "supporter_activated");
        break;

      case "payment.failed":
        await this.handleFailedPayment(subscriptionId);
        // Past due counts as deactivated for analytics
        await this.recordSupporterStatusEvent(userId, "supporter_deactivated");
        break;
    }
  }

  private async recordSupporterStatusEvent(userId: string | undefined, eventType: string): Promise<void> {
    if (!userId) return;

    // Resolve primary initiative to record the event against
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
      await this.updateSubscriptionStatus(subscriptionId, "active");
    }

    // On first successful payment, member_acquired is handled by frontend signup,
    // but for renewals that were previously past_due/cancelled, we might want to activate.
    // However, the event system handles supporter_activated specifically for resumes.
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
