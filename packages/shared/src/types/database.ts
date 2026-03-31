export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          nickname: string;
          age_range: string;
          avatar_url: string | null;
          interests: string[];
          is_verified: boolean;
          is_banned: boolean;
          token_balance: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          nickname: string;
          age_range: string;
          avatar_url?: string | null;
          interests?: string[];
          is_verified?: boolean;
          is_banned?: boolean;
          token_balance?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nickname?: string;
          age_range?: string;
          avatar_url?: string | null;
          interests?: string[];
          is_verified?: boolean;
          is_banned?: boolean;
          token_balance?: number;
          updated_at?: string;
        };
      };
      venues: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          type: string;
          description: string | null;
          address: string;
          latitude: number;
          longitude: number;
          geofence_radius: number;
          wifi_ssid: string | null;
          logo_url: string | null;
          cover_url: string | null;
          subscription_tier: string;
          is_active: boolean;
          settings: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          type: string;
          description?: string | null;
          address: string;
          latitude: number;
          longitude: number;
          geofence_radius?: number;
          wifi_ssid?: string | null;
          logo_url?: string | null;
          cover_url?: string | null;
          subscription_tier?: string;
          is_active?: boolean;
          settings?: Json;
          created_at?: string;
        };
        Update: {
          owner_id?: string;
          name?: string;
          type?: string;
          description?: string | null;
          address?: string;
          latitude?: number;
          longitude?: number;
          geofence_radius?: number;
          wifi_ssid?: string | null;
          logo_url?: string | null;
          cover_url?: string | null;
          subscription_tier?: string;
          is_active?: boolean;
          settings?: Json;
        };
      };
      venue_zones: {
        Row: {
          id: string;
          venue_id: string;
          name: string;
          sort_order: number;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          venue_id: string;
          name: string;
          sort_order?: number;
          is_active?: boolean;
        };
        Update: {
          venue_id?: string;
          name?: string;
          sort_order?: number;
          is_active?: boolean;
        };
      };
      checkins: {
        Row: {
          id: string;
          user_id: string;
          venue_id: string;
          zone_id: string | null;
          method: string;
          status: string;
          status_tag: string | null;
          is_visible: boolean;
          tokens_earned: number;
          checked_in_at: string;
          checked_out_at: string | null;
          expires_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          venue_id: string;
          zone_id?: string | null;
          method: string;
          status?: string;
          status_tag?: string | null;
          is_visible?: boolean;
          tokens_earned?: number;
          checked_in_at?: string;
          checked_out_at?: string | null;
          expires_at: string;
        };
        Update: {
          zone_id?: string | null;
          status?: string;
          status_tag?: string | null;
          is_visible?: boolean;
          checked_out_at?: string | null;
        };
      };
      chats: {
        Row: {
          id: string;
          venue_id: string;
          zone_id: string | null;
          type: string;
          name: string | null;
          is_active: boolean;
          created_at: string;
          expires_at: string | null;
        };
        Insert: {
          id?: string;
          venue_id: string;
          zone_id?: string | null;
          type: string;
          name?: string | null;
          is_active?: boolean;
          created_at?: string;
          expires_at?: string | null;
        };
        Update: {
          is_active?: boolean;
          expires_at?: string | null;
        };
      };
      chat_participants: {
        Row: {
          id: string;
          chat_id: string;
          user_id: string;
          joined_at: string;
          left_at: string | null;
        };
        Insert: {
          id?: string;
          chat_id: string;
          user_id: string;
          joined_at?: string;
          left_at?: string | null;
        };
        Update: {
          left_at?: string | null;
        };
      };
      messages: {
        Row: {
          id: string;
          chat_id: string;
          sender_id: string;
          content: string;
          type: string;
          media_url: string | null;
          is_moderated: boolean;
          is_deleted: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          chat_id: string;
          sender_id: string;
          content: string;
          type?: string;
          media_url?: string | null;
          is_moderated?: boolean;
          is_deleted?: boolean;
          created_at?: string;
        };
        Update: {
          content?: string;
          is_moderated?: boolean;
          is_deleted?: boolean;
        };
      };
      mutual_interests: {
        Row: {
          id: string;
          venue_id: string;
          from_user_id: string;
          to_user_id: string;
          type: string;
          message: string | null;
          is_mutual: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          venue_id: string;
          from_user_id: string;
          to_user_id: string;
          type: string;
          message?: string | null;
          is_mutual?: boolean;
          created_at?: string;
        };
        Update: {
          is_mutual?: boolean;
        };
      };
      activities: {
        Row: {
          id: string;
          venue_id: string;
          zone_id: string | null;
          created_by: string;
          type: string;
          title: string;
          description: string | null;
          config: Json;
          status: string;
          max_participants: number | null;
          token_cost: number;
          starts_at: string;
          ends_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          venue_id: string;
          zone_id?: string | null;
          created_by: string;
          type: string;
          title: string;
          description?: string | null;
          config?: Json;
          status?: string;
          max_participants?: number | null;
          token_cost?: number;
          starts_at: string;
          ends_at: string;
          created_at?: string;
        };
        Update: {
          title?: string;
          description?: string | null;
          config?: Json;
          status?: string;
          max_participants?: number | null;
          token_cost?: number;
          starts_at?: string;
          ends_at?: string;
        };
      };
      activity_participants: {
        Row: {
          id: string;
          activity_id: string;
          user_id: string;
          score: number;
          rank: number | null;
          data: Json | null;
          joined_at: string;
        };
        Insert: {
          id?: string;
          activity_id: string;
          user_id: string;
          score?: number;
          rank?: number | null;
          data?: Json | null;
          joined_at?: string;
        };
        Update: {
          score?: number;
          rank?: number | null;
          data?: Json | null;
        };
      };
      votes: {
        Row: {
          id: string;
          activity_id: string;
          user_id: string;
          option_key: string;
          tokens_spent: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          activity_id: string;
          user_id: string;
          option_key: string;
          tokens_spent?: number;
          created_at?: string;
        };
        Update: never;
      };
      token_transactions: {
        Row: {
          id: string;
          user_id: string;
          venue_id: string | null;
          amount: number;
          type: string;
          reference_id: string | null;
          description: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          venue_id?: string | null;
          amount: number;
          type: string;
          reference_id?: string | null;
          description: string;
          created_at?: string;
        };
        Update: never;
      };
      reports: {
        Row: {
          id: string;
          reporter_id: string;
          reported_user_id: string | null;
          reported_message_id: string | null;
          venue_id: string;
          reason: string;
          description: string | null;
          status: string;
          resolved_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          reporter_id: string;
          reported_user_id?: string | null;
          reported_message_id?: string | null;
          venue_id: string;
          reason: string;
          description?: string | null;
          status?: string;
          resolved_by?: string | null;
          created_at?: string;
        };
        Update: {
          status?: string;
          resolved_by?: string | null;
        };
      };
      blocks: {
        Row: {
          id: string;
          blocker_id: string;
          blocked_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          blocker_id: string;
          blocked_id: string;
          created_at?: string;
        };
        Update: never;
      };
      venue_stories: {
        Row: {
          id: string;
          venue_id: string;
          created_by: string;
          content: string;
          media_url: string | null;
          type: string;
          expires_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          venue_id: string;
          created_by: string;
          content: string;
          media_url?: string | null;
          type: string;
          expires_at: string;
          created_at?: string;
        };
        Update: {
          content?: string;
          media_url?: string | null;
        };
      };
      venue_moderators: {
        Row: {
          id: string;
          venue_id: string;
          user_id: string;
          permissions: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          venue_id: string;
          user_id: string;
          permissions?: Json;
          created_at?: string;
        };
        Update: {
          permissions?: Json;
        };
      };
      leaderboards: {
        Row: {
          id: string;
          venue_id: string;
          type: string;
          activity_id: string | null;
          data: Json;
          date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          venue_id: string;
          type: string;
          activity_id?: string | null;
          data?: Json;
          date: string;
          created_at?: string;
        };
        Update: {
          data?: Json;
        };
      };
      qr_codes: {
        Row: {
          id: string;
          venue_id: string;
          zone_id: string | null;
          code: string;
          type: string;
          is_active: boolean;
          expires_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          venue_id: string;
          zone_id?: string | null;
          code: string;
          type: string;
          is_active?: boolean;
          expires_at?: string | null;
          created_at?: string;
        };
        Update: {
          is_active?: boolean;
          expires_at?: string | null;
        };
      };
    };
    Functions: {
      nearby_venues: {
        Args: {
          user_lat: number;
          user_lng: number;
          radius_km: number;
        };
        Returns: Database['public']['Tables']['venues']['Row'][];
      };
      add_tokens: {
        Args: {
          p_user_id: string;
          p_amount: number;
          p_type: string;
          p_venue_id: string | null;
          p_description: string;
        };
        Returns: void;
      };
    };
    Enums: Record<string, never>;
  };
}
