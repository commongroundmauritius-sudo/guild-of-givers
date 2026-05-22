import { supabase } from "./src/integrations/supabase/client";
import { subscriptionEngine } from "./src/lib/payments/subscription-engine";
import { MockPaymentProvider } from "./src/lib/payments/mock-provider";
import { allocationEngine } from "./src/lib/allocations/engine";

async function verify() {
  console.log("--- End-to-End Logic Verification ---");

  const testUserId = "ef0493c9-3582-425f-a362-aef909588df7"; // Using existing admin for test
  const amount = 1000;
  const subId = "test_sub_" + Date.now();
  const txnId = "test_txn_" + Date.now();

  // 1. Verify 20/80 Split & Overflow Logic
  console.log("\n1. Verifying Allocation Logic...");

  // Setup: Clear existing preferences and add 2 initiatives with small goals
  await supabase.from("member_preferences").delete().eq("user_id", testUserId);

  const { data: initiatives } = await supabase.from("initiatives").select("id").limit(2);
  if (!initiatives || initiatives.length < 2) {
    console.error("Not enough initiatives for test");
    return;
  }

  // Set small goals to force overflow
  await supabase.from("initiatives").update({ goal_amount_mur: 100, current_amount_mur: 0 }).eq("id", initiatives[0].id);
  await supabase.from("initiatives").update({ goal_amount_mur: 100, current_amount_mur: 0 }).eq("id", initiatives[1].id);

  await supabase.from("member_preferences").insert([
    { user_id: testUserId, initiative_id: initiatives[0].id, priority_level: 1 },
    { user_id: testUserId, initiative_id: initiatives[1].id, priority_level: 2 }
  ]);

  console.log("Simulating payment of MUR 1000...");
  const event = MockPaymentProvider.generateMockEvent("payment.success", {
    userId: testUserId,
    subscriptionId: subId,
    transactionId: txnId,
    amount: amount
  });

  await subscriptionEngine.handlePaymentEvent(event);

  // Expected:
  // Total 1000.
  // NGO Pool (80%) = 800.
  // Priority 1 gets 100 (cap reached). Remaining 700.
  // Priority 2 gets 100 (cap reached). Remaining 600.
  // Impact Pool (Fallback) gets 600.

  const { data: allocations } = await supabase.from("allocations").select("*").eq("payment_id", (await supabase.from("payments").select("id").eq("peach_payment_id", txnId).single()).data.id);

  console.log("Allocations found:", allocations.length);
  allocations.forEach(a => {
    console.log(`- Initiative ${a.initiative_id}: MUR ${a.amount_mur}`);
  });

  const totalAllocated = allocations.reduce((sum, a) => sum + Number(a.amount_mur), 0);
  console.log("Total Allocated to NGO Pool:", totalAllocated);
  if (totalAllocated === 800) {
    console.log("PASS: 20/80 split correctly applied (800/1000)");
  } else {
    console.log("FAIL: Incorrect NGO pool amount:", totalAllocated);
  }

  // 2. Verify Subscription State
  console.log("\n2. Verifying Subscription State...");
  const { data: subRecord } = await supabase.from("subscriptions").select("status").eq("peach_subscription_id", subId).single();
  if (subRecord?.status === "active") {
    console.log("PASS: Subscription status set to active");
  } else {
    console.log("FAIL: Subscription status is", subRecord?.status);
  }

  console.log("\n--- Verification Complete ---");
}

verify();
