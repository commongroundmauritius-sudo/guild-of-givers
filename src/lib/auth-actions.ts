import { createServerFn } from "@tanstack/react-start";
import { supabase, type AppRole } from "@/integrations/supabase/client";

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
    }) => data,
  )
  .handler(async ({ data }) => {
    const { email, fullName, phone, amount, coversFees } = data;

    const { error } = await supabase.from("leads").insert({
      email,
      full_name: fullName,
      phone,
      amount_mur: amount,
      covers_fees: coversFees,
    });

    if (error) {
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
      .eq("email", email)
      .eq("status", "pending");

    if (error) {
      console.error("Error converting lead:", error);
      // We don't throw here to avoid blocking the user setup if just the lead update fails
    }

    return { success: true };
  });

export const updateProfile = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      userId: string;
      full_name?: string;
      phone?: string;
      address?: string;
      bio?: string;
      age?: number;
      avatar_url?: string;
    }) => data,
  )
  .handler(async ({ data }) => {
    const { userId, ...updates } = data;

    const { error } = await supabase.from("profiles").update(updates).eq("id", userId);

    if (error) {
      console.error("Error updating profile:", error);
      throw new Error("Failed to update profile");
    }

    return { success: true };
  });
