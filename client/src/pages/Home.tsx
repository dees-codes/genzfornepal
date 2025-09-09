import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Heart, Search, MapPin, Phone, Menu, LogOut, Plus, CheckCircle, Database, Anchor, Navigation, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useNearbyHospitals } from "@/hooks/useNearbyHospitals";
import { useSupabaseNearbyHospitals, useSupabaseHospitals } from "@/hooks/useSupabaseHospitals";
import { HospitalCard } from "@/components/HospitalCard";
import { BloodRequestCard } from "@/components/BloodRequestCard";
import { LoadingSpinner, LoadingOverlay } from "@/components/LoadingSpinner";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { Hospital, BloodRequest } from "@shared/schema";
import nepalFlagImg from "@assets/nepal_1757378776656.png";
import luffyFlagImg from "@assets/image_1757378783453.png";

type TabType = 'hospitals' | 'blood' | 'admin' | 'nearby';

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>('hospitals');
  const [hospitalSearch, setHospitalSearch] = useState('');
  const [bloodSearch, setBloodSearch] = useState('');
  const [hospitalFilters, setHospitalFilters] = useState({
    district: '',
    isFree: false,
    isEmergency: false
  });
  const [bloodFilters, setBloodFilters] = useState({
    bloodGroup: '',
    urgency: '',
    district: ''
  });
  const [showMenu, setShowMenu] = useState(false);

  // Manual coordinate override state
  const [useManualCoords, setUseManualCoords] = useState(false);
  const [manualLat, setManualLat] = useState<string>('');
  const [manualLng, setManualLng] = useState<string>('');
  const [manualRadius, setManualRadius] = useState<string>('50');

  // Initialize from URL params if present
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pLat = params.get('lat');
    const pLng = params.get('lng');
    const pRadius = params.get('radius');
    if (pLat && pLng) {
      setUseManualCoords(true);
      setManualLat(pLat);
      setManualLng(pLng);
      if (pRadius) setManualRadius(pRadius);
      setActiveTab('nearby');
    }
  }, []);

  // Public portal - no authentication required
  const user = null;
  const isAuthenticated = false;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Geolocation
  const { latitude, longitude, error: locationError, loading: locationLoading, refreshLocation } = useGeolocation();

  // Effective coordinates (manual override takes precedence when enabled)
  const effectiveLatitude: number | null = useManualCoords && manualLat !== '' ? Number(manualLat) : (latitude ?? null);
  const effectiveLongitude: number | null = useManualCoords && manualLng !== '' ? Number(manualLng) : (longitude ?? null);
  const effectiveRadius: number = useManualCoords && manualRadius !== '' ? Number(manualRadius) : 50;

  // Nearby hospitals (using Supabase)
  const { data: nearbyHospitals = [], isLoading: nearbyLoading } = useSupabaseNearbyHospitals({
    latitude: effectiveLatitude,
    longitude: effectiveLongitude,
    radius: effectiveRadius,
    enabled: activeTab === 'nearby' && effectiveLatitude !== null && effectiveLongitude !== null,
    emergencyOnly: hospitalFilters.isEmergency,
    freeOnly: hospitalFilters.isFree,
    district: hospitalFilters.district || undefined,
  });

  // Fetch hospitals (using Supabase)
  const { data: hospitals = [], isLoading: hospitalsLoading } = useSupabaseHospitals({
    district: hospitalFilters.district || undefined,
    emergencyOnly: hospitalFilters.isEmergency,
    freeOnly: hospitalFilters.isFree,
    search: hospitalSearch || undefined,
    enabled: activeTab === 'hospitals',
  });

  // Fetch blood requests  
  const { data: bloodRequests = [], isLoading: bloodLoading } = useQuery<BloodRequest[]>({
    queryKey: ['blood-requests', bloodFilters, bloodSearch],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (bloodFilters.bloodGroup) params.append('bloodGroup', bloodFilters.bloodGroup);
      if (bloodFilters.urgency) params.append('urgency', bloodFilters.urgency);
      if (bloodFilters.district) params.append('district', bloodFilters.district);
      if (bloodSearch) params.append('search', bloodSearch);
      
      const url = `/api/blood-requests${params.toString() ? `?${params.toString()}` : ''}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);
      return res.json();
    },
    enabled: activeTab === 'blood',
  });

  // Admin features disabled in public portal
  const adminStats = { totalHospitals: 0, activeBloodRequests: 0, pendingVerifications: 0, lastUpdated: new Date().toISOString() };
  const adminStatsLoading = false;
  const pendingData = { hospitals: [], bloodRequests: [] };
  const pendingLoading = false;


  const handleCall = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  const handleWhatsApp = (phone: string) => {
    const message = encodeURIComponent('Hello, I saw your blood request. I would like to help.');
    window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${message}`, '_blank');
  };

  const handleDirections = (address: string) => {
    const encodedAddress = encodeURIComponent(address);
    window.open(`https://www.google.com/maps/search/${encodedAddress}`, '_blank');
  };


  const handleEmergencyCall = () => {
    if (confirm('Call Nepal emergency services (102/103/108)?')) {
      window.location.href = 'tel:102';
    }
  };

  const renderHeader = () => (
    <header className="bg-primary text-primary-foreground p-4 sticky top-0 z-40">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-6 h-6">
            <img 
              src={luffyFlagImg} 
              alt="One Piece" 
              className="w-full h-full object-contain rounded"
            />
          </div>
          <div>
            <h1 className="text-lg font-bold">Gen Z for Nepal</h1>
            <p className="text-xs opacity-90">Health Portal</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-6 h-5 opacity-90">
            <img 
              src={nepalFlagImg} 
              alt="Nepal" 
              className="w-full h-full object-contain"
            />
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowMenu(!showMenu)}
            className="text-primary-foreground hover:bg-primary-foreground/10 min-h-[44px] min-w-[44px]"
            data-testid="button-menu"
          >
            <Menu className="w-5 h-5" />
          </Button>
        </div>
      </div>
      
      {showMenu && (
        <div className="absolute top-full left-0 right-0 bg-white shadow-lg border-t border-border z-50">
          <div className="p-4 space-y-2">
            <div className="flex items-center space-x-3 pb-2 border-b">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-xs font-bold text-primary-foreground">
                GZ
              </div>
              <div>
                <p className="font-medium text-foreground">Gen Z for Nepal</p>
                <p className="text-xs text-muted-foreground">Public Health Portal</p>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              Free access to Nepal's emergency health information
            </div>
          </div>
        </div>
      )}
    </header>
  );

  const renderLocationStatus = () => (
    <div className="bg-green-50 border-l-4 border-green-400 p-3 flex items-center space-x-2">
      <MapPin className="w-4 h-4 text-green-600 animate-pulse" />
      <span className="text-sm text-green-800" data-testid="text-user-location">
        {effectiveLatitude !== null && effectiveLongitude !== null 
          ? `📍 ${effectiveLatitude.toFixed(4)}, ${effectiveLongitude.toFixed(4)}${useManualCoords ? ' (Manual)' : ''}` 
          : 'Nepal'}
      </span>
      <Button
        variant="ghost"
        size="sm"
        onClick={refreshLocation}
        className="ml-auto text-green-600 text-xs underline hover:bg-transparent"
        data-testid="button-refresh-location"
      >
        Update
      </Button>
    </div>
  );

  const renderNavigation = () => (
    <nav className="bg-white border-b border-border">
      <div className="flex">
        <Button
          variant="ghost"
          onClick={() => setActiveTab('hospitals')}
          className={`flex-1 py-3 px-4 text-sm font-medium rounded-none ${
            activeTab === 'hospitals' 
              ? 'text-primary border-b-2 border-primary bg-blue-50' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
          data-testid="tab-hospitals"
        >
          🏥 Hospitals
        </Button>
        <Button
          variant="ghost"
          onClick={() => setActiveTab('blood')}
          className={`flex-1 py-3 px-4 text-sm font-medium rounded-none ${
            activeTab === 'blood' 
              ? 'text-primary border-b-2 border-primary bg-red-50' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
          data-testid="tab-blood"
        >
          🩸 Blood Banks
        </Button>
        <Button
          variant="ghost"
          onClick={() => setActiveTab('admin')}
          className={`flex-1 py-3 px-4 text-sm font-medium rounded-none ${
            activeTab === 'admin' 
              ? 'text-primary border-b-2 border-primary bg-accent' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
          data-testid="tab-admin"
        >
          🛡️ Admin
        </Button>
      </div>
    </nav>
  );

  const renderHospitalFilters = () => (
    <div className="p-4 bg-gray-50 space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          type="text"
          placeholder="Search hospitals..."
          value={hospitalSearch}
          onChange={(e) => setHospitalSearch(e.target.value)}
          className="pl-10 pr-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
          data-testid="input-hospital-search"
        />
      </div>
      
      <div className="flex space-x-2 overflow-x-auto pb-2">
        <Button
          variant={!hospitalFilters.isFree && !hospitalFilters.isEmergency ? "default" : "outline"}
          size="sm"
          onClick={() => setHospitalFilters({ district: '', isFree: false, isEmergency: false })}
          className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium"
          data-testid="filter-all-hospitals"
        >
          All
        </Button>
        <Button
          variant={hospitalFilters.isFree ? "default" : "outline"}
          size="sm"
          onClick={() => setHospitalFilters(prev => ({ ...prev, isFree: !prev.isFree }))}
          className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium"
          data-testid="filter-free-hospitals"
        >
          Free/Charity
        </Button>
        <Button
          variant={hospitalFilters.isEmergency ? "default" : "outline"}
          size="sm"
          onClick={() => setHospitalFilters(prev => ({ ...prev, isEmergency: !prev.isEmergency }))}
          className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium"
          data-testid="filter-emergency-hospitals"
        >
          Emergency
        </Button>
      </div>
    </div>
  );

  const renderBloodFilters = () => (
    <div className="p-4 bg-gray-50 space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          type="text"
          placeholder="Search by blood group..."
          value={bloodSearch}
          onChange={(e) => setBloodSearch(e.target.value)}
          className="pl-10 pr-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
          data-testid="input-blood-search"
        />
      </div>
      
      <div className="grid grid-cols-4 gap-2">
        {['All', 'A+', 'B+', 'O+', 'A-', 'B-', 'AB+', 'O-'].map((group) => (
          <Button
            key={group}
            variant={bloodFilters.bloodGroup === group || (group === 'All' && !bloodFilters.bloodGroup) ? "default" : "outline"}
            size="sm"
            onClick={() => setBloodFilters(prev => ({ 
              ...prev, 
              bloodGroup: group === 'All' ? '' : group 
            }))}
            className="py-2 px-3 rounded-lg text-sm font-medium"
            data-testid={`filter-blood-${group.toLowerCase()}`}
          >
            {group}
          </Button>
        ))}
      </div>
      
      <div className="flex space-x-2 overflow-x-auto pb-2">
        <Button
          variant={bloodFilters.urgency === 'critical' ? "destructive" : "outline"}
          size="sm"
          onClick={() => setBloodFilters(prev => ({ 
            ...prev, 
            urgency: prev.urgency === 'critical' ? '' : 'critical' 
          }))}
          className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium"
          data-testid="filter-urgency-critical"
        >
          ⚠️ Critical
        </Button>
        <Button
          variant={bloodFilters.urgency === 'urgent' ? "default" : "outline"}
          size="sm"
          onClick={() => setBloodFilters(prev => ({ 
            ...prev, 
            urgency: prev.urgency === 'urgent' ? '' : 'urgent' 
          }))}
          className="flex-shrink-0 px-3 py-1.5 bg-accent text-accent-foreground rounded-full text-xs font-medium"
          data-testid="filter-urgency-urgent"
        >
          ⏰ Urgent
        </Button>
        <Button
          variant={bloodFilters.urgency === 'normal' ? "default" : "outline"}
          size="sm"
          onClick={() => setBloodFilters(prev => ({ 
            ...prev, 
            urgency: prev.urgency === 'normal' ? '' : 'normal' 
          }))}
          className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium"
          data-testid="filter-urgency-normal"
        >
          Normal
        </Button>
      </div>
    </div>
  );

  const renderAdminPanel = () => {
    return (
      <div className="p-4">
        <div className="max-w-sm mx-auto mt-8 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              🛡️
            </div>
            <h2 className="text-xl font-bold">Admin Panel</h2>
            <p className="text-sm text-muted-foreground mt-2">
              Admin features are not available in the public portal version
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              This is a public information portal for emergency health services
            </p>
          </div>
        </div>
      </div>
    );
  };

  const renderBottomNavigation = () => (
    <nav className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white border-t border-border z-30">
      <div className="flex">
        <Button
          variant="ghost"
          onClick={() => setActiveTab('hospitals')}
          className={`flex-1 py-3 px-1 text-center min-h-[60px] flex flex-col items-center justify-center rounded-none ${
            activeTab === 'hospitals' ? 'text-primary' : 'text-muted-foreground'
          }`}
          data-testid="bottom-tab-hospitals"
        >
          <span className="text-lg mb-1">🏥</span>
          <span className="text-xs font-medium">Hospitals</span>
        </Button>
        
        <Button
          variant="ghost"
          onClick={() => setActiveTab('nearby')}
          className={`flex-1 py-3 px-1 text-center min-h-[60px] flex flex-col items-center justify-center rounded-none ${
            activeTab === 'nearby' ? 'text-primary' : 'text-muted-foreground'
          }`}
          data-testid="bottom-tab-nearby"
        >
          <Navigation className="h-4 w-4 mb-1" />
          <span className="text-xs font-medium">Nearby</span>
        </Button>
        
        <Button
          variant="ghost"
          onClick={() => setActiveTab('blood')}
          className={`flex-1 py-3 px-1 text-center min-h-[60px] flex flex-col items-center justify-center rounded-none ${
            activeTab === 'blood' ? 'text-primary' : 'text-muted-foreground'
          }`}
          data-testid="bottom-tab-blood"
        >
          <span className="text-lg mb-1">🩸</span>
          <span className="text-xs font-medium">Blood</span>
        </Button>
        
        <Button
          variant="ghost"
          onClick={() => setActiveTab('admin')}
          className={`flex-1 py-3 px-1 text-center min-h-[60px] flex flex-col items-center justify-center rounded-none ${
            activeTab === 'admin' ? 'text-primary' : 'text-muted-foreground'
          }`}
          data-testid="bottom-tab-admin"
        >
          <span className="text-lg mb-1">🛡️</span>
          <span className="text-xs font-medium">Admin</span>
        </Button>
      </div>
    </nav>
  );

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen relative">
      {renderHeader()}
      {renderLocationStatus()}
      {renderNavigation()}

      {/* Content Sections */}
      <div className="pb-20">
        {activeTab === 'hospitals' && (
          <div data-testid="section-hospitals">
            {renderHospitalFilters()}
            <div>
              {hospitalsLoading ? (
                <div className="p-8 flex justify-center">
                  <LoadingSpinner size="lg" />
                </div>
              ) : hospitals.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-muted-foreground">No hospitals found</p>
                </div>
              ) : (
                hospitals.map((hospital: Hospital) => (
                  <HospitalCard
                    key={hospital.id}
                    hospital={hospital}
                    onCall={handleCall}
                    onDirections={handleDirections}
                  />
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'nearby' && (
          <div data-testid="section-nearby">
            <div className="p-4 bg-blue-50 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Navigation className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold text-blue-900">Nearby Hospitals</h3>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshLocation}
                  disabled={locationLoading}
                  className="text-xs"
                >
                  <Target className="h-3 w-3 mr-1" />
                  {locationLoading ? 'Locating...' : 'Refresh'}
                </Button>
              </div>

              {/* Manual coordinates controls */}
              <div className="mt-3 bg-white border rounded p-3 space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    id="toggle-manual"
                    type="checkbox"
                    checked={useManualCoords}
                    onChange={(e) => setUseManualCoords(e.target.checked)}
                  />
                  <label htmlFor="toggle-manual" className="text-sm">Enter coordinates manually</label>
                </div>
                {useManualCoords && (
                  <div className="grid grid-cols-3 gap-2">
                    <Input
                      type="number"
                      step="any"
                      placeholder="Latitude"
                      value={manualLat}
                      onChange={(e) => setManualLat(e.target.value)}
                    />
                    <Input
                      type="number"
                      step="any"
                      placeholder="Longitude"
                      value={manualLng}
                      onChange={(e) => setManualLng(e.target.value)}
                    />
                    <Input
                      type="number"
                      step="1"
                      min={1}
                      placeholder="Radius (km)"
                      value={manualRadius}
                      onChange={(e) => setManualRadius(e.target.value)}
                    />
                  </div>
                )}
                {useManualCoords && (
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      onClick={() => {
                        const params = new URLSearchParams(window.location.search);
                        if (manualLat && manualLng) {
                          params.set('lat', manualLat);
                          params.set('lng', manualLng);
                        }
                        if (manualRadius) params.set('radius', manualRadius);
                        const newUrl = `${window.location.pathname}?${params.toString()}`;
                        window.history.replaceState({}, '', newUrl);
                      }}
                    >
                      Apply
                    </Button>
                  </div>
                )}
              </div>

              {locationError && !useManualCoords && (
                <div className="mt-2 p-2 bg-red-100 border border-red-200 rounded text-sm text-red-700">
                  <p>{locationError}</p>
                  <p className="text-xs mt-1">Please enable location access to find nearby hospitals</p>
                </div>
              )}

              {effectiveLatitude !== null && effectiveLongitude !== null && (
                <div className="mt-2 text-sm text-blue-700">
                  <p>📍 Location: {effectiveLatitude.toFixed(4)}, {effectiveLongitude.toFixed(4)}{useManualCoords ? ' (Manual)' : ''}</p>
                  <p className="text-xs">
                    Showing hospitals within {effectiveRadius}km radius
                    {nearbyHospitals.length > 0 && ` • Found ${nearbyHospitals.length} hospitals`}
                  </p>
                </div>
              )}
            </div>

            <div>
              {nearbyLoading ? (
                <div className="p-8 flex justify-center">
                  <LoadingSpinner size="lg" />
                </div>
              ) : (!useManualCoords && locationError) ? (
                <div className="p-8 text-center">
                  <Navigation className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-muted-foreground mb-2">Location access required</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Please enable location services to find nearby hospitals
                  </p>
                  <Button onClick={refreshLocation} variant="outline" size="sm">
                    <Target className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                </div>
              ) : nearbyHospitals.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-muted-foreground mb-2">No hospitals found nearby</p>
                  <p className="text-sm text-muted-foreground">
                    Try expanding the search radius or check your location
                  </p>
                </div>
              ) : (
                nearbyHospitals.map((hospital: any) => (
                  <div key={hospital.id} className="relative">
                    <HospitalCard
                      hospital={hospital}
                      onCall={handleCall}
                      onDirections={handleDirections}
                    />
                    <div className="absolute top-4 right-4 flex flex-col gap-1">
                      <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium text-center">
                        {hospital.distance}km away
                      </div>
                      {hospital.hasRoadDistance && hospital.roadDistance && (
                        <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium text-center">
                          {hospital.roadDistance}km by road
                        </div>
                      )}
                      {!hospital.hasRoadDistance && (
                        <div className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs text-center">
                          Road route unavailable
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'blood' && (
          <div data-testid="section-blood">
            {renderBloodFilters()}
            <div>
              {bloodLoading ? (
                <div className="p-8 flex justify-center">
                  <LoadingSpinner size="lg" />
                </div>
              ) : bloodRequests.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-muted-foreground">No blood requests found</p>
                </div>
              ) : (
                bloodRequests.map((request: BloodRequest) => (
                  <BloodRequestCard
                    key={request.id}
                    request={request}
                    onCall={handleCall}
                    onWhatsApp={handleWhatsApp}
                  />
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'admin' && (
          <div data-testid="section-admin">
            {renderAdminPanel()}
          </div>
        )}
      </div>

      <Button
        onClick={handleEmergencyCall}
        className="fixed bottom-20 right-4 w-14 h-14 bg-red-600 text-white rounded-full shadow-lg hover:bg-red-700 flex items-center justify-center z-40"
        data-testid="button-emergency-fab"
      >
        <Phone className="w-5 h-5" />
      </Button>

      {renderBottomNavigation()}
    </div>
  );
}
