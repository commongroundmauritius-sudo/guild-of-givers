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
      organization_id: organizationId,
      author_id: user?.id,
      content,
      lead_id: leadId,
      profile_id: profileId,
      metadata
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
    const { data, error } = await supabase.from('crm_tags').upsert({
      organization_id: organizationId,
      name,
      color
    }, { onConflict: 'organization_id,name' }).select().single();
    if (error) throw error;
    return data;
  },

  /**
   * CRM Task Management
   */
  async createTask(params: {
    organizationId: string;
    title: string;
    description?: string;
    profileId?: string;
    leadId?: string;
    assignedTo?: string;
    dueDate?: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
  }) {
    const { data, error } = await supabase
      .from('crm_tasks' as any)
      .insert({
        organization_id: params.organizationId,
        title: params.title,
        description: params.description,
        profile_id: params.profileId,
        lead_id: params.leadId,
        assigned_to: params.assignedTo,
        due_date: params.dueDate,
        priority: params.priority || 'medium'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getTasks(organizationId: string, filters: { status?: string; assignedTo?: string } = {}) {
    let query = supabase
      .from('crm_tasks' as any)
      .select('*, profile:profiles(full_name, avatar_url), lead:leads(full_name)')
      .eq('organization_id', organizationId);

    if (filters.status) query = query.eq('status', filters.status);
    if (filters.assignedTo) query = query.eq('assigned_to', filters.assignedTo);

    const { data, error } = await query.order('due_date', { ascending: true });
    if (error) throw error;
    return data;
  },

  async updateTaskStatus(taskId: string, status: string) {
    const { data, error } = await supabase
      .from('crm_tasks' as any)
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', taskId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};
