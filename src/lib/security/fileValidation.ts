/**
 * Security constants and utilities for file uploads.
 */

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates file metadata and basic content integrity.
 * In a full production environment, this should be combined with
 * server-side magic byte validation and re-encoding.
 */
export async function validateFile(
  file: File,
  allowedTypes: string[],
  maxSize: number,
): Promise<FileValidationResult> {
  // 1. Extension check (simple defensive layer)
  const extension = file.name.split(".").pop()?.toLowerCase();
  const allowedExtensions = ["jpg", "jpeg", "png", "webp"];
  if (!extension || !allowedExtensions.includes(extension)) {
    return {
      isValid: false,
      error: "Invalid file extension. Only JPG, PNG, and WEBP are allowed.",
    };
  }

  // 2. MIME type check
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `Invalid file type: ${file.type}. Allowed types: ${allowedTypes.join(", ")}`,
    };
  }

  // 3. Size check
  if (file.size > maxSize) {
    const sizeInMB = (maxSize / (1024 * 1024)).toFixed(0);
    return {
      isValid: false,
      error: `File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum size allowed is ${sizeInMB}MB`,
    };
  }

  // 4. Basic content check (Magic Bytes)
  // This is a browser-side check; server-side is authoritative.
  try {
    const header = await getFileHeader(file);
    if (!validateMagicBytes(header, file.type)) {
      return {
        isValid: false,
        error: "File content does not match its type. The file might be corrupted or malicious.",
      };
    }
  } catch (err) {
    console.error("Magic byte check failed:", err);
    // Continue if we can't read the header, but log it.
  }

  return { isValid: true };
}

async function getFileHeader(file: File): Promise<string> {
  const slice = file.slice(0, 4);
  const buffer = await slice.arrayBuffer();
  const view = new Uint8Array(buffer);
  let header = "";
  for (let i = 0; i < view.length; i++) {
    header += view[i].toString(16).padStart(2, "0");
  }
  return header.toUpperCase();
}

function validateMagicBytes(header: string, mimeType: string): boolean {
  // JPEG: FFD8FF
  if (mimeType.includes("jpeg") || mimeType.includes("jpg")) {
    return header.startsWith("FFD8FF");
  }
  // PNG: 89504E47
  if (mimeType.includes("png")) {
    return header.startsWith("89504E47");
  }
  // WEBP: 52494646 (RIFF) ... 57454250 (WEBP)
  if (mimeType.includes("webp")) {
    return header.startsWith("52494646");
  }
  return true;
}

/**
 * Sanitizes a filename for safe rendering and storage.
 */
export function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9.-]/g, "_").substring(0, 100);
}
