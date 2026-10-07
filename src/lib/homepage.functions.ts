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

export type PublicHomepagePayload = {\n  publishedVersion: Pick<HomepageVersion, "id" | "configuration_json" | "published_at"> | null;\n  featuredInitiatives: HomepageFeaturedInitiative[];\n};\n\nexport const getPublicHomepagePayload = createServerFn({ method: "GET" }).handler(\n  async (): Promise<PublicHomepagePayload> => {\n    const { data, error } = await supabase.rpc("get_public_homepage_payload");\n    if (error) throw error;\n    const payload = (data ?? {}) as PublicHomepagePayload;\n    return {\n      publishedVersion: payload.publishedVersion ?? null,\n      featuredInitiatives: Array.isArray(payload.featuredInitiatives) ? payload.featuredInitiatives : [],\n    };\n  },\n);\n