import { createServerFn } from "@tanstack/react-start";
import { supabase, type AppRole } from "@/integrations/supabase/client";

export const initializeUser = createServerFn({ method: "POST" })
  .inputValidator((data: { userId: string; fullName: string; role?: AppRole }) => data)
  .handler(async ({ data }) => {
    const { userId, fullName, role = "member" } = data;

    // Initialize profile
    const { error: profileError } = await supabase.from("profiles").upsert(
      {
        id: userId,
        full_name: fullName,
      },
      { onConflict: "id" },
    );

    if (profileError) {
      console.error("Error initializing profile:", profileError);
      throw new Error("Failed to initialize profile");
    }

    // Initialize role
    const { error: roleError } = await supabase.from("user_roles").upsert(
      {
        user_id: userId,
        role: role,
      },
      { onConflict: "user_id, role" },
    );

    if (roleError) {
      console.error("Error initializing role:", roleError);
      throw new Error("Failed to initialize role");
    }

    return { success: true };
  });

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

export const createInitialSubscription = createServerFn({ method: "POST" })
  .inputValidator((data: { userId: string; amount: number }) => data)
  .handler(async ({ data }) => {
    const { userId, amount } = data;

    const { error } = await supabase.from("subscriptions").insert({
      user_id: userId,
      amount_mur: amount,
      status: "pending",
    });

    if (error) {
      console.error("Error creating initial subscription:", error);
      throw new Error("Failed to create subscription");
    }

    return { success: true };
  });
