export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Disease = 'asma' | 'dpoc' | 'dpi-fp' | 'hap'
export type RequestType = 'inicial' | 'renovacao' | 'reavaliacao'
export type LmeStatus = 'rascunho' | 'enviada' | 'em_analise' | 'deferida' | 'devolvida' | 'indeferida' | 'emitida'
export type WorkspaceRole = 'owner' | 'admin' | 'member'

export interface Database {
  public: {
    Tables: {
      workspaces: {
        Row: {
          id: string
          name: string
          invite_code: string
          created_by: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['workspaces']['Row'], 'id' | 'created_at'>
        Update: Partial<Pick<Database['public']['Tables']['workspaces']['Row'], 'name' | 'invite_code'>>
        Relationships: []
      }
      workspace_members: {
        Row: {
          id: string
          workspace_id: string
          user_id: string
          role: WorkspaceRole
          joined_at: string
        }
        Insert: Omit<Database['public']['Tables']['workspace_members']['Row'], 'id' | 'joined_at'>
        Update: Pick<Database['public']['Tables']['workspace_members']['Row'], 'role'>
        Relationships: []
      }
      doctors: {
        Row: {
          id: string
          workspace_id: string
          created_by_user_id: string
          owner_user_id: string | null
          full_name: string
          crm: string
          crm_uf: string
          cns: string | null
          cpf: string | null
          specialty: string | null
          phone: string | null
          email: string | null
          signature_image_url: string | null
          is_active: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['doctors']['Row'], 'id' | 'created_at'>
        Update: Partial<Omit<Database['public']['Tables']['doctors']['Insert'], 'workspace_id' | 'created_by_user_id'>>
        Relationships: []
      }
      health_facilities: {
        Row: {
          id: string
          workspace_id: string
          name: string
          cnes: string | null
          cnpj: string | null
          address: string | null
          phone: string | null
          city: string | null
          state: string | null
          is_active: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['health_facilities']['Row'], 'id' | 'created_at'>
        Update: Partial<Omit<Database['public']['Tables']['health_facilities']['Insert'], 'workspace_id'>>
        Relationships: []
      }
      patients: {
        Row: {
          id: string
          workspace_id: string
          created_by_user_id: string
          full_name: string
          social_name: string | null
          mother_name: string | null
          cpf: string | null
          cns: string | null
          birth_date: string | null
          sex: 'M' | 'F' | 'O' | null
          race_ethnicity: 'Branca' | 'Preta' | 'Parda' | 'Amarela' | 'Indígena' | null
          ethnicity_detail: string | null
          weight_kg: number | null
          height_cm: number | null
          phone: string | null
          email: string | null
          address: string | null
          is_incapable: boolean
          responsible_name: string | null
          internal_notes: string | null
          last_seen_by_user_id: string | null
          last_seen_at: string | null
          deleted_at: string | null
          deleted_by_user_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['patients']['Row'], 'id' | 'created_at' | 'updated_at' | 'deleted_at' | 'deleted_by_user_id'>
          & Partial<Pick<Database['public']['Tables']['patients']['Row'], 'deleted_at' | 'deleted_by_user_id'>>
        Update: Partial<Omit<Database['public']['Tables']['patients']['Insert'], 'workspace_id' | 'created_by_user_id'>>
        Relationships: []
      }
      lmes: {
        Row: {
          id: string
          workspace_id: string
          patient_id: string
          doctor_id: string
          facility_id: string
          created_by_user_id: string
          last_edited_by_user_id: string | null
          disease: Disease
          request_type: RequestType
          cid10: string
          status: LmeStatus
          lme_data: Json
          specific_form_data: Json | null
          prescription_data: Json
          patient_snapshot: Json
          doctor_snapshot: Json
          facility_snapshot: Json
          lme_pdf_url: string | null
          specific_form_pdf_url: string | null
          prescription_pdf_url: string | null
          parent_lme_id: string | null
          next_renewal_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['lmes']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Database['public']['Tables']['lmes']['Insert'], 'workspace_id' | 'patient_id' | 'created_by_user_id'>>
        Relationships: []
      }
      audit_logs: {
        Row: {
          id: number
          workspace_id: string | null
          user_id: string | null
          action: string
          resource_type: string | null
          resource_id: string | null
          metadata: Json | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['audit_logs']['Row'], 'id' | 'created_at'>
        Update: never
        Relationships: []
      }
      legal_acceptances: {
        Row: {
          id: string
          user_id: string
          terms_version: string
          privacy_version: string
          accepted_at: string
          ip_address: string | null
          user_agent: string | null
          source: string
          metadata: Json
          terms_snapshot: Json | null
          privacy_snapshot: Json | null
        }
        Insert: Omit<Database['public']['Tables']['legal_acceptances']['Row'], 'id' | 'accepted_at'>
          & Partial<Pick<Database['public']['Tables']['legal_acceptances']['Row'], 'id' | 'accepted_at' | 'ip_address' | 'user_agent' | 'source' | 'metadata' | 'terms_snapshot' | 'privacy_snapshot'>>
        Update: never
        Relationships: []
      }
      security_alerts: {
        Row: {
          id: number
          severity: 'low' | 'medium' | 'high'
          type: string
          title: string
          description: string
          workspace_id: string | null
          user_id: string | null
          resource_type: string | null
          resource_id: string | null
          ip_address: string | null
          user_agent: string | null
          metadata: Json
          emailed_at: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['security_alerts']['Row'], 'id' | 'created_at'>
          & Partial<Pick<Database['public']['Tables']['security_alerts']['Row'], 'id' | 'created_at' | 'metadata' | 'emailed_at'>>
        Update: never
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      user_workspace_ids: {
        Args: Record<PropertyKey, never>
        Returns: string[]
      }
      generate_invite_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      join_workspace_by_invite: {
        Args: { invite: string }
        Returns: string
      }
      create_workspace_with_owner: {
        Args: { workspace_name: string; invite: string }
        Returns: string
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

// Tipos derivados para uso no frontend
export type Workspace = Database['public']['Tables']['workspaces']['Row']
export type WorkspaceMember = Database['public']['Tables']['workspace_members']['Row']
export type Doctor = Database['public']['Tables']['doctors']['Row']
export type HealthFacility = Database['public']['Tables']['health_facilities']['Row']
export type Patient = Database['public']['Tables']['patients']['Row']
export type Lme = Database['public']['Tables']['lmes']['Row']
export type AuditLog = Database['public']['Tables']['audit_logs']['Row']
export type LegalAcceptance = Database['public']['Tables']['legal_acceptances']['Row']
