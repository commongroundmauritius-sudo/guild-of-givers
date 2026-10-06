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
