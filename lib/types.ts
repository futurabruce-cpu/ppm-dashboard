export type Role = 'superadmin' | 'admin' | 'engineer'

export interface Company {
  id: string
  name: string
  created_at: string
}

export interface Profile {
  id: string
  company_id: string | null
  full_name: string | null
  role: Role
  created_at: string
  companies?: Company
}

export interface Submission {
  id: string
  company_id: string
  engineer_id: string
  sheet_type: 'lfl' | 'voca'
  site_name: string | null
  site_address: string | null
  service_date: string | null
  answers: Record<string, unknown>
  pdf_url: string | null
  created_at: string
  profiles?: Profile
  companies?: Company
}
