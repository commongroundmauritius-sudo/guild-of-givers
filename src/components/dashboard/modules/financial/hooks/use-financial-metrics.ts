import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useFinancialMetrics() {
  return useQuery({
    retry: false,
    queryKey: ["dashboard", "financial", "metrics"],
    queryFn: async () => {
      // 1. Fetch successful payments
      const { data: payments } = await supabase
        .from("payments")
        .select("amount_mur")
        .eq("status", "success");

      // 2. Fetch active subscriptions
      const { count: activeSubs } = await supabase
        .from("subscriptions")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");

      const totalRevenue = payments?.reduce((sum, p) => sum + Number(p.amount_mur), 0) || 0;

      // 3. Calculate conversion rate (Subscriber lead stage / Total Leads)
      const { count: totalLeads } = await supabase
        .from("leads")
        .select("*", { count: "exact", head: true });

      const { count: subscribers } = await supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .eq("lead_stage", "Subscriber");

      const conversionRate = totalLeads ? ((subscribers || 0) / totalLeads) * 100 : 0;

      // 4. Fetch failed payments and retry visibility
      const { count: failedPayments } = await supabase
        .from("payments")
        .select("*", { count: "exact", head: true })
        .eq("status", "failed");

      const { data: retryData } = await supabase.from("subscriptions").select("retry_count" as any);

      const totalRetries =
        (retryData as any[])?.reduce((sum, r) => sum + (r.retry_count || 0), 0) || 0;

      return {
        revenue: totalRevenue,
        activeSubscriptions: activeSubs || 0,
        conversionRate,
        failedPayments: failedPayments || 0,
        totalRetries,
      };
    },
  });
}
