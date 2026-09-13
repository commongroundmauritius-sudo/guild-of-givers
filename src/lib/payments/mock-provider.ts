import {
  PaymentProvider,
  SubscriptionRequest,
  SubscriptionResult,
  PaymentEvent,
  SubscriptionStatus,
  PaymentEventType,
} from "./types";

function assertDevelopmentOnly(): void {
  if (import.meta.env.PROD) {
    throw new Error("Mock payment provider is disabled in production");
  }
}

export class MockPaymentProvider implements PaymentProvider {
  name = "MockProvider";

  async initializePayment(
    amount: number,
    currency: string,
    metadata: Record<string, unknown>,
  ): Promise<{ checkoutUrl: string; transactionId: string }> {
    assertDevelopmentOnly();
    console.log(`[MockProvider] Initializing payment of ${amount} ${currency}`, metadata);
    const transactionId = `mock_txn_${Math.random().toString(36).substr(2, 9)}`;
    return {
      checkoutUrl: `/mock-checkout?txn=${transactionId}&amount=${amount}`,
      transactionId,
    };
  }

  async createSubscription(request: SubscriptionRequest): Promise<SubscriptionResult> {
    assertDevelopmentOnly();
    console.log(`[MockProvider] Creating subscription for user ${request.userId}`);
    const subscriptionId = `mock_sub_${Math.random().toString(36).substr(2, 9)}`;

    const now = new Date();
    const nextBilling = new Date(now.getFullYear(), now.getMonth(), request.billingDate);
    if (nextBilling <= now) {
      nextBilling.setMonth(nextBilling.getMonth() + 1);
    }

    return {
      subscriptionId,
      status: "active",
      nextBillingDate: nextBilling.toISOString(),
    };
  }

  async cancelSubscription(subscriptionId: string): Promise<boolean> {
    assertDevelopmentOnly();
    console.log(`[MockProvider] Cancelling subscription ${subscriptionId}`);
    return true;
  }

  async resumeSubscription(subscriptionId: string): Promise<boolean> {
    assertDevelopmentOnly();
    console.log(`[MockProvider] Resuming subscription ${subscriptionId}`);
    return true;
  }

  async getSubscriptionStatus(subscriptionId: string): Promise<SubscriptionStatus> {
    assertDevelopmentOnly();
    return "active";
  }

  async handleWebhook(payload: Record<string, unknown>): Promise<PaymentEvent> {
    assertDevelopmentOnly();
    const type = payload.event_type as PaymentEventType;
    return {
      type,
      userId: payload.user_id as string,
      subscriptionId: payload.subscription_id as string,
      transactionId: payload.transaction_id as string,
      amount: payload.amount as number,
      payload,
    };
  }

  static generateMockEvent(
    type: PaymentEventType,
    data: Partial<PaymentEvent>,
  ): Record<string, unknown> {
    assertDevelopmentOnly();
    return {
      event_type: type,
      user_id: data.userId || "mock_user",
      subscription_id: data.subscriptionId || "mock_sub",
      transaction_id: data.transactionId || "mock_txn",
      amount: data.amount || 450,
      timestamp: new Date().toISOString(),
    };
  }
}

export const paymentProvider = new MockPaymentProvider();
