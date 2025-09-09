import express, { type Request, Response, NextFunction } from "express";
import { calculateBatchDistances, calculateStraightLineDistance } from "../server/distanceService";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;

  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${path} ${res.statusCode} in ${duration}ms`);
  });

  next();
});

// Hospital routes - Mock data (same as in routes.ts)
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
      address: "Mahabouddha, Kathmandu",
      district: "Kathmandu",
      phone: "01-4221119",
      services: "Emergency, General Medicine, Surgery, Orthopedics",
      latitude: "27.7025",
      longitude: "85.3077",
      isFree: true,
      isVerified: true,
      isEmergency: true,
      openHours: "24/7",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "3",
      name: "Tribhuvan University Teaching Hospital",
      address: "Maharajgunj, Kathmandu",
      district: "Kathmandu",
      phone: "01-4412303",
      services: "Emergency, Specialist care, Teaching, Research",
      latitude: "27.7350",
      longitude: "85.3206",
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
      phone: "01-5522266",
      services: "Emergency, Community health, General medicine",
      latitude: "27.6766",
      longitude: "85.3245",
      isFree: true,
      isVerified: true,
      isEmergency: true,
      openHours: "24/7",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "5",
      name: "Everest Hospital",
      address: "Basundhara, Kathmandu",
      district: "Kathmandu",
      phone: "01-4269999",
      services: "Emergency, Specialist care, Private healthcare",
      latitude: "27.7421",
      longitude: "85.3707",
      isFree: true,
      isVerified: true,
      isEmergency: true,
      openHours: "24/7",
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  ];

  // Filter hospitals based on query parameters
  let filteredHospitals = mockHospitals;

  const { district, isFree, isEmergency, search } = req.query;

  if (district && typeof district === 'string') {
    filteredHospitals = filteredHospitals.filter(hospital => 
      hospital.district.toLowerCase() === district.toLowerCase()
    );
  }

  if (isFree === 'true') {
    filteredHospitals = filteredHospitals.filter(hospital => hospital.isFree);
  }

  if (isEmergency === 'true') {
    filteredHospitals = filteredHospitals.filter(hospital => hospital.isEmergency);
  }

  if (search && typeof search === 'string') {
    const searchTerm = search.toLowerCase();
    filteredHospitals = filteredHospitals.filter(hospital =>
      hospital.name.toLowerCase().includes(searchTerm) ||
      hospital.address.toLowerCase().includes(searchTerm) ||
      hospital.services.toLowerCase().includes(searchTerm)
    );
  }

  res.json(filteredHospitals);
});

// Nearby hospitals endpoint
app.get('/api/hospitals/nearby', async (req, res) => {
  const { lat, lng, radius = 50 } = req.query;
  
  if (!lat || !lng) {
    return res.status(400).json({ message: 'Latitude and longitude are required' });
  }

  const userLat = parseFloat(lat as string);
  const userLng = parseFloat(lng as string);
  const maxRadius = parseFloat(radius as string);

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
      address: "Mahabouddha, Kathmandu",
      district: "Kathmandu",
      phone: "01-4221119",
      services: "Emergency, General Medicine, Surgery, Orthopedics",
      latitude: "27.7025",
      longitude: "85.3077",
      isFree: true,
      isVerified: true,
      isEmergency: true,
      openHours: "24/7",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "3",
      name: "Tribhuvan University Teaching Hospital",
      address: "Maharajgunj, Kathmandu",
      district: "Kathmandu",
      phone: "01-4412303",
      services: "Emergency, Specialist care, Teaching, Research",
      latitude: "27.7350",
      longitude: "85.3206",
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
      phone: "01-5522266",
      services: "Emergency, Community health, General medicine",
      latitude: "27.6766",
      longitude: "85.3245",
      isFree: true,
      isVerified: true,
      isEmergency: true,
      openHours: "24/7",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "5",
      name: "Everest Hospital",
      address: "Basundhara, Kathmandu",
      district: "Kathmandu",
      phone: "01-4269999",
      services: "Emergency, Specialist care, Private healthcare",
      latitude: "27.7421",
      longitude: "85.3707",
      isFree: true,
      isVerified: true,
      isEmergency: true,
      openHours: "24/7",
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  ];

  // Calculate distances
  const hospitalsWithDistances = await calculateBatchDistances(userLat, userLng, mockHospitals);

  // Filter by radius
  const filteredHospitals = hospitalsWithDistances.filter(hospital => hospital.distance <= maxRadius);

  res.json(filteredHospitals);
});

// Blood request routes
app.get('/api/blood-requests', async (req, res) => {
  const mockBloodRequests = [
    {
      id: "1",
      bloodGroup: "O+",
      unitsRequired: 2,
      patientName: "Ram Bahadur",
      hospitalId: "1",
      hospitalName: "Kathmandu Medical College",
      contactPerson: "Dr. Sharma",
      contactPhone: "9841234567",
      urgency: "critical",
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
      patientName: "Sita Devi",
      hospitalId: "2",
      hospitalName: "Bir Hospital",
      contactPerson: "Nurse Gurung",
      contactPhone: "9851234567",
      urgency: "urgent",
      district: "Kathmandu",
      isActive: true,
      isVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  ];

  let filteredRequests = mockBloodRequests;

  const { bloodGroup, urgency, district, search } = req.query;

  if (bloodGroup && typeof bloodGroup === 'string') {
    filteredRequests = filteredRequests.filter(request => 
      request.bloodGroup.toLowerCase() === bloodGroup.toLowerCase()
    );
  }

  if (urgency && typeof urgency === 'string') {
    filteredRequests = filteredRequests.filter(request => 
      request.urgency.toLowerCase() === urgency.toLowerCase()
    );
  }

  if (district && typeof district === 'string') {
    filteredRequests = filteredRequests.filter(request => 
      request.district.toLowerCase() === district.toLowerCase()
    );
  }

  if (search && typeof search === 'string') {
    const searchTerm = search.toLowerCase();
    filteredRequests = filteredRequests.filter(request =>
      request.hospitalName.toLowerCase().includes(searchTerm) ||
      request.contactPerson.toLowerCase().includes(searchTerm) ||
      request.bloodGroup.toLowerCase().includes(searchTerm)
    );
  }

  res.json(filteredRequests);
});

// Error handling
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message });
  console.error(err);
});

// Export for Vercel
export default app;