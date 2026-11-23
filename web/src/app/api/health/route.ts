import { prisma } from "@/lib/db";
import { fail, ok } from "@/lib/api";

export const dynamic = "force-dynamic";

// GET /api/health -> checks the database is reachable
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return ok({ status: "ok" });
  } catch {
    return fail(503, "DB_UNAVAILABLE", "Database is not reachable");
  }
}
