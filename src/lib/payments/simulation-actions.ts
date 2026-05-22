import { createServerFn } from "@tanstack/react-start";
import { MockPaymentProvider } from "./mock-provider";
import { handlePaymentWebhook } from "./webhook-handler";
import { subscriptionEngine } from "./subscription-engine";

export const simulatePaymentEvent = createServerFn({ method: "POST" })
  .inputValidator(
    (data: { type: string; userId: string; amount?: number; subscriptionId?: string }) => data,
  )
  .handler(async ({ data }) => {
    const payload = MockPaymentProvider.generateMockEvent(data.type as any, {
      userId: data.userId,
      amount: data.amount,
      subscriptionId: data.subscriptionId,
    });

    return await handlePaymentWebhook(payload);
  });

export const simulateBillingCycle = createServerFn({ method: "POST" }).handler(async () => {
  await subscriptionEngine.runBillingCycle();
  return { success: true };
});
