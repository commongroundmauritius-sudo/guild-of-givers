import { supabase } from "@/integrations/supabase/client";

export interface SegmentFilter {
  field: string;
  operator: "eq" | "neq" | "gt" | "lt" | "contains" | "is_empty" | "is_not_empty";
  value: any;
}

export const segmentationService = {
  /**
   * Evaluate a segment by running its filter definition against the profiles table
   */
  async getSegmentMembers(organizationId: string, filterDefinition: { filters: SegmentFilter[] }) {
    let query = supabase
      .from("profiles")
      .select("*, subscriptions(*)")
      .eq("organization_id", organizationId);

    // Apply JSON filters to the PostgREST query
    for (const filter of filterDefinition.filters) {
      switch (filter.operator) {
        case "eq":
          query = query.eq(filter.field as any, filter.value);
          break;
        case "neq":
          query = query.neq(filter.field as any, filter.value);
          break;
        case "gt":
          query = query.gt(filter.field as any, filter.value);
          break;
        case "lt":
          query = query.lt(filter.field as any, filter.value);
          break;
        case "is_empty":
          query = query.is(filter.field as any, null);
          break;
        case "is_not_empty":
          query = query.not(filter.field as any, "is", null);
          break;
        // 'contains' would require complex JSONB operators or full-text search,
        // keeping it simple for now or using like if text.
      }
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  /**
   * Save or update a segment
   */
  async saveSegment(params: {
    organizationId: string;
    name: string;
    description?: string;
    filterDefinition: any;
    id?: string;
  }) {
    const { organizationId, name, description, filterDefinition, id } = params;

    if (id) {
      const { data, error } = await supabase
        .from("segments" as any)
        .update({
          name,
          description,
          filter_definition: filterDefinition,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase
        .from("segments" as any)
        .insert({
          organization_id: organizationId,
          name,
          description,
          filter_definition: filterDefinition,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  },

  /**
   * Fetch all segments for an organization
   */
  async getSegments(organizationId: string) {
    const { data, error } = await supabase
      .from("segments" as any)
      .select("*")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  },
};
