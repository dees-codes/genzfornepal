import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Heart, Search, MapPin, Phone, Menu, LogOut, Plus, CheckCircle, Database, Anchor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { HospitalCard } from "@/components/HospitalCard";
import { BloodRequestCard } from "@/components/BloodRequestCard";
import { LoadingSpinner, LoadingOverlay } from "@/components/LoadingSpinner";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { Hospital, BloodRequest } from "@shared/schema";
import nepalFlagImg from "@assets/nepal_1757378776656.png";
import luffyFlagImg from "@assets/image_1757378783453.png";

type TabType = 'hospitals' | 'blood' | 'admin';

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
  const [userLocation, setUserLocation] = useState('Dhaka, Bangladesh');

  // Public portal - no authentication required
  const user = null;
  const isAuthenticated = false;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch hospitals
  const { data: hospitals = [], isLoading: hospitalsLoading } = useQuery<Hospital[]>({
    queryKey: ['/api/hospitals', hospitalFilters, hospitalSearch],
    enabled: activeTab === 'hospitals',
  });

  // Fetch blood requests  
  const { data: bloodRequests = [], isLoading: bloodLoading } = useQuery<BloodRequest[]>({
    queryKey: ['/api/blood-requests', bloodFilters, bloodSearch],
    enabled: activeTab === 'blood',
  });

  // Admin features disabled in public portal
  const adminStats = { totalHospitals: 0, activeBloodRequests: 0, pendingVerifications: 0, lastUpdated: new Date().toISOString() };
  const adminStatsLoading = false;
  const pendingData = { hospitals: [], bloodRequests: [] };
  const pendingLoading = false;

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // In a real app, reverse geocode the coordinates
          setUserLocation('📍 Location detected');
        },
        (error) => {
          console.log('Location error:', error);
        }
      );
    }
  }, []);

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

  const refreshLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation('📍 Location updated');
          toast({
            title: "Location updated",
            description: "Your location has been refreshed",
          });
        },
        (error) => {
          toast({
            title: "Location error",
            description: "Could not update your location",
            variant: "destructive",
          });
        }
      );
    }
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
        {userLocation}
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

    return (
      <div>
        <div className="bg-primary text-primary-foreground p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold">Admin Dashboard</h2>
              <p className="text-sm opacity-90">Welcome, {user.firstName}</p>
            </div>
          </div>
        </div>

        {adminStatsLoading ? (
          <div className="p-4 flex justify-center">
            <LoadingSpinner size="md" />
          </div>
        ) : (
          <div className="p-4 bg-gray-50">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-primary" data-testid="stat-total-hospitals">
                  {adminStats?.totalHospitals || 0}
                </div>
                <div className="text-xs text-muted-foreground">Total Hospitals</div>
              </div>
              <div className="bg-white p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-primary" data-testid="stat-blood-requests">
                  {adminStats?.activeBloodRequests || 0}
                </div>
                <div className="text-xs text-muted-foreground">Active Blood Requests</div>
              </div>
              <div className="bg-white p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-accent" data-testid="stat-pending-verifications">
                  {adminStats?.pendingVerifications || 0}
                </div>
                <div className="text-xs text-muted-foreground">Pending Verifications</div>
              </div>
              <div className="bg-white p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600" data-testid="stat-last-update">
                  Recent
                </div>
                <div className="text-xs text-muted-foreground">Last Updated</div>
              </div>
            </div>
          </div>
        )}

        <div className="p-4 space-y-3">
          <Button 
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 py-3 px-4 rounded-lg font-medium min-h-[44px] flex items-center justify-center"
            data-testid="button-add-hospital"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New Hospital
          </Button>
          
          <Button 
            className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90 py-3 px-4 rounded-lg font-medium min-h-[44px] flex items-center justify-center"
            data-testid="button-add-blood-request"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Blood Request
          </Button>
          
          <Button 
            className="w-full bg-accent text-accent-foreground hover:bg-accent/90 py-3 px-4 rounded-lg font-medium min-h-[44px] flex items-center justify-center"
            data-testid="button-pending-verifications"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Review Pending ({adminStats?.pendingVerifications || 0})
          </Button>
          
          <Button 
            className="w-full bg-muted text-muted-foreground hover:bg-muted/90 py-3 px-4 rounded-lg font-medium min-h-[44px] flex items-center justify-center"
            data-testid="button-manage-database"
          >
            <Database className="w-4 h-4 mr-2" />
            Manage Database
          </Button>
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
          className={`flex-1 py-3 px-2 text-center min-h-[60px] flex flex-col items-center justify-center rounded-none ${
            activeTab === 'hospitals' ? 'text-primary' : 'text-muted-foreground'
          }`}
          data-testid="bottom-tab-hospitals"
        >
          <span className="text-lg mb-1">🏥</span>
          <span className="text-xs font-medium">Hospitals</span>
        </Button>
        
        <Button
          variant="ghost"
          onClick={() => setActiveTab('blood')}
          className={`flex-1 py-3 px-2 text-center min-h-[60px] flex flex-col items-center justify-center rounded-none ${
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
          className={`flex-1 py-3 px-2 text-center min-h-[60px] flex flex-col items-center justify-center rounded-none ${
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

      {/* Emergency FAB */}
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
