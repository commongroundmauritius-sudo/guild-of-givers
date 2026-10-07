import { createServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import type { HomepageVersion } from "@/lib/homepage-service";

export const getPublishedHomepageVersion = createServerFn({ method: "GET" }).handler(
  async (): Promise<Pick<HomepageVersion, "id" | "configuration_json" | "published_at"> | null> => {
    const { data, error } = await supabase
      .from("homepage_versions")
      .select("id, configuration_json, published_at")
      .eq("status", "published")
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data;
  },
);


export type HomepageFeaturedInitiative = {
  id: string;
  slug: string | null;
  title: string;
  caption: string | null;
  summary: string | null;
  description: string | null;
  goal_amount_mur: number | null;
  current_amount_mur: number | null;
  banner_image_url: string | null;
  image_url: string | null;
  organizations: { organization_name: string | null } | null;
};

export const getHomepageFeaturedInitiatives = createServerFn({ method: "GET" })
  .validator((ids: string[]) => ids.filter((id) => typeof id === "string").slice(0, 12))
  .handler(async ({ data: ids }): Promise<HomepageFeaturedInitiative[]> => {
    if (!ids.length) return [];

    const { data, error } = await supabase
      .from("initiatives")
      .select(
        "id, slug, title, caption, summary, description, goal_amount_mur, current_amount_mur, banner_image_url, image_url, organizations(organization_name)",
      )
      .in("id", ids)
      .eq("is_approved", true)
      .eq("is_published", true)
      .eq("status", "active");

    if (error) throw error;

    const items = (data ?? []) as HomepageFeaturedInitiative[];
    return items.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
  });
