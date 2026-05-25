import { handlePaymentWebhook } from "./src/lib/payments/webhook-handler";

async function test() {
  const transactionId = "test_txn_" + Math.random().toString(36).substr(2, 9);
  const payload = {
    id: "evt_1",
    event_type: "payment.success",
    user_id: "70d3023b-0e0a-4228-868e-5b12384a6c38", // Placeholder UUID
    transaction_id: transactionId,
    amount: 1000,
  };

  console.log("Processing first webhook...");
  const res1 = await handlePaymentWebhook(payload);
  console.log("Result 1:", res1);

  console.log("Processing duplicate webhook...");
  const res2 = await handlePaymentWebhook(payload);
  console.log("Result 2:", res2);
}
// This is for context - I can't run this easily without a full env
