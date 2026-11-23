import { z } from "zod";

export const engineListQuery = z.object({
  status: z.enum(["HEALTHY", "WATCH", "CRITICAL"]).optional(),
  sort: z.enum(["rul", "serial"]).default("rul"),
  order: z.enum(["asc", "desc"]).default("asc"),
});

export const createWorkOrderBody = z.object({
  engineSerial: z.string().regex(/^ESN-\d{3}$/, "Serial must look like ESN-001"),
  title: z.string().trim().min(3, "Title needs at least 3 characters").max(120),
  description: z.string().trim().max(1000).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "AOG"]).default("MEDIUM"),
});

export const updateWorkOrderBody = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "COMPLETED", "CANCELLED"]),
});

export const ackAlertBody = z.object({
  acknowledged: z.literal(true),
});
