import { supabase } from "@/integrations/supabase/client";
import { communicationDispatcher } from "@/lib/communication/dispatcher";

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
    const { data, error } = await supabase.rpc("submit_partner_application", {
      p_org_name: input.organization_name,
      p_org_type: input.organization_type,
      p_reg_num: input.registration_number,
      p_email: input.email,
      p_message: input.message,
    });

    if (error) {
      console.error("Partner application submission failed:", error);
      throw error;
    }

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

    // Generate unique 8-character access code
    const signupCode = Math.random().toString(36).substring(2, 10).toUpperCase();

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

    // 2. Update Application with code and conversion info
    const { error: updateError } = await supabase
      .from("partner_applications")
      .update({
        status: "converted",
        signup_code: signupCode,
        converted_organization_id: org.id,
        converted_at: new Date().toISOString(),
        converted_by: actorId,
      } as any)
      .eq("id", applicationId);

    if (updateError) throw updateError;

    // 3. Dispatch Welcome Email with Access Code
    await communicationDispatcher.dispatch({
      userId: actorId, // Admin who triggered conversion
      channels: ["email"],
      templateKey: "welcome" as any, // Reusing welcome template or specialized if exists
      recipientEmail: app.email,
      payload: {
        organizationName: org.organization_name,
        signupCode: signupCode,
        message:
          "Your partner application has been successful! Use the code below to complete your organization setup.",
        actionUrl: `${window.location.origin}/signup?code=${signupCode}`,
      },
    });

    // 4. Log activity
    await this.logActivity(
      applicationId,
      actorId,
      "converted",
      `Converted to organization: ${org.organization_name}. Signup code generated: ${signupCode}`,
      app.status as PartnerApplicationStatus,
      "converted",
      { organization_id: org.id, signup_code: signupCode },
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
