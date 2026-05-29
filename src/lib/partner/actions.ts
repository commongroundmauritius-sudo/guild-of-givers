import { createServerFn } from "@tanstack/react-start";
import { partnerService } from "./service";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import { partnerApplicationSchema, uuidSchema } from "../security/validators";
import { ensureAdmin } from "../security/auth";
import { rateLimit } from "../security/rateLimit";

export const submitPartnerApplication = createServerFn({ method: "POST" })
  .inputValidator(partnerApplicationSchema)
  .handler(async ({ data }) => {
    // Rate limit applications by email to prevent spam
    await rateLimit(data.email, 'submit_partner_app', { windowMs: 86400000, max: 2 }); // 1 application per 12h per email
    return await partnerService.submitApplication(data);
  });

export const updateApplicationStatus = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    applicationId: uuidSchema,
    status: z.enum(['submitted', 'under_review', 'contacted', 'approved', 'rejected', 'converted', 'archived']),
    notes: z.string().max(1000).optional(),
  }))
  .handler(async ({ data }) => {
    const user = await ensureAdmin();
    return await partnerService.updateStatus(data.applicationId, user.id, data.status as any, data.notes);
  });

export const convertApplicationToOrganization = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    applicationId: uuidSchema,
    orgData: z.object({
      organization_name: z.string().min(2).max(200).optional(),
      description: z.string().max(2000).optional(),
      website_url: z.string().url().optional().or(z.literal("")),
    }).passthrough(),
  }))
  .handler(async ({ data }) => {
    const user = await ensureAdmin();
    return await partnerService.convertToOrganization(data.applicationId, user.id, data.orgData);
  });

export const softDeleteApplication = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    applicationId: uuidSchema,
  }))
  .handler(async ({ data }) => {
    await ensureAdmin();
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
