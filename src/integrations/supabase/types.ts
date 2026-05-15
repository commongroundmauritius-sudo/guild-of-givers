export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_actions: {
        Row: {
          action_type: string
          admin_id: string
          created_at: string
          details: Json | null
          id: string
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action_type: string
          admin_id: string
          created_at?: string
          details?: Json | null
          id?: string
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action_type?: string
          admin_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: []
      }
      allocations: {
        Row: {
          amount_mur: number
          created_at: string
          id: string
          initiative_id: string
          payment_id: string
        }
        Insert: {
          amount_mur: number
          created_at?: string
          id?: string
          initiative_id: string
          payment_id: string
        }
        Update: {
          amount_mur?: number
          created_at?: string
          id?: string
          initiative_id?: string
          payment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "allocations_initiative_id_fkey"
            columns: ["initiative_id"]
            isOneToOne: false
            referencedRelation: "initiatives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "allocations_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      initiative_updates: {
        Row: {
          content: string
          created_at: string
          id: string
          image_url: string | null
          initiative_id: string
          title: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          initiative_id: string
          title: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          initiative_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "initiative_updates_initiative_id_fkey"
            columns: ["initiative_id"]
            isOneToOne: false
            referencedRelation: "initiatives"
            referencedColumns: ["id"]
          },
        ]
      }
      initiatives: {
        Row: {
          cap_amount_mur: number | null
          caption: string | null
          content: string | null
          created_at: string
          current_amount_mur: number | null
          description: string | null
          gallery_urls: string[] | null
          goal_amount_mur: number | null
          id: string
          image_url: string | null
          is_approved: boolean | null
          is_impact_pool: boolean | null
          is_published: boolean | null
          media_url: string | null
          ngo_id: string
          status: string | null
          summary: string | null
          title: string
        }
        Insert: {
          cap_amount_mur?: number | null
          caption?: string | null
          content?: string | null
          created_at?: string
          current_amount_mur?: number | null
          description?: string | null
          gallery_urls?: string[] | null
          goal_amount_mur?: number | null
          id?: string
          image_url?: string | null
          is_approved?: boolean | null
          is_impact_pool?: boolean | null
          is_published?: boolean | null
          media_url?: string | null
          ngo_id: string
          status?: string | null
          summary?: string | null
          title: string
        }
        Update: {
          cap_amount_mur?: number | null
          caption?: string | null
          content?: string | null
          created_at?: string
          current_amount_mur?: number | null
          description?: string | null
          gallery_urls?: string[] | null
          goal_amount_mur?: number | null
          id?: string
          image_url?: string | null
          is_approved?: boolean | null
          is_impact_pool?: boolean | null
          is_published?: boolean | null
          media_url?: string | null
          ngo_id?: string
          status?: string | null
          summary?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "initiatives_ngo_id_fkey"
            columns: ["ngo_id"]
            isOneToOne: false
            referencedRelation: "ngos"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          amount_mur: number
          covers_fees: boolean
          created_at: string
          email: string
          full_name: string
          id: string
          phone: string | null
          status: string
        }
        Insert: {
          amount_mur: number
          covers_fees?: boolean
          created_at?: string
          email: string
          full_name: string
          id?: string
          phone?: string | null
          status?: string
        }
        Update: {
          amount_mur?: number
          covers_fees?: boolean
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          status?: string
        }
        Relationships: []
      }
      member_preferences: {
        Row: {
          created_at: string
          distribution_percentage: number | null
          id: string
          initiative_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          distribution_percentage?: number | null
          id?: string
          initiative_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          distribution_percentage?: number | null
          id?: string
          initiative_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_preferences_initiative_id_fkey"
            columns: ["initiative_id"]
            isOneToOne: false
            referencedRelation: "initiatives"
            referencedColumns: ["id"]
          },
        ]
      }
      ngo_documents: {
        Row: {
          created_at: string
          document_type: string | null
          file_url: string
          id: string
          ngo_id: string
          title: string
        }
        Insert: {
          created_at?: string
          document_type?: string | null
          file_url: string
          id?: string
          ngo_id: string
          title: string
        }
        Update: {
          created_at?: string
          document_type?: string | null
          file_url?: string
          id?: string
          ngo_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "ngo_documents_ngo_id_fkey"
            columns: ["ngo_id"]
            isOneToOne: false
            referencedRelation: "ngos"
            referencedColumns: ["id"]
          },
        ]
      }
      ngos: {
        Row: {
          category: string | null
          contact_info: string | null
          created_at: string
          description: string | null
          id: string
          is_verified: boolean
          logo_url: string | null
          mission: string | null
          name: string
          owner_id: string | null
          status: string | null
          website_url: string | null
        }
        Insert: {
          category?: string | null
          contact_info?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_verified?: boolean
          logo_url?: string | null
          mission?: string | null
          name: string
          owner_id?: string | null
          status?: string | null
          website_url?: string | null
        }
        Update: {
          category?: string | null
          contact_info?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_verified?: boolean
          logo_url?: string | null
          mission?: string | null
          name?: string
          owner_id?: string | null
          status?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      payment_events: {
        Row: {
          created_at: string | null
          event_type: string
          id: string
          processed_at: string | null
          processing_status: string | null
          provider: string
          provider_event_id: string
          raw_payload: Json
          retries: number | null
        }
        Insert: {
          created_at?: string | null
          event_type: string
          id?: string
          processed_at?: string | null
          processing_status?: string | null
          provider: string
          provider_event_id: string
          raw_payload: Json
          retries?: number | null
        }
        Update: {
          created_at?: string | null
          event_type?: string
          id?: string
          processed_at?: string | null
          processing_status?: string | null
          provider?: string
          provider_event_id?: string
          raw_payload?: Json
          retries?: number | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount_mur: number
          created_at: string
          currency: string | null
          fees_covered_amount_mur: number | null
          id: string
          paid_at: string | null
          peach_payment_id: string | null
          processor_response: Json | null
          status: Database["public"]["Enums"]["payment_status"]
          subscription_id: string | null
          user_id: string
        }
        Insert: {
          amount_mur: number
          created_at?: string
          currency?: string | null
          fees_covered_amount_mur?: number | null
          id?: string
          paid_at?: string | null
          peach_payment_id?: string | null
          processor_response?: Json | null
          status?: Database["public"]["Enums"]["payment_status"]
          subscription_id?: string | null
          user_id: string
        }
        Update: {
          amount_mur?: number
          created_at?: string
          currency?: string | null
          fees_covered_amount_mur?: number | null
          id?: string
          paid_at?: string | null
          peach_payment_id?: string | null
          processor_response?: Json | null
          status?: Database["public"]["Enums"]["payment_status"]
          subscription_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          age: number | null
          avatar_url: string | null
          bio: string | null
          country: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          ngo_id: string | null
          phone: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          age?: number | null
          avatar_url?: string | null
          bio?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          ngo_id?: string | null
          phone?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          age?: number | null
          avatar_url?: string | null
          bio?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          ngo_id?: string | null
          phone?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_ngo_id_fkey"
            columns: ["ngo_id"]
            isOneToOne: false
            referencedRelation: "ngos"
            referencedColumns: ["id"]
          },
        ]
      }
      receipts: {
        Row: {
          amount_mur: number
          created_at: string
          id: string
          payment_id: string
          pdf_url: string | null
          receipt_number: string
          user_id: string
        }
        Insert: {
          amount_mur: number
          created_at?: string
          id?: string
          payment_id: string
          pdf_url?: string | null
          receipt_number: string
          user_id: string
        }
        Update: {
          amount_mur?: number
          created_at?: string
          id?: string
          payment_id?: string
          pdf_url?: string | null
          receipt_number?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "receipts_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          admin_feedback: string | null
          created_at: string
          description: string | null
          file_url: string
          id: string
          initiative_id: string | null
          ngo_id: string
          report_date: string | null
          status: string | null
          title: string
        }
        Insert: {
          admin_feedback?: string | null
          created_at?: string
          description?: string | null
          file_url: string
          id?: string
          initiative_id?: string | null
          ngo_id: string
          report_date?: string | null
          status?: string | null
          title: string
        }
        Update: {
          admin_feedback?: string | null
          created_at?: string
          description?: string | null
          file_url?: string
          id?: string
          initiative_id?: string | null
          ngo_id?: string
          report_date?: string | null
          status?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_initiative_id_fkey"
            columns: ["initiative_id"]
            isOneToOne: false
            referencedRelation: "initiatives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_ngo_id_fkey"
            columns: ["ngo_id"]
            isOneToOne: false
            referencedRelation: "ngos"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          amount_mur: number
          billing_cycle: string | null
          covers_fees: boolean | null
          created_at: string
          id: string
          next_billing_date: string | null
          peach_subscription_id: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["subscription_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_mur: number
          billing_cycle?: string | null
          covers_fees?: boolean | null
          created_at?: string
          id?: string
          next_billing_date?: string | null
          peach_subscription_id?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_mur?: number
          billing_cycle?: string | null
          covers_fees?: boolean | null
          created_at?: string
          id?: string
          next_billing_date?: string | null
          peach_subscription_id?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: { requested_role: Database["public"]["Enums"]["app_role"] }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "ngo" | "member"
      payment_status: "success" | "failed" | "pending"
      subscription_status: "active" | "pending" | "cancelled" | "past_due"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "ngo", "member"],
      payment_status: ["success", "failed", "pending"],
      subscription_status: ["active", "pending", "cancelled", "past_due"],
    },
  },
} as const
