import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useCrmSummary() {
  return useQuery({
    retry: false,
    queryKey: ["dashboard", "crm", "summary"],
    queryFn: async () => {
      // Fetch lead stage distribution
      const { data: leadStages } = await supabase
        .from("leads")
        .select("lead_stage");

      const stages: Record<string, number> = {};
      leadStages?.forEach(l => {
        const stage = l.lead_stage || 'Visitor';
        stages[stage] = (stages[stage] || 0) + 1;
      });

      // Fetch notes count
      const { count: notesCount } = await supabase
        .from("crm_notes")
        .select("*", { count: "exact", head: true });

      // Fetch recent activities for the timeline
      const { data: activities } = await supabase
        .from("activities")
        .select("*, profiles(full_name)")
        .order("created_at", { ascending: false })
        .limit(5);

      return {
        stages,
        notesCount: notesCount || 0,
        recentActivity: activities || []
      };
    }
  });
}
