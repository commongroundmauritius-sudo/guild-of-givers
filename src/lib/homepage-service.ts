import { supabase } from "@/integrations/supabase/client";

export type HomepageVersion = {
  id: string;
  status: string;
  configuration_json: any;
  created_by: string | null;
  created_at: string;
  published_at: string | null;
};

export type HomepageConfig = {
  sections: Array<{
    id: string;
    visible: boolean;
    settings: any;
  }>;
};

export const DEFAULT_HOMEPAGE_CONFIG: HomepageConfig = {
  sections: [
    {
      id: "hero",
      visible: true,
      settings: {
        headline: "Impact that Matters",
        subheadline: "Support verified community initiatives and see your contribution in action.",
        primaryCTA: { text: "Explore Initiatives", href: "/initiatives" },
        secondaryCTA: { text: "Our Story", href: "/about" },
      },
    },
    {
      id: "stats",
      visible: true,
      settings: {
        metrics: [
          { id: "orgs", label: "Verified Organizations", visible: true },
          { id: "initiatives", label: "Active Initiatives", visible: true },
          { id: "donations", label: "Total Contributions", visible: true },
          { id: "profiles", label: "Impact Makers", visible: true },
        ],
      },
    },
    { id: "featured", visible: true, settings: {} },
    { id: "volunteers", visible: true, settings: {} },
    { id: "urgent", visible: true, settings: {} },
    { id: "trending", visible: true, settings: {} },
    { id: "success", visible: true, settings: {} },
    { id: "faq", visible: true, settings: {} },
  ],
};

export const homepageService = {
  async getPublishedVersion() {
    const { data, error } = await supabase
      .from("homepage_versions")
      .select("id, configuration_json, published_at")
      .eq("status", "published")
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async getDraftVersion() {
    const { data, error } = await supabase
      .from("homepage_versions")
      .select("id, configuration_json")
      .eq("status", "draft")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async saveDraft(config: HomepageConfig, userId: string) {
    const draft = await this.getDraftVersion();

    if (draft) {
      const { data, error } = await supabase
        .from("homepage_versions")
        .update({
          configuration_json: config as any,
          created_by: userId,
        })
        .eq("id", draft.id)
        .select("id")
        .single();

      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase
        .from("homepage_versions")
        .insert({
          status: "draft",
          configuration_json: config as any,
          created_by: userId,
        })
        .select("id")
        .single();

      if (error) throw error;
      return data;
    }
  },

  async publishVersion(versionId: string) {
    await supabase
      .from("homepage_versions")
      .update({ status: "archived" })
      .eq("status", "published");

    const { data, error } = await supabase
      .from("homepage_versions")
      .update({
        status: "published",
        published_at: new Date().toISOString(),
      })
      .eq("id", versionId)
      .select("id, published_at")
      .single();

    if (error) throw error;
    return data;
  },
};
