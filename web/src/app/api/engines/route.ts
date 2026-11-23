import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { badRequest, ok } from "@/lib/api";
import { engineListQuery } from "@/lib/validation";

export const dynamic = "force-dynamic";

// GET /api/engines?status=CRITICAL&sort=rul&order=asc
export async function GET(req: NextRequest) {
  const parsed = engineListQuery.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) return badRequest(parsed.error);
  const { status, sort, order } = parsed.data;

  const engines = await prisma.engine.findMany({
    where: status ? { status } : undefined,
    orderBy: sort === "rul" ? { predictedRul: order } : { serial: order },
    include: { _count: { select: { alerts: { where: { acknowledged: false } } } } },
  });
  return ok(engines);
}
