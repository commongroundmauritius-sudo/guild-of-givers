import { supabase } from "@/integrations/supabase/client";
import { paymentProvider } from "./mock-provider";
import { subscriptionEngine } from "./subscription-engine";
import { Json } from "@/integrations/supabase/types";

interface WebhookPayload {
  id?: string;
  transaction_id?: string;
  event_type?: string;
  [key: string]: any;
}

function isWebhookPayload(payload: unknown): payload is WebhookPayload {
  return typeof payload === "object" && payload !== null;
}

/**
 * PRODUCTION NOTE: Webhook signature validation should be implemented here
 * using the provider's specific signing secret.
 */
async function validateWebhookSignature(payload: unknown, signature?: string): Promise<boolean> {
  // Mock implementation for development
  if (import.meta.env.DEV) return true;

  // In production, fetch secret from env and use crypto to verify
  const secret = import.meta.env.VITE_PAYMENT_WEBHOOK_SECRET;
  if (!secret) {
    console.error("Critical: Webhook secret not configured in production");
    return false;
  }

  // Placeholder for real verification logic
  return !!signature;
}

export async function handlePaymentWebhook(
  payload: unknown,
  signature?: string
): Promise<{ success: boolean }> {
  if (!isWebhookPayload(payload)) {
    console.error("Invalid webhook payload received");
    return { success: false };
  }

  // 0. Validate authenticity
  const isValid = await validateWebhookSignature(payload, signature);
  if (!isValid) {
    console.error("Invalid webhook signature rejected");
    return { success: false };
  }

  const eventId = payload.id || `event_${Date.now()}`;

  // 1. Log the raw event for audit/debugging
  const { error: logError } = await supabase.from("payment_events").insert({
    provider: paymentProvider.name,
    provider_event_id: eventId,
    event_type: payload.event_type || "unknown",
    raw_payload: payload as unknown as Json,
    processing_status: "received",
  });

  if (logError) {
    console.error("Error logging payment event:", logError);
    // Continue anyway, but this is a warning sign
  }

  try {
    // 2. Parse the event using the provider abstraction
    const event = await paymentProvider.handleWebhook(payload as Record<string, unknown>);

    // 3. Process the event via the subscription engine
    await subscriptionEngine.handlePaymentEvent(event);

    // 4. Update log status
    await supabase
      .from("payment_events")
      .update({ processing_status: "processed", processed_at: new Date().toISOString() })
      .eq("provider_event_id", eventId);

    return { success: true };
  } catch (err) {
    console.error("Error processing webhook:", err);

    await supabase
      .from("payment_events")
      .update({ processing_status: "failed" })
      .eq("provider_event_id", eventId);

    return { success: false };
  }
}
