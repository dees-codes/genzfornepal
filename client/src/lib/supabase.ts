import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Debug logging
console.log('🔍 Environment Debug:')
console.log('VITE_SUPABASE_URL:', supabaseUrl)
console.log('VITE_SUPABASE_ANON_KEY exists:', !!supabaseAnonKey)

// Use fallback values if environment variables are not available
const finalUrl = supabaseUrl || 'https://nnwyysitmjpwittsljfp.supabase.co'
const finalKey = supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ud3l5c2l0bWpwd2l0dHNsamZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczNzMyNDIsImV4cCI6MjA3Mjk0OTI0Mn0.anAE9ThOiLzKMb4UBr53TEfol2moRNlgsn24TeMoA4o'

if (!supabaseUrl || !supabaseAnonKey) {
  console.log('🔧 Using fallback credentials (env vars not found)')
} else {
  console.log('✅ Using environment variables')
}

export const supabase = createClient(finalUrl, finalKey)

// Database Types matching your table schema
export interface SupabaseHospital {
  id: number
  osm_id: string
  osm_type: string
  name: string
  name_nepali?: string
  latitude: number
  longitude: number
  address?: string
  district?: string
  zone?: string
  phone?: string
  website?: string
  services?: string
  healthcare_type?: string
  emergency: boolean
  is_free: boolean
  opening_hours?: string
  operator?: string
  operator_type?: string
  bed_count?: number
  specialties?: string[]
  created_at: string
  updated_at: string
}

export interface HospitalWithDistance extends SupabaseHospital {
  distance: number
  roadDistance?: number
  hasRoadDistance: boolean
}