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

function isWebhookPayload(payload: any): payload is WebhookPayload {
  return typeof payload === "object" && payload !== null;
}

/**
 * PRODUCTION NOTE: Webhook signature validation should be implemented here
 * using the provider's specific signing secret.
 */
async function validateWebhookSignature(payload: any, signature?: string): Promise<boolean> {
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
  payload: any,
  signature?: string,
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

  // Provider event IDs are the idempotency key. Refuse to process an event
  // that was already successfully handled.
  if (payload.id) {
    const { data: existingEvent, error: existingEventError } = await supabase
      .from("payment_events")
      .select("processing_status")
      .eq("provider_event_id", eventId)
      .maybeSingle();

    if (existingEventError) {
      console.error("Error checking payment event idempotency:", existingEventError);
      return { success: false };
    }

    if (existingEvent?.processing_status === "processed") {
      return { success: true };
    }
  }

  // 1. Log the raw event for audit/debugging
  const { error: logError } = await supabase.from("payment_events").insert({
    provider: paymentProvider.name,
    provider_event_id: eventId,
    event_type: payload.event_type || "unknown",
    raw_payload: payload as unknown as Json,
    processing_status: "received",
  });

  if (logError) {
    // A duplicate can race the pre-check. If the database rejected the
    // provider_event_id uniqueness constraint, treat it as already claimed.
    if (payload.id && /duplicate|unique/i.test(logError.message ?? "")) {
      const { data: existingEvent } = await supabase
        .from("payment_events")
        .select("processing_status")
        .eq("provider_event_id", eventId)
        .maybeSingle();

      if (existingEvent?.processing_status === "processed") {
        return { success: true };
      }
    } else {
      console.error("Error logging payment event:", logError);
      return { success: false };
    }
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
