export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      activities: {
        Row: {
          created_at: string;
          event_type: string;
          id: string;
          initiative_id: string | null;
          metadata: Json | null;
          organization_id: string | null;
          source: string | null;
          user_id: string | null;
        };
        Insert: {
          created_at?: string;
          event_type: string;
          id?: string;
          initiative_id?: string | null;
          metadata?: Json | null;
          organization_id?: string | null;
          source?: string | null;
          user_id?: string | null;
        };
        Update: {
          created_at?: string;
          event_type?: string;
          id?: string;
          initiative_id?: string | null;
          metadata?: Json | null;
          organization_id?: string | null;
          source?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "activities_initiative_id_fkey";
            columns: ["initiative_id"];
            isOneToOne: false;
            referencedRelation: "initiatives";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "activities_initiative_id_fkey";
            columns: ["initiative_id"];
            isOneToOne: false;
            referencedRelation: "public_visible_initiatives";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "activities_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      admin_actions: {
        Row: {
          action_type: string;
          admin_id: string;
          created_at: string;
          details: Json | null;
          id: string;
          target_id: string | null;
          target_type: string | null;
        };
        Insert: {
          action_type: string;
          admin_id: string;
          created_at?: string;
          details?: Json | null;
          id?: string;
          target_id?: string | null;
          target_type?: string | null;
        };
        Update: {
          action_type?: string;
          admin_id?: string;
          created_at?: string;
          details?: Json | null;
          id?: string;
          target_id?: string | null;
          target_type?: string | null;
        };
        Relationships: [];
      };
      allocations: {
        Row: {
          amount_mur: number;
          created_at: string;
          id: string;
          initiative_id: string;
          is_overflow: boolean | null;
          organization_id: string | null;
          payment_id: string;
          potential_amount_mur: number | null;
        };
        Insert: {
          amount_mur: number;
          created_at?: string;
          id?: string;
          initiative_id: string;
          is_overflow?: boolean | null;
          organization_id?: string | null;
          payment_id: string;
          potential_amount_mur?: number | null;
        };
        Update: {
          amount_mur?: number;
          created_at?: string;
          id?: string;
          initiative_id?: string;
          is_overflow?: boolean | null;
          organization_id?: string | null;
          payment_id?: string;
          potential_amount_mur?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "allocations_initiative_id_fkey";
            columns: ["initiative_id"];
            isOneToOne: false;
            referencedRelation: "initiatives";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "allocations_initiative_id_fkey";
            columns: ["initiative_id"];
            isOneToOne: false;
            referencedRelation: "public_visible_initiatives";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "allocations_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "allocations_payment_id_fkey";
            columns: ["payment_id"];
            isOneToOne: false;
            referencedRelation: "payments";
            referencedColumns: ["id"];
          },
        ];
      };
      announcements: {
        Row: {
          author_id: string | null;
          category: string;
          content: string;
          created_at: string;
          deleted_at: string | null;
          id: string;
          image_url: string | null;
          is_deleted: boolean | null;
          pinned: boolean | null;
          title: string;
          updated_at: string;
        };
        Insert: {
          author_id?: string | null;
          category: string;
          content: string;
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          image_url?: string | null;
          is_deleted?: boolean | null;
          pinned?: boolean | null;
          title: string;
          updated_at?: string;
        };
        Update: {
          author_id?: string | null;
          category?: string;
          content?: string;
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          image_url?: string | null;
          is_deleted?: boolean | null;
          pinned?: boolean | null;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "announcements_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "announcements_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "supporter_retention_stats";
            referencedColumns: ["profile_id"];
          },
        ];
      };
      audit_logs: {
        Row: {
          action: string;
          created_at: string;
          entity_id: string;
          entity_type: string;
          id: string;
          new_data: Json | null;
          previous_data: Json | null;
          user_id: string | null;
        };
        Insert: {
          action: string;
          created_at?: string;
          entity_id: string;
          entity_type: string;
          id?: string;
          new_data?: Json | null;
          previous_data?: Json | null;
          user_id?: string | null;
        };
        Update: {
          action?: string;
          created_at?: string;
          entity_id?: string;
          entity_type?: string;
          id?: string;
          new_data?: Json | null;
          previous_data?: Json | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "audit_logs_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "supporter_retention_stats";
            referencedColumns: ["profile_id"];
          },
        ];
      };
      automation_executions: {
        Row: {
          created_at: string | null;
          entity_id: string | null;
          id: string;
          result: Json | null;
          rule_id: string | null;
          status: string | null;
          user_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          entity_id?: string | null;
          id?: string;
          result?: Json | null;
          rule_id?: string | null;
          status?: string | null;
          user_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          entity_id?: string | null;
          id?: string;
          result?: Json | null;
          rule_id?: string | null;
          status?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "automation_executions_rule_id_fkey";
            columns: ["rule_id"];
            isOneToOne: false;
            referencedRelation: "automation_rules";
            referencedColumns: ["id"];
          },
        ];
      };
      automation_logs: {
        Row: {
          created_at: string | null;
          execution_id: string | null;
          id: string;
          level: string | null;
          message: string;
          metadata: Json | null;
        };
        Insert: {
          created_at?: string | null;
          execution_id?: string | null;
          id?: string;
          level?: string | null;
          message: string;
          metadata?: Json | null;
        };
        Update: {
          created_at?: string | null;
          execution_id?: string | null;
          id?: string;
          level?: string | null;
          message?: string;
          metadata?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: "automation_logs_execution_id_fkey";
            columns: ["execution_id"];
            isOneToOne: false;
            referencedRelation: "automation_executions";
            referencedColumns: ["id"];
          },
        ];
      };
      automation_rules: {
        Row: {
          actions: Json | null;
          conditions: Json | null;
          created_at: string | null;
          description: string | null;
          id: string;
          is_active: boolean | null;
          name: string;
          organization_id: string | null;
          trigger_config: Json | null;
          trigger_type: string;
          updated_at: string | null;
        };
        Insert: {
          actions?: Json | null;
          conditions?: Json | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          name: string;
          organization_id?: string | null;
          trigger_config?: Json | null;
          trigger_type: string;
          updated_at?: string | null;
        };
        Update: {
          actions?: Json | null;
          conditions?: Json | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          name?: string;
          organization_id?: string | null;
          trigger_config?: Json | null;
          trigger_type?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "automation_rules_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      billing_cycles: {
        Row: {
          end_date: string;
          id: string;
          is_closed: boolean | null;
          month: number;
          start_date: string;
          year: number;
        };
        Insert: {
          end_date: string;
          id?: string;
          is_closed?: boolean | null;
          month: number;
          start_date: string;
          year: number;
        };
        Update: {
          end_date?: string;
          id?: string;
          is_closed?: boolean | null;
          month?: number;
          start_date?: string;
          year?: number;
        };
        Relationships: [];
      };
      billing_runs: {
        Row: {
          created_at: string;
          error_log: string | null;
          id: string;
          run_date: string;
          status: string | null;
          subscriptions_processed: number | null;
          total_amount_mur: number | null;
        };
        Insert: {
          created_at?: string;
          error_log?: string | null;
          id?: string;
          run_date?: string;
          status?: string | null;
          subscriptions_processed?: number | null;
          total_amount_mur?: number | null;
        };
        Update: {
          created_at?: string;
          error_log?: string | null;
          id?: string;
          run_date?: string;
          status?: string | null;
          subscriptions_processed?: number | null;
          total_amount_mur?: number | null;
        };
        Relationships: [];
      };
      campaign_links: {
        Row: {
          created_at: string;
          created_by: string | null;
          expires_at: string | null;
          id: string;
          initiative_id: string;
          is_active: boolean | null;
          metadata: Json | null;
          name: string;
          source_type: string;
          tracking_code: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          expires_at?: string | null;
          id?: string;
          initiative_id: string;
          is_active?: boolean | null;
          metadata?: Json | null;
          name: string;
          source_type: string;
          tracking_code: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          expires_at?: string | null;
          id?: string;
          initiative_id?: string;
          is_active?: boolean | null;
          metadata?: Json | null;
          name?: string;
          source_type?: string;
          tracking_code?: string;
        };
        Relationships: [
          {
            foreignKeyName: "campaign_links_initiative_id_fkey";
            columns: ["initiative_id"];
            isOneToOne: false;
            referencedRelation: "initiatives";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "campaign_links_initiative_id_fkey";
            columns: ["initiative_id"];
            isOneToOne: false;
            referencedRelation: "public_visible_initiatives";
            referencedColumns: ["id"];
          },
        ];
      };
      campaigns: {
        Row: {
          created_at: string;
          description: string | null;
          end_date: string | null;
          id: string;
          name: string;
          organization_id: string;
          start_date: string | null;
          status: string | null;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          end_date?: string | null;
          id?: string;
          name: string;
          organization_id: string;
          start_date?: string | null;
          status?: string | null;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          end_date?: string | null;
          id?: string;
          name?: string;
          organization_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "campaigns_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      community_activity_limits: {
        Row: {
          daily_posts: number;
          daily_reactions: number;
          hourly_comments: number;
          last_comment_at: string | null;
          last_post_at: string | null;
          last_reaction_at: string | null;
          user_id: string;
        };
        Insert: {
          daily_posts?: number;
          daily_reactions?: number;
          hourly_comments?: number;
          last_comment_at?: string | null;
          last_post_at?: string | null;
          last_reaction_at?: string | null;
          user_id: string;
        };
        Update: {
          daily_posts?: number;
          daily_reactions?: number;
          hourly_comments?: number;
          last_comment_at?: string | null;
          last_post_at?: string | null;
          last_reaction_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "community_activity_limits_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "community_activity_limits_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "supporter_retention_stats";
            referencedColumns: ["profile_id"];
          },
        ];
      };
      community_posts: {
        Row: {
          comments_count: number;
          content: string;
          created_at: string;
          deleted_at: string | null;
          id: string;
          image_url: string | null;
          initiative_id: string | null;
          is_deleted: boolean | null;
          reactions_count: number;
          status: string;
          title: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          comments_count?: number;
          content: string;
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          image_url?: string | null;
          initiative_id?: string | null;
          is_deleted?: boolean | null;
          reactions_count?: number;
          status?: string;
          title: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          comments_count?: number;
          content?: string;
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          image_url?: string | null;
          initiative_id?: string | null;
          is_deleted?: boolean | null;
          reactions_count?: number;
          status?: string;
          title?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "community_posts_initiative_id_fkey";
            columns: ["initiative_id"];
            isOneToOne: false;
            referencedRelation: "initiatives";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "community_posts_initiative_id_fkey";
            columns: ["initiative_id"];
            isOneToOne: false;
            referencedRelation: "public_visible_initiatives";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "community_posts_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "community_posts_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "supporter_retention_stats";
            referencedColumns: ["profile_id"];
          },
        ];
      };
      crm_notes: {
        Row: {
          author_id: string | null;
          content: string;
          created_at: string;
          id: string;
          lead_id: string | null;
          metadata: Json | null;
          organization_id: string;
          profile_id: string | null;
        };
        Insert: {
          author_id?: string | null;
          content: string;
          created_at?: string;
          id?: string;
          lead_id?: string | null;
          metadata?: Json | null;
          organization_id: string;
          profile_id?: string | null;
        };
        Update: {
          author_id?: string | null;
          content?: string;
          created_at?: string;
          id?: string;
          lead_id?: string | null;
          metadata?: Json | null;
          organization_id?: string;
          profile_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "crm_notes_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_notes_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_notes_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_notes_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "supporter_retention_stats";
            referencedColumns: ["profile_id"];
          },
        ];
      };
      crm_tag_assignments: {
        Row: {
          created_at: string;
          id: string;
          lead_id: string | null;
          profile_id: string | null;
          tag_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          lead_id?: string | null;
          profile_id?: string | null;
          tag_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          lead_id?: string | null;
          profile_id?: string | null;
          tag_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "crm_tag_assignments_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_tag_assignments_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_tag_assignments_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "supporter_retention_stats";
            referencedColumns: ["profile_id"];
          },
          {
            foreignKeyName: "crm_tag_assignments_tag_id_fkey";
            columns: ["tag_id"];
            isOneToOne: false;
            referencedRelation: "crm_tags";
            referencedColumns: ["id"];
          },
        ];
      };
      crm_tags: {
        Row: {
          color: string | null;
          created_at: string;
          id: string;
          name: string;
          organization_id: string;
        };
        Insert: {
          color?: string | null;
          created_at?: string;
          id?: string;
          name: string;
          organization_id: string;
        };
        Update: {
          color?: string | null;
          created_at?: string;
          id?: string;
          name?: string;
          organization_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "crm_tags_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      crm_tasks: {
        Row: {
          assigned_to: string | null;
          created_at: string | null;
          description: string | null;
          due_date: string | null;
          id: string;
          lead_id: string | null;
          metadata: Json | null;
          organization_id: string | null;
          priority: string | null;
          profile_id: string | null;
          status: string | null;
          title: string;
          updated_at: string | null;
        };
        Insert: {
          assigned_to?: string | null;
          created_at?: string | null;
          description?: string | null;
          due_date?: string | null;
          id?: string;
          lead_id?: string | null;
          metadata?: Json | null;
          organization_id?: string | null;
          priority?: string | null;
          profile_id?: string | null;
          status?: string | null;
          title: string;
          updated_at?: string | null;
        };
        Update: {
          assigned_to?: string | null;
          created_at?: string | null;
          description?: string | null;
          due_date?: string | null;
          id?: string;
          lead_id?: string | null;
          metadata?: Json | null;
          organization_id?: string | null;
          priority?: string | null;
          profile_id?: string | null;
          status?: string | null;
          title?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "crm_tasks_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_tasks_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_tasks_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_tasks_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "supporter_retention_stats";
            referencedColumns: ["profile_id"];
          },
        ];
      };
      daily_campaign_stats: {
        Row: {
          campaign_link_id: string;
          date: string;
          failed_payment_count: number | null;
          id: string;
          registration_count: number | null;
          subscription_count: number | null;
          successful_payment_count: number | null;
          total_revenue_mur: number | null;
          view_count: number | null;
        };
        Insert: {
          campaign_link_id: string;
          date: string;
          failed_payment_count?: number | null;
          id?: string;
          registration_count?: number | null;
          subscription_count?: number | null;
          successful_payment_count?: number | null;
          total_revenue_mur?: number | null;
          view_count?: number | null;
        };
        Update: {
          campaign_link_id?: string;
          date?: string;
          failed_payment_count?: number | null;
          id?: string;
          registration_count?: number | null;
          subscription_count?: number | null;
          successful_payment_count?: number | null;
          total_revenue_mur?: number | null;
          view_count?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "daily_campaign_stats_campaign_link_id_fkey";
            columns: ["campaign_link_id"];
            isOneToOne: false;
            referencedRelation: "campaign_links";
            referencedColumns: ["id"];
          },
        ];
      };
      daily_initiative_stats: {
        Row: {
          date: string;
          failed_payment_count: number | null;
          id: string;
          initiative_id: string;
          registration_count: number | null;
          subscription_count: number | null;
          successful_payment_count: number | null;
          total_revenue_mur: number | null;
          view_count: number | null;
        };
        Insert: {
          date: string;
          failed_payment_count?: number | null;
          id?: string;
          initiative_id: string;
          registration_count?: number | null;
          subscription_count?: number | null;
          successful_payment_count?: number | null;
          total_revenue_mur?: number | null;
          view_count?: number | null;
        };
        Update: {
          date?: string;
          failed_payment_count?: number | null;
          id?: string;
          initiative_id?: string;
          registration_count?: number | null;
          subscription_count?: number | null;
          successful_payment_count?: number | null;
          total_revenue_mur?: number | null;
          view_count?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "daily_initiative_stats_initiative_id_fkey";
            columns: ["initiative_id"];
            isOneToOne: false;
            referencedRelation: "initiatives";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "daily_initiative_stats_initiative_id_fkey";
            columns: ["initiative_id"];
            isOneToOne: false;
            referencedRelation: "public_visible_initiatives";
            referencedColumns: ["id"];
          },
        ];
      };
      daily_revenue_stats: {
        Row: {
          active_subscriptions: number | null;
          date: string;
          failed_payments: number | null;
          id: string;
          total_payments: number | null;
          total_revenue_mur: number | null;
        };
        Insert: {
          active_subscriptions?: number | null;
          date: string;
          failed_payments?: number | null;
          id?: string;
          total_payments?: number | null;
          total_revenue_mur?: number | null;
        };
        Update: {
          active_subscriptions?: number | null;
          date?: string;
          failed_payments?: number | null;
          id?: string;
          total_payments?: number | null;
          total_revenue_mur?: number | null;
        };
        Relationships: [];
      };
      email_queue: {
        Row: {
          created_at: string;
          error_message: string | null;
          id: string;
          payload: Json | null;
          processed_at: string | null;
          provider: string | null;
          recipient: string;
          retry_count: number;
          status: string;
          template_key: string;
        };
        Insert: {
          created_at?: string;
          error_message?: string | null;
          id?: string;
          payload?: Json | null;
          processed_at?: string | null;
          provider?: string | null;
          recipient: string;
          retry_count?: number;
          status?: string;
          template_key: string;
        };
        Update: {
          created_at?: string;
          error_message?: string | null;
          id?: string;
          payload?: Json | null;
          processed_at?: string | null;
          provider?: string | null;
          recipient?: string;
          retry_count?: number;
          status?: string;
          template_key?: string;
        };
        Relationships: [];
      };
      fee_configurations: {
        Row: {
          active: boolean | null;
          created_at: string;
          fee_type: Database["public"]["Enums"]["fee_type"];
          fixed_amount_mur: number | null;
          id: string;
          percentage_value: number | null;
        };
        Insert: {
          active?: boolean | null;
          created_at?: string;
          fee_type: Database["public"]["Enums"]["fee_type"];
          fixed_amount_mur?: number | null;
          id?: string;
          percentage_value?: number | null;
        };
        Update: {
          active?: boolean | null;
          created_at?: string;
          fee_type?: Database["public"]["Enums"]["fee_type"];
          fixed_amount_mur?: number | null;
          id?: string;
          percentage_value?: number | null;
        };
        Relationships: [];
      };
      financial_accounts: {
        Row: {
          account_type: Database["public"]["Enums"]["financial_account_type"];
          cached_balance_mur: number;
          created_at: string;
          id: string;
          is_system: boolean;
          reference_id: string | null;
        };
        Insert: {
          account_type: Database["public"]["Enums"]["financial_account_type"];
          cached_balance_mur?: number;
          created_at?: string;
          id?: string;
          is_system?: boolean;
          reference_id?: string | null;
        };
        Update: {
          account_type?: Database["public"]["Enums"]["financial_account_type"];
          cached_balance_mur?: number;
          created_at?: string;
          id?: string;
          is_system?: boolean;
          reference_id?: string | null;
        };
        Relationships: [];
      };
      financial_events: {
        Row: {
          account_id: string;
          amount_mur: number;
          billing_cycle_id: string | null;
          created_at: string;
          event_type: Database["public"]["Enums"]["financial_event_type"];
          id: string;
          initiative_id: string | null;
          metadata: Json | null;
          payment_id: string | null;
          previous_balance: number;
          resulting_balance: number;
          user_id: string | null;
        };
        Insert: {
          account_id: string;
          amount_mur: number;
          billing_cycle_id?: string | null;
          created_at?: string;
          event_type: Database["public"]["Enums"]["financial_event_type"];
          id?: string;
          initiative_id?: string | null;
          metadata?: Json | null;
          payment_id?: string | null;
          previous_balance: number;
          resulting_balance: number;
          user_id?: string | null;
        };
        Update: {
          account_id?: string;
          amount_mur?: number;
          billing_cycle_id?: string | null;
          created_at?: string;
          event_type?: Database["public"]["Enums"]["financial_event_type"];
          id?: string;
          initiative_id?: string | null;
          metadata?: Json | null;
          payment_id?: string | null;
          previous_balance?: number;
          resulting_balance?: number;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "financial_events_account_id_fkey";
            columns: ["account_id"];
            isOneToOne: false;
            referencedRelation: "financial_accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "financial_events_billing_cycle_id_fkey";
            columns: ["billing_cycle_id"];
            isOneToOne: false;
            referencedRelation: "billing_cycles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "financial_events_initiative_id_fkey";
            columns: ["initiative_id"];
            isOneToOne: false;
            referencedRelation: "initiatives";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "financial_events_initiative_id_fkey";
            columns: ["initiative_id"];
            isOneToOne: false;
            referencedRelation: "public_visible_initiatives";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "financial_events_payment_id_fkey";
            columns: ["payment_id"];
            isOneToOne: false;
            referencedRelation: "payments";
            referencedColumns: ["id"];
          },
        ];
      };
      homepage_featured_initiatives: {
        Row: {
          created_at: string;
          display_order: number;
          id: string;
          initiative_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          display_order: number;
          id?: string;
          initiative_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          display_order?: number;
          id?: string;
          initiative_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "homepage_featured_initiatives_initiative_id_fkey";
            columns: ["initiative_id"];
            isOneToOne: false;
            referencedRelation: "initiatives";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "homepage_featured_initiatives_initiative_id_fkey";
            columns: ["initiative_id"];
            isOneToOne: false;
            referencedRelation: "public_visible_initiatives";
            referencedColumns: ["id"];
          },
        ];
      };
      homepage_settings: {
        Row: {
          id: string;
          setting_key: string;
          setting_value: Json;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          id?: string;
          setting_key: string;
          setting_value: Json;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          id?: string;
          setting_key?: string;
          setting_value?: Json;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [];
      };
      initiative_events: {
        Row: {
          campaign_link_id: string | null;
          created_at: string | null;
          event_type: string;
          id: string;
          initiative_id: string | null;
          metadata: Json | null;
          session_id: string | null;
          user_id: string | null;
        };
        Insert: {
          campaign_link_id?: string | null;
          created_at?: string | null;
          event_type: string;
          id?: string;
          initiative_id?: string | null;
          metadata?: Json | null;
          session_id?: string | null;
          user_id?: string | null;
        };
        Update: {
          campaign_link_id?: string | null;
          created_at?: string | null;
          event_type?: string;
          id?: string;
          initiative_id?: string | null;
          metadata?: Json | null;
          session_id?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "initiative_events_campaign_link_id_fkey";
            columns: ["campaign_link_id"];
            isOneToOne: false;
            referencedRelation: "campaign_links";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "initiative_events_initiative_id_fkey";
            columns: ["initiative_id"];
            isOneToOne: false;
            referencedRelation: "initiatives";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "initiative_events_initiative_id_fkey";
            columns: ["initiative_id"];
            isOneToOne: false;
            referencedRelation: "public_visible_initiatives";
            referencedColumns: ["id"];
          },
        ];
      };
      initiative_funding_cycles: {
        Row: {
          billing_cycle_id: string;
          closed_at: string | null;
          created_at: string;
          id: string;
          initiative_id: string;
          month: number;
          overflow_amount_mur: number;
          received_amount_mur: number;
          remaining_amount_mur: number;
          status: Database["public"]["Enums"]["funding_cycle_status"];
          supporter_count: number;
          target_amount_mur: number;
          year: number;
        };
        Insert: {
          billing_cycle_id: string;
          closed_at?: string | null;
          created_at?: string;
          id?: string;
          initiative_id: string;
          month: number;
          overflow_amount_mur?: number;
          received_amount_mur?: number;
          remaining_amount_mur?: number;
          status?: Database["public"]["Enums"]["funding_cycle_status"];
          supporter_count?: number;
          target_amount_mur?: number;
          year: number;
        };
        Update: {
          billing_cycle_id?: string;
          closed_at?: string | null;
          created_at?: string;
          id?: string;
          initiative_id?: string;
          month?: number;
          overflow_amount_mur?: number;
          received_amount_mur?: number;
          remaining_amount_mur?: number;
          status?: Database["public"]["Enums"]["funding_cycle_status"];
          supporter_count?: number;
          target_amount_mur?: number;
          year?: number;
        };
        Relationships: [
          {
            foreignKeyName: "initiative_funding_cycles_billing_cycle_id_fkey";
            columns: ["billing_cycle_id"];
            isOneToOne: false;
            referencedRelation: "billing_cycles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "initiative_funding_cycles_initiative_id_fkey";
            columns: ["initiative_id"];
            isOneToOne: false;
            referencedRelation: "initiatives";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "initiative_funding_cycles_initiative_id_fkey";
            columns: ["initiative_id"];
            isOneToOne: false;
            referencedRelation: "public_visible_initiatives";
            referencedColumns: ["id"];
          },
        ];
      };
      initiative_health_scores: {
        Row: {
          calculated_at: string;
          conversion_score: number | null;
          engagement_score: number | null;
          growth_score: number | null;
          health_score: number | null;
          id: string;
          initiative_id: string;
          metadata: Json | null;
          retention_score: number | null;
          revenue_score: number | null;
        };
        Insert: {
          calculated_at?: string;
          conversion_score?: number | null;
          engagement_score?: number | null;
          growth_score?: number | null;
          health_score?: number | null;
          id?: string;
          initiative_id: string;
          metadata?: Json | null;
          retention_score?: number | null;
          revenue_score?: number | null;
        };
        Update: {
          calculated_at?: string;
          conversion_score?: number | null;
          engagement_score?: number | null;
          growth_score?: number | null;
          health_score?: number | null;
          id?: string;
          initiative_id?: string;
          metadata?: Json | null;
          retention_score?: number | null;
          revenue_score?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "initiative_health_scores_initiative_id_fkey";
            columns: ["initiative_id"];
            isOneToOne: false;
            referencedRelation: "initiatives";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "initiative_health_scores_initiative_id_fkey";
            columns: ["initiative_id"];
            isOneToOne: false;
            referencedRelation: "public_visible_initiatives";
            referencedColumns: ["id"];
          },
        ];
      };
      initiative_updates: {
        Row: {
          content: string;
          created_at: string;
          id: string;
          image_url: string | null;
          initiative_id: string;
          title: string;
        };
        Insert: {
          content: string;
          created_at?: string;
          id?: string;
          image_url?: string | null;
          initiative_id: string;
          title: string;
        };
        Update: {
          content?: string;
          created_at?: string;
          id?: string;
          image_url?: string | null;
          initiative_id?: string;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "initiative_updates_initiative_id_fkey";
            columns: ["initiative_id"];
            isOneToOne: false;
            referencedRelation: "initiatives";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "initiative_updates_initiative_id_fkey";
            columns: ["initiative_id"];
            isOneToOne: false;
            referencedRelation: "public_visible_initiatives";
            referencedColumns: ["id"];
          },
        ];
      };
      initiative_versions: {
        Row: {
          admin_feedback: string | null;
          category: string | null;
          content: string | null;
          created_at: string;
          created_by: string | null;
          description: string | null;
          expected_outcomes: string | null;
          goal_amount_mur: number | null;
          id: string;
          image_url: string | null;
          impact_pool_target: number | null;
          initiative_id: string;
          long_term_goals: string | null;
          media_url: string | null;
          reviewed_at: string | null;
          reviewed_by: string | null;
          short_term_goals: string | null;
          status: string;
          summary: string | null;
          target_milestones: string | null;
          title: string | null;
          version_number: number;
        };
        Insert: {
          admin_feedback?: string | null;
          category?: string | null;
          content?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          expected_outcomes?: string | null;
          goal_amount_mur?: number | null;
          id?: string;
          image_url?: string | null;
          impact_pool_target?: number | null;
          initiative_id: string;
          long_term_goals?: string | null;
          media_url?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          short_term_goals?: string | null;
          status?: string;
          summary?: string | null;
          target_milestones?: string | null;
          title?: string | null;
          version_number: number;
        };
        Update: {
          admin_feedback?: string | null;
          category?: string | null;
          content?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          expected_outcomes?: string | null;
          goal_amount_mur?: number | null;
          id?: string;
          image_url?: string | null;
          impact_pool_target?: number | null;
          initiative_id?: string;
          long_term_goals?: string | null;
          media_url?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          short_term_goals?: string | null;
          status?: string;
          summary?: string | null;
          target_milestones?: string | null;
          title?: string | null;
          version_number?: number;
        };
        Relationships: [
          {
            foreignKeyName: "initiative_versions_initiative_id_fkey";
            columns: ["initiative_id"];
            isOneToOne: false;
            referencedRelation: "initiatives";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "initiative_versions_initiative_id_fkey";
            columns: ["initiative_id"];
            isOneToOne: false;
            referencedRelation: "public_visible_initiatives";
            referencedColumns: ["id"];
          },
        ];
      };
      initiatives: {
        Row: {
          active_supporter_count: number | null;
          cap_amount_mur: number | null;
          caption: string | null;
          category: string | null;
          content: string | null;
          conversion_count: number | null;
          created_at: string;
          creator_role: Database["public"]["Enums"]["app_role"] | null;
          creator_user_id: string | null;
          current_amount_mur: number | null;
          description: string | null;
          expected_outcomes: string | null;
          gallery_urls: string[] | null;
          goal_amount_mur: number | null;
          id: string;
          image_url: string | null;
          impact_pool_allocation: number | null;
          impact_pool_current: number | null;
          impact_pool_progress: number | null;
          impact_pool_target: number | null;
          inactive_supporter_count: number | null;
          initiative_source: string | null;
          is_approved: boolean;
          is_featured: boolean | null;
          is_impact_pool: boolean | null;
          is_published: boolean;
          is_system_owned: boolean | null;
          is_unlimited: boolean | null;
          is_urgent: boolean | null;
          long_term_goals: string | null;
          media_url: string | null;
          monthly_target_mur: number | null;
          organization_id: string | null;
          short_term_goals: string | null;
          slug: string;
          status: string | null;
          summary: string | null;
          target_milestones: string | null;
          title: string;
          updated_at: string | null;
          view_count: number | null;
        };
        Insert: {
          active_supporter_count?: number | null;
          cap_amount_mur?: number | null;
          caption?: string | null;
          category?: string | null;
          content?: string | null;
          conversion_count?: number | null;
          created_at?: string;
          creator_role?: Database["public"]["Enums"]["app_role"] | null;
          creator_user_id?: string | null;
          current_amount_mur?: number | null;
          description?: string | null;
          expected_outcomes?: string | null;
          gallery_urls?: string[] | null;
          goal_amount_mur?: number | null;
          id?: string;
          image_url?: string | null;
          impact_pool_allocation?: number | null;
          impact_pool_current?: number | null;
          impact_pool_progress?: number | null;
          impact_pool_target?: number | null;
          inactive_supporter_count?: number | null;
          initiative_source?: string | null;
          is_approved?: boolean;
          is_featured?: boolean | null;
          is_impact_pool?: boolean | null;
          is_published?: boolean;
          is_system_owned?: boolean | null;
          is_unlimited?: boolean | null;
          is_urgent?: boolean | null;
          long_term_goals?: string | null;
          media_url?: string | null;
          monthly_target_mur?: number | null;
          organization_id?: string | null;
          short_term_goals?: string | null;
          slug: string;
          status?: string | null;
          summary?: string | null;
          target_milestones?: string | null;
          title: string;
          updated_at?: string | null;
          view_count?: number | null;
        };
        Update: {
          active_supporter_count?: number | null;
          cap_amount_mur?: number | null;
          caption?: string | null;
          category?: string | null;
          content?: string | null;
          conversion_count?: number | null;
          created_at?: string;
          creator_role?: Database["public"]["Enums"]["app_role"] | null;
          creator_user_id?: string | null;
          current_amount_mur?: number | null;
          description?: string | null;
          expected_outcomes?: string | null;
          gallery_urls?: string[] | null;
          goal_amount_mur?: number | null;
          id?: string;
          image_url?: string | null;
          impact_pool_allocation?: number | null;
          impact_pool_current?: number | null;
          impact_pool_progress?: number | null;
          impact_pool_target?: number | null;
          inactive_supporter_count?: number | null;
          initiative_source?: string | null;
          is_approved?: boolean;
          is_featured?: boolean | null;
          is_impact_pool?: boolean | null;
          is_published?: boolean;
          is_system_owned?: boolean | null;
          is_unlimited?: boolean | null;
          is_urgent?: boolean | null;
          long_term_goals?: string | null;
          media_url?: string | null;
          monthly_target_mur?: number | null;
          organization_id?: string | null;
          short_term_goals?: string | null;
          slug?: string;
          status?: string | null;
          summary?: string | null;
          target_milestones?: string | null;
          title?: string;
          updated_at?: string | null;
          view_count?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "initiatives_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      lead_status_history: {
        Row: {
          changed_at: string | null;
          changed_by: string | null;
          id: string;
          lead_id: string;
          new_status: string;
          old_status: string | null;
        };
        Insert: {
          changed_at?: string | null;
          changed_by?: string | null;
          id?: string;
          lead_id: string;
          new_status: string;
          old_status?: string | null;
        };
        Update: {
          changed_at?: string | null;
          changed_by?: string | null;
          id?: string;
          lead_id?: string | null;
          new_status?: string;
          old_status?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "lead_status_history_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
        ];
      };
      leads: {
        Row: {
          acquisition_channel: string | null;
          amount_mur: number;
          campaign_id: string | null;
          campaign_link_id: string | null;
          converted_at: string | null;
          covers_fees: boolean;
          created_at: string;
          email: string;
          first_seen_at: string | null;
          full_name: string;
          id: string;
          last_activity_at: string | null;
          lead_stage: string | null;
          metadata: Json | null;
          notes: string | null;
          phone: string | null;
          source_initiative_id: string | null;
          status: string;
          utm_parameters: Json | null;
        };
        Insert: {
          acquisition_channel?: string | null;
          amount_mur: number;
          campaign_id?: string | null;
          campaign_link_id?: string | null;
          converted_at?: string | null;
          covers_fees?: boolean;
          created_at?: string;
          email: string;
          first_seen_at?: string | null;
          full_name: string;
          id?: string;
          last_activity_at?: string | null;
          lead_stage?: string | null;
          metadata?: Json | null;
          notes?: string | null;
          phone?: string | null;
          source_initiative_id?: string | null;
          status?: string;
          utm_parameters?: Json | null;
        };
        Update: {
          acquisition_channel?: string | null;
          amount_mur?: number;
          campaign_id?: string | null;
          campaign_link_id?: string | null;
          converted_at?: string | null;
          covers_fees?: boolean;
          created_at?: string;
          email?: string;
          first_seen_at?: string | null;
          full_name?: string;
          id?: string;
          last_activity_at?: string | null;
          lead_stage?: string | null;
          metadata?: Json | null;
          notes?: string | null;
          phone?: string | null;
          source_initiative_id?: string | null;
          status?: string;
          utm_parameters?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: "leads_campaign_link_id_fkey";
            columns: ["campaign_link_id"];
            isOneToOne: false;
            referencedRelation: "campaign_links";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "leads_source_initiative_id_fkey";
            columns: ["source_initiative_id"];
            isOneToOne: false;
            referencedRelation: "initiatives";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "leads_source_initiative_id_fkey";
            columns: ["source_initiative_id"];
            isOneToOne: false;
            referencedRelation: "public_visible_initiatives";
            referencedColumns: ["id"];
          },
        ];
      };
      member_preferences: {
        Row: {
          created_at: string;
          distribution_percentage: number | null;
          id: string;
          initiative_id: string;
          organization_id: string | null;
          priority_level: number | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          distribution_percentage?: number | null;
          id?: string;
          initiative_id: string;
          organization_id?: string | null;
          priority_level?: number | null;
          user_id: string;
        };
        Update: {
          created_at?: string;
          distribution_percentage?: number | null;
          id?: string;
          initiative_id?: string;
          organization_id?: string | null;
          priority_level?: number | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "member_preferences_initiative_id_fkey";
            columns: ["initiative_id"];
            isOneToOne: false;
            referencedRelation: "initiatives";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "member_preferences_initiative_id_fkey";
            columns: ["initiative_id"];
            isOneToOne: false;
            referencedRelation: "public_visible_initiatives";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "member_preferences_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      notifications: {
        Row: {
          actor_id: string | null;
          bundle_count: number;
          created_at: string;
          entity_id: string;
          id: string;
          metadata: Json | null;
          read: boolean;
          read_at: string | null;
          type: string;
          user_id: string;
        };
        Insert: {
          actor_id?: string | null;
          bundle_count?: number;
          created_at?: string;
          entity_id: string;
          id?: string;
          metadata?: Json | null;
          read?: boolean;
          read_at?: string | null;
          type: string;
          user_id: string;
        };
        Update: {
          actor_id?: string | null;
          bundle_count?: number;
          created_at?: string;
          entity_id?: string;
          id?: string;
          metadata?: Json | null;
          read?: boolean;
          read_at?: string | null;
          type?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_actor_id_fkey";
            columns: ["actor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notifications_actor_id_fkey";
            columns: ["actor_id"];
            isOneToOne: false;
            referencedRelation: "supporter_retention_stats";
            referencedColumns: ["profile_id"];
          },
          {
            foreignKeyName: "notifications_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notifications_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "supporter_retention_stats";
            referencedColumns: ["profile_id"];
          },
        ];
      };
      organization_documents: {
        Row: {
          created_at: string;
          document_type: string | null;
          file_url: string;
          id: string;
          organization_id: string;
          title: string;
        };
        Insert: {
          created_at?: string;
          document_type?: string | null;
          file_url: string;
          id?: string;
          organization_id: string;
          title: string;
        };
        Update: {
          created_at?: string;
          document_type?: string | null;
          file_url?: string;
          id?: string;
          organization_id?: string;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "organization_documents_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      organizations: {
        Row: {
          address: string | null;
          allocation_summary: string | null;
          category: string | null;
          contact_email: string | null;
          contact_info: string | null;
          contact_phone: string | null;
          conversion_source: string | null;
          created_at: string;
          created_by_admin_id: string | null;
          current_collected_amount: number | null;
          description: string | null;
          expected_outcomes: string | null;
          goals: string | null;
          id: string;
          impact_metrics: string | null;
          is_verified: boolean;
          logo_url: string | null;
          milestones: string | null;
          mission: string | null;
          monthly_target_amount: number | null;
          organization_name: string;
          owner_user_id: string | null;
          status: string | null;
          supporters_count: number | null;
          transparency_content: string | null;
          updates_feed_enabled: boolean | null;
          website_url: string | null;
        };
        Insert: {
          address?: string | null;
          allocation_summary?: string | null;
          category?: string | null;
          contact_email?: string | null;
          contact_info?: string | null;
          contact_phone?: string | null;
          conversion_source?: string | null;
          created_at?: string;
          created_by_admin_id?: string | null;
          current_collected_amount?: number | null;
          description?: string | null;
          expected_outcomes?: string | null;
          goals?: string | null;
          id?: string;
          impact_metrics?: string | null;
          is_verified?: boolean;
          logo_url?: string | null;
          milestones?: string | null;
          mission?: string | null;
          monthly_target_amount?: number | null;
          organization_name: string;
          owner_user_id?: string | null;
          status?: string | null;
          supporters_count?: number | null;
          transparency_content?: string | null;
          updates_feed_enabled?: boolean | null;
          website_url?: string | null;
        };
        Update: {
          address?: string | null;
          allocation_summary?: string | null;
          category?: string | null;
          contact_email?: string | null;
          contact_info?: string | null;
          contact_phone?: string | null;
          conversion_source?: string | null;
          created_at?: string;
          created_by_admin_id?: string | null;
          current_collected_amount?: number | null;
          description?: string | null;
          expected_outcomes?: string | null;
          goals?: string | null;
          id?: string;
          impact_metrics?: string | null;
          is_verified?: boolean;
          logo_url?: string | null;
          milestones?: string | null;
          mission?: string | null;
          monthly_target_amount?: number | null;
          organization_name?: string;
          owner_user_id?: string | null;
          status?: string | null;
          supporters_count?: number | null;
          transparency_content?: string | null;
          updates_feed_enabled?: boolean | null;
          website_url?: string | null;
        };
        Relationships: [];
      };
      partner_application_activity: {
        Row: {
          action: string;
          actor_id: string | null;
          application_id: string;
          created_at: string;
          id: string;
          metadata: Json | null;
          new_status: Database["public"]["Enums"]["partner_application_status"] | null;
          previous_status: Database["public"]["Enums"]["partner_application_status"] | null;
        };
        Insert: {
          action: string;
          actor_id?: string | null;
          application_id: string;
          created_at?: string;
          id?: string;
          metadata?: Json | null;
          new_status?: Database["public"]["Enums"]["partner_application_status"] | null;
          previous_status?: Database["public"]["Enums"]["partner_application_status"] | null;
        };
        Update: {
          action?: string;
          actor_id?: string | null;
          application_id?: string;
          created_at?: string;
          id?: string;
          metadata?: Json | null;
          new_status?: Database["public"]["Enums"]["partner_application_status"] | null;
          previous_status?: Database["public"]["Enums"]["partner_application_status"] | null;
        };
        Relationships: [
          {
            foreignKeyName: "partner_application_activity_actor_id_fkey";
            columns: ["actor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "partner_application_activity_actor_id_fkey";
            columns: ["actor_id"];
            isOneToOne: false;
            referencedRelation: "supporter_retention_stats";
            referencedColumns: ["profile_id"];
          },
          {
            foreignKeyName: "partner_application_activity_application_id_fkey";
            columns: ["application_id"];
            isOneToOne: false;
            referencedRelation: "partner_applications";
            referencedColumns: ["id"];
          },
        ];
      };
      partner_applications: {
        Row: {
          admin_notes: string | null;
          contact_name: string | null;
          converted_at: string | null;
          converted_by: string | null;
          converted_organization_id: string | null;
          created_at: string;
          deleted_at: string | null;
          email: string;
          id: string;
          is_deleted: boolean | null;
          message: string;
          metadata: Json | null;
          organization_name: string;
          organization_type: string;
          phone: string | null;
          registration_number: string;
          reviewed_at: string | null;
          reviewed_by: string | null;
          status: Database["public"]["Enums"]["partner_application_status"];
          updated_at: string;
          website: string | null;
        };
        Insert: {
          admin_notes?: string | null;
          contact_name?: string | null;
          converted_at?: string | null;
          converted_by?: string | null;
          converted_organization_id?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          email: string;
          id?: string;
          is_deleted?: boolean | null;
          message: string;
          metadata?: Json | null;
          organization_name: string;
          organization_type: string;
          phone?: string | null;
          registration_number: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          status?: Database["public"]["Enums"]["partner_application_status"];
          updated_at?: string;
          website?: string | null;
        };
        Update: {
          admin_notes?: string | null;
          contact_name?: string | null;
          converted_at?: string | null;
          converted_by?: string | null;
          converted_organization_id?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          email?: string;
          id?: string;
          is_deleted?: boolean | null;
          message?: string;
          metadata?: Json | null;
          organization_name?: string;
          organization_type?: string;
          phone?: string | null;
          registration_number?: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          status?: Database["public"]["Enums"]["partner_application_status"];
          updated_at?: string;
          website?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "partner_applications_converted_by_fkey";
            columns: ["converted_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "partner_applications_converted_by_fkey";
            columns: ["converted_by"];
            isOneToOne: false;
            referencedRelation: "supporter_retention_stats";
            referencedColumns: ["profile_id"];
          },
          {
            foreignKeyName: "partner_applications_converted_organization_id_fkey";
            columns: ["converted_organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      payment_events: {
        Row: {
          created_at: string | null;
          event_type: string;
          id: string;
          processed_at: string | null;
          processing_status: string | null;
          provider: string;
          provider_event_id: string;
          raw_payload: Json;
          retries: number | null;
        };
        Insert: {
          created_at?: string | null;
          event_type: string;
          id?: string;
          processed_at?: string | null;
          processing_status?: string | null;
          provider: string;
          provider_event_id: string;
          raw_payload: Json;
          retries?: number | null;
        };
        Update: {
          created_at?: string | null;
          event_type?: string;
          id?: string;
          processed_at?: string | null;
          processing_status?: string | null;
          provider?: string;
          provider_event_id?: string;
          raw_payload?: Json;
          retries?: number | null;
        };
        Relationships: [];
      };
      payments: {
        Row: {
          amount_mur: number;
          created_at: string;
          currency: string | null;
          failure_reason: string | null;
          fees_covered_amount_mur: number | null;
          gateway_response: Json | null;
          id: string;
          paid_at: string | null;
          peach_payment_id: string | null;
          processor_response: Json | null;
          receipt_sent: boolean | null;
          reconciliation_status: string | null;
          retry_count: number;
          status: Database["public"]["Enums"]["payment_status"];
          subscription_id: string | null;
          user_id: string;
          webhook_event_id: string | null;
        };
        Insert: {
          amount_mur: number;
          created_at?: string;
          currency?: string | null;
          failure_reason?: string | null;
          fees_covered_amount_mur?: number | null;
          gateway_response?: Json | null;
          id?: string;
          paid_at?: string | null;
          peach_payment_id?: string | null;
          processor_response?: Json | null;
          receipt_sent?: boolean | null;
          reconciliation_status?: string | null;
          retry_count?: number;
          status?: Database["public"]["Enums"]["payment_status"];
          subscription_id?: string | null;
          user_id: string;
          webhook_event_id?: string | null;
        };
        Update: {
          amount_mur?: number;
          created_at?: string;
          currency?: string | null;
          failure_reason?: string | null;
          fees_covered_amount_mur?: number | null;
          gateway_response?: Json | null;
          id?: string;
          paid_at?: string | null;
          peach_payment_id?: string | null;
          processor_response?: Json | null;
          receipt_sent?: boolean | null;
          reconciliation_status?: string | null;
          retry_count?: number;
          status?: Database["public"]["Enums"]["payment_status"];
          subscription_id?: string | null;
          user_id?: string;
          webhook_event_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "payments_subscription_id_fkey";
            columns: ["subscription_id"];
            isOneToOne: false;
            referencedRelation: "subscriptions";
            referencedColumns: ["id"];
          },
        ];
      };
      payouts: {
        Row: {
          amount_mur: number;
          created_at: string;
          id: string;
          organization_id: string;
          paid_date: string | null;
          reference: string | null;
          scheduled_date: string | null;
          status: Database["public"]["Enums"]["payout_status"];
        };
        Insert: {
          amount_mur: number;
          created_at?: string;
          id?: string;
          organization_id: string;
          paid_date?: string | null;
          reference?: string | null;
          scheduled_date?: string | null;
          status?: Database["public"]["Enums"]["payout_status"];
        };
        Update: {
          amount_mur?: number;
          created_at?: string;
          id?: string;
          organization_id?: string;
          paid_date?: string | null;
          reference?: string | null;
          scheduled_date?: string | null;
          status?: Database["public"]["Enums"]["payout_status"];
        };
        Relationships: [
          {
            foreignKeyName: "payouts_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      post_comments: {
        Row: {
          content: string;
          created_at: string;
          deleted_at: string | null;
          id: string;
          is_deleted: boolean | null;
          parent_comment_id: string | null;
          post_id: string;
          user_id: string;
        };
        Insert: {
          content: string;
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          is_deleted?: boolean | null;
          parent_comment_id?: string | null;
          post_id: string;
          user_id: string;
        };
        Update: {
          content?: string;
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          is_deleted?: boolean | null;
          parent_comment_id?: string | null;
          post_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "post_comments_parent_comment_id_fkey";
            columns: ["parent_comment_id"];
            isOneToOne: false;
            referencedRelation: "post_comments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "post_comments_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "community_posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "post_comments_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "post_comments_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "supporter_retention_stats";
            referencedColumns: ["profile_id"];
          },
        ];
      };
      post_reactions: {
        Row: {
          created_at: string;
          id: string;
          post_id: string;
          reaction_type: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          post_id: string;
          reaction_type: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          post_id?: string;
          reaction_type?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "post_reactions_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "community_posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "post_reactions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "post_reactions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "supporter_retention_stats";
            referencedColumns: ["profile_id"];
          },
        ];
      };
      profiles: {
        Row: {
          address: string | null;
          age: number | null;
          avatar_url: string | null;
          bio: string | null;
          country: string | null;
          created_at: string;
          email: string | null;
          full_name: string | null;
          id: string;
          last_engagement_at: string | null;
          lifecycle_stage: string | null;
          organization_id: string | null;
          phone: string | null;
          primary_initiative_id: string | null;
          source_initiative_id: string | null;
          status: string | null;
          updated_at: string;
        };
        Insert: {
          address?: string | null;
          age?: number | null;
          avatar_url?: string | null;
          bio?: string | null;
          country?: string | null;
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          id: string;
          last_engagement_at?: string | null;
          lifecycle_stage?: string | null;
          organization_id?: string | null;
          phone?: string | null;
          primary_initiative_id?: string | null;
          source_initiative_id?: string | null;
          status?: string | null;
          updated_at?: string;
        };
        Update: {
          address?: string | null;
          age?: number | null;
          avatar_url?: string | null;
          bio?: string | null;
          country?: string | null;
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          id?: string;
          last_engagement_at?: string | null;
          lifecycle_stage?: string | null;
          organization_id?: string | null;
          phone?: string | null;
          primary_initiative_id?: string | null;
          source_initiative_id?: string | null;
          status?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "profiles_primary_initiative_id_fkey";
            columns: ["primary_initiative_id"];
            isOneToOne: false;
            referencedRelation: "initiatives";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "profiles_primary_initiative_id_fkey";
            columns: ["primary_initiative_id"];
            isOneToOne: false;
            referencedRelation: "public_visible_initiatives";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "profiles_source_initiative_id_fkey";
            columns: ["source_initiative_id"];
            isOneToOne: false;
            referencedRelation: "initiatives";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "profiles_source_initiative_id_fkey";
            columns: ["source_initiative_id"];
            isOneToOne: false;
            referencedRelation: "public_visible_initiatives";
            referencedColumns: ["id"];
          },
        ];
      };
      receipts: {
        Row: {
          amount_mur: number;
          created_at: string;
          id: string;
          payment_id: string;
          pdf_url: string | null;
          receipt_number: string;
          user_id: string;
        };
        Insert: {
          amount_mur: number;
          created_at?: string;
          id?: string;
          payment_id: string;
          pdf_url?: string | null;
          receipt_number: string;
          user_id: string;
        };
        Update: {
          amount_mur?: number;
          created_at?: string;
          id?: string;
          payment_id?: string;
          pdf_url?: string | null;
          receipt_number?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "receipts_payment_id_fkey";
            columns: ["payment_id"];
            isOneToOne: false;
            referencedRelation: "payments";
            referencedColumns: ["id"];
          },
        ];
      };
      reports: {
        Row: {
          admin_feedback: string | null;
          created_at: string;
          description: string | null;
          file_url: string;
          id: string;
          initiative_id: string | null;
          organization_id: string;
          report_date: string | null;
          status: string | null;
          title: string;
        };
        Insert: {
          admin_feedback?: string | null;
          created_at?: string;
          description?: string | null;
          file_url: string;
          id?: string;
          initiative_id?: string | null;
          organization_id: string;
          report_date?: string | null;
          status?: string | null;
          title: string;
        };
        Update: {
          admin_feedback?: string | null;
          created_at?: string;
          description?: string | null;
          file_url?: string;
          id?: string;
          initiative_id?: string | null;
          organization_id?: string;
          report_date?: string | null;
          status?: string | null;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reports_initiative_id_fkey";
            columns: ["initiative_id"];
            isOneToOne: false;
            referencedRelation: "initiatives";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reports_initiative_id_fkey";
            columns: ["initiative_id"];
            isOneToOne: false;
            referencedRelation: "public_visible_initiatives";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reports_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      segments: {
        Row: {
          created_at: string | null;
          description: string | null;
          filter_definition: Json;
          id: string;
          name: string;
          organization_id: string | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          description?: string | null;
          filter_definition?: Json;
          id?: string;
          name: string;
          organization_id?: string | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          description?: string | null;
          filter_definition?: Json;
          id?: string;
          name?: string;
          organization_id?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "segments_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      subscriptions: {
        Row: {
          amount_mur: number;
          billing_cycle: string | null;
          covers_fees: boolean | null;
          created_at: string;
          failure_reason: string | null;
          id: string;
          last_retry_at: string | null;
          next_billing_date: string | null;
          organization_id: string | null;
          peach_subscription_id: string | null;
          retry_count: number;
          start_date: string | null;
          status: Database["public"]["Enums"]["subscription_status"];
          updated_at: string;
          user_id: string;
        };
        Insert: {
          amount_mur: number;
          billing_cycle?: string | null;
          covers_fees?: boolean | null;
          created_at?: string;
          failure_reason?: string | null;
          id?: string;
          last_retry_at?: string | null;
          next_billing_date?: string | null;
          organization_id?: string | null;
          peach_subscription_id?: string | null;
          retry_count?: number;
          start_date?: string | null;
          status?: Database["public"]["Enums"]["subscription_status"];
          updated_at?: string;
          user_id: string;
        };
        Update: {
          amount_mur?: number;
          created_at?: string;
          failure_reason?: string | null;
          id?: string;
          last_retry_at?: string | null;
          next_billing_date?: string | null;
          organization_id?: string | null;
          peach_subscription_id?: string | null;
          retry_count?: number;
          start_date?: string | null;
          status?: Database["public"]["Enums"]["subscription_status"];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "subscriptions_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      supporter_engagement_scores: {
        Row: {
          calculated_at: string | null;
          engagement_level: string;
          engagement_score: number;
          id: string;
          score_breakdown: Json | null;
          user_id: string | null;
        };
        Insert: {
          calculated_at?: string | null;
          engagement_level: string;
          engagement_score: number;
          id?: string;
          score_breakdown?: Json | null;
          user_id?: string | null;
        };
        Update: {
          calculated_at?: string | null;
          engagement_level?: string;
          engagement_score?: number;
          id?: string;
          score_breakdown?: Json | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "supporter_engagement_scores_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "supporter_engagement_scores_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "supporter_retention_stats";
            referencedColumns: ["profile_id"];
          },
        ];
      };
      supporter_interests: {
        Row: {
          category: string;
          id: string;
          interest_score: number | null;
          last_updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          category: string;
          id?: string;
          interest_score?: number | null;
          last_updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          category?: string;
          id?: string;
          interest_score?: number | null;
          last_updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "supporter_interests_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "supporter_interests_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "supporter_retention_stats";
            referencedColumns: ["profile_id"];
          },
        ];
      };
      user_roles: {
        Row: {
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
      user_trust: {
        Row: {
          approved_posts: number;
          reputation_score: number;
          user_id: string;
          violations: number;
        };
        Insert: {
          approved_posts?: number;
          reputation_score?: number;
          user_id: string;
          violations?: number;
        };
        Update: {
          approved_posts?: number;
          reputation_score?: number;
          user_id?: string;
          violations?: number;
        };
        Relationships: [
          {
            foreignKeyName: "user_trust_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_trust_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "supporter_retention_stats";
            referencedColumns: ["profile_id"];
          },
        ];
      };
    };
    Views: {
      public_visible_initiatives: {
        Row: {
          active_supporter_count: number | null;
          banner_image_url: string | null;
          category: string | null;
          conversion_count: number | null;
          created_at: string | null;
          current_amount_mur: number | null;
          full_description: string | null;
          gallery_urls: string[] | null;
          goal_amount_mur: number | null;
          id: string | null;
          is_approved: boolean | null;
          is_published: boolean | null;
          organization_id: string | null;
          organization_logo: string | null;
          organization_name: string | null;
          organization_status: string | null;
          short_description: string | null;
          slug: string | null;
          title: string | null;
          updated_at: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "initiatives_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      supporter_retention_stats: {
        Row: {
          active_subscriptions: number | null;
          full_name: string | null;
          last_engagement_at: string | null;
          lifecycle_stage: string | null;
          organization_id: string | null;
          profile_id: string | null;
          retention_status: string | null;
          total_lifetime_contribution: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Functions: {
      activate_membership: { Args: { p_user_id: string }; Returns: undefined };
      aggregate_daily_stats: { Args: { p_date?: string }; Returns: undefined };
      allocate_payment_funds: {
        Args: {
          p_payment_id: string;
          p_total_amount: number;
          p_user_id: string;
        };
        Returns: undefined;
      };
      approve_initiative_version: {
        Args: { p_admin_id: string; p_version_id: string };
        Returns: undefined;
      };
      calculate_initiative_health: {
        Args: { p_initiative_id: string };
        Returns: Json;
      };
      calculate_supporter_engagement_scores: { Args: never; Returns: undefined };
      get_admin_financial_metrics: { Args: never; Returns: Json };
      get_ledger_summary_metrics: { Args: never; Returns: Json };
      get_trending_initiatives: {
        Args: { p_limit?: number };
        Returns: {
          initiative_id: string;
          momentum_score: number;
        }[];
      };
      has_role: {
        Args: { requested_role: Database["public"]["Enums"]["app_role"] };
        Returns: boolean;
      };
      increment_initiative_amount: {
        Args: { increment_by: number; initiative_id: string };
        Returns: undefined;
      };
      mark_abandoned_leads: {
        Args: { p_timeout_hours?: number };
        Returns: number;
      };
      process_recurring_billing: { Args: never; Returns: undefined };
      reconcile_initiative_analytics: {
        Args: { p_initiative_id?: string };
        Returns: undefined;
      };
      snapshot_initiative_health: { Args: never; Returns: undefined };
    };
    Enums: {
      app_role: "admin" | "ngo" | "member" | "organization" | "super_admin";
      fee_type: "percentage" | "fixed" | "hybrid";
      financial_account_type:
        | "platform"
        | "organization_pool"
        | "impact_pool"
        | "fee"
        | "initiative";
      financial_event_type:
        | "payment_received"
        | "transaction_fee"
        | "platform_share"
        | "organization_pool"
        | "allocation"
        | "overflow"
        | "impact_pool"
        | "refund"
        | "subscription_change"
        | "payout"
        | "net_payment"
        | "initiative_allocation"
        | "overflow_transfer";
      funding_cycle_status: "active" | "completed" | "underfunded" | "overflowed";
      partner_application_status:
        | "submitted"
        | "under_review"
        | "contacted"
        | "approved"
        | "rejected"
        | "converted"
        | "archived";
      payment_status: "success" | "failed" | "pending";
      payout_status: "pending" | "processing" | "paid" | "failed";
      subscription_status: "active" | "pending" | "cancelled" | "past_due";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "ngo", "member", "organization", "super_admin"],
      fee_type: ["percentage", "fixed", "hybrid"],
      financial_account_type: ["platform", "organization_pool", "impact_pool", "fee", "initiative"],
      financial_event_type: [
        "payment_received",
        "transaction_fee",
        "platform_share",
        "organization_pool",
        "allocation",
        "overflow",
        "impact_pool",
        "refund",
        "subscription_change",
        "payout",
        "net_payment",
        "initiative_allocation",
        "overflow_transfer",
      ],
      funding_cycle_status: ["active", "completed", "underfunded", "overflowed"],
      partner_application_status: [
        "submitted",
        "under_review",
        "contacted",
        "approved",
        "rejected",
        "converted",
        "archived",
      ],
      payment_status: ["success", "failed", "pending"],
      payout_status: ["pending", "processing", "paid", "failed"],
      subscription_status: ["active", "pending", "cancelled", "past_due"],
    },
  },
} as const;
