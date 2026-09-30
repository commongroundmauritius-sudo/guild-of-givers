import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Initiative = Tables<"initiatives">;

export const initiativeService = {
  async getAll(options: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    sortBy?: "newest" | "trending" | "goal_progress";
  }) {
    const { page = 1, limit = 12, search, category, sortBy = "newest" } = options;
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    let query = supabase
      .from("initiatives")
      .select("*, organizations(organization_name)", { count: "exact" })
      .eq("status", "active");
    if (search) query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    if (category && category !== "All") query = query.eq("category", category);
    if (sortBy === "newest") query = query.order("created_at", { ascending: false });
    else if (sortBy === "trending")
      query = query.order("conversion_count", { ascending: false, nullsFirst: false });
    else if (sortBy === "goal_progress")
      query = query.order("current_amount_mur", { ascending: false });
    const { data, error, count } = await query.range(from, to);
    if (error) throw error;
    return { data, count };
  },
};
