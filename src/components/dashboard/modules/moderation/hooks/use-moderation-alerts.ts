import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useModerationAlerts() {
  return useQuery({
    queryKey: ["dashboard", "moderation", "alerts"],
    queryFn: async () => {
      const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
      const twentyFourHoursAgo = new Date(Date.now() - 86400000).toISOString();

      // 1. Fetch recent data
      const [
        { count: recentSignups },
        { count: totalRecentPayments },
        { count: failedRecentPayments },
        { data: recentViews },
        { data: paymentAudit }
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", oneHourAgo),
        supabase.from("payments").select("*", { count: "exact", head: true }).gte("created_at", oneHourAgo),
        supabase.from("payments").select("*", { count: "exact", head: true }).eq("status", "failed").gte("created_at", oneHourAgo),
        supabase.from("activities").select("id, user_id, metadata").or("event_type.eq.homepage_view,event_type.eq.initiative_view").gte("created_at", oneHourAgo),
        supabase.from("payments").select("user_id, status").gte("created_at", twentyFourHoursAgo)
      ]);

      const alerts = [];
      const failureRate = totalRecentPayments ? (failedRecentPayments || 0) / totalRecentPayments : 0;
      const recentViewsCount = recentViews?.length || 0;

      // 2. Anomaly Rules

      // Rule: Signup Spike
      if ((recentSignups || 0) > 50) {
        alerts.push({ type: 'warning', message: `Signup burst: ${recentSignups} new accounts in the last hour.` });
      }

      // Rule: High Payment Failure Rate
      if (failureRate > 0.3 && (totalRecentPayments || 0) > 5) {
        alerts.push({ type: 'critical', message: `High payment failure rate: ${(failureRate * 100).toFixed(1)}%.` });
      }

      // Rule: Repeated Failures (Same User)
      const userFailures: Record<string, number> = {};
      paymentAudit?.forEach(p => {
        if (p.status === 'failed' && p.user_id) {
          userFailures[p.user_id] = (userFailures[p.user_id] || 0) + 1;
        }
      });
      const persistentFailures = Object.values(userFailures).some(count => count > 3);
      if (persistentFailures) {
        alerts.push({ type: 'warning', message: 'Persistent payment failures detected from specific users.' });
      }

      // Rule: Suspicious Traffic Spikes
      if (recentViewsCount > 1000) {
        alerts.push({ type: 'info', message: 'Significant traffic spike detected.' });
      }

      // Rule: Abnormal Conversion Ratios
      // Simplified: if conversion ratio > 50% in high volume
      const { count: recentConversions } = await supabase
        .from("initiative_events")
        .select("*", { count: "exact", head: true })
        .eq("event_type", "member_acquired")
        .gte("created_at", oneHourAgo);

      if ((recentConversions || 0) > 20 && recentViewsCount > 0 && (recentConversions! / recentViewsCount) > 0.5) {
        alerts.push({ type: 'warning', message: 'Unusually high conversion ratio detected.' });
      }

      return {
        alerts,
        metrics: {
          recentSignups: recentSignups || 0,
          failureRate,
          recentViews: recentViewsCount,
          recentConversions: recentConversions || 0
        }
      };
    }
  });
}
