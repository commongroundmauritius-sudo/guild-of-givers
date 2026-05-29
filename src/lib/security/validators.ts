import { z } from "zod";

/**
 * Shared Zod schemas for application-wide validation.
 */

export const uuidSchema = z.string().uuid();

export const slugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

export const emailSchema = z.string().email().toLowerCase().trim();

// Ensure URLs use safe protocols and prevent common XSS vectors
export const urlSchema = z.string().url().refine(val =>
  val.startsWith("http://") || val.startsWith("https://") || val.startsWith("/"),
  { message: "URL must use http, https, or be a relative path" }
).or(z.string().startsWith("/"));

// Title schema to prevent scripts and excessive length
export const titleSchema = z.string()
  .min(2)
  .max(200)
  .trim()
  .refine(val => !/<script/i.test(val), { message: "Title contains forbidden characters" });

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
  title: titleSchema,
  content: messageSchema,
  initiative_id: uuidSchema.nullable().optional(),
  image_url: urlSchema.nullable().optional(),
});

export const commentSchema = z.object({
  post_id: uuidSchema,
  content: z.string().min(1).max(1000).trim(),
});

/**
 * Trusted fields filter: Returns only the fields that are allowed to be updated by a user.
 * Prevents "Mass Assignment" or "Trusted Field Injection" attacks.
 */
export function filterTrustedFields<T extends object>(data: T, allowedFields: (keyof T)[]): Partial<T> {
  const filtered: any = {};
  allowedFields.forEach(field => {
    if (data[field] !== undefined) {
      filtered[field] = data[field];
    }
  });
  return filtered;
}
