import { toast } from "sonner";

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

export async function validateFile(file: File, allowedTypes: string[], maxSize: number) {
  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, error: "Invalid file type. Only JPEG, PNG and WEBP are allowed." };
  }
  if (file.size > maxSize) {
    return { isValid: false, error: "File too large. Max size is 5MB." };
  }
  return { isValid: true };
}
