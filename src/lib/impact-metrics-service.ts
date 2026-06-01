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
    const [orgs, initiatives, profiles] = await Promise.all([
      supabase
        .from("organizations")
        .select("id", { count: "exact", head: true })
        .eq("is_verified", true),
      supabase
        .from("initiatives")
        .select("id", { count: "exact", head: true })
        .eq("status", "active"),
      supabase.from("profiles").select("id", { count: "exact", head: true }),
    ]);

    // Calculate total contributed from payments
    let totalContributions = 0;
    const { data: contributionData } = await supabase
      .from("payments")
      .select("amount_mur")
      .eq("status", "success");

    if (contributionData) {
      totalContributions = contributionData.reduce((sum, p) => sum + Number(p.amount_mur), 0);
    }

    return {
      totalOrganizations: orgs.count || 0,
      totalInitiatives: initiatives.count || 0,
      totalContributions: totalContributions,
      totalVolunteers: profiles.count || 0, // Placeholder logic for volunteers
    };
  },
};
