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
      budgets: {
        Row: {
          archived_at: string | null
          category_id: string
          created_at: string
          currency: Database["public"]["Enums"]["currency_code"]
          id: string
          limit_amount: number
          notes: string | null
          period_start: string
          period_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          archived_at?: string | null
          category_id: string
          created_at?: string
          currency: Database["public"]["Enums"]["currency_code"]
          id?: string
          limit_amount: number
          notes?: string | null
          period_start: string
          period_type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          archived_at?: string | null
          category_id?: string
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_code"]
          id?: string
          limit_amount?: number
          notes?: string | null
          period_start?: string
          period_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "budgets_category_owner_fk"
            columns: ["category_id", "user_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "budgets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          accent_identifier: string | null
          archived_at: string | null
          created_at: string
          icon_identifier: string | null
          id: string
          keywords: string[]
          name: string
          status: Database["public"]["Enums"]["category_status"]
          type: Database["public"]["Enums"]["category_type"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          accent_identifier?: string | null
          archived_at?: string | null
          created_at?: string
          icon_identifier?: string | null
          id?: string
          keywords?: string[]
          name: string
          status?: Database["public"]["Enums"]["category_status"]
          type: Database["public"]["Enums"]["category_type"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          accent_identifier?: string | null
          archived_at?: string | null
          created_at?: string
          icon_identifier?: string | null
          id?: string
          keywords?: string[]
          name?: string
          status?: Database["public"]["Enums"]["category_status"]
          type?: Database["public"]["Enums"]["category_type"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      category_rules: {
        Row: {
          category_id: string
          created_at: string
          deleted_at: string | null
          enabled: boolean
          field: Database["public"]["Enums"]["category_rule_field"]
          id: string
          label: string | null
          operator: Database["public"]["Enums"]["rule_operator"]
          priority: number
          updated_at: string
          user_id: string
          value: string
        }
        Insert: {
          category_id: string
          created_at?: string
          deleted_at?: string | null
          enabled?: boolean
          field: Database["public"]["Enums"]["category_rule_field"]
          id?: string
          label?: string | null
          operator: Database["public"]["Enums"]["rule_operator"]
          priority?: number
          updated_at?: string
          user_id: string
          value: string
        }
        Update: {
          category_id?: string
          created_at?: string
          deleted_at?: string | null
          enabled?: boolean
          field?: Database["public"]["Enums"]["category_rule_field"]
          id?: string
          label?: string | null
          operator?: Database["public"]["Enums"]["rule_operator"]
          priority?: number
          updated_at?: string
          user_id?: string
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "category_rules_category_owner_fk"
            columns: ["category_id", "user_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "category_rules_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_events: {
        Row: {
          created_at: string
          event_type: string | null
          external_event_id: string
          id: string
          idempotency_key: string | null
          integration_id: string
          metadata: Json
          processed_at: string | null
          provider: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_type?: string | null
          external_event_id: string
          id?: string
          idempotency_key?: string | null
          integration_id: string
          metadata?: Json
          processed_at?: string | null
          provider?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_type?: string | null
          external_event_id?: string
          id?: string
          idempotency_key?: string | null
          integration_id?: string
          metadata?: Json
          processed_at?: string | null
          provider?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "integration_events_integration_owner_fk"
            columns: ["integration_id", "user_id"]
            isOneToOne: false
            referencedRelation: "user_integrations"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "integration_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_link_tokens: {
        Row: {
          consumed_at: string | null
          created_at: string
          expires_at: string
          id: string
          provider: string
          token_hash: string
          user_id: string
        }
        Insert: {
          consumed_at?: string | null
          created_at?: string
          expires_at: string
          id?: string
          provider?: string
          token_hash: string
          user_id: string
        }
        Update: {
          consumed_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          provider?: string
          token_hash?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "integration_link_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_sessions: {
        Row: {
          created_at: string
          deleted_at: string | null
          expires_at: string
          flow: string
          id: string
          integration_id: string
          payload: Json
          status: string
          step: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          expires_at: string
          flow: string
          id?: string
          integration_id: string
          payload?: Json
          status?: string
          step: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          expires_at?: string
          flow?: string
          id?: string
          integration_id?: string
          payload?: Json
          status?: string
          step?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "integration_sessions_integration_owner_fk"
            columns: ["integration_id", "user_id"]
            isOneToOne: false
            referencedRelation: "user_integrations"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "integration_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          channel: Database["public"]["Enums"]["notification_channel"]
          created_at: string
          enabled: boolean
          id: string
          preference_key: string
          updated_at: string
          user_id: string
        }
        Insert: {
          channel?: Database["public"]["Enums"]["notification_channel"]
          created_at?: string
          enabled?: boolean
          id?: string
          preference_key: string
          updated_at?: string
          user_id: string
        }
        Update: {
          channel?: Database["public"]["Enums"]["notification_channel"]
          created_at?: string
          enabled?: boolean
          id?: string
          preference_key?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          location: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
          location?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          location?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          category_id: string | null
          cleared_at: string | null
          created_at: string
          currency: Database["public"]["Enums"]["currency_code"]
          deleted_at: string | null
          description: string | null
          external_id: string | null
          external_metadata: Json
          id: string
          idempotency_key: string | null
          note: string | null
          occurred_at: string
          payee: string | null
          posted_at: string | null
          reference: string | null
          source: Database["public"]["Enums"]["transaction_source"]
          status: Database["public"]["Enums"]["transaction_status"]
          transfer_id: string | null
          transfer_leg: Database["public"]["Enums"]["transfer_leg"] | null
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at: string
          user_id: string
          wallet_id: string
        }
        Insert: {
          amount: number
          category_id?: string | null
          cleared_at?: string | null
          created_at?: string
          currency: Database["public"]["Enums"]["currency_code"]
          deleted_at?: string | null
          description?: string | null
          external_id?: string | null
          external_metadata?: Json
          id?: string
          idempotency_key?: string | null
          note?: string | null
          occurred_at: string
          payee?: string | null
          posted_at?: string | null
          reference?: string | null
          source?: Database["public"]["Enums"]["transaction_source"]
          status?: Database["public"]["Enums"]["transaction_status"]
          transfer_id?: string | null
          transfer_leg?: Database["public"]["Enums"]["transfer_leg"] | null
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
          user_id: string
          wallet_id: string
        }
        Update: {
          amount?: number
          category_id?: string | null
          cleared_at?: string | null
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_code"]
          deleted_at?: string | null
          description?: string | null
          external_id?: string | null
          external_metadata?: Json
          id?: string
          idempotency_key?: string | null
          note?: string | null
          occurred_at?: string
          payee?: string | null
          posted_at?: string | null
          reference?: string | null
          source?: Database["public"]["Enums"]["transaction_source"]
          status?: Database["public"]["Enums"]["transaction_status"]
          transfer_id?: string | null
          transfer_leg?: Database["public"]["Enums"]["transfer_leg"] | null
          type?: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
          user_id?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_category_owner_fk"
            columns: ["category_id", "user_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "transactions_transfer_owner_fk"
            columns: ["transfer_id", "user_id"]
            isOneToOne: false
            referencedRelation: "wallet_transfers"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_wallet_owner_fk"
            columns: ["wallet_id", "user_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      user_integrations: {
        Row: {
          created_at: string
          deleted_at: string | null
          external_chat_id: string | null
          external_user_id: string
          id: string
          last_seen_at: string | null
          linked_at: string | null
          provider: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          external_chat_id?: string | null
          external_user_id: string
          id?: string
          last_seen_at?: string | null
          linked_at?: string | null
          provider?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          external_chat_id?: string | null
          external_user_id?: string
          id?: string
          last_seen_at?: string | null
          linked_at?: string | null
          provider?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_integrations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          appearance: string
          auto_categorize: boolean
          confirm_before_delete: boolean
          created_at: string
          date_format: string
          default_currency: Database["public"]["Enums"]["currency_code"]
          default_transaction_type: Database["public"]["Enums"]["category_type"]
          entry_mode: string
          merchant_suggestions: boolean
          number_format: string
          region: string
          timezone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          appearance?: string
          auto_categorize?: boolean
          confirm_before_delete?: boolean
          created_at?: string
          date_format?: string
          default_currency?: Database["public"]["Enums"]["currency_code"]
          default_transaction_type?: Database["public"]["Enums"]["category_type"]
          entry_mode?: string
          merchant_suggestions?: boolean
          number_format?: string
          region?: string
          timezone?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          appearance?: string
          auto_categorize?: boolean
          confirm_before_delete?: boolean
          created_at?: string
          date_format?: string
          default_currency?: Database["public"]["Enums"]["currency_code"]
          default_transaction_type?: Database["public"]["Enums"]["category_type"]
          entry_mode?: string
          merchant_suggestions?: boolean
          number_format?: string
          region?: string
          timezone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_transfers: {
        Row: {
          created_at: string
          deleted_at: string | null
          destination_amount: number
          destination_transaction_id: string | null
          destination_wallet_id: string
          exchange_rate: number | null
          fee_amount: number
          id: string
          idempotency_key: string | null
          reference: string | null
          source: Database["public"]["Enums"]["transaction_source"]
          source_amount: number
          source_transaction_id: string | null
          source_wallet_id: string
          status: Database["public"]["Enums"]["transfer_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          destination_amount: number
          destination_transaction_id?: string | null
          destination_wallet_id: string
          exchange_rate?: number | null
          fee_amount?: number
          id?: string
          idempotency_key?: string | null
          reference?: string | null
          source?: Database["public"]["Enums"]["transaction_source"]
          source_amount: number
          source_transaction_id?: string | null
          source_wallet_id: string
          status?: Database["public"]["Enums"]["transfer_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          destination_amount?: number
          destination_transaction_id?: string | null
          destination_wallet_id?: string
          exchange_rate?: number | null
          fee_amount?: number
          id?: string
          idempotency_key?: string | null
          reference?: string | null
          source?: Database["public"]["Enums"]["transaction_source"]
          source_amount?: number
          source_transaction_id?: string | null
          source_wallet_id?: string
          status?: Database["public"]["Enums"]["transfer_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transfers_destination_transaction_fk"
            columns: ["destination_transaction_id"]
            isOneToOne: true
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_transfers_destination_wallet_owner_fk"
            columns: ["destination_wallet_id", "user_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "wallet_transfers_source_transaction_fk"
            columns: ["source_transaction_id"]
            isOneToOne: true
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_transfers_source_wallet_owner_fk"
            columns: ["source_wallet_id", "user_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "wallet_transfers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wallets: {
        Row: {
          accent_identifier: string | null
          account_mask: string | null
          created_at: string
          currency: Database["public"]["Enums"]["currency_code"]
          deleted_at: string | null
          icon_identifier: string | null
          id: string
          institution: string | null
          kind: Database["public"]["Enums"]["wallet_kind"]
          monthly_limit: number | null
          name: string
          opening_balance: number
          opening_balance_at: string
          status: Database["public"]["Enums"]["wallet_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          accent_identifier?: string | null
          account_mask?: string | null
          created_at?: string
          currency: Database["public"]["Enums"]["currency_code"]
          deleted_at?: string | null
          icon_identifier?: string | null
          id?: string
          institution?: string | null
          kind?: Database["public"]["Enums"]["wallet_kind"]
          monthly_limit?: number | null
          name: string
          opening_balance?: number
          opening_balance_at?: string
          status?: Database["public"]["Enums"]["wallet_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          accent_identifier?: string | null
          account_mask?: string | null
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_code"]
          deleted_at?: string | null
          icon_identifier?: string | null
          id?: string
          institution?: string | null
          kind?: Database["public"]["Enums"]["wallet_kind"]
          monthly_limit?: number | null
          name?: string
          opening_balance?: number
          opening_balance_at?: string
          status?: Database["public"]["Enums"]["wallet_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_telegram_link_code: {
        Args: Record<PropertyKey, never>
        Returns: { code: string; expires_at: string }[]
      }
      unlink_telegram: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      perform_wallet_transfer: {
        Args: {
          p_amount: number
          p_destination_wallet_id: string
          p_idempotency_key?: string | null
          p_note?: string | null
          p_source_wallet_id: string
        }
        Returns: {
          created_at: string
          destination_amount: number
          destination_transaction_id: string
          destination_wallet_id: string
          reference: string | null
          source_amount: number
          source_transaction_id: string
          source_wallet_id: string
          status: Database["public"]["Enums"]["transfer_status"]
          transfer_id: string
        }[]
      }
    }
    Enums: {
      category_rule_field: "payee" | "description"
      category_status: "active" | "inactive"
      category_type: "expense" | "income"
      currency_code: "USD" | "EUR" | "GBP" | "IDR"
      notification_channel: "in_app" | "email" | "telegram"
      rule_operator: "contains" | "starts_with" | "exact_match"
      transaction_source: "web" | "telegram" | "import" | "api"
      transaction_status: "pending" | "completed" | "canceled"
      transaction_type: "income" | "expense" | "transfer"
      transfer_leg: "outbound" | "inbound"
      transfer_status: "pending" | "completed" | "canceled"
      wallet_kind: "bank" | "cash" | "card" | "travel" | "savings"
      wallet_status: "active" | "inactive"
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
      category_rule_field: ["payee", "description"],
      category_status: ["active", "inactive"],
      category_type: ["expense", "income"],
      currency_code: ["USD", "EUR", "GBP", "IDR"],
      notification_channel: ["in_app", "email", "telegram"],
      rule_operator: ["contains", "starts_with", "exact_match"],
      transaction_source: ["web", "telegram", "import", "api"],
      transaction_status: ["pending", "completed", "canceled"],
      transaction_type: ["income", "expense", "transfer"],
      transfer_leg: ["outbound", "inbound"],
      transfer_status: ["pending", "completed", "canceled"],
      wallet_kind: ["bank", "cash", "card", "travel", "savings"],
      wallet_status: ["active", "inactive"],
    },
  },
} as const
