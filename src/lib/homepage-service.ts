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

export const homepageService = {
  async getPublishedVersion() {
    const { data, error } = await supabase
      .from("homepage_versions")
      .select("*")
      .eq("status", "published")
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async getDraftVersion() {
    const { data, error } = await supabase
      .from("homepage_versions")
      .select("*")
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
        .select()
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
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  },

  async publishVersion(versionId: string) {
    // Start a transaction-like sequence
    // 1. Archive current published version
    await supabase
      .from("homepage_versions")
      .update({ status: "archived" })
      .eq("status", "published");

    // 2. Publish new version
    const { data, error } = await supabase
      .from("homepage_versions")
      .update({
        status: "published",
        published_at: new Date().toISOString()
      })
      .eq("id", versionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};
