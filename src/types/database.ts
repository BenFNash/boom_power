export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          name: string | null
          roles: Json
          company_id: string | null
          created_at: string
        }
        Insert: {
          id: string
          email: string
          name?: string | null
          roles?: Json
          company_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          roles?: Json
          company_id?: string | null
          created_at?: string
        }
      }
      roles: {
        Row: {
          id: string
          role_name: string
          created_at: string
        }
        Insert: {
          id?: string
          role_name: string
          created_at?: string
        }
        Update: {
          id?: string
          role_name?: string
          created_at?: string
        }
      }
      companies: {
        Row: {
          id: string
          company_name: string
          active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          company_name: string
          active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          company_name?: string
          active?: boolean
          created_at?: string
        }
      }
      sites: {
        Row: {
          id: string
          site_name: string
          site_owner_company_id: string
          active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          site_name: string
          site_owner_company_id: string
          active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          site_name?: string
          site_owner_company_id?: string
          active?: boolean
          created_at?: string
        }
      }

      company_contacts: {
        Row: {
          id: string
          company_id: string
          contact_name: string
          contact_email: string
          active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          company_id: string
          contact_name: string
          contact_email: string
          active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          contact_name?: string
          contact_email?: string
          active?: boolean
          created_at?: string
        }
      }
      tickets: {
        Row: {
          id: string
          ticket_number: string
          site_id: string
          site_owner_company_id: string
          ticket_type: string
          priority: string
          date_raised: string
          who_raised_id: string
          target_completion_date: string
          due_date: string | null
          assigned_company_id: string | null
          assigned_contact_id: string | null
          subject_title: string
          description: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          ticket_number: string
          site_id: string
          site_owner_company_id: string
          ticket_type: string
          priority: string
          date_raised?: string
          who_raised_id: string
          target_completion_date: string
          due_date?: string | null
          assigned_company_id?: string | null
          assigned_contact_id?: string | null
          subject_title: string
          description?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          ticket_number?: string
          site_id?: string
          site_owner_company_id?: string
          ticket_type?: string
          priority?: string
          date_raised?: string
          who_raised_id?: string
          target_completion_date?: string
          due_date?: string | null
          assigned_company_id?: string | null
          assigned_contact_id?: string | null
          subject_title?: string
          description?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      communications: {
        Row: {
          id: string
          ticket_id: string
          user_id: string
          message: string
          created_at: string
        }
        Insert: {
          id?: string
          ticket_id: string
          user_id: string
          message: string
          created_at?: string
        }
        Update: {
          id?: string
          ticket_id?: string
          user_id?: string
          message?: string
          created_at?: string
        }
      }
      attachments: {
        Row: {
          id: string
          ticket_id: string
          communication_id: string | null
          uploaded_by: string
          file_url: string
          file_name: string
          file_type: string
          file_size: number
          created_at: string
        }
        Insert: {
          id?: string
          ticket_id: string
          communication_id?: string | null
          uploaded_by: string
          file_url: string
          file_name: string
          file_type: string
          file_size: number
          created_at?: string
        }
        Update: {
          id?: string
          ticket_id?: string
          communication_id?: string | null
          uploaded_by?: string
          file_url?: string
          file_name?: string
          file_type?: string
          file_size?: number
          created_at?: string
        }
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
  }
}