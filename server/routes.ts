import type { Express } from "express";
import { createServer, type Server } from "http";
import { calculateBatchDistances, calculateStraightLineDistance } from "./distanceService";

export async function registerRoutes(app: Express): Promise<Server> {

  // Public info routes - no auth required

  // Hospital routes - Mock data for development (Nepal hospitals)
  app.get('/api/hospitals', async (req, res) => {
    const mockHospitals = [
      {
        id: "1",
        name: "Kathmandu Medical College (KMC)",
        address: "Sinamangal, Kathmandu",
        district: "Kathmandu",
        phone: "01-4467711",
        services: "Emergency, Surgery, Cardiology, ICU, Pharmacy",
        latitude: "27.7172",
        longitude: "85.3240",
        isFree: true, // Private but offering free care
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
        isFree: true, // Federal hospital
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
        isFree: true, // Offering free care
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
        isFree: true, // Offering free care
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
        isFree: true, // Offering free care
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
        isFree: true, // Private but offering free care
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
        isFree: true, // Federal teaching hospital
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
        isFree: true, // Federal hospital
        isVerified: true,
        isEmergency: true,
        openHours: "24/7",
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ];
    
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
    const { lat, lng, radius = 50 } = req.query; // Default radius: 50km
    
    if (!lat || !lng) {
      return res.status(400).json({ message: "Latitude and longitude are required" });
    }
    
    const userLat = parseFloat(lat as string);
    const userLng = parseFloat(lng as string);
    const maxRadius = parseFloat(radius as string);
    
    // Get all hospitals from the main endpoint logic
    const mockHospitals = [
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
    
    // Calculate both straight-line and road distances
    const hospitalsWithDistances = await calculateBatchDistances(userLat, userLng, mockHospitals);
    
    // Filter by radius (using straight-line distance)
    const filteredHospitals = hospitalsWithDistances.filter(hospital => hospital.distance <= maxRadius);
    
    res.json(filteredHospitals);
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
