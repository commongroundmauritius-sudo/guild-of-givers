import {
  PaymentProvider,
  SubscriptionRequest,
  SubscriptionResult,
  SubscriptionStatus,
} from "./types";
import { paymentProvider } from "./mock-provider";

class PaymentService {
  private provider: PaymentProvider;

  constructor(provider: PaymentProvider) {
    this.provider = provider;
  }

  async startPayment(
    amount: number,
    currency: string = "MUR",
    metadata: Record<string, unknown> = {},
  ) {
    return this.provider.initializePayment(amount, currency, metadata);
  }

  async subscribe(request: SubscriptionRequest): Promise<SubscriptionResult> {
    return this.provider.createSubscription(request);
  }

  async cancel(subscriptionId: string): Promise<boolean> {
    return this.provider.cancelSubscription(subscriptionId);
  }

  async resume(subscriptionId: string): Promise<boolean> {
    return this.provider.resumeSubscription(subscriptionId);
  }

  async getStatus(subscriptionId: string): Promise<SubscriptionStatus> {
    return this.provider.getSubscriptionStatus(subscriptionId);
  }
}

export const paymentService = new PaymentService(paymentProvider);
