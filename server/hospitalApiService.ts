// Hospital API service using OpenStreetMap Overpass API (free)
// Fetches real hospital data instead of using mock data

export interface OSMHospital {
  id: string;
  name: string;
  lat: number;
  lon: number;
  tags: {
    amenity?: string;
    healthcare?: string;
    name?: string;
    phone?: string;
    website?: string;
    opening_hours?: string;
    addr_full?: string;
    addr_street?: string;
    addr_city?: string;
    emergency?: string;
    [key: string]: any;
  };
}

export interface NormalizedHospital {
  id: string;
  name: string;
  address: string;
  district: string;
  phone: string;
  services: string;
  latitude: string;
  longitude: string;
  isFree: boolean;
  isVerified: boolean;
  isEmergency: boolean;
  openHours: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Fetch hospitals from OpenStreetMap Overpass API within a bounding box
 * @param lat - Center latitude
 * @param lng - Center longitude 
 * @param radiusKm - Search radius in kilometers
 */
export async function fetchHospitalsFromOSM(lat: number, lng: number, radiusKm: number = 50): Promise<NormalizedHospital[]> {
  try {
    // Calculate bounding box (approximate)
    const latDelta = radiusKm / 111; // 1 degree lat ≈ 111km
    const lngDelta = radiusKm / (111 * Math.cos(lat * Math.PI / 180)); // Account for longitude variation
    
    const south = lat - latDelta;
    const north = lat + latDelta;
    const west = lng - lngDelta;
    const east = lng + lngDelta;

    // Overpass QL query for hospitals and clinics
    const overpassQuery = `
      [out:json][timeout:25];
      (
        node["amenity"="hospital"](${south},${west},${north},${east});
        way["amenity"="hospital"](${south},${west},${north},${east});
        relation["amenity"="hospital"](${south},${west},${north},${east});
        node["amenity"="clinic"](${south},${west},${north},${east});
        way["amenity"="clinic"](${south},${west},${north},${east});
        node["healthcare"="hospital"](${south},${west},${north},${east});
        way["healthcare"="hospital"](${south},${west},${north},${east});
      );
      out center;
    `;

    console.log(`Fetching hospitals from OSM for bounds: ${south},${west},${north},${east}`);
    
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `data=${encodeURIComponent(overpassQuery)}`,
    });

    if (!response.ok) {
      throw new Error(`Overpass API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`OSM returned ${data.elements?.length || 0} hospital elements`);

    if (!data.elements || !Array.isArray(data.elements)) {
      console.warn('No elements returned from Overpass API');
      return [];
    }

    // Convert OSM data to normalized format
    const hospitals: NormalizedHospital[] = data.elements
      .filter((element: any) => {
        // Filter out elements without proper coordinates or names
        const hasCoords = element.lat && element.lon;
        const hasName = element.tags?.name || element.tags?.['name:en'];
        return hasCoords && hasName;
      })
      .map((element: any) => normalizeOSMHospital(element))
      .filter((hospital: NormalizedHospital | null) => hospital !== null) as NormalizedHospital[];

    console.log(`Normalized ${hospitals.length} hospitals from OSM data`);
    return hospitals;

  } catch (error) {
    console.error('Error fetching hospitals from OSM:', error);
    return [];
  }
}

/**
 * Convert OSM element to normalized hospital format
 */
function normalizeOSMHospital(element: any): NormalizedHospital | null {
  try {
    const tags = element.tags || {};
    
    // Use center coordinates for ways/relations, direct coordinates for nodes
    const lat = element.center?.lat || element.lat;
    const lng = element.center?.lon || element.lon;
    
    if (!lat || !lng) {
      console.warn('Skipping element without coordinates:', element.id);
      return null;
    }

    const name = tags.name || tags['name:en'] || tags['name:ne'] || `Hospital ${element.id}`;
    
    // Build address from available components
    const addressParts = [
      tags['addr:street'],
      tags['addr:city'] || tags['addr:district'],
      tags['addr:state'] || tags['addr:province']
    ].filter(Boolean);
    
    const address = addressParts.length > 0 
      ? addressParts.join(', ')
      : tags.addr_full || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

    // Determine district (fallback chain)
    const district = tags['addr:city'] || 
                    tags['addr:district'] || 
                    tags['addr:state'] || 
                    tags['addr:province'] ||
                    inferDistrictFromCoordinates(lat, lng);

    // Determine if it's an emergency facility
    const isEmergency = tags.emergency === 'yes' || 
                       tags.healthcare === 'hospital' ||
                       tags.amenity === 'hospital' ||
                       name.toLowerCase().includes('emergency');

    // Services based on healthcare specialties and types
    const services = buildServicesString(tags);

    // Phone number cleaning
    const phone = cleanPhoneNumber(tags.phone || tags['contact:phone'] || '');

    // Opening hours
    const openHours = tags.opening_hours || (isEmergency ? '24/7' : 'Unknown');

    // Assume public hospitals are free, private might not be
    const isFree = !name.toLowerCase().includes('private') && 
                   !name.toLowerCase().includes('pvt') &&
                   !tags.operator?.toLowerCase().includes('private');

    return {
      id: `osm_${element.type}_${element.id}`,
      name,
      address,
      district,
      phone,
      services,
      latitude: lat.toString(),
      longitude: lng.toString(),
      isFree,
      isVerified: true, // OSM data is community verified
      isEmergency,
      openHours,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

  } catch (error) {
    console.error('Error normalizing OSM hospital:', error);
    return null;
  }
}

/**
 * Build services string from OSM healthcare tags
 */
function buildServicesString(tags: any): string {
  const services: string[] = [];
  
  // Emergency services
  if (tags.emergency === 'yes' || tags.amenity === 'hospital') {
    services.push('Emergency');
  }
  
  // Healthcare specialties
  if (tags['healthcare:speciality']) {
    const specialties = tags['healthcare:speciality'].split(';').map((s: string) => s.trim());
    services.push(...specialties);
  }
  
  // Common medical services based on tags
  if (tags.surgery === 'yes') services.push('Surgery');
  if (tags.icu === 'yes' || tags.intensive_care === 'yes') services.push('ICU');
  if (tags.pharmacy === 'yes') services.push('Pharmacy');
  if (tags.laboratory === 'yes') services.push('Laboratory');
  if (tags.radiology === 'yes' || tags['medical:radiology'] === 'yes') services.push('Radiology');
  if (tags.cardiology === 'yes') services.push('Cardiology');
  if (tags.maternity === 'yes') services.push('Maternity');
  
  // Healthcare type fallbacks
  if (services.length === 0) {
    if (tags.healthcare === 'hospital') {
      services.push('General Medicine', 'Emergency');
    } else if (tags.healthcare === 'clinic') {
      services.push('General Medicine');
    } else if (tags.amenity === 'hospital') {
      services.push('General Medicine', 'Emergency');
    } else if (tags.amenity === 'clinic') {
      services.push('Outpatient Care');
    }
  }
  
  return services.length > 0 ? services.join(', ') : 'Medical Services';
}

/**
 * Clean and format phone numbers
 */
function cleanPhoneNumber(phone: string): string {
  if (!phone) return '';
  
  // Remove common prefixes and clean formatting
  return phone
    .replace(/^\+977[-\s]?/, '') // Remove Nepal country code
    .replace(/[-\s()]/g, '') // Remove formatting
    .replace(/^0/, '') // Remove leading zero
    .trim();
}

/**
 * Infer district from coordinates (basic Nepal districts)
 */
function inferDistrictFromCoordinates(lat: number, lng: number): string {
  // Simple coordinate-based district inference for Nepal
  // This is a rough approximation - in production you'd use a proper geocoding service
  
  if (lat >= 27.65 && lat <= 27.75 && lng >= 85.25 && lng <= 85.40) {
    return 'Kathmandu';
  } else if (lat >= 27.60 && lat <= 27.70 && lng >= 85.20 && lng <= 85.35) {
    return 'Lalitpur';
  } else if (lat >= 27.65 && lat <= 27.73 && lng >= 85.35 && lng <= 85.50) {
    return 'Bhaktapur';
  } else if (lat >= 28.10 && lat <= 28.30 && lng >= 83.90 && lng <= 84.20) {
    return 'Pokhara';
  } else if (lat >= 26.40 && lat <= 26.60 && lng >= 87.20 && lng <= 87.40) {
    return 'Biratnagar';
  } else if (lat >= 28.00 && lat <= 28.30) {
    return 'Gandaki';
  } else if (lat >= 27.00 && lat <= 28.00) {
    return 'Bagmati';
  } else if (lat >= 26.00 && lat <= 27.00) {
    return 'Janakpur';
  } else {
    return 'Nepal';
  }
}

/**
 * Test function to check OSM coverage in Nepal
 */
export async function testOSMCoverageNepal(): Promise<void> {
  console.log('Testing OSM hospital coverage in major Nepal cities...');
  
  // Test major Nepal cities
  const testLocations = [
    { name: 'Kathmandu', lat: 27.7172, lng: 85.3240 },
    { name: 'Pokhara', lat: 28.2096, lng: 83.9856 },
    { name: 'Lalitpur', lat: 27.6588, lng: 85.3247 },
    { name: 'Biratnagar', lat: 26.4525, lng: 87.2718 },
  ];
  
  for (const location of testLocations) {
    try {
      const hospitals = await fetchHospitalsFromOSM(location.lat, location.lng, 25);
      console.log(`${location.name}: Found ${hospitals.length} hospitals`);
      if (hospitals.length > 0) {
        console.log(`Sample: ${hospitals[0].name} at ${hospitals[0].address}`);
      }
    } catch (error) {
      console.error(`Error testing ${location.name}:`, error);
    }
  }
}
