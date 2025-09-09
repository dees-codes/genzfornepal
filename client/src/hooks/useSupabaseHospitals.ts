import { useQuery } from '@tanstack/react-query'
import { getNearbyHospitals, getHospitals, type HospitalWithDistance } from '@/lib/hospitalService'
import type { SupabaseHospital } from '@/lib/supabase'

interface UseNearbyHospitalsParams {
  latitude: number | null
  longitude: number | null
  radius?: number
  enabled?: boolean
  emergencyOnly?: boolean
  freeOnly?: boolean
  district?: string
}

export function useSupabaseNearbyHospitals({
  latitude,
  longitude,
  radius = 50,
  enabled = true,
  emergencyOnly = false,
  freeOnly = false,
  district
}: UseNearbyHospitalsParams) {
  return useQuery<HospitalWithDistance[]>({
    queryKey: ['supabase-nearby-hospitals', latitude, longitude, radius, emergencyOnly, freeOnly, district],
    queryFn: async () => {
      if (!latitude || !longitude) {
        throw new Error('Location coordinates are required')
      }

      return getNearbyHospitals({
        userLat: latitude,
        userLng: longitude,
        radiusKm: radius,
        emergencyOnly,
        freeOnly,
        district,
        includeRoadDistance: true,
        limit: 20
      })
    },
    enabled: enabled && latitude !== null && longitude !== null,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  })
}

export function useSupabaseHospitals({
  district,
  emergencyOnly = false,
  freeOnly = false,
  search,
  enabled = true
}: {
  district?: string
  emergencyOnly?: boolean
  freeOnly?: boolean
  search?: string
  enabled?: boolean
} = {}) {
  return useQuery<SupabaseHospital[]>({
    queryKey: ['supabase-hospitals', district, emergencyOnly, freeOnly, search],
    queryFn: () => getHospitals({ district, emergencyOnly, freeOnly, search }),
    enabled,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}
