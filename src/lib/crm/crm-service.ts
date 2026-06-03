import { supabase } from "@/integrations/supabase/client";
import { isUUID } from "@/lib/identifiers";
import { isAdmin, getSessionUser } from "@/lib/security/auth";

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

    const user = await getSessionUser();
    if (!user) throw new Error("Unauthorized");

    // Check if user has access to this organization
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();
    const userIsAdmin = await isAdmin(user.id);

    if (!userIsAdmin && profile?.organization_id !== organizationId) {
      throw new Error("Unauthorized access to organization CRM");
    }

    const { data, error } = await supabase
      .from("crm_notes")
      .insert({
        organization_id: organizationId,
        author_id: user?.id,
        content,
        lead_id: leadId && isUUID(leadId) ? leadId : null,
        profile_id: profileId && isUUID(profileId) ? profileId : null,
        metadata,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getNotes(params: { leadId?: string; profileId?: string }) {
    const user = await getSessionUser();
    if (!user) throw new Error("Unauthorized");

    let query = supabase
      .from("crm_notes")
      .select("*, author:profiles(full_name, avatar_url)")
      .order("created_at", { ascending: false });

    if (params.leadId && isUUID(params.leadId)) {
      query = query.eq("lead_id", params.leadId);
    }
    if (params.profileId && isUUID(params.profileId)) {
      query = query.eq("profile_id", params.profileId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async getTasks(params: { organizationId: string; leadId?: string; profileId?: string }) {
    const { organizationId, leadId, profileId } = params;
    if (!isUUID(organizationId)) throw new Error("Invalid organization ID");

    const user = await getSessionUser();
    if (!user) throw new Error("Unauthorized");

    let query = supabase
      .from("crm_tasks")
      .select("*, assigned_to_user:profiles!crm_tasks_assigned_to_fkey(full_name, avatar_url)")
      .eq("organization_id", organizationId)
      .order("due_date", { ascending: true });

    if (leadId && isUUID(leadId)) {
      query = query.eq("lead_id", leadId);
    }
    if (profileId && isUUID(profileId)) {
      query = query.eq("profile_id", profileId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async updateTaskStatus(taskId: string, status: string) {
    if (!isUUID(taskId)) throw new Error("Invalid task ID");

    const user = await getSessionUser();
    if (!user) throw new Error("Unauthorized");

    const { data, error } = await supabase
      .from("crm_tasks")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", taskId)
      .select("id, status, updated_at")
      .single();
    if (error) throw error;
    return data;
  },
};
