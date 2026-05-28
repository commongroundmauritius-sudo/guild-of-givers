import { supabase } from "@/integrations/supabase/client";
import { PaymentEvent } from "./types";

export class SubscriptionEngine {
  async handlePaymentEvent(event: PaymentEvent): Promise<void> {
    const { type, userId, subscriptionId, transactionId, amount, payload } = event;

    switch (type) {
      case "payment.success":
      case "subscription.renewal":
        if (userId && transactionId && typeof amount === "number") {
          await this.processSuccessfulPayment(userId, subscriptionId, transactionId, amount, payload);
        }
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
        await this.processFailedPayment(userId, subscriptionId, transactionId, amount, payload);
        break;
    }
  }

  async runBillingCycle(): Promise<void> {
    const { error } = await supabase.rpc("process_recurring_billing" as any);
    if (error) throw error;
  }

  private async processSuccessfulPayment(
    userId: string,
    subscriptionId: string | undefined,
    transactionId: string | undefined,
    amount: number | undefined,
    payload?: any
  ): Promise<void> {
    if (!transactionId || amount === undefined) return;

    // 1. Allocate funds via RPC (idempotent)
    const { error: allocError } = await supabase.rpc("allocate_payment_funds" as any, {
      p_payment_id: transactionId,
      p_user_id: userId,
      p_total_amount: amount,
    });

    if (allocError) {
      console.error("Fund allocation failed:", allocError);
    }

    // 2. Update payment record with reliability metadata
    await supabase.from("payments").update({
      status: "success",
      paid_at: new Date().toISOString(),
      reconciliation_status: "success",
      gateway_response: payload,
      webhook_event_id: payload?.id
    } as any).eq("id", transactionId);

    // 3. Update subscription status
    if (subscriptionId) {
      await this.updateSubscriptionStatus(subscriptionId, "active");
    }

    // 4. Record official supporter conversion event
    await this.recordSupporterStatusEvent(userId, "member_acquired");
  }

  private async processFailedPayment(
    userId: string,
    subscriptionId: string | undefined,
    transactionId: string | undefined,
    amount: number | undefined,
    payload?: any
  ): Promise<void> {
    const failureReason = payload?.failure_reason || "unknown_error";

    // 1. Update payment record
    if (transactionId) {
      await supabase.from("payments").update({
        status: "failed",
        failure_reason: failureReason,
        gateway_response: payload,
        reconciliation_status: "failed",
        webhook_event_id: payload?.id
      } as any).eq("id", transactionId);
    }

    // 2. Update subscription status and retry count
    if (subscriptionId) {
      const { data: sub } = await supabase
        .from("subscriptions")
        .select("retry_count" as any)
        .eq("id", subscriptionId)
        .single();

      const newRetryCount = ((sub as any)?.retry_count || 0) + 1;

      await supabase
        .from("subscriptions")
        .update({
          status: "past_due",
          failure_reason: failureReason,
          retry_count: newRetryCount,
          last_retry_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as any)
        .eq("id", subscriptionId);

      await this.recordSupporterStatusEvent(userId, "supporter_deactivated");
    }
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
      .select("primary_initiative_id" as any)
      .eq("id", userId)
      .maybeSingle();

    if ((profile as any)?.primary_initiative_id) {
      await supabase.from("initiative_events").insert({
        initiative_id: (profile as any).primary_initiative_id,
        event_type: eventType,
        user_id: userId,
      });
    }
  }
}

export const subscriptionEngine = new SubscriptionEngine();
