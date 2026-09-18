import { createServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { paymentService } from "./payments/service";
import { activityService } from "./activities/activity-service";
import { z } from "zod";
import { uuidSchema, emailSchema, nameSchema } from "./security/validators";
import { ensureAuthenticated } from "./security/auth";
import { rateLimit } from "./security/rateLimit";

export const toggleInitiativePreference = createServerFn({ method: "POST" })
  .inputValidator(z.object({ initiativeId: uuidSchema, selected: z.boolean() }))
  .handler(async ({ data }) => {
    const user = await ensureAuthenticated();
    const { initiativeId, selected } = data;
    if (selected) {
      const { error } = await supabase
        .from("member_preferences")
        .upsert(
          { user_id: user.id, initiative_id: initiativeId },
          { onConflict: "user_id, initiative_id" },
        );
      if (error) throw new Error("Failed to add preference");
    } else {
      const { error } = await supabase
        .from("member_preferences")
        .delete()
        .eq("user_id", user.id)
        .eq("initiative_id", initiativeId);
      if (error) throw new Error("Failed to remove preference");
    }
    return { success: true };
  });

export const createLead = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      email: emailSchema,
      fullName: nameSchema,
      phone: z.string().max(20).optional().nullable(),
      amount: z.number().min(167),
      coversFees: z.boolean(),
      status: z.string().optional(),
      sourceInitiativeId: uuidSchema.optional().nullable(),
      attribution: z.any().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const {
      email,
      fullName,
      phone,
      amount,
      coversFees,
      status = "started",
      sourceInitiativeId,
      attribution,
    } = data;
    await rateLimit(email, "create_lead", { windowMs: 3600000, max: 5 });
    const trimmedEmail = email.trim().toLowerCase();
    let campaignLinkId = null;
    if (attribution?.tracking_code) {
      const { data: linkData } = await supabase
        .from("campaign_links")
        .select("id")
        .eq("tracking_code", attribution.tracking_code)
        .single();
      campaignLinkId = linkData?.id;
    }
    const { error } = await supabase.from("leads").insert({
      email: trimmedEmail,
      full_name: fullName.trim(),
      phone: phone?.trim() || null,
      amount_mur: amount,
      covers_fees: coversFees,
      status,
      lead_stage: "Visitor",
      source_initiative_id: sourceInitiativeId as any,
      campaign_link_id: campaignLinkId,
      utm_parameters: attribution || {},
      last_activity_at: new Date().toISOString(),
    });
    if (error) {
      if (error.code === "23505") {
        await supabase
          .from("leads")
          .update({ last_activity_at: new Date().toISOString(), lead_stage: "Visitor" })
          .eq("email", trimmedEmail);
        return { success: true, message: "Lead activity updated" };
      }
      throw new Error("Failed to capture details. Please try again.");
    }
    await activityService.logEvent({
      eventType: "lead_captured",
      initiativeId: sourceInitiativeId || undefined,
      metadata: { email: trimmedEmail, stage: "Visitor" },
      source: "backend",
    });
    return { success: true };
  });

export const convertLead = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      email: emailSchema,
      status: z.string().optional(),
      sourceInitiativeId: uuidSchema.optional().nullable(),
    }),
  )
  .handler(async ({ data }) => {
    const user = await ensureAuthenticated();
    const { email, status = "converted", sourceInitiativeId } = data;
    const { data: lead } = await supabase
      .from("leads")
      .select("id")
      .eq("email", email.trim().toLowerCase())
      .maybeSingle();
    if (!lead) throw new Error("Lead not found");
    const { error } = await supabase
      .from("leads")
      .update({
        status,
        lead_stage: "Subscriber",
        converted_at: new Date().toISOString(),
        last_activity_at: new Date().toISOString(),
      })
      .eq("id", lead.id);
    if (error) throw error;
    await activityService.logEvent({
      initiativeId: sourceInitiativeId || undefined,
      eventType: "payment_completed",
      metadata: { user_id: user.id, lead_id: lead.id, email: email.trim().toLowerCase() },
      source: "backend",
    });
    return { success: true };
  });

export const startMembershipSubscription = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      amount: z.number().min(167),
      billingDate: z.number().int().min(1).max(31),
      coversFees: z.boolean(),
      priorities: z.array(uuidSchema),
    }),
  )
  .handler(async ({ data }) => {
    const user = await ensureAuthenticated();
    await rateLimit(user.id, "start_subscription", { windowMs: 3600000, max: 3 });
    if (import.meta.env.PROD) throw new Error("Production payments are not configured yet");
    const result = await paymentService.subscribe({
      userId: user.id,
      amount: data.amount,
      billingDate: data.billingDate,
      coversFees: data.coversFees,
      priorityInitiatives: data.priorities,
    });
    if (result.status !== "active")
      throw new Error("Mock provider did not activate the subscription");
    return result;
  });

export const finalizeMockMembership = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      amount: z.number().min(167),
      billingDate: z.number().int().min(1).max(31),
      coversFees: z.boolean(),
      transactionId: z.string().regex(/^mock_txn_[a-z0-9]+$/),
      priorities: z.array(uuidSchema),
    }),
  )
  .handler(async ({ data }) => {
    const user = await ensureAuthenticated();
    if (import.meta.env.PROD) throw new Error("Mock membership finalization is development-only");
    await rateLimit(user.id, "finalize_mock_membership", { windowMs: 3600000, max: 3 });
    const { data: result, error } = await supabase.rpc("dev_complete_mock_membership", {
      p_amount_mur: data.amount,
      p_billing_date: data.billingDate,
      p_covers_fees: data.coversFees,
      p_transaction_id: data.transactionId,
      p_priority_initiatives: data.priorities,
    } as any);
    if (error) throw new Error(error.message || "Mock membership finalization failed");
    return result as any;
  });
