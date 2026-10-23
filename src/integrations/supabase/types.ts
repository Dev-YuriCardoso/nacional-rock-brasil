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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      chat_rooms: {
        Row: {
          created_at: string
          id: string
          participant_a: string
          participant_b: string
          product_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          participant_a: string
          participant_b: string
          product_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          participant_a?: string
          participant_b?: string
          product_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_rooms_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      classifieds: {
        Row: {
          category: string
          contact: string
          created_at: string
          description: string
          estado: string
          id: string
          title: string
          user_id: string
        }
        Insert: {
          category?: string
          contact?: string
          created_at?: string
          description?: string
          estado?: string
          id?: string
          title?: string
          user_id: string
        }
        Update: {
          category?: string
          contact?: string
          created_at?: string
          description?: string
          estado?: string
          id?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      comments: {
        Row: {
          artist_id: string
          created_at: string
          id: string
          text: string
          user_id: string
          username: string
        }
        Insert: {
          artist_id: string
          created_at?: string
          id?: string
          text: string
          user_id: string
          username: string
        }
        Update: {
          artist_id?: string
          created_at?: string
          id?: string
          text?: string
          user_id?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      content: {
        Row: {
          artist_id: string
          created_at: string
          id: string
          is_exclusive: boolean
          title: string
          type: Database["public"]["Enums"]["content_type"]
          url: string
        }
        Insert: {
          artist_id: string
          created_at?: string
          id?: string
          is_exclusive?: boolean
          title: string
          type: Database["public"]["Enums"]["content_type"]
          url: string
        }
        Update: {
          artist_id?: string
          created_at?: string
          id?: string
          is_exclusive?: boolean
          title?: string
          type?: Database["public"]["Enums"]["content_type"]
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          artist_id: string
          city: string
          created_at: string
          date: string
          id: string
          image_url: string | null
          location: string
          title: string
        }
        Insert: {
          artist_id: string
          city?: string
          created_at?: string
          date: string
          id?: string
          image_url?: string | null
          location: string
          title: string
        }
        Update: {
          artist_id?: string
          city?: string
          created_at?: string
          date?: string
          id?: string
          image_url?: string | null
          location?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      home_featured: {
        Row: {
          band_id: string
          created_at: string
          display_order: number
          id: string
          section_name: string
        }
        Insert: {
          band_id: string
          created_at?: string
          display_order?: number
          id?: string
          section_name?: string
        }
        Update: {
          band_id?: string
          created_at?: string
          display_order?: number
          id?: string
          section_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "home_featured_band_id_fkey"
            columns: ["band_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          created_at: string
          id: string
          room_id: string
          sender_id: string
          text: string
        }
        Insert: {
          created_at?: string
          id?: string
          room_id: string
          sender_id: string
          text?: string
        }
        Update: {
          created_at?: string
          id?: string
          room_id?: string
          sender_id?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_requests: {
        Row: {
          band_id: string
          created_at: string
          id: string
          proof_url: string
          reviewed_at: string | null
          reviewed_by: string | null
          slots_requested: number
          status: Database["public"]["Enums"]["payment_request_status"]
        }
        Insert: {
          band_id: string
          created_at?: string
          id?: string
          proof_url: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          slots_requested?: number
          status?: Database["public"]["Enums"]["payment_request_status"]
        }
        Update: {
          band_id?: string
          created_at?: string
          id?: string
          proof_url?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          slots_requested?: number
          status?: Database["public"]["Enums"]["payment_request_status"]
        }
        Relationships: [
          {
            foreignKeyName: "payment_requests_band_id_fkey"
            columns: ["band_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          artist_id: string
          created_at: string
          id: string
          image_url: string | null
          text: string
        }
        Insert: {
          artist_id: string
          created_at?: string
          id?: string
          image_url?: string | null
          text?: string
        }
        Update: {
          artist_id?: string
          created_at?: string
          id?: string
          image_url?: string | null
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: string
          created_at: string
          description: string
          id: string
          image_url: string | null
          owner_id: string
          price: number
          status: Database["public"]["Enums"]["product_status"]
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string
          id?: string
          image_url?: string | null
          owner_id: string
          price: number
          status?: Database["public"]["Enums"]["product_status"]
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          id?: string
          image_url?: string | null
          owner_id?: string
          price?: number
          status?: Database["public"]["Enums"]["product_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          accepted_terms: boolean
          avatar_url: string | null
          banner_url: string | null
          bio: string | null
          created_at: string
          estado: string | null
          genre: string | null
          id: string
          is_suspended: boolean
          pix_link: string | null
          pix_qrcode_url: string | null
          product_slots: number
          subgenre: string | null
          terms_accepted_at: string | null
          updated_at: string
          user_type: Database["public"]["Enums"]["user_type"]
          username: string
        }
        Insert: {
          accepted_terms?: boolean
          avatar_url?: string | null
          banner_url?: string | null
          bio?: string | null
          created_at?: string
          estado?: string | null
          genre?: string | null
          id: string
          is_suspended?: boolean
          pix_link?: string | null
          pix_qrcode_url?: string | null
          product_slots?: number
          subgenre?: string | null
          terms_accepted_at?: string | null
          updated_at?: string
          user_type?: Database["public"]["Enums"]["user_type"]
          username: string
        }
        Update: {
          accepted_terms?: boolean
          avatar_url?: string | null
          banner_url?: string | null
          bio?: string | null
          created_at?: string
          estado?: string | null
          genre?: string | null
          id?: string
          is_suspended?: boolean
          pix_link?: string | null
          pix_qrcode_url?: string | null
          product_slots?: number
          subgenre?: string | null
          terms_accepted_at?: string | null
          updated_at?: string
          user_type?: Database["public"]["Enums"]["user_type"]
          username?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          key: string
          updated_at?: string
          value?: string
        }
        Update: {
          key?: string
          updated_at?: string
          value?: string
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
          role: Database["public"]["Enums"]["app_role"]
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
      admin_delete_user: {
        Args: { _user_id: string }
        Returns: undefined
      }
      approve_payment_request: {
        Args: { _request_id: string }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      content_type:
        | "spotify_link"
        | "youtube_link"
        | "bandcamp_link"
        | "soundcloud_link"
      payment_request_status: "pending" | "approved" | "rejected"
      product_status: "active" | "sold" | "inactive"
      user_type: "fã" | "banda"
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
      app_role: ["admin", "moderator", "user"],
      content_type: [
        "spotify_link",
        "youtube_link",
        "bandcamp_link",
        "soundcloud_link",
      ],
      payment_request_status: ["pending", "approved", "rejected"],
      product_status: ["active", "sold", "inactive"],
      user_type: ["fã", "banda"],
    },
  },
} as const
