import {
  PaymentProvider,
  SubscriptionRequest,
  SubscriptionResult,
  PaymentEvent,
  SubscriptionStatus,
  PaymentEventType,
} from "./types";

export class MockPaymentProvider implements PaymentProvider {
  name = "MockProvider";

  async initializePayment(
    amount: number,
    currency: string,
    metadata: Record<string, any>,
  ): Promise<{ checkoutUrl: string; transactionId: string }> {
    console.log(`[MockProvider] Initializing payment of ${amount} ${currency}`);
    const transactionId = `mock_txn_${Math.random().toString(36).substr(2, 9)}`;
    return {
      checkoutUrl: `/mock-checkout?txn=${transactionId}&amount=${amount}`,
      transactionId,
    };
  }

  async createSubscription(request: SubscriptionRequest): Promise<SubscriptionResult> {
    console.log(`[MockProvider] Creating subscription for user ${request.userId}`);
    const subscriptionId = `mock_sub_${Math.random().toString(36).substr(2, 9)}`;

    // Set next billing date to the next occurrence of billingDate
    const now = new Date();
    let nextBilling = new Date(now.getFullYear(), now.getMonth(), request.billingDate);
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
    console.log(`[MockProvider] Cancelling subscription ${subscriptionId}`);
    return true;
  }

  async resumeSubscription(subscriptionId: string): Promise<boolean> {
    console.log(`[MockProvider] Resuming subscription ${subscriptionId}`);
    return true;
  }

  async getSubscriptionStatus(subscriptionId: string): Promise<SubscriptionStatus> {
    return "active";
  }

  async handleWebhook(payload: any): Promise<PaymentEvent> {
    const type = payload.event_type as PaymentEventType;
    return {
      type,
      userId: payload.user_id,
      subscriptionId: payload.subscription_id,
      transactionId: payload.transaction_id,
      amount: payload.amount,
      payload,
    };
  }

  // Helper for simulation
  static generateMockEvent(type: PaymentEventType, data: Partial<PaymentEvent>): any {
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
