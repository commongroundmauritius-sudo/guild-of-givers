export type PaymentStatus = "success" | "failed" | "pending";
export type SubscriptionStatus = "active" | "pending" | "cancelled" | "past_due" | "paused";

export interface PaymentResult {
  success: boolean;
  transactionId: string;
  amount: number;
  currency: string;
  error?: string;
  timestamp: string;
}

export interface SubscriptionRequest {
  userId: string;
  amount: number;
  billingDate: number; // Day of month (e.g., 7)
  coversFees: boolean;
  priorityInitiatives: string[]; // Ordered list of initiative IDs
}

export interface SubscriptionResult {
  subscriptionId: string;
  status: SubscriptionStatus;
  nextBillingDate: string;
}

export interface PaymentProvider {
  name: string;
  initializePayment(
    amount: number,
    currency: string,
    metadata: Record<string, unknown>,
  ): Promise<{ checkoutUrl: string; transactionId: string }>;
  createSubscription(request: SubscriptionRequest): Promise<SubscriptionResult>;
  cancelSubscription(subscriptionId: string): Promise<boolean>;
  resumeSubscription(subscriptionId: string): Promise<boolean>;
  getSubscriptionStatus(subscriptionId: string): Promise<SubscriptionStatus>;
  handleWebhook(payload: Record<string, unknown>): Promise<PaymentEvent>;
}

export type PaymentEventType =
  | "payment.success"
  | "payment.failed"
  | "subscription.cancelled"
  | "subscription.resumed"
  | "subscription.renewal"
  | "subscription.created";

export interface PaymentEvent {
  type: PaymentEventType;
  userId: string;
  subscriptionId?: string;
  transactionId?: string;
  amount?: number;
  payload: Record<string, unknown>;
}
