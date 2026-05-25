import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/initiatives/$id")({
  beforeLoad: async ({ params }) => {
    const { id } = params;

    // Attempt to resolve the slug for this ID
    const { data, error } = await supabase
      .from("initiatives")
      .select("slug")
      .eq("id", id)
      .maybeSingle();

    if (data?.slug) {
      throw redirect({
        to: "/initiatives/$slug",
        params: { slug: data.slug },
        mask: {
          to: `/initiatives/${data.slug}`,
        },
      });
    }

    // If not found, it might be a slug already or invalid ID,
    // but the  route will handle it as a slug.
    throw redirect({
      to: "/initiatives/$slug",
      params: { slug: id },
    });
  },
});
