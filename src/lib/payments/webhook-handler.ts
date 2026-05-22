import { supabase } from "@/integrations/supabase/client";
import { paymentProvider } from "./mock-provider";
import { subscriptionEngine } from "./subscription-engine";

export async function handlePaymentWebhook(payload: any): Promise<{ success: boolean }> {
  // 1. Log the raw event for audit/debugging
  const { error: logError } = await supabase.from("payment_events").insert({
    provider: paymentProvider.name,
    provider_event_id: payload.id || `event_${Date.now()}`,
    event_type: payload.event_type || "unknown",
    raw_payload: payload,
    processing_status: "received",
  });

  if (logError) {
    console.error("Error logging payment event:", logError);
    // Continue anyway, but this is a warning sign
  }

  try {
    // 2. Parse the event using the provider abstraction
    const event = await paymentProvider.handleWebhook(payload);

    // 3. Process the event via the subscription engine
    await subscriptionEngine.handlePaymentEvent(event);

    // 4. Update log status
    await supabase
      .from("payment_events")
      .update({ processing_status: "processed", processed_at: new Date().toISOString() })
      .eq("provider_event_id", payload.id || payload.transaction_id);

    return { success: true };
  } catch (err) {
    console.error("Error processing webhook:", err);

    await supabase
      .from("payment_events")
      .update({ processing_status: "failed" })
      .eq("provider_event_id", payload.id || payload.transaction_id);

    return { success: false };
  }
}
