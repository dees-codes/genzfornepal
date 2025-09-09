import { z } from "zod";

// Type definitions for the application
export interface User {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  isAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Hospital {
  id: string;
  name: string;
  address: string;
  district: string;
  phone: string;
  services: string;
  latitude?: string;
  longitude?: string;
  isFree: boolean;
  isVerified: boolean;
  isEmergency: boolean;
  openHours: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface HospitalWithDistance extends Hospital {
  distance: number; // straight-line distance in km
  roadDistance?: number | null; // road distance in km (if available)
  hasRoadDistance?: boolean; // whether road distance was successfully calculated
}

export interface BloodRequest {
  id: string;
  bloodGroup: string;
  unitsRequired: number;
  patientName?: string;
  hospitalId?: string;
  hospitalName: string;
  contactPerson: string;
  contactPhone: string;
  urgency: string; // 'critical', 'urgent', 'normal'
  district: string;
  isActive: boolean;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Validation schemas
export const insertHospitalSchema = z.object({
  name: z.string().min(1),
  address: z.string().min(1),
  district: z.string().min(1),
  phone: z.string().min(1),
  services: z.string().min(1),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  isFree: z.boolean().default(false),
  isVerified: z.boolean().default(false),
  isEmergency: z.boolean().default(true),
  openHours: z.string().default("24/7"),
});

export const insertBloodRequestSchema = z.object({
  bloodGroup: z.string().min(1),
  unitsRequired: z.number().min(1),
  patientName: z.string().optional(),
  hospitalId: z.string().optional(),
  hospitalName: z.string().min(1),
  contactPerson: z.string().min(1),
  contactPhone: z.string().min(1),
  urgency: z.enum(['critical', 'urgent', 'normal']),
  district: z.string().min(1),
  isActive: z.boolean().default(true),
  isVerified: z.boolean().default(false),
});

export const upsertUserSchema = z.object({
  id: z.string(),
  email: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  profileImageUrl: z.string().optional(),
});

// Types from schemas
export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type InsertHospital = z.infer<typeof insertHospitalSchema>;
export type InsertBloodRequest = z.infer<typeof insertBloodRequestSchema>;
