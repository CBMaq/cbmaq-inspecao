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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      inspection_items: {
        Row: {
          category: string
          created_at: string | null
          entry_status: string | null
          exit_status: string | null
          id: string
          inspection_id: string
          item_description: string
          problem_description: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          entry_status?: string | null
          exit_status?: string | null
          id?: string
          inspection_id: string
          item_description: string
          problem_description?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          entry_status?: string | null
          exit_status?: string | null
          id?: string
          inspection_id?: string
          item_description?: string
          problem_description?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inspection_items_inspection_id_fkey"
            columns: ["inspection_id"]
            isOneToOne: false
            referencedRelation: "inspections"
            referencedColumns: ["id"]
          },
        ]
      }
      inspection_photos: {
        Row: {
          created_at: string | null
          id: string
          inspection_id: string
          photo_type: string
          photo_url: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          inspection_id: string
          photo_type: string
          photo_url: string
        }
        Update: {
          created_at?: string | null
          id?: string
          inspection_id?: string
          photo_type?: string
          photo_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "inspection_photos_inspection_id_fkey"
            columns: ["inspection_id"]
            isOneToOne: false
            referencedRelation: "inspections"
            referencedColumns: ["id"]
          },
        ]
      }
      inspections: {
        Row: {
          approval_observations: string | null
          approved_at: string | null
          approved_by: string | null
          codes_corrected: boolean | null
          created_at: string | null
          created_by: string
          driver_documents_url: string | null
          driver_name: string | null
          driver_signature: string | null
          driver_signature_date: string | null
          entry_signature: string | null
          entry_signature_date: string | null
          entry_technician_id: string | null
          entry_technician_name: string | null
          exit_signature: string | null
          exit_signature_date: string | null
          exit_technician_id: string | null
          exit_technician_name: string | null
          fault_codes_description: string | null
          freight_responsible: string | null
          general_observations: string | null
          has_fault_codes: boolean | null
          horimeter: number
          id: string
          inspection_date: string
          model: string
          model_id: string | null
          process_type: string
          serial_number: string
          status: string
          updated_at: string | null
        }
        Insert: {
          approval_observations?: string | null
          approved_at?: string | null
          approved_by?: string | null
          codes_corrected?: boolean | null
          created_at?: string | null
          created_by: string
          driver_documents_url?: string | null
          driver_name?: string | null
          driver_signature?: string | null
          driver_signature_date?: string | null
          entry_signature?: string | null
          entry_signature_date?: string | null
          entry_technician_id?: string | null
          entry_technician_name?: string | null
          exit_signature?: string | null
          exit_signature_date?: string | null
          exit_technician_id?: string | null
          exit_technician_name?: string | null
          fault_codes_description?: string | null
          freight_responsible?: string | null
          general_observations?: string | null
          has_fault_codes?: boolean | null
          horimeter: number
          id?: string
          inspection_date?: string
          model: string
          model_id?: string | null
          process_type?: string
          serial_number: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          approval_observations?: string | null
          approved_at?: string | null
          approved_by?: string | null
          codes_corrected?: boolean | null
          created_at?: string | null
          created_by?: string
          driver_documents_url?: string | null
          driver_name?: string | null
          driver_signature?: string | null
          driver_signature_date?: string | null
          entry_signature?: string | null
          entry_signature_date?: string | null
          entry_technician_id?: string | null
          entry_technician_name?: string | null
          exit_signature?: string | null
          exit_signature_date?: string | null
          exit_technician_id?: string | null
          exit_technician_name?: string | null
          fault_codes_description?: string | null
          freight_responsible?: string | null
          general_observations?: string | null
          has_fault_codes?: boolean | null
          horimeter?: number
          id?: string
          inspection_date?: string
          model?: string
          model_id?: string | null
          process_type?: string
          serial_number?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inspections_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "machine_models"
            referencedColumns: ["id"]
          },
        ]
      }
      machine_models: {
        Row: {
          category: string
          created_at: string
          description: string | null
          gallery_images: string[] | null
          id: string
          image_url: string | null
          internal_code: string | null
          line: string
          name: string
          source_url: string | null
          technical_sheet_url: string | null
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          gallery_images?: string[] | null
          id?: string
          image_url?: string | null
          internal_code?: string | null
          line: string
          name: string
          source_url?: string | null
          technical_sheet_url?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          gallery_images?: string[] | null
          id?: string
          image_url?: string | null
          internal_code?: string | null
          line?: string
          name?: string
          source_url?: string | null
          technical_sheet_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          full_name: string
          id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          full_name: string
          id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          full_name?: string
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      technicians: {
        Row: {
          created_at: string | null
          id: string
          name: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id: string
          name: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
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
    }
    Enums: {
      app_role: "admin" | "supervisor" | "tecnico"
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
      app_role: ["admin", "supervisor", "tecnico"],
    },
  },
} as const
