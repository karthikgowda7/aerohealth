import { prisma } from "@/lib/db";
import { badRequest, fail, ok } from "@/lib/api";
import { ackAlertBody } from "@/lib/validation";

export const dynamic = "force-dynamic";

// PATCH /api/alerts/:id  body: { acknowledged: true }
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsed = ackAlertBody.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return badRequest(parsed.error);

  const alert = await prisma.alert.findUnique({ where: { id } });
  if (!alert) return fail(404, "NOT_FOUND", "Alert not found");
  const updated = await prisma.alert.update({ where: { id }, data: { acknowledged: true } });
  return ok(updated);
}
