import { createServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { paymentService } from "./payments/service";
import { activityService } from "./activities/activity-service";
import { z } from "zod";
import { uuidSchema, emailSchema, nameSchema } from "./security/validators";
import { ensureAuthenticated } from "./security/auth";
import { rateLimit } from "./security/rateLimit";

export const toggleInitiativePreference = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      initiativeId: uuidSchema,
      selected: z.boolean(),
    }),
  )
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
      amount: z.number().positive(),
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

    // Rate limit lead creation to prevent spam
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
      status: status,
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
          .eq("email", trimmedEmail)
          .eq("source_initiative_id", sourceInitiativeId as any);
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

export const startMembershipSubscription = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      amount: z.number().positive(),
      billingDate: z.number().int().min(1).max(31),
      coversFees: z.boolean(),
      priorities: z.array(uuidSchema),
    }),
  )
  .handler(async ({ data }) => {
    const user = await ensureAuthenticated();

    // Rate limit subscription attempts
    await rateLimit(user.id, "start_subscription", { windowMs: 3600000, max: 3 });

    const result = await paymentService.subscribe({
      userId: user.id,
      amount: data.amount,
      billingDate: data.billingDate,
      coversFees: data.coversFees,
      priorityInitiatives: data.priorities,
    });
    const { error } = await supabase.from("subscriptions").upsert({
      user_id: user.id,
      amount_mur: data.amount,
      status: result.status as any,
      peach_subscription_id: result.subscriptionId,
      next_billing_date: result.nextBillingDate,
      covers_fees: data.coversFees,
    });
    if (error) throw error;
    return result;
  });
