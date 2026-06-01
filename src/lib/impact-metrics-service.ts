import { supabase } from "@/integrations/supabase/client";

export type ImpactMetric = {
  id: string;
  label: string;
  value: number;
  auto: boolean;
  manualValue?: number;
};

export const impactMetricsService = {
  async calculateMetrics() {
    const [orgs, initiatives, donations, profiles] = await Promise.all([
      supabase.from("organizations").select("id", { count: "exact", head: true }).eq("is_verified", true),
      supabase.from("initiatives").select("id", { count: "exact", head: true }).eq("status", "active"),
      supabase.rpc("get_ledger_summary_metrics"), // Assuming this exists or using sum
      supabase.from("profiles").select("id", { count: "exact", head: true })
    ]);

    // Fallback for donations if RPC fails or not available
    let totalDonations = 0;
    const { data: donationData } = await supabase
      .from("payments")
      .select("amount_mur")
      .eq("status", "success");

    if (donationData) {
      totalDonations = donationData.reduce((sum, p) => sum + Number(p.amount_mur), 0);
    }

    return {
      totalOrganizations: orgs.count || 0,
      totalInitiatives: initiatives.count || 0,
      totalDonations: totalDonations,
      totalVolunteers: profiles.count || 0 // Placeholder logic for volunteers
    };
  }
};
