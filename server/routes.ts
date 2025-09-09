import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertHospitalSchema, insertBloodRequestSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Hospital routes
  app.get('/api/hospitals', async (req, res) => {
    try {
      const { district, isFree, isEmergency, search } = req.query;
      const hospitals = await storage.getHospitals({
        district: district as string,
        isFree: isFree === 'true',
        isEmergency: isEmergency === 'true',
        search: search as string,
      });
      res.json(hospitals);
    } catch (error) {
      console.error("Error fetching hospitals:", error);
      res.status(500).json({ message: "Failed to fetch hospitals" });
    }
  });

  app.get('/api/hospitals/:id', async (req, res) => {
    try {
      const hospital = await storage.getHospitalById(req.params.id);
      if (!hospital) {
        return res.status(404).json({ message: "Hospital not found" });
      }
      res.json(hospital);
    } catch (error) {
      console.error("Error fetching hospital:", error);
      res.status(500).json({ message: "Failed to fetch hospital" });
    }
  });

  app.post('/api/hospitals', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const validatedData = insertHospitalSchema.parse(req.body);
      const hospital = await storage.createHospital(validatedData);
      res.status(201).json(hospital);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating hospital:", error);
      res.status(500).json({ message: "Failed to create hospital" });
    }
  });

  app.put('/api/hospitals/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const validatedData = insertHospitalSchema.partial().parse(req.body);
      const hospital = await storage.updateHospital(req.params.id, validatedData);
      res.json(hospital);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating hospital:", error);
      res.status(500).json({ message: "Failed to update hospital" });
    }
  });

  app.delete('/api/hospitals/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      await storage.deleteHospital(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting hospital:", error);
      res.status(500).json({ message: "Failed to delete hospital" });
    }
  });

  app.put('/api/hospitals/:id/verify', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const hospital = await storage.verifyHospital(req.params.id);
      res.json(hospital);
    } catch (error) {
      console.error("Error verifying hospital:", error);
      res.status(500).json({ message: "Failed to verify hospital" });
    }
  });

  // Blood request routes
  app.get('/api/blood-requests', async (req, res) => {
    try {
      const { bloodGroup, urgency, district, isActive } = req.query;
      const requests = await storage.getBloodRequests({
        bloodGroup: bloodGroup as string,
        urgency: urgency as string,
        district: district as string,
        isActive: isActive === 'true',
      });
      res.json(requests);
    } catch (error) {
      console.error("Error fetching blood requests:", error);
      res.status(500).json({ message: "Failed to fetch blood requests" });
    }
  });

  app.get('/api/blood-requests/:id', async (req, res) => {
    try {
      const request = await storage.getBloodRequestById(req.params.id);
      if (!request) {
        return res.status(404).json({ message: "Blood request not found" });
      }
      res.json(request);
    } catch (error) {
      console.error("Error fetching blood request:", error);
      res.status(500).json({ message: "Failed to fetch blood request" });
    }
  });

  app.post('/api/blood-requests', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const validatedData = insertBloodRequestSchema.parse(req.body);
      const request = await storage.createBloodRequest(validatedData);
      res.status(201).json(request);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating blood request:", error);
      res.status(500).json({ message: "Failed to create blood request" });
    }
  });

  app.put('/api/blood-requests/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const validatedData = insertBloodRequestSchema.partial().parse(req.body);
      const request = await storage.updateBloodRequest(req.params.id, validatedData);
      res.json(request);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating blood request:", error);
      res.status(500).json({ message: "Failed to update blood request" });
    }
  });

  app.delete('/api/blood-requests/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      await storage.deleteBloodRequest(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting blood request:", error);
      res.status(500).json({ message: "Failed to delete blood request" });
    }
  });

  app.put('/api/blood-requests/:id/verify', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const request = await storage.verifyBloodRequest(req.params.id);
      res.json(request);
    } catch (error) {
      console.error("Error verifying blood request:", error);
      res.status(500).json({ message: "Failed to verify blood request" });
    }
  });

  // Admin routes
  app.get('/api/admin/pending', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const pending = await storage.getPendingVerifications();
      res.json(pending);
    } catch (error) {
      console.error("Error fetching pending verifications:", error);
      res.status(500).json({ message: "Failed to fetch pending verifications" });
    }
  });

  app.get('/api/admin/stats', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const [hospitals, bloodRequests, pending] = await Promise.all([
        storage.getHospitals(),
        storage.getBloodRequests({ isActive: true }),
        storage.getPendingVerifications(),
      ]);

      res.json({
        totalHospitals: hospitals.length,
        activeBloodRequests: bloodRequests.length,
        pendingVerifications: pending.hospitals.length + pending.bloodRequests.length,
        lastUpdated: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Failed to fetch admin stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
