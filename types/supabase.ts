/**
 * Supabase Database types — manually maintained until you run:
 *   pnpm supabase gen types typescript --project-id <ref>
 *
 * Each Table must include Relationships to satisfy GenericTable constraint
 * in @supabase/supabase-js.
 */

export interface Database {
  public: {
    Views: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;

    Tables: {
      tenants: {
        Row: {
          id: string;          // Clerk org_id (text, not uuid)
          name: string;
          slug: string;
          plan: string;
          settings: Record<string, unknown>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;          // required — must be Clerk org_id
          name: string;
          slug: string;
          plan?: string;
          settings?: Record<string, unknown>;
        };
        Update: {
          name?: string;
          slug?: string;
          plan?: string;
          settings?: Record<string, unknown>;
        };
        Relationships: [];
      };

      chat_sessions: {
        Row: {
          id: string;
          tenant_id: string;
          visitor_id: string;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          visitor_id: string;
          status?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          visitor_id?: string;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "chat_sessions_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };

      chat_messages: {
        Row: {
          id: string;
          session_id: string;
          tenant_id: string;
          role: "user" | "assistant" | "system";
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          tenant_id: string;
          role: "user" | "assistant" | "system";
          content: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          tenant_id?: string;
          role?: "user" | "assistant" | "system";
          content?: string;
        };
        Relationships: [
          {
            foreignKeyName: "chat_messages_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "chat_sessions";
            referencedColumns: ["id"];
          },
        ];
      };

      documents: {
        Row: {
          id: string;
          tenant_id: string;
          name: string;
          file_path: string;
          file_size: number;
          mime_type: string;
          status: "processing" | "ready" | "failed";
          chunk_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          name: string;
          file_path: string;
          file_size?: number;
          mime_type?: string;
          status?: "processing" | "ready" | "failed";
          chunk_count?: number;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          name?: string;
          file_path?: string;
          file_size?: number;
          mime_type?: string;
          status?: "processing" | "ready" | "failed";
          chunk_count?: number;
        };
        Relationships: [
          {
            foreignKeyName: "documents_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };

      document_chunks: {
        Row: {
          id: string;
          document_id: string;
          tenant_id: string;
          content: string;
          embedding: number[] | null;
          chunk_index: number;
          metadata: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          id?: string;
          document_id: string;
          tenant_id: string;
          content: string;
          embedding?: number[] | null;
          chunk_index: number;
          metadata?: Record<string, unknown>;
        };
        Update: {
          id?: string;
          document_id?: string;
          tenant_id?: string;
          content?: string;
          embedding?: number[] | null;
          chunk_index?: number;
          metadata?: Record<string, unknown>;
        };
        Relationships: [
          {
            foreignKeyName: "document_chunks_document_id_fkey";
            columns: ["document_id"];
            isOneToOne: false;
            referencedRelation: "documents";
            referencedColumns: ["id"];
          },
        ];
      };

      analytics_events: {
        Row: {
          id: string;
          tenant_id: string;
          session_id: string | null;
          event_type: string;
          metadata: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          session_id?: string | null;
          event_type: string;
          metadata?: Record<string, unknown>;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          session_id?: string | null;
          event_type?: string;
          metadata?: Record<string, unknown>;
        };
        Relationships: [];
      };
    };

    Functions: {
      match_documents: {
        Args: {
          query_embedding: number[];
          match_threshold: number;
          match_count: number;
          p_tenant_id: string;   // text — accepts Clerk org_id directly
        };
        Returns: {
          id: string;
          document_id: string;
          content: string;
          score: number;
        }[];
      };
    };
  };
}
