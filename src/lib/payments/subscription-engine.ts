import { supabase } from "@/integrations/supabase/client";
import { PaymentEvent } from "./types";

export class SubscriptionEngine {
  async handlePaymentEvent(event: PaymentEvent): Promise<void> {
    const { type, userId, subscriptionId, transactionId, amount } = event;

    switch (type) {
      case "payment.success":
      case "subscription.renewal":
        if (userId && transactionId && typeof amount === "number") {
          await this.processSuccessfulPayment(userId, subscriptionId, transactionId, amount);
        }
        break;

      case "subscription.cancelled":
        if (await this.updateSubscriptionStatus(subscriptionId, "cancelled")) {
          // The database trigger will now handle lead inactivation
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

  async runBillingCycle(): Promise<void> {
    const { error } = await supabase.rpc("process_recurring_billing");
    if (error) throw error;
  }

  private async processSuccessfulPayment(
    userId: string,
    subscriptionId: string | undefined,
    transactionId: string | undefined,
    amount: number | undefined,
  ): Promise<void> {
    if (!transactionId || amount === undefined) return;
    // 1. Allocate funds via RPC (idempotent)
    const { error: allocError } = await supabase.rpc("allocate_payment_funds", {
      p_payment_id: transactionId,
      p_user_id: userId,
      p_total_amount: amount,
    });


    if (allocError) {
      console.error("Fund allocation failed:", allocError);
    }

    // 2. Update subscription status
    if (subscriptionId) {
      await this.updateSubscriptionStatus(subscriptionId, "active");
    }

    // 3. The database trigger tr_handle_lead_conversion on profiles will handle lead status
    // when source_initiative_id is set during signup.
  }

  private async updateSubscriptionStatus(
    subscriptionId: string | undefined,
    status: "active" | "cancelled" | "past_due" | "pending",
  ): Promise<boolean> {
    if (!subscriptionId) return false;

    const { error } = await supabase
      .from("subscriptions")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", subscriptionId);

    return !error;
  }

  private async recordSupporterStatusEvent(
    userId: string | undefined,
    eventType: string,
  ): Promise<void> {
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

}


export const subscriptionEngine = new SubscriptionEngine();
