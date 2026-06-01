import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || "https://vzsifigcowusabfmnudk.supabase.co";
const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6c2lmaWdjb3d1c2FiZm1udWRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzNTE0MDIsImV4cCI6MjA5MzkyNzQwMn0.LY3_GeQbj1-9VfV_872pVh6pyb6cXiaJ9-FLdOAQQ4I";

import type { Database } from "./types";

type LooseDatabase = Omit<Database, "public"> & {
  public: Omit<Database["public"], "Tables" | "Views" | "Functions"> & {
    Tables: Database["public"]["Tables"] & Record<string, { Row: any; Insert: any; Update: any; Relationships: any[] }>;
    Views: Database["public"]["Views"] & Record<string, { Row: any; Relationships: any[] }>;
    Functions: Database["public"]["Functions"] & Record<string, { Args: any; Returns: any }>;
  };
};

export const supabase = createClient<LooseDatabase>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
  },
});

export type AppRole = Database["public"]["Enums"]["app_role"];

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type Enums<T extends keyof Database["public"]["Enums"]> = Database["public"]["Enums"][T];
