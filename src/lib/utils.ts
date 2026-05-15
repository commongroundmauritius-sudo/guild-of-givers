import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getJoinedData<T>(data: T | T[] | undefined | null): T | null {
  if (!data) return null;
  return Array.isArray(data) ? data[0] : data;
}

export function getJoinedField<T, K extends keyof T>(
  data: T | T[] | undefined | null,
  field: K,
): T[K] | null {
  const item = getJoinedData(data);
  return item ? item[field] : null;
}
