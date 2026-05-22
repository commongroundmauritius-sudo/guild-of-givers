import { supabase } from "./src/integrations/supabase/client";
import { subscriptionEngine } from "./src/lib/payments/subscription-engine";
import { MockPaymentProvider } from "./src/lib/payments/mock-provider";

async function test() {
  const userId = "ef0493c9-3582-425f-a362-aef909588df7"; // Existing admin/user ID from memory
  const amount = 450;
  const subscriptionId = "mock_sub_123";
  const transactionId = "mock_txn_123";

  console.log("Simulating payment.success event...");
  const event = MockPaymentProvider.generateMockEvent("payment.success", {
    userId,
    subscriptionId,
    transactionId,
    amount
  });

  await subscriptionEngine.handlePaymentEvent(event);

  // Check payments table
  const { data: payments } = await supabase
    .from("payments")
    .select("*")
    .eq("peach_payment_id", transactionId);

  console.log("Payments record:", payments);

  // Check subscriptions table
  const { data: subs } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("peach_subscription_id", subscriptionId);

  console.log("Subscriptions record:", subs);
}

test();
