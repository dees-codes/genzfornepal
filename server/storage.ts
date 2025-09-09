import {
  users,
  hospitals,
  bloodRequests,
  type User,
  type UpsertUser,
  type Hospital,
  type BloodRequest,
  type InsertHospital,
  type InsertBloodRequest,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, sql, or, like } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Hospital operations
  getHospitals(filters?: {
    district?: string;
    isFree?: boolean;
    isEmergency?: boolean;
    search?: string;
  }): Promise<Hospital[]>;
  getHospitalById(id: string): Promise<Hospital | undefined>;
  createHospital(hospital: InsertHospital): Promise<Hospital>;
  updateHospital(id: string, hospital: Partial<InsertHospital>): Promise<Hospital>;
  deleteHospital(id: string): Promise<void>;
  
  // Blood request operations
  getBloodRequests(filters?: {
    bloodGroup?: string;
    urgency?: string;
    district?: string;
    isActive?: boolean;
  }): Promise<BloodRequest[]>;
  getBloodRequestById(id: string): Promise<BloodRequest | undefined>;
  createBloodRequest(request: InsertBloodRequest): Promise<BloodRequest>;
  updateBloodRequest(id: string, request: Partial<InsertBloodRequest>): Promise<BloodRequest>;
  deleteBloodRequest(id: string): Promise<void>;
  
  // Admin operations
  getPendingVerifications(): Promise<{
    hospitals: Hospital[];
    bloodRequests: BloodRequest[];
  }>;
  verifyHospital(id: string): Promise<Hospital>;
  verifyBloodRequest(id: string): Promise<BloodRequest>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Hospital operations
  async getHospitals(filters?: {
    district?: string;
    isFree?: boolean;
    isEmergency?: boolean;
    search?: string;
  }): Promise<Hospital[]> {
    let query = db.select().from(hospitals);
    
    const conditions = [];
    
    if (filters?.district) {
      conditions.push(eq(hospitals.district, filters.district));
    }
    
    if (filters?.isFree !== undefined) {
      conditions.push(eq(hospitals.isFree, filters.isFree));
    }
    
    if (filters?.isEmergency !== undefined) {
      conditions.push(eq(hospitals.isEmergency, filters.isEmergency));
    }
    
    if (filters?.search) {
      conditions.push(
        or(
          like(hospitals.name, `%${filters.search}%`),
          like(hospitals.address, `%${filters.search}%`),
          like(hospitals.services, `%${filters.search}%`)
        )
      );
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query.orderBy(desc(hospitals.updatedAt));
  }

  async getHospitalById(id: string): Promise<Hospital | undefined> {
    const [hospital] = await db.select().from(hospitals).where(eq(hospitals.id, id));
    return hospital;
  }

  async createHospital(hospital: InsertHospital): Promise<Hospital> {
    const [newHospital] = await db
      .insert(hospitals)
      .values(hospital)
      .returning();
    return newHospital;
  }

  async updateHospital(id: string, hospital: Partial<InsertHospital>): Promise<Hospital> {
    const [updatedHospital] = await db
      .update(hospitals)
      .set({ ...hospital, updatedAt: new Date() })
      .where(eq(hospitals.id, id))
      .returning();
    return updatedHospital;
  }

  async deleteHospital(id: string): Promise<void> {
    await db.delete(hospitals).where(eq(hospitals.id, id));
  }

  // Blood request operations
  async getBloodRequests(filters?: {
    bloodGroup?: string;
    urgency?: string;
    district?: string;
    isActive?: boolean;
  }): Promise<BloodRequest[]> {
    let query = db.select().from(bloodRequests);
    
    const conditions = [];
    
    if (filters?.bloodGroup) {
      conditions.push(eq(bloodRequests.bloodGroup, filters.bloodGroup));
    }
    
    if (filters?.urgency) {
      conditions.push(eq(bloodRequests.urgency, filters.urgency));
    }
    
    if (filters?.district) {
      conditions.push(eq(bloodRequests.district, filters.district));
    }
    
    if (filters?.isActive !== undefined) {
      conditions.push(eq(bloodRequests.isActive, filters.isActive));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query.orderBy(
      asc(sql`CASE 
        WHEN ${bloodRequests.urgency} = 'critical' THEN 1 
        WHEN ${bloodRequests.urgency} = 'urgent' THEN 2 
        ELSE 3 
      END`),
      desc(bloodRequests.createdAt)
    );
  }

  async getBloodRequestById(id: string): Promise<BloodRequest | undefined> {
    const [request] = await db.select().from(bloodRequests).where(eq(bloodRequests.id, id));
    return request;
  }

  async createBloodRequest(request: InsertBloodRequest): Promise<BloodRequest> {
    const [newRequest] = await db
      .insert(bloodRequests)
      .values(request)
      .returning();
    return newRequest;
  }

  async updateBloodRequest(id: string, request: Partial<InsertBloodRequest>): Promise<BloodRequest> {
    const [updatedRequest] = await db
      .update(bloodRequests)
      .set({ ...request, updatedAt: new Date() })
      .where(eq(bloodRequests.id, id))
      .returning();
    return updatedRequest;
  }

  async deleteBloodRequest(id: string): Promise<void> {
    await db.delete(bloodRequests).where(eq(bloodRequests.id, id));
  }

  // Admin operations
  async getPendingVerifications(): Promise<{
    hospitals: Hospital[];
    bloodRequests: BloodRequest[];
  }> {
    const [pendingHospitals, pendingBloodRequests] = await Promise.all([
      db.select().from(hospitals).where(eq(hospitals.isVerified, false)),
      db.select().from(bloodRequests).where(eq(bloodRequests.isVerified, false)),
    ]);

    return {
      hospitals: pendingHospitals,
      bloodRequests: pendingBloodRequests,
    };
  }

  async verifyHospital(id: string): Promise<Hospital> {
    const [hospital] = await db
      .update(hospitals)
      .set({ isVerified: true, updatedAt: new Date() })
      .where(eq(hospitals.id, id))
      .returning();
    return hospital;
  }

  async verifyBloodRequest(id: string): Promise<BloodRequest> {
    const [request] = await db
      .update(bloodRequests)
      .set({ isVerified: true, updatedAt: new Date() })
      .where(eq(bloodRequests.id, id))
      .returning();
    return request;
  }
}

export const storage = new DatabaseStorage();
