/**
 * Security constants and utilities for file uploads.
 */

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
}

export function validateFile(file: File, allowedTypes: string[], maxSize: number): FileValidationResult {
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `Invalid file type. Allowed types: ${allowedTypes.join(", ")}`,
    };
  }

  if (file.size > maxSize) {
    const sizeInMB = (maxSize / (1024 * 1024)).toFixed(0);
    return {
      isValid: false,
      error: `File too large. Maximum size allowed is ${sizeInMB}MB`,
    };
  }

  return { isValid: true };
}
