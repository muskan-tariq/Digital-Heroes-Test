import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type UserRole = 'user' | 'admin'
export type SubStatus = 'active' | 'inactive' | 'past_due' | 'canceled'

export interface Profile {
  id: string
  email: string
  role: UserRole
  sub_status: SubStatus
  sub_renewal_date: string | null
  charity_id: string | null
  charity_percentage: number
  mock_balance: number
  created_at: string
}

export interface Score {
  id: string
  user_id: string
  date: string
  score: number
  created_at: string
}

export interface Charity {
  id: string
  name: string
  description: string
  image_url: string | null
  website_url: string | null
  is_featured?: boolean
  upcoming_events?: string
  created_at: string
}

export interface Draw {
  id: string
  month: string
  status: 'draft' | 'published'
  winning_numbers: number[]
  total_pool: number
  match_5_pool: number
  match_4_pool: number
  match_3_pool: number
  jackpot_rollover: number
  executed_at: string
}

export interface UserDraw {
  id: string
  draw_id: string
  user_id: string
  user_scores: number[]
  matches: number
  winnings: number
  created_at: string
}

export interface Verification {
  id: string
  user_id: string
  draw_id: string
  proof_url: string
  status: 'pending' | 'approved' | 'rejected' | 'paid'
  created_at: string
}
