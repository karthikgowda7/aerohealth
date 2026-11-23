import { PrismaClient } from "@prisma/client";

// One shared Prisma client. Without this, Next.js hot reload in dev
// creates a new client on every change and runs out of DB connections.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
