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
      activity_logs: {
        Row: {
          created_at: string
          date: string
          details: Json | null
          duration: number | null
          id: string
          intensity: string | null
          label: string
          note: string | null
          pillar: string
          source: string
          timestamp: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          details?: Json | null
          duration?: number | null
          id?: string
          intensity?: string | null
          label: string
          note?: string | null
          pillar: string
          source?: string
          timestamp?: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          details?: Json | null
          duration?: number | null
          id?: string
          intensity?: string | null
          label?: string
          note?: string | null
          pillar?: string
          source?: string
          timestamp?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      admin_access: {
        Row: {
          created_at: string | null
          id: string
          password_hash: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          password_hash: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          password_hash?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      admin_sessions: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          session_token: string
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          session_token: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          session_token?: string
        }
        Relationships: []
      }
      badges: {
        Row: {
          badge_id: string
          description: string
          emoji: string
          id: string
          label: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          badge_id: string
          description?: string
          emoji?: string
          id?: string
          label: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          description?: string
          emoji?: string
          id?: string
          label?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: []
      }
      bio_age_results: {
        Row: {
          bio_age: number
          consent_email_marketing: boolean | null
          consent_source: string | null
          consent_text: string | null
          consent_timestamp: string | null
          consent_url: string | null
          consent_version: string | null
          created_at: string
          email: string
          gdpr_consent: boolean | null
          id: string
          meeting_booked: boolean | null
          name: string
          notes: string | null
          real_age: number
          result_level: string | null
          result_text: string | null
        }
        Insert: {
          bio_age: number
          consent_email_marketing?: boolean | null
          consent_source?: string | null
          consent_text?: string | null
          consent_timestamp?: string | null
          consent_url?: string | null
          consent_version?: string | null
          created_at?: string
          email: string
          gdpr_consent?: boolean | null
          id?: string
          meeting_booked?: boolean | null
          name: string
          notes?: string | null
          real_age: number
          result_level?: string | null
          result_text?: string | null
        }
        Update: {
          bio_age?: number
          consent_email_marketing?: boolean | null
          consent_source?: string | null
          consent_text?: string | null
          consent_timestamp?: string | null
          consent_url?: string | null
          consent_version?: string | null
          created_at?: string
          email?: string
          gdpr_consent?: boolean | null
          id?: string
          meeting_booked?: boolean | null
          name?: string
          notes?: string | null
          real_age?: number
          result_level?: string | null
          result_text?: string | null
        }
        Relationships: []
      }
      bioage_submissions: {
        Row: {
          answers: Json
          consent_email_marketing: boolean | null
          consent_source: string | null
          consent_text: string | null
          consent_timestamp: string | null
          consent_url: string | null
          consent_version: string | null
          created_at: string
          email: string
          firstname: string
          gdpr_consent: boolean | null
          id: string
          meeting_booked: boolean | null
          notes: string | null
          result_level: string | null
          score_total: number | null
          user_age: number | null
        }
        Insert: {
          answers?: Json
          consent_email_marketing?: boolean | null
          consent_source?: string | null
          consent_text?: string | null
          consent_timestamp?: string | null
          consent_url?: string | null
          consent_version?: string | null
          created_at?: string
          email: string
          firstname: string
          gdpr_consent?: boolean | null
          id?: string
          meeting_booked?: boolean | null
          notes?: string | null
          result_level?: string | null
          score_total?: number | null
          user_age?: number | null
        }
        Update: {
          answers?: Json
          consent_email_marketing?: boolean | null
          consent_source?: string | null
          consent_text?: string | null
          consent_timestamp?: string | null
          consent_url?: string | null
          consent_version?: string | null
          created_at?: string
          email?: string
          firstname?: string
          gdpr_consent?: boolean | null
          id?: string
          meeting_booked?: boolean | null
          notes?: string | null
          result_level?: string | null
          score_total?: number | null
          user_age?: number | null
        }
        Relationships: []
      }
      brevo_sync_failures: {
        Row: {
          created_at: string
          email: string
          error_message: string | null
          error_status: number | null
          firstname: string | null
          id: string
          last_retry_at: string | null
          newsletter_optin: boolean | null
          resolved_at: string | null
          retry_count: number | null
        }
        Insert: {
          created_at?: string
          email: string
          error_message?: string | null
          error_status?: number | null
          firstname?: string | null
          id?: string
          last_retry_at?: string | null
          newsletter_optin?: boolean | null
          resolved_at?: string | null
          retry_count?: number | null
        }
        Update: {
          created_at?: string
          email?: string
          error_message?: string | null
          error_status?: number | null
          firstname?: string | null
          id?: string
          last_retry_at?: string | null
          newsletter_optin?: boolean | null
          resolved_at?: string | null
          retry_count?: number | null
        }
        Relationships: []
      }
      coach_sessions: {
        Row: {
          id: string
          memory_facts: string[]
          messages: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          memory_facts?: string[]
          messages?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          memory_facts?: string[]
          messages?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      companion_evolution: {
        Row: {
          best_streak: number
          evolution_progress: number
          evolution_tier: string
          id: string
          total_checkins: number
          unlocked_at: Json
          updated_at: string
          user_id: string
          vitality: number
        }
        Insert: {
          best_streak?: number
          evolution_progress?: number
          evolution_tier?: string
          id?: string
          total_checkins?: number
          unlocked_at?: Json
          updated_at?: string
          user_id: string
          vitality?: number
        }
        Update: {
          best_streak?: number
          evolution_progress?: number
          evolution_tier?: string
          id?: string
          total_checkins?: number
          unlocked_at?: Json
          updated_at?: string
          user_id?: string
          vitality?: number
        }
        Relationships: []
      }
      daily_checkins: {
        Row: {
          alcohol: boolean
          created_at: string
          date: string
          energy: number
          hydration: string
          id: string
          mood: number
          protein_quality: string
          recovery: number
          screen_time_night: boolean
          sleep_hours: number
          sleep_quality: number
          steps: number
          stress: number
          training: boolean
          user_id: string
        }
        Insert: {
          alcohol?: boolean
          created_at?: string
          date: string
          energy?: number
          hydration?: string
          id?: string
          mood?: number
          protein_quality?: string
          recovery?: number
          screen_time_night?: boolean
          sleep_hours?: number
          sleep_quality?: number
          steps?: number
          stress?: number
          training?: boolean
          user_id: string
        }
        Update: {
          alcohol?: boolean
          created_at?: string
          date?: string
          energy?: number
          hydration?: string
          id?: string
          mood?: number
          protein_quality?: string
          recovery?: number
          screen_time_night?: boolean
          sleep_hours?: number
          sleep_quality?: number
          steps?: number
          stress?: number
          training?: boolean
          user_id?: string
        }
        Relationships: []
      }
      goal_plans: {
        Row: {
          active_pillars: string[] | null
          completed_blocks: string[]
          created_at: string
          follow_up_answers: Json | null
          goal_description: string
          goal_type: string
          id: string
          mental_tips: Json | null
          nutrition_plan: Json | null
          pillar_activation_answers: Json | null
          pillar_activation_dates: Json | null
          pillar_assessment: Json | null
          plan_checkin_history: Json | null
          realism_result: Json | null
          recovery_tips: Json | null
          reminders_enabled: boolean
          secondary_goal: string | null
          target_date: string
          target_weeks: number
          training_plan_data: Json | null
          updated_at: string
          user_id: string
          weekly_plan: Json | null
        }
        Insert: {
          active_pillars?: string[] | null
          completed_blocks?: string[]
          created_at?: string
          follow_up_answers?: Json | null
          goal_description?: string
          goal_type?: string
          id?: string
          mental_tips?: Json | null
          nutrition_plan?: Json | null
          pillar_activation_answers?: Json | null
          pillar_activation_dates?: Json | null
          pillar_assessment?: Json | null
          plan_checkin_history?: Json | null
          realism_result?: Json | null
          recovery_tips?: Json | null
          reminders_enabled?: boolean
          secondary_goal?: string | null
          target_date?: string
          target_weeks?: number
          training_plan_data?: Json | null
          updated_at?: string
          user_id: string
          weekly_plan?: Json | null
        }
        Update: {
          active_pillars?: string[] | null
          completed_blocks?: string[]
          created_at?: string
          follow_up_answers?: Json | null
          goal_description?: string
          goal_type?: string
          id?: string
          mental_tips?: Json | null
          nutrition_plan?: Json | null
          pillar_activation_answers?: Json | null
          pillar_activation_dates?: Json | null
          pillar_assessment?: Json | null
          plan_checkin_history?: Json | null
          realism_result?: Json | null
          recovery_tips?: Json | null
          reminders_enabled?: boolean
          secondary_goal?: string | null
          target_date?: string
          target_weeks?: number
          training_plan_data?: Json | null
          updated_at?: string
          user_id?: string
          weekly_plan?: Json | null
        }
        Relationships: []
      }
      habit_data: {
        Row: {
          habit_history: Json
          habits: Json
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          habit_history?: Json
          habits?: Json
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          habit_history?: Json
          habits?: Json
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      nutrition_logs: {
        Row: {
          created_at: string
          date: string
          estimated_protein_total: number
          id: string
          meals: Json
          quality_rating: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          estimated_protein_total?: number
          id?: string
          meals?: Json
          quality_rating?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          estimated_protein_total?: number
          id?: string
          meals?: Json
          quality_rating?: string
          user_id?: string
        }
        Relationships: []
      }
      score_history: {
        Row: {
          created_at: string
          date: string
          id: string
          pillar_bewegung: number
          pillar_ernaehrung: number
          pillar_mental: number
          pillar_regeneration: number
          score: number
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          pillar_bewegung?: number
          pillar_ernaehrung?: number
          pillar_mental?: number
          pillar_regeneration?: number
          score?: number
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          pillar_bewegung?: number
          pillar_ernaehrung?: number
          pillar_mental?: number
          pillar_regeneration?: number
          score?: number
          user_id?: string
        }
        Relationships: []
      }
      training_logs: {
        Row: {
          created_at: string
          date: string
          duration: number
          exercises: Json
          id: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          duration?: number
          exercises?: Json
          id?: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          duration?: number
          exercises?: Json
          id?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          activity_level: string
          age: number
          created_at: string
          current_streak: number
          gender: string
          goals: string[]
          height: number
          id: string
          is_premium: boolean
          name: string
          onboarding_complete: boolean
          premium_source: string
          premium_until: string | null
          role: string
          sleep_quality: string
          stress_level: string
          updated_at: string
          weight: number
        }
        Insert: {
          activity_level?: string
          age?: number
          created_at?: string
          current_streak?: number
          gender?: string
          goals?: string[]
          height?: number
          id: string
          is_premium?: boolean
          name?: string
          onboarding_complete?: boolean
          premium_source?: string
          premium_until?: string | null
          role?: string
          sleep_quality?: string
          stress_level?: string
          updated_at?: string
          weight?: number
        }
        Update: {
          activity_level?: string
          age?: number
          created_at?: string
          current_streak?: number
          gender?: string
          goals?: string[]
          height?: number
          id?: string
          is_premium?: boolean
          name?: string
          onboarding_complete?: boolean
          premium_source?: string
          premium_until?: string | null
          role?: string
          sleep_quality?: string
          stress_level?: string
          updated_at?: string
          weight?: number
        }
        Relationships: []
      }
      wearable_entries: {
        Row: {
          created_at: string
          date: string
          hrv: number | null
          id: string
          resting_hr: number | null
          sleep_hours: number | null
          source: string
          spo2: number | null
          steps: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          hrv?: number | null
          id?: string
          resting_hr?: number | null
          sleep_hours?: number | null
          source?: string
          spo2?: number | null
          steps?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          hrv?: number | null
          id?: string
          resting_hr?: number | null
          sleep_hours?: number | null
          source?: string
          spo2?: number | null
          steps?: number | null
          user_id?: string
        }
        Relationships: []
      }
      weekly_reports: {
        Row: {
          generated_at: string
          id: string
          report_json: Json
          user_id: string
          week_key: string
        }
        Insert: {
          generated_at?: string
          id?: string
          report_json?: Json
          user_id: string
          week_key: string
        }
        Update: {
          generated_at?: string
          id?: string
          report_json?: Json
          user_id?: string
          week_key?: string
        }
        Relationships: []
      }
      weight_entries: {
        Row: {
          body_fat: number | null
          created_at: string
          date: string
          id: string
          user_id: string
          weight: number
        }
        Insert: {
          body_fat?: number | null
          created_at?: string
          date: string
          id?: string
          user_id: string
          weight: number
        }
        Update: {
          body_fat?: number | null
          created_at?: string
          date?: string
          id?: string
          user_id?: string
          weight?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
