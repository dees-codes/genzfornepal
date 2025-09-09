// Distance calculation service with OSRM road distance and Haversine fallback

// Haversine formula for straight-line distance
export function calculateStraightLineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in kilometers
}

// Get road distance using OpenStreetMap OSRM (free)
export async function calculateRoadDistance(lat1: number, lon1: number, lat2: number, lon2: number): Promise<number | null> {
  try {
    // OSRM expects longitude,latitude format (not lat,lng)
    const url = `https://router.project-osrm.org/route/v1/driving/${lon1},${lat1};${lon2},${lat2}?overview=false&alternatives=false&steps=false`;
    
    // Create timeout controller
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch(url, {
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`OSRM API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
      // OSRM returns distance in meters, convert to kilometers
      const distanceKm = data.routes[0].distance / 1000;
      return Math.round(distanceKm * 100) / 100; // Round to 2 decimal places
    }
    
    return null; // No route found
  } catch (error) {
    console.warn('OSRM road distance calculation failed:', error);
    return null; // Fallback to straight-line only
  }
}

// Combined distance calculation with hybrid approach
export async function calculateDistances(lat1: number, lon1: number, lat2: number, lon2: number) {
  const straightLine = Math.round(calculateStraightLineDistance(lat1, lon1, lat2, lon2) * 100) / 100;
  
  // Try to get road distance
  const roadDistance = await calculateRoadDistance(lat1, lon1, lat2, lon2);
  
  return {
    straightLine,
    road: roadDistance,
    hasRoadDistance: roadDistance !== null,
  };
}

// Batch calculate distances for multiple hospitals (more efficient)
export async function calculateBatchDistances(
  userLat: number, 
  userLng: number, 
  hospitals: Array<{ latitude: string; longitude: string; [key: string]: any }>
) {
  const results = await Promise.allSettled(
    hospitals.map(async (hospital) => {
      const hospitalLat = parseFloat(hospital.latitude);
      const hospitalLng = parseFloat(hospital.longitude);
      
      const distances = await calculateDistances(userLat, userLng, hospitalLat, hospitalLng);
      
      return {
        ...hospital,
        distance: distances.straightLine,
        roadDistance: distances.road,
        hasRoadDistance: distances.hasRoadDistance,
      };
    })
  );
  
  // Filter out failed calculations and sort by distance
  return results
    .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
    .map(result => result.value)
    .sort((a, b) => a.distance - b.distance);
}
