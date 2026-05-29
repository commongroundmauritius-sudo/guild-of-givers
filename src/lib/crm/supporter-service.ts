import { supabase } from "@/integrations/supabase/client";

export type LifecycleStage =
  | 'Visitor'
  | 'Lead'
  | 'Registered User'
  | 'Supporter'
  | 'Recurring Contributor'
  | 'Ambassador';

export const supporterService = {
  /**
   * Transition a profile to a new lifecycle stage
   */
  async transitionStage(profileId: string, stage: LifecycleStage) {
    const { error } = await supabase
      .from('profiles' as any)
      .update({ lifecycle_stage: stage })
      .eq('id', profileId);

    if (error) {
      console.error('Failed to transition stage:', error);
      throw error;
    }
  },

  /**
   * Fetch a unified supporter profile
   */
  async getSupporterProfile(profileId: string): Promise<any> {
    const { data, error } = await supabase
      .from('profiles' as any)
      .select(`
        *,
        organizations(organization_name, logo_url),
        subscriptions(*),
        member_preferences(*, initiatives(title, slug))
      `)
      .eq('id', profileId)
      .single();

    if (error) throw error;
    return data as any;
  },

  /**
   * Fetch unified activity timeline
   */
  async getTimeline(profileId: string, limit = 50) {
    // Unify activities and initiative_events
    const [activitiesRes, eventsRes] = await Promise.all([
      supabase
        .from('activities')
        .select('*')
        .eq('user_id', profileId)
        .order('created_at', { ascending: false })
        .limit(limit),
      supabase
        .from('initiative_events')
        .select('*, initiatives(title)')
        .eq('user_id', profileId)
        .order('created_at', { ascending: false })
        .limit(limit)
    ]);

    if (activitiesRes.error) throw activitiesRes.error;
    if (eventsRes.error) throw eventsRes.error;

    // Merge and sort
    const merged = [
      ...(activitiesRes.data || []).map(a => ({ ...a, source_table: 'activities' })),
      ...(eventsRes.data || []).map(e => ({ ...e, source_table: 'initiative_events' }))
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return merged.slice(0, limit);
  },

  /**
   * Dynamic Segmentation: Get recurring contributors
   */
  async getRecurringContributors(organizationId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*, subscriptions!inner(*)')
      .eq('organization_id', organizationId)
      .eq('subscriptions.status', 'active');

    if (error) throw error;
    return data;
  },

  /**
   * Dynamic Segmentation: Get dormant supporters (no activity > 30 days)
   */
  async getDormantSupporters(organizationId: string, days = 30) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('organization_id', organizationId)
      .lt('last_engagement_at', cutoff.toISOString());

    if (error) throw error;
    return data;
  }
};
