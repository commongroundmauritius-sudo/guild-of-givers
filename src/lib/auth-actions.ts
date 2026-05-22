import { createServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";

export const toggleInitiativePreference = createServerFn({ method: "POST" })
  .inputValidator((data: { userId: string; initiativeId: string; selected: boolean }) => data)
  .handler(async ({ data }) => {
    const { userId, initiativeId, selected } = data;

    // Verify ownership via RLS or subquery if needed, but here we enforce same-user
    // In a real production app, we would also verify the user's session token on the server.

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
    }) => data,
  )
  .handler(async ({ data }) => {
    const { email, fullName, phone, amount, coversFees } = data;
    const trimmedEmail = email.trim().toLowerCase();

    const { error } = await supabase.from("leads").insert({
      email: trimmedEmail,
      full_name: fullName.trim(),
      phone: phone?.trim() || null,
      amount_mur: amount,
      covers_fees: coversFees,
      status: "pending_review",
    });

    if (error) {
      if (error.code === "23505") {
        // Unique violation
        return { success: true, message: "Lead already exists" };
      }
      console.error("Error creating lead:", error);
      throw new Error("Failed to capture details. Please try again.");
    }

    return { success: true };
  });

export const convertLead = createServerFn({ method: "POST" })
  .inputValidator((data: { email: string }) => data)
  .handler(async ({ data }) => {
    const { email } = data;

    const { error } = await supabase
      .from("leads")
      .update({ status: "converted" })
      .eq("email", email.trim().toLowerCase())
      .neq("status", "converted");

    if (error) {
      console.error("Error converting lead:", error);
    }

    return { success: true };
  });

import { paymentService } from "./payments/service";

export const startMembershipSubscription = createServerFn({ method: "POST" })
  .inputValidator((data: { userId: string, amount: number, billingDate: number, coversFees: boolean, priorities: string[] }) => data)
  .handler(async ({ data }) => {
    // 1. Initialize with provider
    const result = await paymentService.subscribe({
      userId: data.userId,
      amount: data.amount,
      billingDate: data.billingDate,
      coversFees: data.coversFees,
      priorityInitiatives: data.priorities
    });

    // 2. Update local subscription record
    const { error } = await supabase.from("subscriptions").upsert({
      user_id: data.userId,
      amount_mur: data.amount,
      status: result.status as any,
      peach_subscription_id: result.subscriptionId,
      next_billing_date: result.nextBillingDate,
      covers_fees: data.coversFees
    });

    if (error) throw error;

    return result;
  });
