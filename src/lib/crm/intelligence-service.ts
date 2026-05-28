import { supabase } from "@/integrations/supabase/client";

export const intelligenceService = {
  /**
   * Fetch latest health score for an initiative
   */
  async getLatestHealthScore(initiativeId: string) {
    const { data, error } = await supabase
      .from('initiative_health_scores')
      .select('*')
      .eq('initiative_id', initiativeId)
      .order('calculated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  /**
   * Fetch health history for trends
   */
  async getHealthHistory(initiativeId: string, limit = 30) {
    const { data, error } = await supabase
      .from('initiative_health_scores')
      .select('*')
      .eq('initiative_id', initiativeId)
      .order('calculated_at', { ascending: true })
      .limit(limit);

    if (error) throw error;
    return data;
  },

  /**
   * Fetch retention stats for an organization
   */
  async getRetentionStats(organizationId: string) {
    const { data, error } = await supabase
      .from('supporter_retention_stats' as any)
      .select('*')
      .eq('organization_id', organizationId);

    if (error) throw error;

    // Aggregate for summary
    const summary = {
      active: (data as any[]).filter(s => s.retention_status === 'Active').length,
      dormant: (data as any[]).filter(s => s.retention_status === 'Dormant').length,
      inactive: (data as any[]).filter(s => s.retention_status === 'Inactive').length,
      totalSupporters: data.length,
      totalLifetimeRevenue: (data as any[]).reduce((acc, s) => acc + (Number(s.total_lifetime_contribution) || 0), 0)
    };

    return { details: data, summary };
  },

  /**
   * Fetch trending initiatives based on momentum
   */
  async getTrendingInitiatives(limit = 6) {
    const { data, error } = await supabase
      .rpc('get_trending_initiatives', { p_limit: limit });

    if (error) throw error;

    // Hydrate with initiative details
    if (data && (data as any[]).length > 0) {
      const ids = (data as any[]).map((d: any) => d.initiative_id);
      const { data: initiatives, error: initError } = await supabase
        .from('initiatives')
        .select('*, organizations(organization_name, logo_url)')
        .in('id', ids);

      if (initError) throw initError;

      // Maintain trending order
      return (data as any[]).map((d: any) => ({
        ...d,
        initiative: initiatives?.find(i => i.id === d.initiative_id)
      }));
    }

    return [];
  }
};
