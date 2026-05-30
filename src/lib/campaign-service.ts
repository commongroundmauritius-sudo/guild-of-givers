import { supabase } from "@/integrations/supabase/client";

export interface CampaignLink {
  id: string;
  initiative_id: string;
  name: string;
  tracking_code: string;
  source_type: string;
  is_active: boolean;
  expires_at?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export const campaignService = {
  /**
   * Create a new campaign link
   */
  async createLink(params: Omit<CampaignLink, "id" | "created_at">) {
    const { data, error } = await supabase
      .from("campaign_links" as any)
      .insert(params)
      .select()
      .single();

    if (error) {
      console.error("Failed to create campaign link:", error);
      throw error;
    }

    return data;
  },

  /**
   * Update an existing campaign link
   */
  async updateLink(id: string, updates: Partial<CampaignLink>) {
    const { data, error } = await supabase
      .from("campaign_links" as any)
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Failed to update campaign link:", error);
      throw error;
    }

    return data;
  },

  /**
   * Fetch links for an initiative
   */
  async getInitiativeLinks(initiativeId: string) {
    const { data, error } = await supabase
      .from("campaign_links" as any)
      .select("*")
      .eq("initiative_id", initiativeId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch campaign links:", error);
      throw error;
    }

    return data as any[];
  },

  /**
   * Fetch link performance (funnel)
   */
  async getLinkPerformance(linkId: string) {
    const { data, error } = await supabase
      .from("daily_campaign_stats" as any)
      .select("*")
      .eq("campaign_link_id", linkId)
      .order("date", { ascending: true });

    if (error) {
      console.error("Failed to fetch link performance:", error);
      throw error;
    }

    return data as any[];
  },
};
