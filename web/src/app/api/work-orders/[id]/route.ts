import { prisma } from "@/lib/db";
import { badRequest, fail, ok } from "@/lib/api";
import { updateWorkOrderBody } from "@/lib/validation";
import { canTransition } from "@/lib/workorder";

export const dynamic = "force-dynamic";

// PATCH /api/work-orders/:id  body: { status }
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsed = updateWorkOrderBody.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return badRequest(parsed.error);
  const to = parsed.data.status;

  const order = await prisma.workOrder.findUnique({ where: { id } });
  if (!order) return fail(404, "NOT_FOUND", "Work order not found");
  if (order.status === to) return ok(order); // same status: nothing to do
  if (!canTransition(order.status, to)) {
    return fail(409, "INVALID_TRANSITION", `Cannot move from ${order.status} to ${to}`);
  }

  const updated = await prisma.workOrder.update({
    where: { id },
    data: { status: to, closedAt: to === "COMPLETED" || to === "CANCELLED" ? new Date() : null },
  });
  return ok(updated);
}
