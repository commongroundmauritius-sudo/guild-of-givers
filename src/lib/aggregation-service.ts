import { supabase } from "@/integrations/supabase/client";

export const aggregationService = {
  /**
   * Trigger the daily aggregation RPC
   */
  async runDailyAggregation(date?: string) {
    // If no date provided, defaults to yesterday in the RPC
    const { error } = await supabase.rpc("aggregate_daily_stats" as any, {
      p_date: date || new Date(Date.now() - 86400000).toISOString().split("T")[0],
    });

    if (error) {
      console.error("Failed to run aggregation:", error);
      throw error;
    }
  },

  /**
   * Fetch aggregated stats for an initiative
   */
  async getInitiativeSnapshots(initiativeId: string, days: number = 30) {
    const { data, error } = await supabase
      .from("daily_initiative_stats" as any)
      .select("*")
      .eq("initiative_id", initiativeId)
      .order("date", { ascending: true })
      .limit(days);

    if (error) {
      console.error("Failed to fetch snapshots:", error);
      throw error;
    }

    return data as any[];
  },
};
