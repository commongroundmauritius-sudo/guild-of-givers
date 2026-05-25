import { supabase } from "@/integrations/supabase/client";

/**
 * Generates a URL-friendly slug from a string.
 * Rules: lowercase, remove special characters, normalize separators.
 */
export function slugify(text: string): string {
  const slug = text
    .toLowerCase()
    .normalize("NFD") // normalize unicode
    .replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/[^a-z0-9]+/g, "-") // replace non-alphanumeric with hyphen
    .replace(/^-+|-+$/g, ""); // trim hyphens from start and end

  return slug || "initiative";
}

/**
 * Generates a unique slug for an initiative by checking the database for collisions.
 * Handles tree-planting, tree-planting-2, tree-planting-3 pattern.
 */
export async function generateUniqueInitiativeSlug(title: string): Promise<string> {
  const baseSlug = slugify(title);
  let finalSlug = baseSlug;
  let counter = 1;

  while (true) {
    const { data, error } = await supabase
      .from("initiatives")
      .select("id")
      .eq("slug", finalSlug)
      .maybeSingle();

    if (error) {
      console.error("Error checking slug uniqueness:", error);
      // In case of error, we still want to return a slug, but might risk a collision
      // However, the DB unique constraint will ultimately catch it.
      return finalSlug;
    }

    if (!data) {
      // No collision found
      return finalSlug;
    }

    // Collision found, increment counter and try again
    counter++;
    finalSlug = `${baseSlug}-${counter}`;
  }
}
