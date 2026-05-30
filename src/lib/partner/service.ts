import { supabase } from "@/integrations/supabase/client";

export type PartnerApplicationStatus =
  | "submitted"
  | "under_review"
  | "contacted"
  | "approved"
  | "rejected"
  | "converted"
  | "archived";

export interface PartnerApplicationInput {
  organization_name: string;
  organization_type: string;
  registration_number: string;
  email: string;
  message: string;
}

class PartnerService {
  async submitApplication(input: PartnerApplicationInput) {
    const email = input.email.trim().toLowerCase();

    // 1. Duplicate protection (24h cooldown for pending/submitted status)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: existing, error: checkError } = await supabase
      .from("partner_applications")
      .select("id, created_at, status")
      .eq("email", email)
      .in("status", ["submitted", "under_review"])
      .gt("created_at", twentyFourHoursAgo)
      .is("deleted_at", null)
      .maybeSingle();

    if (checkError) throw checkError;
    if (existing) {
      throw new Error(
        "An application from this email is already being processed. Please wait 24 hours before submitting another.",
      );
    }

    // 2. Insert application
    const { data, error } = await supabase
      .from("partner_applications")
      .insert({
        ...input,
        email,
        status: "submitted",
      })
      .select()
      .single();

    if (error) throw error;

    // 3. Log activity
    await this.logActivity(data.id, null, "submitted", "Application submitted via public form");

    return data;
  }

  async updateStatus(
    applicationId: string,
    actorId: string,
    newStatus: PartnerApplicationStatus,
    notes?: string,
  ) {
    const { data: oldApp, error: fetchError } = await supabase
      .from("partner_applications")
      .select("status")
      .eq("id", applicationId)
      .single();

    if (fetchError) throw fetchError;

    const { error } = await supabase
      .from("partner_applications")
      .update({ status: newStatus })
      .eq("id", applicationId);

    if (error) throw error;

    await this.logActivity(
      applicationId,
      actorId,
      "status_change",
      notes || `Status changed to ${newStatus}`,
      oldApp.status as PartnerApplicationStatus,
      newStatus,
    );
  }

  async convertToOrganization(applicationId: string, actorId: string, orgData: any) {
    const { data: app, error: appError } = await supabase
      .from("partner_applications")
      .select("*")
      .eq("id", applicationId)
      .single();

    if (appError) throw appError;
    if (app.status === "converted") throw new Error("Application already converted");

    // 1. Create Organization
    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .insert({
        organization_name: orgData.organization_name || app.organization_name,
        description: orgData.description || app.message,
        website_url: orgData.website_url,
        category: app.organization_type,
        is_verified: true,
        conversion_source: "partner_application",
      })
      .select()
      .single();

    if (orgError) throw orgError;

    // 2. Update Application
    const { error: updateError } = await supabase
      .from("partner_applications")
      .update({
        status: "converted",
        converted_organization_id: org.id,
        converted_at: new Date().toISOString(),
        converted_by: actorId,
      })
      .eq("id", applicationId);

    if (updateError) throw updateError;

    // 3. Log activity
    await this.logActivity(
      applicationId,
      actorId,
      "converted",
      `Converted to organization: ${org.organization_name}`,
      app.status as PartnerApplicationStatus,
      "converted",
      { organization_id: org.id },
    );

    return org;
  }

  private async logActivity(
    applicationId: string,
    actorId: string | null,
    action: string,
    message: string,
    previousStatus?: PartnerApplicationStatus,
    newStatus?: PartnerApplicationStatus,
    metadata: any = {},
  ) {
    await supabase.from("partner_application_activity").insert({
      application_id: applicationId,
      actor_id: actorId,
      action,
      previous_status: previousStatus,
      new_status: newStatus,
      metadata: { ...metadata, message },
    });
  }
}

export const partnerService = new PartnerService();
