import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { badRequest, fail, ok } from "@/lib/api";
import { createWorkOrderBody, updateWorkOrderBody } from "@/lib/validation";

export const dynamic = "force-dynamic";

// GET /api/work-orders?status=OPEN
export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get("status");
  const parsed = status ? updateWorkOrderBody.safeParse({ status }) : null;
  if (parsed && !parsed.success) return badRequest(parsed.error);

  const orders = await prisma.workOrder.findMany({
    where: parsed ? { status: parsed.data.status } : undefined,
    orderBy: { createdAt: "desc" },
    include: { engine: { select: { serial: true } } },
  });
  return ok(orders);
}

// POST /api/work-orders  body: { engineSerial, title, description?, priority? }
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = createWorkOrderBody.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error);
  const { engineSerial, ...fields } = parsed.data;

  const engine = await prisma.engine.findUnique({ where: { serial: engineSerial } });
  if (!engine) return fail(404, "NOT_FOUND", `Engine ${engineSerial} not found`);

  const order = await prisma.workOrder.create({ data: { ...fields, engineId: engine.id } });
  return ok(order, 201);
}
