import { createServerFn } from "@tanstack/react-start";
import { partnerService, PartnerApplicationInput, PartnerApplicationStatus } from "./service";
import { supabase } from "@/integrations/supabase/client";

export const submitPartnerApplication = createServerFn({ method: "POST" })
  .inputValidator((data: PartnerApplicationInput) => data)
  .handler(async ({ data }) => {
    return await partnerService.submitApplication(data);
  });

export const updateApplicationStatus = createServerFn({ method: "POST" })
  .inputValidator((data: { applicationId: string; actorId: string; status: PartnerApplicationStatus; notes?: string }) => data)
  .handler(async ({ data }) => {
    return await partnerService.updateStatus(data.applicationId, data.actorId, data.status, data.notes);
  });

export const convertApplicationToOrganization = createServerFn({ method: "POST" })
  .inputValidator((data: { applicationId: string; actorId: string; orgData: any }) => data)
  .handler(async ({ data }) => {
    return await partnerService.convertToOrganization(data.applicationId, data.actorId, data.orgData);
  });

export const softDeleteApplication = createServerFn({ method: "POST" })
  .inputValidator((data: { applicationId: string; actorId: string }) => data)
  .handler(async ({ data }) => {
    const { error } = await supabase
      .from('partner_applications')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString()
      })
      .eq('id', data.applicationId);

    if (error) throw error;

    return { success: true };
  });
