export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      connections: {
        Row: {
          created_at: string | null
          friend_id: string | null
          id: string
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          friend_id?: string | null
          id?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          friend_id?: string | null
          id?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "connections_friend_id_fkey"
            columns: ["friend_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      friend_group_members: {
        Row: {
          added_at: string
          friend_id: string
          group_id: string
          id: string
        }
        Insert: {
          added_at?: string
          friend_id: string
          group_id: string
          id?: string
        }
        Update: {
          added_at?: string
          friend_id?: string
          group_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "friend_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "friend_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      friend_groups: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      game_stats: {
        Row: {
          average_score: number | null
          best_score: number | null
          created_at: string | null
          current_streak: number | null
          game_id: string
          id: string
          longest_streak: number | null
          total_plays: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          average_score?: number | null
          best_score?: number | null
          created_at?: string | null
          current_streak?: number | null
          game_id: string
          id?: string
          longest_streak?: number | null
          total_plays?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          average_score?: number | null
          best_score?: number | null
          created_at?: string | null
          current_streak?: number | null
          game_id?: string
          id?: string
          longest_streak?: number | null
          total_plays?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "game_stats_user_id_fkey"
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
          created_at: string | null
          full_name: string | null
          id: string
          selected_games: string[] | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id: string
          selected_games?: string[] | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          selected_games?: string[] | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      scores: {
        Row: {
          created_at: string | null
          date: string
          game_id: string
          id: string
          notes: string | null
          updated_at: string | null
          user_id: string
          value: number
        }
        Insert: {
          created_at?: string | null
          date?: string
          game_id: string
          id?: string
          notes?: string | null
          updated_at?: string | null
          user_id: string
          value: number
        }
        Update: {
          created_at?: string | null
          date?: string
          game_id?: string
          id?: string
          notes?: string | null
          updated_at?: string | null
          user_id?: string
          value?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_friend_test_scores: {
        Args: {
          p_game_id: string
          p_friend_id: string
          p_requester_id: string
          p_today_date: string
          p_yesterday_date: string
          p_two_days_ago_date: string
        }
        Returns: Json
      }
      force_delete_connection: {
        Args: {
          connection_id: string
        }
        Returns: boolean
      }
      get_profile: {
        Args: {
          profile_id: string
        }
        Returns: {
          avatar_url: string | null
          created_at: string | null
          full_name: string | null
          id: string
          selected_games: string[] | null
          updated_at: string | null
          username: string | null
        }
      }
      get_user_game_stats: {
        Args: {
          user_id_param: string
        }
        Returns: {
          average_score: number | null
          best_score: number | null
          created_at: string | null
          current_streak: number | null
          game_id: string
          id: string
          longest_streak: number | null
          total_plays: number | null
          updated_at: string | null
          user_id: string | null
        }[]
      }
      update_game_stats: {
        Args: {
          p_user_id: string
          p_game_id: string
          p_score: number
          p_date: string
        }
        Returns: {
          average_score: number | null
          best_score: number | null
          created_at: string | null
          current_streak: number | null
          game_id: string
          id: string
          longest_streak: number | null
          total_plays: number | null
          updated_at: string | null
          user_id: string | null
        }
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
