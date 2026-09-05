import { z } from "zod";

export const createPatientSchema = z.object({
  fullName: z.string().min(2).max(120),
  medicalRecordNumber: z.string().min(2).max(40),
  dateOfBirth: z.string().min(8),
  sex: z.string().min(1).max(40),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(40).optional(),
  notes: z.string().max(2000).optional(),
  symptoms: z.array(z.string()).optional(),
  conditions: z.array(z.string()).optional(),
  allergies: z.array(z.string()).optional(),
  medications: z.array(z.string()).optional(),
});

export const updatePatientSchema = createPatientSchema.partial();

export const patchTestSchema = z.object({
  testName: z.string().min(1).optional(),
  value: z.string().nullable().optional(),
  unit: z.string().nullable().optional(),
  referenceLow: z.number().nullable().optional(),
  referenceHigh: z.number().nullable().optional(),
  referenceText: z.string().nullable().optional(),
  observation: z.string().nullable().optional(),
  reportDate: z.string().nullable().optional(),
});

export const conflictActionSchema = z.object({
  action: z.enum(["KEEP_A", "KEEP_B", "RESOLVED"]),
  resolution: z.string().optional(),
});
