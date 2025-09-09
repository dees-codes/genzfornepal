import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  boolean,
  decimal,
  integer,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  isAdmin: boolean("is_admin").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Hospitals table
export const hospitals = pgTable("hospitals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  address: text("address").notNull(),
  district: varchar("district").notNull(),
  phone: varchar("phone").notNull(),
  services: text("services").notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  isFree: boolean("is_free").default(false),
  isVerified: boolean("is_verified").default(false),
  isEmergency: boolean("is_emergency").default(true),
  openHours: varchar("open_hours").default("24/7"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Blood requests table
export const bloodRequests = pgTable("blood_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bloodGroup: varchar("blood_group").notNull(),
  unitsRequired: integer("units_required").notNull(),
  patientName: varchar("patient_name"),
  hospitalId: varchar("hospital_id").references(() => hospitals.id),
  hospitalName: text("hospital_name").notNull(),
  contactPerson: varchar("contact_person").notNull(),
  contactPhone: varchar("contact_phone").notNull(),
  urgency: varchar("urgency").notNull(), // 'critical', 'urgent', 'normal'
  district: varchar("district").notNull(),
  isActive: boolean("is_active").default(true),
  isVerified: boolean("is_verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas
export const insertHospitalSchema = createInsertSchema(hospitals).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBloodRequestSchema = createInsertSchema(bloodRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const upsertUserSchema = createInsertSchema(users).pick({
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
});

// Types
export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type User = typeof users.$inferSelect;
export type Hospital = typeof hospitals.$inferSelect;
export type BloodRequest = typeof bloodRequests.$inferSelect;
export type InsertHospital = z.infer<typeof insertHospitalSchema>;
export type InsertBloodRequest = z.infer<typeof insertBloodRequestSchema>;
