import { createServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import { uuidSchema, nameSchema, urlSchema, filterTrustedFields, slugSchema } from "./validators";
import { ensureAdmin, ensureAuthenticated, getSessionUser } from "./auth";
import { generateUniqueInitiativeSlug } from "@/lib/slugify";

/**
 * Hardened Server actions via Server Functions.
 * Authorization is derived from the session, not client parameters.
 */

export const updateAnnouncement = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      id: uuidSchema.optional(),
      data: z.object({
        title: z.string().min(1).max(200),
        content: z.string().min(1).max(5000),
        category: z.string(),
        pinned: z.boolean().optional(),
      }),
    }),
  )
  .handler(async ({ data }) => {
    const user = await ensureAdmin();

    // Only allow specific fields for update/insert
    const allowedData = filterTrustedFields(data.data, ["title", "content", "category", "pinned"]);

    if (data.id) {
      const { error } = await supabase.from("announcements").update(allowedData).eq("id", data.id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from("announcements")
        .insert({ ...data.data, author_id: user.id });
      if (error) throw error;
    }
    return { success: true };
  });

export const deleteAnnouncement = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      id: uuidSchema,
    }),
  )
  .handler(async ({ data }) => {
    await ensureAdmin();
    const { error } = await supabase
      .from("announcements")
      .update({ is_deleted: true, deleted_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw error;
    return { success: true };
  });

export const updateOrganizationStatus = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      id: uuidSchema,
      status: z.string(),
    }),
  )
  .handler(async ({ data }) => {
    await ensureAdmin();
    const { error } = await supabase
      .from("organizations")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw error;
    return { success: true };
  });

export const toggleOrganizationVetted = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      id: uuidSchema,
      is_verified: z.boolean(),
    }),
  )
  .handler(async ({ data }) => {
    await ensureAdmin();
    const { error } = await supabase
      .from("organizations")
      .update({ is_verified: data.is_verified })
      .eq("id", data.id);
    if (error) throw error;
    return { success: true };
  });

export const updateReportStatus = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      id: uuidSchema,
      status: z.enum(["pending", "reviewing", "approved", "returned_for_revision"]),
      adminFeedback: z.string().max(1000).optional(),
    }),
  )
  .handler(async ({ data }) => {
    await ensureAdmin();
    const { error } = await supabase
      .from("reports")
      .update({
        status: data.status,
        admin_feedback: data.adminFeedback,
      })
      .eq("id", data.id);
    if (error) throw error;
    return { success: true };
  });

export const updatePostStatus = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      id: uuidSchema,
      status: z.enum(["published", "rejected", "pending"]),
    }),
  )
  .handler(async ({ data }) => {
    await ensureAdmin();
    const { error } = await supabase
      .from("community_posts")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw error;
    return { success: true };
  });

export const deletePost = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      id: uuidSchema,
    }),
  )
  .handler(async ({ data }) => {
    await ensureAdmin();
    const { error } = await supabase
      .from("community_posts")
      .update({ is_deleted: true, deleted_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw error;
    return { success: true };
  });

export const updateInitiative = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      id: uuidSchema,
      data: z
        .object({
          title: z.string().optional(),
          description: z.string().optional(),
          summary: z.string().optional(),
          caption: z.string().optional(),
          status: z.string().optional(),
          category: z.string().optional(),
          goal_amount_mur: z.number().optional(),
          impact_pool_target: z.number().optional(),
          image_url: urlSchema.optional(),
          is_published: z.boolean().optional(),
        }),
    }),
  )
  .handler(async ({ data }) => {
    await ensureAdmin();

    // Whitelist only specific fields to prevent role escalation or system field tampering
    const allowedData = filterTrustedFields(data.data, [
      "title",
      "description",
      "summary",
      "caption",
      "status",
      "category",
      "goal_amount_mur",
      "impact_pool_target",
      "image_url",
      "is_published",
    ]);

    const { error } = await supabase.from("initiatives").update(allowedData).eq("id", data.id);
    if (error) throw error;
    return { success: true };
  });

export const createInitiative = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      data: z.any(),
      publish: z.boolean().default(false),
    }),
  )
  .handler(async ({ data }) => {
    const user = await ensureAdmin();
    const slug = await generateUniqueInitiativeSlug(data.data.title);

    const allowedData = filterTrustedFields(data.data, [
      "title",
      "description",
      "summary",
      "caption",
      "status",
      "category",
      "goal_amount_mur",
      "impact_pool_target",
      "image_url",
      "content",
      "gallery_urls",
      "short_term_goals",
      "long_term_goals",
      "target_milestones",
      "expected_outcomes",
      "organization_id",
    ]);

    const { data: initiative, error } = await supabase
      .from("initiatives")
      .insert({
        ...allowedData,
        title: z.string().min(1).parse(data.data.title),
        is_published: data.publish,
        is_approved: true,
        initiative_source: "admin_created",
        creator_user_id: user.id,
        creator_role: "admin",
        slug: data.data.slug || slug,
      })
      .select()
      .single();

    if (error) throw error;
    return initiative;
  });

export const deleteInitiative = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      id: uuidSchema,
    }),
  )
  .handler(async ({ data }) => {
    await ensureAdmin();
    const { error } = await supabase.from("initiatives").delete().eq("id", data.id);
    if (error) throw error;
    return { success: true };
  });

export const updateProfile = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      data: z.object({
        full_name: nameSchema.optional(),
        phone: z.string().max(20).optional().nullable(),
        address: z.string().max(500).optional().nullable(),
        age: z.number().int().min(13).max(120).optional().nullable(),
        avatar_url: urlSchema.optional().nullable(),
      }),
    }),
  )
  .handler(async ({ data }) => {
    const user = await ensureAuthenticated();

    // Explicit whitelisting: Never allow role/organization_id change via this action
    const allowedData = filterTrustedFields(data.data, [
      "full_name",
      "phone",
      "address",
      "age",
      "avatar_url",
    ]);

    const { error } = await supabase
      .from("profiles")
      .update({
        ...allowedData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) throw error;
    return { success: true };
  });

export const createCampaignLink = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      initiative_id: uuidSchema,
      name: z.string().min(1).max(100),
      source_type: z.string(),
      tracking_code: slugSchema,
      expires_at: z.string().optional(),
      is_active: z.boolean().default(true),
    }),
  )
  .handler(async ({ data }) => {
    const user = await ensureAuthenticated();

    // Verify ownership of the initiative (or admin)
    const { data: initiative } = await supabase
      .from("initiatives")
      .select("organization_id")
      .eq("id", data.initiative_id)
      .single();

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    const { data: userRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();
    const isAdminRole = userRole?.role === "admin" || userRole?.role === "super_admin";

    if (!isAdminRole && profile?.organization_id !== initiative?.organization_id) {
      throw new Error("Unauthorized: You do not own this initiative");
    }

    const { error } = await supabase
      .from("campaign_links" as any)
      .insert({ ...data, created_by: user.id });

    if (error) throw error;
    return { success: true };
  });

export const logInitiativeEvent = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      initiativeId: uuidSchema,
      eventType: z.enum(["page_view", "cta_click", "share", "referral_visit"]),
      metadata: z.record(z.any()).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const user = await getSessionUser();
    const userId = user?.id;

    const { error } = await supabase.from("initiative_events" as any).insert({
      initiative_id: data.initiativeId,
      event_type: data.eventType,
      user_id: userId,
      metadata: data.metadata || {},
    });

    if (error) throw error;
    return { success: true };
  });

export const uploadReport = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      title: z.string().min(1).max(200),
      description: z.string().max(1000).optional(),
      fileUrl: z.string().url(),
      organizationId: uuidSchema,
      reportDate: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const user = await ensureAuthenticated();

    // Verify user belongs to the organization
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (profile?.organization_id !== data.organizationId) {
      throw new Error("Unauthorized: You can only upload reports for your own organization");
    }

    const { error } = await supabase.from("reports").insert({
      title: data.title,
      description: data.description,
      file_url: data.fileUrl,
      organization_id: data.organizationId,
      report_date: data.reportDate || new Date().toISOString(),
      status: "pending",
    });

    if (error) throw error;
    return { success: true };
  });
