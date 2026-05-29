import { supabase } from "@/integrations/supabase/client";
import { isUUID } from "@/lib/identifiers";

export const crmService = {
  async addNote(params: {
    organizationId: string;
    content: string;
    leadId?: string;
    profileId?: string;
    metadata?: Record<string, any>;
  }) {
    const { organizationId, content, leadId, profileId, metadata = {} } = params;

    if (!isUUID(organizationId)) throw new Error("Invalid organization ID");

    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase.from('crm_notes').insert({
      organization_id: organizationId,
      author_id: user?.id,
      content,
      lead_id: leadId && isUUID(leadId) ? leadId : null,
      profile_id: profileId && isUUID(profileId) ? profileId : null,
      metadata
    }).select().single();
    if (error) throw error;
    return data;
  },

  async getNotes(params: { leadId?: string; profileId?: string; }) {
    const { leadId, profileId } = params;
    let query = supabase.from('crm_notes').select('*, author:profiles(full_name, avatar_url)').order('created_at', { ascending: false });

    if (leadId && isUUID(leadId)) {
      query = query.eq('lead_id', leadId);
    } else if (profileId && isUUID(profileId)) {
      query = query.eq('profile_id', profileId);
    } else {
      return [];
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async ensureTag(organizationId: string, name: string, color?: string) {
    if (!isUUID(organizationId)) throw new Error("Invalid organization ID");

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
    if (!isUUID(params.organizationId)) throw new Error("Invalid organization ID");

    const { data, error } = await supabase
      .from('crm_tasks' as any)
      .insert({
        organization_id: params.organizationId,
        title: params.title,
        description: params.description,
        profile_id: params.profileId && isUUID(params.profileId) ? params.profileId : null,
        lead_id: params.leadId && isUUID(params.leadId) ? params.leadId : null,
        assigned_to: params.assignedTo && isUUID(params.assignedTo) ? params.assignedTo : null,
        due_date: params.dueDate,
        priority: params.priority || 'medium'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getTasks(organizationId: string, filters: { status?: string; assignedTo?: string } = {}) {
    if (!isUUID(organizationId)) throw new Error("Invalid organization ID");

    let query = supabase
      .from('crm_tasks' as any)
      .select('*, profile:profiles(full_name, avatar_url), lead:leads(full_name)')
      .eq('organization_id', organizationId);

    if (filters.status) query = query.eq('status', filters.status);
    if (filters.assignedTo && isUUID(filters.assignedTo)) {
      query = query.eq('assigned_to', filters.assignedTo);
    }

    const { data, error } = await query.order('due_date', { ascending: true });
    if (error) throw error;
    return data;
  },

  async updateTaskStatus(taskId: string, status: string) {
    if (!isUUID(taskId)) throw new Error("Invalid task ID");

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
