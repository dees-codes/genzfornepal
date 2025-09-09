import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertHospitalSchema, insertBloodRequestSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Public info routes - no auth required

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

  app.post('/api/blood-requests', async (req: any, res) => {
    res.status(403).json({ message: "Admin features not available in public portal" });
  });

  app.put('/api/blood-requests/:id', async (req: any, res) => {
    res.status(403).json({ message: "Admin features not available in public portal" });
  });

  app.delete('/api/blood-requests/:id', async (req: any, res) => {
    res.status(403).json({ message: "Admin features not available in public portal" });
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
