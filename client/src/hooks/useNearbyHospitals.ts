import { useQuery } from "@tanstack/react-query";
import type { HospitalWithDistance } from "@shared/schema";

interface UseNearbyHospitalsProps {
  latitude: number | null;
  longitude: number | null;
  radius?: number;
  enabled?: boolean;
}

export function useNearbyHospitals({ 
  latitude, 
  longitude, 
  radius = 50, 
  enabled = true 
}: UseNearbyHospitalsProps) {
  return useQuery<HospitalWithDistance[]>({
    queryKey: ['nearby-hospitals', latitude, longitude, radius],
    queryFn: async () => {
      if (!latitude || !longitude) {
        throw new Error('Location coordinates are required');
      }

      const params = new URLSearchParams({
        lat: latitude.toString(),
        lng: longitude.toString(),
        radius: radius.toString(),
      });

      const url = `/api/hospitals/nearby?${params.toString()}`;
      const res = await fetch(url, { credentials: "include" });
      
      if (!res.ok) {
        throw new Error(`${res.status}: ${res.statusText}`);
      }
      
      return res.json();
    },
    enabled: enabled && latitude !== null && longitude !== null,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
}
