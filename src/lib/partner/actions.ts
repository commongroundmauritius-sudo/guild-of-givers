import { createServerFn } from "@tanstack/react-start";
import { partnerService } from "./service";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import { partnerApplicationSchema, uuidSchema } from "../security/validators";

export const submitPartnerApplication = createServerFn({ method: "POST" })
  .inputValidator(partnerApplicationSchema)
  .handler(async ({ data }) => {
    return await partnerService.submitApplication(data);
  });

export const updateApplicationStatus = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    applicationId: uuidSchema,
    actorId: uuidSchema,
    status: z.enum(['submitted', 'under_review', 'contacted', 'approved', 'rejected', 'converted', 'archived']),
    notes: z.string().max(1000).optional(),
  }))
  .handler(async ({ data }) => {
    return await partnerService.updateStatus(data.applicationId, data.actorId, data.status as any, data.notes);
  });

export const convertApplicationToOrganization = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    applicationId: uuidSchema,
    actorId: uuidSchema,
    orgData: z.object({
      organization_name: z.string().min(2).max(200).optional(),
      description: z.string().max(2000).optional(),
      website_url: z.string().url().optional().or(z.literal("")),
    }).passthrough(),
  }))
  .handler(async ({ data }) => {
    return await partnerService.convertToOrganization(data.applicationId, data.actorId, data.orgData);
  });

export const softDeleteApplication = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    applicationId: uuidSchema,
    actorId: uuidSchema,
  }))
  .handler(async ({ data }) => {
    const { error } = await supabase
      .from('partner_applications' as any)
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString()
      })
      .eq('id', data.applicationId);

    if (error) throw error;

    return { success: true };
  });
