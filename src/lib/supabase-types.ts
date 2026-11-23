// Types for the project's own Supabase (Lockcopy).
// Maintained by hand from db/0001_schema.sql + db/0004_portal.sql,
// because this project uses an external Supabase without the type generator.

export type AppPlan = "teste" | "solo" | "agency";
export type OrgRole = "owner" | "member";
export type RequestStatus = "draft" | "sent" | "in_progress" | "completed" | "archived";
export type FieldType = "text" | "textarea" | "image" | "file" | "select";
export type SubmissionStatus = "pending" | "submitted" | "approved" | "rejected";
export type FileStatus = "ready" | "rejected";
export type ImageStatus = "none" | "pending" | "processing" | "done" | "failed";
export type NotificationStatus = "queued" | "processing" | "sent" | "failed" | "cancelled";
export type NotificationChannel = "email" | "sms" | "in_app";
export type SubscriptionStatus = "trialing" | "active" | "past_due" | "canceled" | "incomplete";
export type DeletionStatus = "scheduled" | "running" | "done" | "failed";
export type ActorKind = "agency" | "client" | "system";

export type Json = string | number | boolean | null | Json[] | { [k: string]: Json };

type Table<Row> = {
  Row: Row;
  Insert: Partial<Row>;
  Update: Partial<Row>;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      plan_limits: Table<{
        plan: AppPlan;
        requests_limit: number;
        users_limit: number;
        storage_bytes: number;
        price_month_usd: number;
        price_year_usd: number;
        trial_days: number;
      }>;
      organizations: Table<{
        id: string;
        name: string;
        slug: string;
        logo_url: string | null;
        brand_color: string | null;
        plan: AppPlan;
        subscription_status: SubscriptionStatus;
        stripe_customer_id: string | null;
        stripe_subscription_id: string | null;
        trial_ends_at: string | null;
        current_period_ends_at: string | null;
        grace_period_ends_at: string | null;
        storage_used_bytes: number;
        created_at: string;
        updated_at: string;
      }>;
      org_members: Table<{
        id: string;
        org_id: string;
        user_id: string;
        role: OrgRole;
        notify_instant: boolean;
        notify_daily_digest: boolean;
        created_at: string;
      }>;
      templates: Table<{
        id: string;
        slug: string;
        name: string;
        description: string | null;
        is_active: boolean;
        created_at: string;
      }>;
      template_sections: Table<{
        id: string;
        template_id: string;
        title: string;
        description: string | null;
        order_index: number;
      }>;
      template_fields: Table<{
        id: string;
        section_id: string;
        label: string;
        help_text: string | null;
        field_type: FieldType;
        is_required: boolean;
        char_limit: number | null;
        allowed_mime: string[] | null;
        order_index: number;
      }>;
      requests: Table<{
        id: string;
        org_id: string;
        title: string;
        client_name: string;
        client_email: string;
        client_phone: string | null;
        status: RequestStatus;
        token: string;
        password_hash: string | null;
        due_date: string | null;
        expires_at: string;
        revoked_at: string | null;
        created_at: string;
        updated_at: string;
      }>;
      sections: Table<{
        id: string;
        request_id: string;
        title: string;
        description: string | null;
        order_index: number;
      }>;
      fields: Table<{
        id: string;
        section_id: string;
        label: string;
        help_text: string | null;
        field_type: FieldType;
        is_required: boolean;
        char_limit: number | null;
        allowed_mime: string[] | null;
        order_index: number;
      }>;
      submissions: Table<{
        id: string;
        field_id: string;
        request_id: string;
        org_id: string;
        value_text: string;
        status: SubmissionStatus;
        rejection_note: string | null;
        version: number;
        updated_by: ActorKind;
        created_at: string;
        updated_at: string;
      }>;
      submission_files: Table<{
        id: string;
        org_id: string;
        request_id: string;
        field_id: string;
        file_name: string;
        storage_path: string;
        mime_type: string;
        size_bytes: number;
        status: FileStatus;
        image_status: ImageStatus;
        webp_storage_path: string | null;
        image_error: string | null;
        created_at: string;
      }>;
      request_events: Table<{
        id: string;
        request_id: string;
        org_id: string;
        actor: ActorKind;
        actor_user_id: string | null;
        kind: string;
        detail: Json;
        created_at: string;
      }>;
      notifications: Table<{
        id: string;
        org_id: string;
        request_id: string | null;
        channel: NotificationChannel;
        kind: string | null;
        recipient: string;
        subject: string;
        body: string;
        status: NotificationStatus;
        attempts: number;
        last_error: string | null;
        scheduled_for: string;
        sent_at: string | null;
        created_at: string;
      }>;
      subscription_events: Table<{
        id: string;
        org_id: string | null;
        stripe_event_id: string;
        event_type: string;
        payload: Json;
        processed_at: string | null;
        created_at: string;
      }>;
      deletion_jobs: Table<{
        id: string;
        org_id: string;
        request_id: string | null;
        scheduled_for: string;
        reason: string;
        status: DeletionStatus;
        detail: Json;
        completed_at: string | null;
        created_at: string;
      }>;
    };
    Views: Record<string, never>;
    Functions: {
      portal_load: { Args: { _token: string }; Returns: Json };
      portal_save: { Args: { _token: string; _field: string; _text: string }; Returns: Json };
      portal_register_file: {
        Args: {
          _token: string;
          _field: string;
          _path: string;
          _name: string;
          _mime: string;
          _size: number;
        };
        Returns: Json;
      };
      portal_upload_prefix: { Args: { _token: string; _field: string }; Returns: string };
      create_request_from_template: {
        Args: {
          _org: string;
          _template: string;
          _title: string;
          _client_name: string;
          _client_email: string;
          _client_phone?: string | null;
          _due_date?: string | null;
          _expires_at?: string;
        };
        Returns: Json;
      };
      review_field: {
        Args: { _field: string; _decision: string; _note?: string | null };
        Returns: Json;
      };
      set_request_link: { Args: { _request: string; _revoke: boolean }; Returns: Json };
      send_reminder: { Args: { _request: string }; Returns: Json };
      apply_subscription: {
        Args: {
          _org: string;
          _sub_id?: string | null;
          _status?: SubscriptionStatus | null;
          _plan?: AppPlan | null;
          _trial_ends?: string | null;
          _period_ends?: string | null;
          _grace_ends?: string | null;
          _customer_id?: string | null;
        };
        Returns: undefined;
      };
      start_trial: { Args: { _org: string; _plan: AppPlan }; Returns: undefined };
      portal_attach_webp: {
        Args: { _token: string; _file: string; _webp_path: string };
        Returns: undefined;
      };
      claim_notifications: { Args: { _batch: number }; Returns: Json };
      finish_notification: {
        Args: { _id: string; _ok: boolean; _err?: string | null };
        Returns: undefined;
      };
    };
    Enums: {
      app_plan: AppPlan;
      org_role: OrgRole;
      request_status: RequestStatus;
      field_type: FieldType;
      submission_status: SubmissionStatus;
      file_status: FileStatus;
      image_status: ImageStatus;
      notification_status: NotificationStatus;
      notification_channel: NotificationChannel;
      subscription_status: SubscriptionStatus;
      deletion_status: DeletionStatus;
      actor_kind: ActorKind;
    };
    CompositeTypes: Record<string, never>;
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
