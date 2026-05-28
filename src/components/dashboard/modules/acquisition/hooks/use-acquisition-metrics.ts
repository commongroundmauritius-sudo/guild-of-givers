import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useAcquisitionMetrics() {
  return useQuery({
    queryKey: ["dashboard", "acquisition", "metrics"],
    queryFn: async () => {
      // 1. Fetch total visits from activities
      const { count: visits } = await supabase
        .from("activities")
        .select("*", { count: "exact", head: true })
        .or("event_type.eq.homepage_view,event_type.eq.initiative_view");

      // 2. Fetch registrations
      const { count: registrations } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      // 3. Fetch top campaign link performance
      const { data: linkPerformance } = await supabase
        .from("campaign_links" as any)
        .select(`
          id,
          name,
          tracking_code,
          source_type,
          daily_campaign_stats (
            view_count,
            registration_count,
            subscription_count,
            successful_payment_count,
            total_revenue_mur
          )
        `);

      const processedLinks = (linkPerformance as any[])?.map(link => {
        const stats = (link.daily_campaign_stats as any[]) || [];
        return {
          id: link.id,
          name: link.name,
          code: link.tracking_code,
          source: link.source_type,
          visits: stats.reduce((sum, s) => sum + (s.view_count || 0), 0),
          conversions: stats.reduce((sum, s) => sum + (s.successful_payment_count || 0), 0),
          revenue: stats.reduce((sum, s) => sum + Number(s.total_revenue_mur || 0), 0)
        };
      }).sort((a, b) => b.visits - a.visits) || [];

      // 4. Fetch traffic sources from leads
      const { data: leadSources } = await supabase
        .from("leads")
        .select("acquisition_channel")
        .not("acquisition_channel", "is", null);

      const sources: Record<string, number> = {};
      leadSources?.forEach(l => {
        const source = (l as any).acquisition_channel || 'Direct';
        sources[source] = (sources[source] || 0) + 1;
      });

      return {
        visits: visits || 0,
        registrations: registrations || 0,
        topSources: Object.entries(sources)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5),
        campaignLinks: processedLinks.slice(0, 5)
      };
    }
  });
}
