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
      categories: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      consents: {
        Row: {
          accepted_at: string
          content: string
          document_type: string
          id: string
          transaction_id: string | null
          user_id: string
          version: string
        }
        Insert: {
          accepted_at?: string
          content: string
          document_type: string
          id?: string
          transaction_id?: string | null
          user_id: string
          version: string
        }
        Update: {
          accepted_at?: string
          content?: string
          document_type?: string
          id?: string
          transaction_id?: string | null
          user_id?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "consents_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      cookie_consents: {
        Row: {
          affiliation: boolean
          analytics: boolean
          banner_version: string
          created_at: string
          functional: boolean
          id: string
          marketing: boolean
          necessary: boolean
          user_id: string | null
        }
        Insert: {
          affiliation?: boolean
          analytics?: boolean
          banner_version: string
          created_at?: string
          functional?: boolean
          id?: string
          marketing?: boolean
          necessary?: boolean
          user_id?: string | null
        }
        Update: {
          affiliation?: boolean
          analytics?: boolean
          banner_version?: string
          created_at?: string
          functional?: boolean
          id?: string
          marketing?: boolean
          necessary?: boolean
          user_id?: string | null
        }
        Relationships: []
      }
      dac7_reports: {
        Row: {
          created_at: string
          currency: string
          gross_amount: number
          id: string
          reported: boolean
          tx_count: number
          user_id: string
          year: number
        }
        Insert: {
          created_at?: string
          currency?: string
          gross_amount?: number
          id?: string
          reported?: boolean
          tx_count?: number
          user_id: string
          year: number
        }
        Update: {
          created_at?: string
          currency?: string
          gross_amount?: number
          id?: string
          reported?: boolean
          tx_count?: number
          user_id?: string
          year?: number
        }
        Relationships: []
      }
      exchange_items: {
        Row: {
          created_at: string
          exchange_id: string
          id: string
          product_id: string
          side: string
        }
        Insert: {
          created_at?: string
          exchange_id: string
          id?: string
          product_id: string
          side: string
        }
        Update: {
          created_at?: string
          exchange_id?: string
          id?: string
          product_id?: string
          side?: string
        }
        Relationships: [
          {
            foreignKeyName: "exchange_items_exchange_id_fkey"
            columns: ["exchange_id"]
            isOneToOne: false
            referencedRelation: "exchanges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exchange_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      exchanges: {
        Row: {
          created_at: string
          id: string
          message: string | null
          offered_product_id: string
          proposer_id: string
          receiver_id: string
          requested_product_id: string
          status: Database["public"]["Enums"]["exchange_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          offered_product_id: string
          proposer_id: string
          receiver_id: string
          requested_product_id: string
          status?: Database["public"]["Enums"]["exchange_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          offered_product_id?: string
          proposer_id?: string
          receiver_id?: string
          requested_product_id?: string
          status?: Database["public"]["Enums"]["exchange_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exchanges_offered_product_id_fkey"
            columns: ["offered_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exchanges_requested_product_id_fkey"
            columns: ["requested_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          read_at: string | null
          recipient_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          read_at?: string | null
          recipient_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          read_at?: string | null
          recipient_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          data: Json
          id: string
          link: string | null
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          data?: Json
          id?: string
          link?: string | null
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          data?: Json
          id?: string
          link?: string | null
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      privacy_requests: {
        Row: {
          admin_notes: string | null
          created_at: string
          details: string | null
          id: string
          kind: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          details?: string | null
          id?: string
          kind: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          details?: string | null
          id?: string
          kind?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      product_likes: {
        Row: {
          created_at: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_likes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          affiliate_commission_pct: number
          category_id: string | null
          created_at: string
          currency: string
          custom_category: string | null
          description: string | null
          downloads_count: number
          file_path: string | null
          id: string
          is_tradable: boolean
          license_terms: Json
          preview_url: string | null
          price: number
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          sample_url: string | null
          seller_id: string
          status: Database["public"]["Enums"]["product_status"]
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          affiliate_commission_pct?: number
          category_id?: string | null
          created_at?: string
          currency?: string
          custom_category?: string | null
          description?: string | null
          downloads_count?: number
          file_path?: string | null
          id?: string
          is_tradable?: boolean
          license_terms?: Json
          preview_url?: string | null
          price?: number
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          sample_url?: string | null
          seller_id: string
          status?: Database["public"]["Enums"]["product_status"]
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          affiliate_commission_pct?: number
          category_id?: string | null
          created_at?: string
          currency?: string
          custom_category?: string | null
          description?: string | null
          downloads_count?: number
          file_path?: string | null
          id?: string
          is_tradable?: boolean
          license_terms?: Json
          preview_url?: string | null
          price?: number
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          sample_url?: string | null
          seller_id?: string
          status?: Database["public"]["Enums"]["product_status"]
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          date_of_birth: string | null
          display_name: string | null
          id: string
          is_banned: boolean
          is_verified_seller: boolean
          onboarding_completed: boolean
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          date_of_birth?: string | null
          display_name?: string | null
          id: string
          is_banned?: boolean
          is_verified_seller?: boolean
          onboarding_completed?: boolean
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          date_of_birth?: string | null
          display_name?: string | null
          id?: string
          is_banned?: boolean
          is_verified_seller?: boolean
          onboarding_completed?: boolean
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      reports: {
        Row: {
          admin_notes: string | null
          created_at: string
          description: string | null
          id: string
          reason: string
          reporter_id: string
          resolved_at: string | null
          resolved_by: string | null
          status: Database["public"]["Enums"]["report_status"]
          target_id: string
          target_type: Database["public"]["Enums"]["report_target"]
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          description?: string | null
          id?: string
          reason: string
          reporter_id: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          target_id: string
          target_type: Database["public"]["Enums"]["report_target"]
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          description?: string | null
          id?: string
          reason?: string
          reporter_id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          target_id?: string
          target_type?: Database["public"]["Enums"]["report_target"]
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          buyer_id: string
          comment: string | null
          created_at: string
          id: string
          product_id: string
          rating: number
          seller_id: string
          transaction_id: string
          updated_at: string
        }
        Insert: {
          buyer_id: string
          comment?: string | null
          created_at?: string
          id?: string
          product_id: string
          rating: number
          seller_id: string
          transaction_id: string
          updated_at?: string
        }
        Update: {
          buyer_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          product_id?: string
          rating?: number
          seller_id?: string
          transaction_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_notifications: {
        Row: {
          admin_note: string | null
          created_at: string
          id: string
          kind: string
          product_title: string | null
          read_at: string | null
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          created_at?: string
          id?: string
          kind?: string
          product_title?: string | null
          read_at?: string | null
          user_id: string
        }
        Update: {
          admin_note?: string | null
          created_at?: string
          id?: string
          kind?: string
          product_title?: string | null
          read_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      seller_payouts: {
        Row: {
          created_at: string
          payout_account: string
          payout_holder: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          payout_account: string
          payout_holder: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          payout_account?: string
          payout_holder?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      seller_tax_profiles: {
        Row: {
          address_line: string
          birth_place: string | null
          business_reg_no: string | null
          city: string
          country: string
          created_at: string
          date_of_birth: string | null
          full_name: string
          postal_code: string
          seller_kind: string
          tin: string
          updated_at: string
          user_id: string
          vat_id: string | null
          verified: boolean
        }
        Insert: {
          address_line: string
          birth_place?: string | null
          business_reg_no?: string | null
          city: string
          country?: string
          created_at?: string
          date_of_birth?: string | null
          full_name: string
          postal_code: string
          seller_kind: string
          tin: string
          updated_at?: string
          user_id: string
          vat_id?: string | null
          verified?: boolean
        }
        Update: {
          address_line?: string
          birth_place?: string | null
          business_reg_no?: string | null
          city?: string
          country?: string
          created_at?: string
          date_of_birth?: string | null
          full_name?: string
          postal_code?: string
          seller_kind?: string
          tin?: string
          updated_at?: string
          user_id?: string
          vat_id?: string | null
          verified?: boolean
        }
        Relationships: []
      }
      transactions: {
        Row: {
          affiliate_amount: number
          affiliate_commission_pct: number
          affiliate_user_id: string | null
          amount: number
          buyer_id: string
          buyer_price: number | null
          created_at: string
          currency: string
          dispute_reason: string | null
          disputed_at: string | null
          id: string
          platform_amount: number
          platform_fee_pct: number
          product_id: string | null
          released_at: string | null
          seller_amount: number
          seller_id: string
          source: string
          status: Database["public"]["Enums"]["transaction_status"]
          stripe_session_id: string | null
        }
        Insert: {
          affiliate_amount?: number
          affiliate_commission_pct?: number
          affiliate_user_id?: string | null
          amount: number
          buyer_id: string
          buyer_price?: number | null
          created_at?: string
          currency?: string
          dispute_reason?: string | null
          disputed_at?: string | null
          id?: string
          platform_amount?: number
          platform_fee_pct?: number
          product_id?: string | null
          released_at?: string | null
          seller_amount?: number
          seller_id: string
          source?: string
          status?: Database["public"]["Enums"]["transaction_status"]
          stripe_session_id?: string | null
        }
        Update: {
          affiliate_amount?: number
          affiliate_commission_pct?: number
          affiliate_user_id?: string | null
          amount?: number
          buyer_id?: string
          buyer_price?: number | null
          created_at?: string
          currency?: string
          dispute_reason?: string | null
          disputed_at?: string | null
          id?: string
          platform_amount?: number
          platform_fee_pct?: number
          product_id?: string | null
          released_at?: string | null
          seller_amount?: number
          seller_id?: string
          source?: string
          status?: Database["public"]["Enums"]["transaction_status"]
          stripe_session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_current_user_admin: { Args: never; Returns: boolean }
      pl_norm: { Args: { t: string }; Returns: string }
      search_products: {
        Args: { cat?: string; q?: string }
        Returns: {
          category_icon: string
          category_name: string
          category_slug: string
          currency: string
          custom_category: string
          downloads_count: number
          id: string
          is_tradable: boolean
          preview_url: string
          price: number
          score: number
          title: string
        }[]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      app_role: "admin" | "user"
      exchange_status: "pending" | "accepted" | "rejected" | "cancelled"
      product_status:
        | "draft"
        | "published"
        | "sold"
        | "archived"
        | "pending_review"
        | "rejected"
      report_status: "pending" | "reviewing" | "resolved" | "dismissed"
      report_target: "product" | "user"
      transaction_status:
        | "pending"
        | "completed"
        | "failed"
        | "refunded"
        | "held"
        | "released"
        | "disputed"
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
      app_role: ["admin", "user"],
      exchange_status: ["pending", "accepted", "rejected", "cancelled"],
      product_status: [
        "draft",
        "published",
        "sold",
        "archived",
        "pending_review",
        "rejected",
      ],
      report_status: ["pending", "reviewing", "resolved", "dismissed"],
      report_target: ["product", "user"],
      transaction_status: [
        "pending",
        "completed",
        "failed",
        "refunded",
        "held",
        "released",
        "disputed",
      ],
    },
  },
} as const
