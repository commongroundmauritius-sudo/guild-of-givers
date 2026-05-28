import { supabase } from "@/integrations/supabase/client";

export const crmService = {
  async addNote(params: {
    organizationId: string;
    content: string;
    leadId?: string;
    profileId?: string;
    metadata?: Record<string, any>;
  }) {
    const { organizationId, content, leadId, profileId, metadata = {} } = params;
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase.from('crm_notes').insert({
      organization_id: organizationId, author_id: user?.id, content, lead_id: leadId, profile_id: profileId, metadata
    }).select().single();
    if (error) throw error;
    return data;
  },
  async getNotes(params: { leadId?: string; profileId?: string; }) {
    const { leadId, profileId } = params;
    let query = supabase.from('crm_notes').select('*, author:profiles(full_name, avatar_url)').order('created_at', { ascending: false });
    if (leadId) query = query.eq('lead_id', leadId);
    else if (profileId) query = query.eq('profile_id', profileId);
    else return [];
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },
  async ensureTag(organizationId: string, name: string, color?: string) {
    const { data, error } = await supabase.from('crm_tags').upsert({ organization_id: organizationId, name, color }, { onConflict: 'organization_id,name' }).select().single();
    if (error) throw error;
    return data;
  }
};
