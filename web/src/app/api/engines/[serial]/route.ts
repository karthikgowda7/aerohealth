import { prisma } from "@/lib/db";
import { fail, ok } from "@/lib/api";

export const dynamic = "force-dynamic";

// GET /api/engines/ESN-001 -> engine + alerts + work orders + readings
export async function GET(_req: Request, { params }: { params: Promise<{ serial: string }> }) {
  const { serial } = await params; // Next.js 15: params is a Promise
  const engine = await prisma.engine.findUnique({
    where: { serial },
    include: {
      alerts: { orderBy: { cycle: "desc" } },
      workOrders: { orderBy: { createdAt: "desc" } },
      readings: { orderBy: { cycle: "asc" } },
    },
  });
  if (!engine) return fail(404, "NOT_FOUND", `Engine ${serial} not found`);
  return ok(engine);
}
