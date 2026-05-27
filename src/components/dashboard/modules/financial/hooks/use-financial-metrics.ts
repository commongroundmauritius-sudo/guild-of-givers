import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useFinancialMetrics() {
  return useQuery({
    queryKey: ["dashboard", "financial", "metrics"],
    queryFn: async () => {
      // Fetch successful payments
      const { data: payments } = await supabase
        .from("payments")
        .select("amount_mur")
        .eq("status", "success");

      // Fetch active subscriptions
      const { count: activeSubs } = await supabase
        .from("subscriptions")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");

      const totalRevenue = payments?.reduce((sum, p) => sum + Number(p.amount_mur), 0) || 0;

      // Calculate conversion rate (Subscriber lead stage / Total Leads)
      const { count: totalLeads } = await supabase
        .from("leads")
        .select("*", { count: "exact", head: true });

      const { count: subscribers } = await supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .eq("lead_stage", "Subscriber");

      const conversionRate = totalLeads ? ((subscribers || 0) / totalLeads) * 100 : 0;

      return {
        revenue: totalRevenue,
        activeSubscriptions: activeSubs || 0,
        conversionRate
      };
    }
  });
}
