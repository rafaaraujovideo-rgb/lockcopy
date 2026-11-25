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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      deletion_jobs: {
        Row: {
          completed_at: string | null
          created_at: string
          detail: Json
          id: string
          org_id: string
          reason: string
          request_id: string | null
          scheduled_for: string
          status: Database["public"]["Enums"]["deletion_status"]
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          detail?: Json
          id?: string
          org_id: string
          reason?: string
          request_id?: string | null
          scheduled_for: string
          status?: Database["public"]["Enums"]["deletion_status"]
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          detail?: Json
          id?: string
          org_id?: string
          reason?: string
          request_id?: string | null
          scheduled_for?: string
          status?: Database["public"]["Enums"]["deletion_status"]
        }
        Relationships: [
          {
            foreignKeyName: "deletion_jobs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deletion_jobs_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback: {
        Row: {
          created_at: string
          id: string
          kind: string
          message: string
          org_id: string | null
          page: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          message: string
          org_id?: string | null
          page?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          message?: string
          org_id?: string | null
          page?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      fields: {
        Row: {
          allowed_mime: string[] | null
          char_limit: number | null
          field_type: Database["public"]["Enums"]["field_type"]
          help_text: string | null
          id: string
          is_required: boolean
          label: string
          order_index: number
          section_id: string
        }
        Insert: {
          allowed_mime?: string[] | null
          char_limit?: number | null
          field_type?: Database["public"]["Enums"]["field_type"]
          help_text?: string | null
          id?: string
          is_required?: boolean
          label: string
          order_index?: number
          section_id: string
        }
        Update: {
          allowed_mime?: string[] | null
          char_limit?: number | null
          field_type?: Database["public"]["Enums"]["field_type"]
          help_text?: string | null
          id?: string
          is_required?: boolean
          label?: string
          order_index?: number
          section_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fields_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          attempts: number
          body: string
          channel: Database["public"]["Enums"]["notification_channel"]
          created_at: string
          id: string
          kind: string | null
          last_error: string | null
          org_id: string
          recipient: string
          request_id: string | null
          scheduled_for: string
          sent_at: string | null
          status: Database["public"]["Enums"]["notification_status"]
          subject: string
        }
        Insert: {
          attempts?: number
          body?: string
          channel?: Database["public"]["Enums"]["notification_channel"]
          created_at?: string
          id?: string
          kind?: string | null
          last_error?: string | null
          org_id: string
          recipient: string
          request_id?: string | null
          scheduled_for?: string
          sent_at?: string | null
          status?: Database["public"]["Enums"]["notification_status"]
          subject: string
        }
        Update: {
          attempts?: number
          body?: string
          channel?: Database["public"]["Enums"]["notification_channel"]
          created_at?: string
          id?: string
          kind?: string | null
          last_error?: string | null
          org_id?: string
          recipient?: string
          request_id?: string | null
          scheduled_for?: string
          sent_at?: string | null
          status?: Database["public"]["Enums"]["notification_status"]
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      org_invites: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          org_id: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          org_id: string
          token?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          org_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_invites_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      org_members: {
        Row: {
          created_at: string
          id: string
          notify_daily_digest: boolean
          notify_instant: boolean
          org_id: string
          role: Database["public"]["Enums"]["org_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notify_daily_digest?: boolean
          notify_instant?: boolean
          org_id: string
          role?: Database["public"]["Enums"]["org_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notify_daily_digest?: boolean
          notify_instant?: boolean
          org_id?: string
          role?: Database["public"]["Enums"]["org_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_members_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          brand_color: string | null
          created_at: string
          current_period_ends_at: string | null
          grace_period_ends_at: string | null
          id: string
          logo_url: string | null
          name: string
          plan: Database["public"]["Enums"]["app_plan"]
          slug: string
          storage_used_bytes: number
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_status: Database["public"]["Enums"]["subscription_status"]
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          brand_color?: string | null
          created_at?: string
          current_period_ends_at?: string | null
          grace_period_ends_at?: string | null
          id?: string
          logo_url?: string | null
          name: string
          plan?: Database["public"]["Enums"]["app_plan"]
          slug: string
          storage_used_bytes?: number
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: Database["public"]["Enums"]["subscription_status"]
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          brand_color?: string | null
          created_at?: string
          current_period_ends_at?: string | null
          grace_period_ends_at?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          plan?: Database["public"]["Enums"]["app_plan"]
          slug?: string
          storage_used_bytes?: number
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: Database["public"]["Enums"]["subscription_status"]
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      plan_limits: {
        Row: {
          plan: Database["public"]["Enums"]["app_plan"]
          price_month_usd: number
          price_year_usd: number
          requests_limit: number
          storage_bytes: number
          trial_days: number
          users_limit: number
        }
        Insert: {
          plan: Database["public"]["Enums"]["app_plan"]
          price_month_usd: number
          price_year_usd: number
          requests_limit: number
          storage_bytes: number
          trial_days?: number
          users_limit: number
        }
        Update: {
          plan?: Database["public"]["Enums"]["app_plan"]
          price_month_usd?: number
          price_year_usd?: number
          requests_limit?: number
          storage_bytes?: number
          trial_days?: number
          users_limit?: number
        }
        Relationships: []
      }
      request_events: {
        Row: {
          actor: Database["public"]["Enums"]["actor_kind"]
          actor_user_id: string | null
          created_at: string
          detail: Json
          id: string
          kind: string
          org_id: string
          request_id: string
        }
        Insert: {
          actor: Database["public"]["Enums"]["actor_kind"]
          actor_user_id?: string | null
          created_at?: string
          detail?: Json
          id?: string
          kind: string
          org_id: string
          request_id: string
        }
        Update: {
          actor?: Database["public"]["Enums"]["actor_kind"]
          actor_user_id?: string | null
          created_at?: string
          detail?: Json
          id?: string
          kind?: string
          org_id?: string
          request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "request_events_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_events_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      requests: {
        Row: {
          client_email: string
          client_name: string
          client_phone: string | null
          created_at: string
          due_date: string | null
          expires_at: string
          id: string
          org_id: string
          password_hash: string | null
          revoked_at: string | null
          status: Database["public"]["Enums"]["request_status"]
          title: string
          token: string
          updated_at: string
        }
        Insert: {
          client_email: string
          client_name: string
          client_phone?: string | null
          created_at?: string
          due_date?: string | null
          expires_at?: string
          id?: string
          org_id: string
          password_hash?: string | null
          revoked_at?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          title: string
          token?: string
          updated_at?: string
        }
        Update: {
          client_email?: string
          client_name?: string
          client_phone?: string | null
          created_at?: string
          due_date?: string | null
          expires_at?: string
          id?: string
          org_id?: string
          password_hash?: string | null
          revoked_at?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          title?: string
          token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "requests_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      sections: {
        Row: {
          description: string | null
          id: string
          order_index: number
          request_id: string
          title: string
        }
        Insert: {
          description?: string | null
          id?: string
          order_index?: number
          request_id: string
          title: string
        }
        Update: {
          description?: string | null
          id?: string
          order_index?: number
          request_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "sections_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      submission_files: {
        Row: {
          created_at: string
          field_id: string
          file_name: string
          id: string
          image_error: string | null
          image_status: Database["public"]["Enums"]["image_status"]
          mime_type: string
          org_id: string
          request_id: string
          size_bytes: number
          status: Database["public"]["Enums"]["file_status"]
          storage_path: string
          webp_storage_path: string | null
        }
        Insert: {
          created_at?: string
          field_id: string
          file_name: string
          id?: string
          image_error?: string | null
          image_status?: Database["public"]["Enums"]["image_status"]
          mime_type: string
          org_id: string
          request_id: string
          size_bytes: number
          status?: Database["public"]["Enums"]["file_status"]
          storage_path: string
          webp_storage_path?: string | null
        }
        Update: {
          created_at?: string
          field_id?: string
          file_name?: string
          id?: string
          image_error?: string | null
          image_status?: Database["public"]["Enums"]["image_status"]
          mime_type?: string
          org_id?: string
          request_id?: string
          size_bytes?: number
          status?: Database["public"]["Enums"]["file_status"]
          storage_path?: string
          webp_storage_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "submission_files_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "fields"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submission_files_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submission_files_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      submissions: {
        Row: {
          client_note: string | null
          created_at: string
          field_id: string
          id: string
          org_id: string
          rejection_note: string | null
          request_id: string
          status: Database["public"]["Enums"]["submission_status"]
          updated_at: string
          updated_by: Database["public"]["Enums"]["actor_kind"]
          value_text: string
          version: number
        }
        Insert: {
          client_note?: string | null
          created_at?: string
          field_id: string
          id?: string
          org_id: string
          rejection_note?: string | null
          request_id: string
          status?: Database["public"]["Enums"]["submission_status"]
          updated_at?: string
          updated_by?: Database["public"]["Enums"]["actor_kind"]
          value_text?: string
          version?: number
        }
        Update: {
          client_note?: string | null
          created_at?: string
          field_id?: string
          id?: string
          org_id?: string
          rejection_note?: string | null
          request_id?: string
          status?: Database["public"]["Enums"]["submission_status"]
          updated_at?: string
          updated_by?: Database["public"]["Enums"]["actor_kind"]
          value_text?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "submissions_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: true
            referencedRelation: "fields"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          org_id: string | null
          payload: Json
          processed_at: string | null
          stripe_event_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          org_id?: string | null
          payload?: Json
          processed_at?: string | null
          stripe_event_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          org_id?: string | null
          payload?: Json
          processed_at?: string | null
          stripe_event_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_events_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      template_fields: {
        Row: {
          allowed_mime: string[] | null
          char_limit: number | null
          field_type: Database["public"]["Enums"]["field_type"]
          help_text: string | null
          id: string
          is_required: boolean
          label: string
          order_index: number
          section_id: string
        }
        Insert: {
          allowed_mime?: string[] | null
          char_limit?: number | null
          field_type?: Database["public"]["Enums"]["field_type"]
          help_text?: string | null
          id?: string
          is_required?: boolean
          label: string
          order_index?: number
          section_id: string
        }
        Update: {
          allowed_mime?: string[] | null
          char_limit?: number | null
          field_type?: Database["public"]["Enums"]["field_type"]
          help_text?: string | null
          id?: string
          is_required?: boolean
          label?: string
          order_index?: number
          section_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_fields_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "template_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      template_sections: {
        Row: {
          description: string | null
          id: string
          order_index: number
          template_id: string
          title: string
        }
        Insert: {
          description?: string | null
          id?: string
          order_index?: number
          template_id: string
          title: string
        }
        Update: {
          description?: string | null
          id?: string
          order_index?: number
          template_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_sections_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
        ]
      }
      templates: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          org_id: string | null
          slug: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          org_id?: string | null
          slug: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          org_id?: string | null
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "templates_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_invite: { Args: { _token: string }; Returns: string }
      apply_subscription: {
        Args: {
          _customer_id?: string
          _grace_ends?: string
          _org: string
          _period_ends?: string
          _plan?: Database["public"]["Enums"]["app_plan"]
          _status?: Database["public"]["Enums"]["subscription_status"]
          _sub_id?: string
          _trial_ends?: string
        }
        Returns: undefined
      }
      claim_notifications: {
        Args: { _batch?: number }
        Returns: {
          attempts: number
          body: string
          channel: Database["public"]["Enums"]["notification_channel"]
          created_at: string
          id: string
          kind: string | null
          last_error: string | null
          org_id: string
          recipient: string
          request_id: string | null
          scheduled_for: string
          sent_at: string | null
          status: Database["public"]["Enums"]["notification_status"]
          subject: string
        }[]
        SetofOptions: {
          from: "*"
          to: "notifications"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      claim_portal_notifications: {
        Args: { _batch?: number; _token: string }
        Returns: {
          attempts: number
          body: string
          channel: Database["public"]["Enums"]["notification_channel"]
          created_at: string
          id: string
          kind: string | null
          last_error: string | null
          org_id: string
          recipient: string
          request_id: string | null
          scheduled_for: string
          sent_at: string | null
          status: Database["public"]["Enums"]["notification_status"]
          subject: string
        }[]
        SetofOptions: {
          from: "*"
          to: "notifications"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      create_request_from_template: {
        Args: {
          _client_email: string
          _client_name: string
          _client_phone?: string
          _due_date?: string
          _expires_at?: string
          _org: string
          _template: string
          _title: string
        }
        Returns: Json
      }
      delete_org_template: { Args: { _template: string }; Returns: undefined }
      due_images: {
        Args: { _batch?: number }
        Returns: {
          created_at: string
          field_id: string
          file_name: string
          id: string
          image_error: string | null
          image_status: Database["public"]["Enums"]["image_status"]
          mime_type: string
          org_id: string
          request_id: string
          size_bytes: number
          status: Database["public"]["Enums"]["file_status"]
          storage_path: string
          webp_storage_path: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "submission_files"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      due_purges: {
        Args: { _batch?: number }
        Returns: {
          completed_at: string | null
          created_at: string
          detail: Json
          id: string
          org_id: string
          reason: string
          request_id: string | null
          scheduled_for: string
          status: Database["public"]["Enums"]["deletion_status"]
        }[]
        SetofOptions: {
          from: "*"
          to: "deletion_jobs"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      enqueue_notification: {
        Args: {
          _body: string
          _channel: Database["public"]["Enums"]["notification_channel"]
          _kind?: string
          _org: string
          _recipient: string
          _request: string
          _scheduled?: string
          _subject: string
        }
        Returns: string
      }
      finish_notification: {
        Args: { _err?: string; _id: string; _ok: boolean }
        Returns: undefined
      }
      finish_purge: {
        Args: { _err?: string; _id: string; _ok: boolean }
        Returns: undefined
      }
      invite_preview: {
        Args: { _token: string }
        Returns: {
          accepted: boolean
          email: string
          expired: boolean
          org_name: string
        }[]
      }
      is_org_member: { Args: { _org: string }; Returns: boolean }
      list_org_members: {
        Args: { _org: string }
        Returns: {
          created_at: string
          email: string
          role: Database["public"]["Enums"]["org_role"]
          user_id: string
        }[]
      }
      mark_image: {
        Args: {
          _err?: string
          _file: string
          _status: Database["public"]["Enums"]["image_status"]
          _webp_path?: string
        }
        Returns: undefined
      }
      org_can_work: { Args: { _org: string }; Returns: boolean }
      org_from_path: { Args: { _path: string }; Returns: string }
      org_has_role: {
        Args: { _org: string; _role: Database["public"]["Enums"]["org_role"] }
        Returns: boolean
      }
      org_limit: { Args: { _kind: string; _org: string }; Returns: number }
      path_matches_token: { Args: { _path: string }; Returns: boolean }
      portal_attach_webp: {
        Args: { _file: string; _token: string; _webp_path: string }
        Returns: undefined
      }
      portal_load: { Args: { _token: string }; Returns: Json }
      portal_notes: { Args: { _token: string }; Returns: Json }
      portal_register_file: {
        Args: {
          _field: string
          _mime: string
          _name: string
          _path: string
          _size: number
          _token: string
        }
        Returns: Json
      }
      portal_remove_file: {
        Args: { _file: string; _token: string }
        Returns: Json
      }
      portal_save: {
        Args: { _field: string; _text: string; _token: string }
        Returns: Json
      }
      portal_send_to_agency: { Args: { _token: string }; Returns: Json }
      portal_set_note: {
        Args: { _field: string; _note: string; _token: string }
        Returns: Json
      }
      portal_token_active: { Args: { _token: string }; Returns: boolean }
      portal_upload_prefix: {
        Args: { _field: string; _token: string }
        Returns: string
      }
      request_in_org: { Args: { _request: string }; Returns: boolean }
      review_field: {
        Args: { _decision: string; _field: string; _note?: string }
        Returns: Json
      }
      save_org_template: {
        Args: { _name: string; _org: string; _sections: Json }
        Returns: string
      }
      schedule_purge: {
        Args: { _org: string; _reason: string; _when: string }
        Returns: string
      }
      send_reminder: { Args: { _request: string }; Returns: Json }
      set_request_link: {
        Args: { _request: string; _revoke: boolean }
        Returns: Json
      }
      start_trial: {
        Args: { _org: string; _plan: Database["public"]["Enums"]["app_plan"] }
        Returns: undefined
      }
      token_from_path: { Args: { _path: string }; Returns: string }
    }
    Enums: {
      actor_kind: "agency" | "client" | "system"
      app_plan: "teste" | "solo" | "agency"
      deletion_status: "scheduled" | "running" | "done" | "failed"
      field_type: "text" | "textarea" | "image" | "file" | "select"
      file_status: "ready" | "rejected"
      image_status: "none" | "pending" | "processing" | "done" | "failed"
      notification_channel: "email" | "sms" | "in_app"
      notification_status:
        | "queued"
        | "processing"
        | "sent"
        | "failed"
        | "cancelled"
      org_role: "owner" | "member"
      request_status:
        | "draft"
        | "sent"
        | "in_progress"
        | "completed"
        | "archived"
      submission_status: "pending" | "submitted" | "approved" | "rejected"
      subscription_status:
        | "trialing"
        | "active"
        | "past_due"
        | "canceled"
        | "incomplete"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      actor_kind: ["agency", "client", "system"],
      app_plan: ["teste", "solo", "agency"],
      deletion_status: ["scheduled", "running", "done", "failed"],
      field_type: ["text", "textarea", "image", "file", "select"],
      file_status: ["ready", "rejected"],
      image_status: ["none", "pending", "processing", "done", "failed"],
      notification_channel: ["email", "sms", "in_app"],
      notification_status: [
        "queued",
        "processing",
        "sent",
        "failed",
        "cancelled",
      ],
      org_role: ["owner", "member"],
      request_status: ["draft", "sent", "in_progress", "completed", "archived"],
      submission_status: ["pending", "submitted", "approved", "rejected"],
      subscription_status: [
        "trialing",
        "active",
        "past_due",
        "canceled",
        "incomplete",
      ],
    },
  },
} as const
