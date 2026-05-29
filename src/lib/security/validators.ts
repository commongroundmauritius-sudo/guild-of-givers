import { z } from "zod";

/**
 * Shared Zod schemas for application-wide validation.
 */

export const uuidSchema = z.string().uuid();

export const slugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

export const emailSchema = z.string().email().toLowerCase().trim();

export const urlSchema = z.string().url().or(z.string().startsWith("/"));

export const nameSchema = z.string().min(2).max(100).trim();

export const messageSchema = z.string().min(1).max(5000).trim();

export const partnerApplicationSchema = z.object({
  organization_name: z.string().min(2).max(200).trim(),
  organization_type: z.string().min(2).max(100),
  registration_number: z.string().min(2).max(100),
  email: emailSchema,
  message: messageSchema,
});

export const communityPostSchema = z.object({
  title: z.string().min(5).max(200).trim(),
  content: messageSchema,
  initiative_id: uuidSchema.nullable().optional(),
  image_url: urlSchema.nullable().optional(),
});

export const commentSchema = z.object({
  post_id: uuidSchema,
  content: z.string().min(1).max(1000).trim(),
});
