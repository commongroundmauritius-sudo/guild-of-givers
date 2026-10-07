import { createServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import type { HomepageVersion } from "@/lib/homepage-service";

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

export type PublicHomepagePayload = {
  publishedVersion: Pick<HomepageVersion, "id" | "configuration_json" | "published_at"> | null;
  featuredInitiatives: HomepageFeaturedInitiative[];
};

export const getPublicHomepagePayload = createServerFn({ method: "GET" }).handler(
  async (): Promise<PublicHomepagePayload> => {
    const { data, error } = await supabase.rpc("get_public_homepage_payload");
    if (error) throw error;
    const payload = (data ?? {}) as PublicHomepagePayload;
    return {
      publishedVersion: payload.publishedVersion ?? null,
      featuredInitiatives: Array.isArray(payload.featuredInitiatives) ? payload.featuredInitiatives : [],
    };
  },
);
