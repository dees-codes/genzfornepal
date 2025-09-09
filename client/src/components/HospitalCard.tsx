import { Phone, MapPin, Clock, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Hospital } from "@shared/schema";

interface HospitalCardProps {
  hospital: Hospital;
  onCall: (phone: string) => void;
  onDirections: (address: string) => void;
}

export function HospitalCard({ hospital, onCall, onDirections }: HospitalCardProps) {
  const getStatusBadge = () => {
    if (hospital.isFree) {
      return (
        <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
          <span className="mr-1">✓</span>
          Free
        </Badge>
      );
    }
    
    if (hospital.isVerified) {
      return (
        <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
          <span className="mr-1">⭐</span>
          Verified
        </Badge>
      );
    }
    
    return (
      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 text-xs">
        <span className="mr-1">$</span>
        Paid
      </Badge>
    );
  };

  const calculateDistance = () => {
    // Mock distance calculation - in real app, use geolocation API
    return `${(Math.random() * 5 + 0.5).toFixed(1)} km away`;
  };

  return (
    <div className="border-b border-border bg-white" data-testid={`hospital-card-${hospital.id}`}>
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-foreground pr-2" data-testid={`hospital-name-${hospital.id}`}>
            {hospital.name}
          </h3>
          {getStatusBadge()}
        </div>
        
        <div className="space-y-2 text-sm text-muted-foreground mb-3">
          <div className="flex items-center">
            <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
            <span data-testid={`hospital-address-${hospital.id}`}>{hospital.address}</span>
          </div>
          <div className="flex items-center">
            <span className="w-4 h-4 mr-2 flex-shrink-0 text-center">🏥</span>
            <span data-testid={`hospital-services-${hospital.id}`}>{hospital.services}</span>
          </div>
          <div className="flex items-center">
            <Clock className="w-4 h-4 mr-2 flex-shrink-0" />
            <span>{calculateDistance()} • {hospital.openHours}</span>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <Button 
            onClick={() => onCall(hospital.phone)}
            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 py-2.5 px-4 rounded-lg font-medium text-sm min-h-[44px] flex items-center justify-center"
            data-testid={`button-call-${hospital.id}`}
          >
            <Phone className="w-4 h-4 mr-2" />
            Call Now
          </Button>
          <Button 
            onClick={() => onDirections(hospital.address)}
            variant="secondary"
            className="flex-1 bg-secondary text-secondary-foreground hover:bg-secondary/90 py-2.5 px-4 rounded-lg font-medium text-sm min-h-[44px] flex items-center justify-center"
            data-testid={`button-directions-${hospital.id}`}
          >
            <Navigation className="w-4 h-4 mr-2" />
            Directions
          </Button>
        </div>
      </div>
    </div>
  );
}
