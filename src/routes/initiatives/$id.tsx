import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/initiatives/$id")({
  beforeLoad: async ({ params }) => {
    const { id } = params;

    // Check if it's already a slug or a UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      // It's likely a slug already, redirect to $slug route
      throw redirect({
        to: "/initiatives/$slug",
        params: { slug: id },
      });
    }

    // It's a UUID, attempt to resolve the slug for this ID
    const { data } = await supabase
      .from("initiatives")
      .select("slug")
      .eq("id", id)
      .maybeSingle();

    if (data?.slug) {
      throw redirect({
        to: "/initiatives/$slug",
        params: { slug: data.slug },
      });
    }

    // If no slug found, try treating ID as slug in the $slug route
    throw redirect({
      to: "/initiatives/$slug",
      params: { slug: id },
    });
  },
});
