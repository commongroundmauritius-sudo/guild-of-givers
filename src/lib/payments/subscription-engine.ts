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
        subscription_id: null, // Would need actual UUID from DB if exists
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
    await allocationEngine.processPayment(payment.id, userId, amount);

    // 3. Update user status/subscription if applicable
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
    console.log("[SubscriptionEngine] Running billing cycle for today...");

    const { data: subscriptions } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("status", "active")
      .lte("next_billing_date", new Date().toISOString());

    if (!subscriptions) return;

    for (const sub of subscriptions) {
      console.log(`[SubscriptionEngine] Billing subscription ${sub.id} for user ${sub.user_id}`);

      const event = MockPaymentProvider.generateMockEvent("subscription.renewal", {
        userId: sub.user_id,
        subscriptionId: sub.peach_subscription_id || "mock_sub",
        amount: Number(sub.amount_mur),
      });

      await this.handlePaymentEvent(event);

      const nextDate = new Date();
      nextDate.setMonth(nextDate.getMonth() + 1);

      await supabase
        .from("subscriptions")
        .update({ next_billing_date: nextDate.toISOString() })
        .eq("id", sub.id);
    }
  }
}

export const subscriptionEngine = new SubscriptionEngine();
