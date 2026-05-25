import { createServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { paymentService } from "./payments/service";

export const toggleInitiativePreference = createServerFn({ method: "POST" })
  .inputValidator((data: { userId: string; initiativeId: string; selected: boolean }) => data)
  .handler(async ({ data }) => {
    const { userId, initiativeId, selected } = data;

    if (selected) {
      const { error } = await supabase.from("member_preferences").upsert(
        {
          user_id: userId,
          initiative_id: initiativeId,
        },
        { onConflict: "user_id, initiative_id" },
      );
      if (error) throw new Error("Failed to add preference");
    } else {
      const { error } = await supabase
        .from("member_preferences")
        .delete()
        .eq("user_id", userId)
        .eq("initiative_id", initiativeId);
      if (error) throw new Error("Failed to remove preference");
    }

    return { success: true };
  });

export const createLead = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      email: string;
      fullName: string;
      phone?: string;
      amount: number;
      coversFees: boolean;
      status?: string;
      sourceInitiativeId?: string | null;
    }) => data,
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
    } = data;
    const trimmedEmail = email.trim().toLowerCase();

    const { error } = await supabase.from("leads").insert({
      email: trimmedEmail,
      full_name: fullName.trim(),
      phone: phone?.trim() || null,
      amount_mur: amount,
      covers_fees: coversFees,
      status: status,
      source_initiative_id: sourceInitiativeId || null,
      last_activity_at: new Date().toISOString(),
    });

    if (error) {
      if (error.code === "23505") {
        // Upsert logic for existing lead to update last activity
        await supabase
          .from("leads")
          .update({ last_activity_at: new Date().toISOString() })
          .eq("email", trimmedEmail)
          .eq("source_initiative_id", sourceInitiativeId || null);
        return { success: true, message: "Lead activity updated" };
      }
      console.error("Error creating lead:", error);
      throw new Error("Failed to capture details. Please try again.");
    }

    return { success: true };
  });

export const convertLead = createServerFn({ method: "POST" })
  .inputValidator(
    (data: { email: string; status?: string; sourceInitiativeId?: string | null }) => data,
  )
  .handler(async ({ data }) => {
    const { email, status = "converted", sourceInitiativeId } = data;

    const query = supabase
      .from("leads")
      .update({
        status: status,
        last_activity_at: new Date().toISOString(),
        converted_at: status === "converted" ? new Date().toISOString() : undefined,
      })
      .eq("email", email.trim().toLowerCase())
      .neq("status", status);

    if (sourceInitiativeId) {
      query.eq("source_initiative_id", sourceInitiativeId);
    }

    const { error } = await query;

    if (error) {
      console.error("Error converting lead:", error);
    }

    return { success: true };
  });

export const startMembershipSubscription = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      userId: string;
      amount: number;
      billingDate: number;
      coversFees: boolean;
      priorities: string[];
    }) => data,
  )
  .handler(async ({ data }) => {
    const result = await paymentService.subscribe({
      userId: data.userId,
      amount: data.amount,
      billingDate: data.billingDate,
      coversFees: data.coversFees,
      priorityInitiatives: data.priorities,
    });

    const { error } = await supabase.from("subscriptions").upsert({
      user_id: data.userId,
      amount_mur: data.amount,
      status: result.status as any,
      peach_subscription_id: result.subscriptionId,
      next_billing_date: result.nextBillingDate,
      covers_fees: data.coversFees,
    });

    if (error) throw error;

    return result;
  });
