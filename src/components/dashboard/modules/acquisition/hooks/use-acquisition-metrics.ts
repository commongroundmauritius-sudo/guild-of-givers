import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useAcquisitionMetrics() {
  return useQuery({
    queryKey: ["dashboard", "acquisition", "metrics"],
    queryFn: async () => {
      // Fetch total visits from activities
      const { count: visits } = await supabase
        .from("activities")
        .select("*", { count: "exact", head: true })
        .or("event_type.eq.homepage_view,event_type.eq.initiative_view");

      // Fetch registrations
      const { count: registrations } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      // Fetch top traffic sources from campaign links resolved in leads
      const { data: leadSources } = await supabase
        .from("leads")
        .select("utm_parameters->>utm_source")
        .not("utm_parameters->>utm_source", "is", null);

      const sources: Record<string, number> = {};
      leadSources?.forEach(l => {
        const source = (l as any).utm_source || 'unknown';
        sources[source] = (sources[source] || 0) + 1;
      });

      return {
        visits: visits || 0,
        registrations: registrations || 0,
        topSources: Object.entries(sources)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5)
      };
    }
  });
}
