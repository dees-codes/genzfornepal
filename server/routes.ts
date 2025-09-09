import type { Express } from "express";
import { createServer, type Server } from "http";
import { calculateBatchDistances, calculateStraightLineDistance } from "./distanceService";
import { fetchHospitalsFromOSM, testOSMCoverageNepal } from "./hospitalApiService";

// Helper function to get curated Nepal hospitals as fallback
function getMockHospitalsForNepal() {
  return [
    {
      id: "1",
      name: "Kathmandu Medical College (KMC)",
      address: "Sinamangal, Kathmandu",
      district: "Kathmandu",
      phone: "01-4467711",
      services: "Emergency, Surgery, Cardiology, ICU, Pharmacy",
      latitude: "27.7172",
      longitude: "85.3240",
      isFree: true,
      isVerified: true,
      isEmergency: true,
      openHours: "24/7",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "2", 
      name: "Bir Hospital",
      address: "Mahaboudha, Kathmandu",
      district: "Kathmandu",
      phone: "01-4221119",
      services: "Emergency, General Medicine, Surgery, Pediatrics",
      latitude: "27.7025",
      longitude: "85.3140",
      isFree: true,
      isVerified: true,
      isEmergency: true,
      openHours: "24/7",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "3",
      name: "Teaching Hospital (Maharajgunj)",
      address: "Maharajgunj, Kathmandu",
      district: "Kathmandu", 
      phone: "01-4412303",
      services: "Emergency, Surgery, Medicine, Pediatrics, Cardiology, Neurology",
      latitude: "27.7369",
      longitude: "85.3236",
      isFree: true,
      isVerified: true,
      isEmergency: true,
      openHours: "24/7",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "4",
      name: "Patan Hospital",
      address: "Lagankhel, Lalitpur",
      district: "Lalitpur",
      phone: "01-5522278",
      services: "Emergency, Surgery, Medicine, Orthopedics, Pharmacy",
      latitude: "27.6648",
      longitude: "85.3240",
      isFree: true,
      isVerified: true,
      isEmergency: true,
      openHours: "24/7",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "5",
      name: "Civil Service Hospital",
      address: "Minbhawan, Kathmandu",
      district: "Kathmandu",
      phone: "01-4412248",
      services: "Emergency, Medicine, Surgery, Cardiology, Radiology",
      latitude: "27.7216",
      longitude: "85.3206",
      isFree: true,
      isVerified: true,
      isEmergency: true,
      openHours: "24/7",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "6",
      name: "Everest Hospital",
      address: "Basundhara, Kathmandu",
      district: "Kathmandu",
      phone: "01-4217766",
      services: "Emergency, Surgery, Cardiology, ICU, Neurology",
      latitude: "27.7373",
      longitude: "85.3413",
      isFree: true,
      isVerified: true,
      isEmergency: true,
      openHours: "24/7",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "7",
      name: "Tribhuvan University Teaching Hospital",
      address: "Maharajgunj, Kathmandu",
      district: "Kathmandu",
      phone: "01-4412404",
      services: "Emergency, All specialties, Research, Education",
      latitude: "27.7376",
      longitude: "85.3234",
      isFree: true,
      isVerified: true,
      isEmergency: true,
      openHours: "24/7",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "8",
      name: "Bhaktapur Hospital",
      address: "Dudhpati, Bhaktapur",
      district: "Bhaktapur",
      phone: "01-6610798",
      services: "Emergency, Medicine, Surgery, Maternity",
      latitude: "27.6710",
      longitude: "85.4298",
      isFree: true,
      isVerified: true,
      isEmergency: true,
      openHours: "24/7",
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  ];
}

export async function registerRoutes(app: Express): Promise<Server> {

  // Test endpoint for OSM coverage
  app.get('/api/test/osm-coverage', async (req, res) => {
    try {
      await testOSMCoverageNepal();
      res.json({ message: "OSM coverage test completed. Check server logs for results." });
    } catch (error) {
      console.error('OSM coverage test failed:', error);
      res.status(500).json({ error: "OSM coverage test failed" });
    }
  });

  // Public info routes - no auth required

  // Hospital routes - Now uses curated Nepal hospitals as primary data
  app.get('/api/hospitals', async (req, res) => {
    // Use curated hospital list (fallback data is our primary data for listing)
    const mockHospitals = getMockHospitalsForNepal();
    
    // Apply filters if provided
    let filteredHospitals = mockHospitals;
    const { district, isFree, isEmergency, search } = req.query;
    
    if (district) {
      filteredHospitals = filteredHospitals.filter(h => 
        h.district.toLowerCase().includes((district as string).toLowerCase())
      );
    }
    
    if (isFree === 'true') {
      filteredHospitals = filteredHospitals.filter(h => h.isFree);
    }
    
    if (isEmergency === 'true') {
      filteredHospitals = filteredHospitals.filter(h => h.isEmergency);
    }
    
    if (search) {
      const searchTerm = (search as string).toLowerCase();
      filteredHospitals = filteredHospitals.filter(h => 
        h.name.toLowerCase().includes(searchTerm) ||
        h.address.toLowerCase().includes(searchTerm) ||
        h.services.toLowerCase().includes(searchTerm)
      );
    }
    
    res.json(filteredHospitals);
  });

  // Nearby hospitals endpoint (must come before /:id route)
  app.get('/api/hospitals/nearby', async (req, res) => {
    const { lat, lng, radius = 50, source = 'osm' } = req.query; // Default radius: 50km, source: OSM
    
    if (!lat || !lng) {
      return res.status(400).json({ message: "Latitude and longitude are required" });
    }
    
    const userLat = parseFloat(lat as string);
    const userLng = parseFloat(lng as string);
    const maxRadius = parseFloat(radius as string);
    const dataSource = source as string;
    
    console.log(`Fetching nearby hospitals from ${dataSource} for ${userLat},${userLng} within ${maxRadius}km`);
    
    try {
      let hospitals: any[] = [];
      
      if (dataSource === 'osm') {
        // Fetch from OpenStreetMap
        hospitals = await fetchHospitalsFromOSM(userLat, userLng, maxRadius);
        console.log(`OSM returned ${hospitals.length} hospitals`);
        
        // If OSM returns few results, fall back to mock data for now
        if (hospitals.length < 3) {
          console.log('OSM returned few results, falling back to curated data for Nepal...');
          hospitals = getMockHospitalsForNepal();
        }
      } else {
        // Use curated Nepal hospitals as fallback
        hospitals = getMockHospitalsForNepal();
      }
      
      if (hospitals.length === 0) {
        return res.json([]);
      }
      
      // Calculate both straight-line and road distances
      const hospitalsWithDistances = await calculateBatchDistances(userLat, userLng, hospitals);
      
      // Filter by radius (using straight-line distance)
      const filteredHospitals = hospitalsWithDistances.filter(hospital => hospital.distance <= maxRadius);
      
      console.log(`Returning ${filteredHospitals.length} hospitals within ${maxRadius}km radius`);
      res.json(filteredHospitals);
      
    } catch (error) {
      console.error('Error fetching nearby hospitals:', error);
      
      // Fallback to mock data on error
      const fallbackHospitals = getMockHospitalsForNepal();
      const hospitalsWithDistances = await calculateBatchDistances(userLat, userLng, fallbackHospitals);
      const filteredHospitals = hospitalsWithDistances.filter(hospital => hospital.distance <= maxRadius);
      
      res.json(filteredHospitals);
    }
  });

  // Individual hospital by ID
  app.get('/api/hospitals/:id', async (req, res) => {
    const mockHospital = {
      id: req.params.id,
      name: "Kathmandu Medical College",
      address: "Sinamangal, Kathmandu", 
      district: "Kathmandu",
      phone: "01-4467711",
      services: "Emergency, Surgery, Cardiology",
      latitude: "27.7172",
      longitude: "85.3240",
      isFree: false,
      isVerified: true,
      isEmergency: true,
      openHours: "24/7",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    res.json(mockHospital);
  });

  // Admin routes temporarily disabled for public portal
  app.post('/api/hospitals', async (req: any, res) => {
    res.status(403).json({ message: "Admin features not available in public portal" });
  });

  app.put('/api/hospitals/:id', async (req: any, res) => {
    res.status(403).json({ message: "Admin features not available in public portal" });
  });

  app.delete('/api/hospitals/:id', async (req: any, res) => {
    res.status(403).json({ message: "Admin features not available in public portal" });
  });

  app.put('/api/hospitals/:id/verify', async (req: any, res) => {
    res.status(403).json({ message: "Admin features not available in public portal" });
  });

  // Blood request routes - Mock data for development
  app.get('/api/blood-requests', async (req, res) => {
    const mockBloodRequests = [
      {
        id: "1",
        bloodGroup: "O+",
        unitsRequired: 2,
        patientName: "John Doe",
        hospitalId: "1",
        hospitalName: "Kathmandu Medical College",
        contactPerson: "Dr. Smith",
        contactPhone: "9841234567",
        urgency: "urgent",
        district: "Kathmandu",
        isActive: true,
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "2",
        bloodGroup: "B+",
        unitsRequired: 1,
        patientName: "Jane Smith",
        hospitalId: "2",
        hospitalName: "Bir Hospital",
        contactPerson: "Dr. Johnson",
        contactPhone: "9851234567",
        urgency: "critical",
        district: "Kathmandu",
        isActive: true,
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ];
    res.json(mockBloodRequests);
  });

  app.get('/api/blood-requests/:id', async (req, res) => {
    const mockBloodRequest = {
      id: req.params.id,
      bloodGroup: "O+",
      unitsRequired: 2,
      patientName: "John Doe",
      hospitalId: "1",
      hospitalName: "Kathmandu Medical College",
      contactPerson: "Dr. Smith",
      contactPhone: "9841234567",
      urgency: "urgent",
      district: "Kathmandu",
      isActive: true,
      isVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    res.json(mockBloodRequest);
  });

  app.post('/api/blood-requests', async (req: any, res) => {
    res.status(403).json({ message: "Admin features not available in public portal" });
  });

  app.put('/api/blood-requests/:id', async (req: any, res) => {
    res.status(403).json({ message: "Admin features not available in public portal" });
  });

  app.delete('/api/blood-requests/:id', async (req: any, res) => {
    res.status(403).json({ message: "Admin features not available in public portal" });
  });

  app.put('/api/blood-requests/:id/verify', async (req: any, res) => {
    res.status(403).json({ message: "Admin features not available in public portal" });
  });

  // Admin routes disabled for public portal
  app.get('/api/admin/pending', async (req: any, res) => {
    res.status(403).json({ message: "Admin features not available in public portal" });
  });

  app.get('/api/admin/stats', async (req: any, res) => {
    res.status(403).json({ message: "Admin features not available in public portal" });
  });

  const httpServer = createServer(app);
  return httpServer;
}
