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
  contact_name: string;
  email: string;
  phone: string;
  website: string;
  message: string;
}

class PartnerService {
  async submitApplication(input: PartnerApplicationInput) {
    const email = input.email.trim().toLowerCase();

    // 2. Insert application (status and duplicate protection handled by DB)
    const { data, error } = await supabase
      .from("partner_applications" as any)
      .insert({
        organization_name: input.organization_name.trim(),
        organization_type: input.organization_type,
        registration_number: input.registration_number.trim(),
        contact_name: input.contact_name.trim(),
        email,
        phone: input.phone?.trim(),
        website: input.website?.trim(),
        message: input.message.trim(),
      })
      .select()
      .single();

    if (error) {
      if (error.message.includes("already exists within the last 24 hours")) {
        throw new Error(
          "An application from this email is already being processed. Please wait 24 hours before submitting another.",
        );
      }
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
    // Note: Logging handled by DB trigger tr_partner_application_activity
    const { error } = await supabase
      .from("partner_applications" as any)
      .update({
        status: newStatus,
        reviewed_by: actorId,
        reviewed_at: new Date().toISOString(),
        admin_notes: notes,
      })
      .eq("id", applicationId);

    if (error) throw error;
  }

  async convertToOrganization(applicationId: string, actorId: string, orgData: any) {
    const { data: appData, error: appError } = await supabase
      .from("partner_applications" as any)
      .select("*")
      .eq("id", applicationId)
      .single();

    if (appError) throw appError;
    const app = appData as any;
    if (app.status === "converted") throw new Error("Application already converted");

    // 1. Create Organization
    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .insert({
        organization_name: orgData.organization_name || app.organization_name,
        description: orgData.description || app.message,
        website_url: orgData.website_url || app.website,
        category: app.organization_type,
        is_verified: true,
        conversion_source: "partner_application",
      })
      .select()
      .single();

    if (orgError) throw orgError;

    // 2. Update Application (Logging handled by DB trigger)
    const { error: updateError } = await supabase
      .from("partner_applications" as any)
      .update({
        status: "converted",
        converted_organization_id: org.id,
        converted_at: new Date().toISOString(),
        converted_by: actorId,
      })
      .eq("id", applicationId);

    if (updateError) throw updateError;

    return org;
  }
}

export const partnerService = new PartnerService();
