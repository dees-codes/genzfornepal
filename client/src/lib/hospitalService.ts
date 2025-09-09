import { supabase, type SupabaseHospital, type HospitalWithDistance } from './supabase'

// Haversine formula for straight-line distance
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

// Calculate bounding box for fast pre-filtering
function getBoundingBox(lat: number, lng: number, radiusKm: number) {
  const earthRadius = 6371
  const latDelta = (radiusKm / earthRadius) * (180 / Math.PI)
  const lngDelta = latDelta / Math.cos(lat * Math.PI / 180)
  
  return {
    minLat: lat - latDelta,
    maxLat: lat + latDelta,
    minLng: lng - lngDelta,
    maxLng: lng + lngDelta
  }
}

// OSRM API for road distance (with timeout)
async function calculateRoadDistance(userLat: number, userLng: number, hospitalLat: number, hospitalLng: number): Promise<number | null> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

    const response = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${userLng},${userLat};${hospitalLng},${hospitalLat}?overview=false&alternatives=false&steps=false`,
      { signal: controller.signal }
    )

    clearTimeout(timeoutId)

    if (!response.ok) return null
    const data = await response.json()
    return data.routes?.[0]?.distance ? Math.round(data.routes[0].distance / 1000 * 10) / 10 : null
  } catch (error) {
    return null // Return null on timeout or error
  }
}

interface GetNearbyHospitalsParams {
  userLat: number
  userLng: number
  radiusKm?: number
  limit?: number
  includeRoadDistance?: boolean
  emergencyOnly?: boolean
  freeOnly?: boolean
  district?: string
}

export async function getNearbyHospitals({
  userLat,
  userLng,
  radiusKm = 50,
  limit = 20,
  includeRoadDistance = true,
  emergencyOnly = false,
  freeOnly = false,
  district
}: GetNearbyHospitalsParams): Promise<HospitalWithDistance[]> {
  
  // Calculate bounding box for pre-filtering (this is the key optimization!)
  const bbox = getBoundingBox(userLat, userLng, radiusKm)
  
  console.log(`🔍 Searching in bounding box: lat ${bbox.minLat.toFixed(4)} to ${bbox.maxLat.toFixed(4)}, lng ${bbox.minLng.toFixed(4)} to ${bbox.maxLng.toFixed(4)}`)
  
  // Build query with bounding box filter
  let query = supabase
    .from('hospitals')
    .select('*')
    .gte('latitude', bbox.minLat)
    .lte('latitude', bbox.maxLat)
    .gte('longitude', bbox.minLng)
    .lte('longitude', bbox.maxLng)

  // Apply additional filters
  if (emergencyOnly) {
    query = query.eq('emergency', true)
  }
  
  if (freeOnly) {
    query = query.eq('is_free', true)
  }
  
  if (district) {
    query = query.eq('district', district)
  }

  // Execute query
  const { data: hospitals, error } = await query

  if (error) {
    console.error('Error fetching hospitals:', error)
    throw error
  }

  if (!hospitals) return []

  console.log(`📊 Bounding box returned ${hospitals.length} hospitals (reduced from ~5000)`)

  // Calculate exact distances and filter by precise radius
  const hospitalsWithDistance: HospitalWithDistance[] = hospitals
    .map((hospital: SupabaseHospital) => {
      const distance = calculateDistance(userLat, userLng, hospital.latitude, hospital.longitude)
      return {
        ...hospital,
        distance: Math.round(distance * 10) / 10,
        hasRoadDistance: false
      }
    })
    .filter(h => h.distance <= radiusKm) // Exact radius filter
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit)

  console.log(`🎯 Final result: ${hospitalsWithDistance.length} hospitals within ${radiusKm}km`)

  // Calculate road distances for closest hospitals (parallel)
  if (includeRoadDistance && hospitalsWithDistance.length > 0) {
    const roadDistancePromises = hospitalsWithDistance.slice(0, 10).map(async (hospital) => {
      const roadDistance = await calculateRoadDistance(userLat, userLng, hospital.latitude, hospital.longitude)
      return {
        ...hospital,
        roadDistance: roadDistance || undefined,
        hasRoadDistance: roadDistance !== null
      }
    })

    const hospitalsWithRoadDistance = await Promise.allSettled(roadDistancePromises)
    
    // Merge road distance results with remaining hospitals
    const result: HospitalWithDistance[] = []
    
    hospitalsWithRoadDistance.forEach((roadResult, index) => {
      result.push(
        roadResult.status === 'fulfilled' 
          ? roadResult.value 
          : hospitalsWithDistance[index]
      )
    })
    
    // Add remaining hospitals without road distance calculation
    if (hospitalsWithDistance.length > 10) {
      result.push(...hospitalsWithDistance.slice(10))
    }
    
    return result
  }

  return hospitalsWithDistance
}

// Get all hospitals (with optional filters)
export async function getHospitals({
  district,
  emergencyOnly = false,
  freeOnly = false,
  search,
  limit = 50
}: {
  district?: string
  emergencyOnly?: boolean
  freeOnly?: boolean
  search?: string
  limit?: number
} = {}) {
  let query = supabase
    .from('hospitals')
    .select('*')

  if (emergencyOnly) query = query.eq('emergency', true)
  if (freeOnly) query = query.eq('is_free', true)
  if (district) query = query.eq('district', district)
  if (search) {
    query = query.or(`name.ilike.%${search}%,address.ilike.%${search}%,services.ilike.%${search}%`)
  }

  query = query.limit(limit)

  const { data, error } = await query

  if (error) throw error
  return data || []
}
