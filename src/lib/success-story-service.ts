import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type SuccessStory = Database["public"]["Tables"]["success_stories"]["Row"];
export type SuccessStoryInsert = Database["public"]["Tables"]["success_stories"]["Insert"];
export type SuccessStoryUpdate = Database["public"]["Tables"]["success_stories"]["Update"];

export const successStoryService = {
  async getAll() {
    const { data, error } = await supabase
      .from("success_stories")
      .select("*")
      .order("display_order", { ascending: true });

    if (error) throw error;
    return data;
  },

  async getPublished() {
    const { data, error } = await supabase
      .from("success_stories")
      .select("*")
      .eq("is_published", true)
      .order("display_order", { ascending: true });

    if (error) throw error;
    return data;
  },

  async create(story: SuccessStoryInsert) {
    const { data, error } = await supabase
      .from("success_stories")
      .insert(story)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, updates: SuccessStoryUpdate) {
    const { data, error } = await supabase
      .from("success_stories")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from("success_stories")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },

  async reorder(orderedIds: string[]) {
    const updates = orderedIds.map((id, index) => ({
      id,
      display_order: index
    }));

    // Perform multiple updates
    for (const update of updates) {
      await supabase
        .from("success_stories")
        .update({ display_order: update.display_order })
        .eq("id", update.id);
    }
  }
};
