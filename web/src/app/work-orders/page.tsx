import Link from "next/link";
import { prisma } from "@/lib/db";
import StatusButtons from "@/components/StatusButtons";
import type { WorkOrderStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status: rawStatus } = await searchParams;

  const validStatuses: WorkOrderStatus[] = [
    "OPEN",
    "IN_PROGRESS",
    "COMPLETED",
    "CANCELLED",
  ];
  const currentStatus = validStatuses.includes(rawStatus as WorkOrderStatus)
    ? (rawStatus as WorkOrderStatus)
    : undefined;

  const workOrders = await prisma.workOrder.findMany({
    where: currentStatus ? { status: currentStatus } : undefined,
    include: { engine: { select: { serial: true } } },
    orderBy: { createdAt: "desc" },
  });

  function buildHref(statusParam?: string) {
    return statusParam ? `/work-orders?status=${statusParam}` : "/work-orders";
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Work Orders
          </h1>
          <p className="text-sm text-slate-500">
            Manage engine maintenance orders and status transitions.
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white shadow-xs">
        {/* Filter bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-600">Filter:</span>
            <div className="inline-flex rounded-md border border-slate-200 bg-slate-50 p-1 text-xs">
              <Link
                href={buildHref(undefined)}
                className={`rounded px-2.5 py-1 font-medium transition-colors ${
                  currentStatus === undefined
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                All
              </Link>
              <Link
                href={buildHref("OPEN")}
                className={`rounded px-2.5 py-1 font-medium transition-colors ${
                  currentStatus === "OPEN"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Open
              </Link>
              <Link
                href={buildHref("IN_PROGRESS")}
                className={`rounded px-2.5 py-1 font-medium transition-colors ${
                  currentStatus === "IN_PROGRESS"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                In progress
              </Link>
              <Link
                href={buildHref("COMPLETED")}
                className={`rounded px-2.5 py-1 font-medium transition-colors ${
                  currentStatus === "COMPLETED"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Completed
              </Link>
              <Link
                href={buildHref("CANCELLED")}
                className={`rounded px-2.5 py-1 font-medium transition-colors ${
                  currentStatus === "CANCELLED"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Cancelled
              </Link>
            </div>
          </div>

          <span className="text-xs text-slate-500">
            Showing {workOrders.length} order{workOrders.length === 1 ? "" : "s"}
          </span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">Engine</th>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Closed</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {workOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    No work orders yet. Open an engine and create one.
                  </td>
                </tr>
              ) : (
                workOrders.map((wo) => {
                  const isAog = wo.priority === "AOG";

                  return (
                    <tr key={wo.id} className="transition-colors hover:bg-slate-50/80">
                      <td className="px-4 py-3 font-medium text-slate-900">
                        <Link
                          href={`/engines/${wo.engine.serial}`}
                          className="text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {wo.engine.serial}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">{wo.title}</div>
                        {wo.description && (
                          <p className="text-xs text-slate-500">{wo.description}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={
                            isAog
                              ? "font-bold text-rose-600"
                              : "font-medium text-slate-700"
                          }
                        >
                          {wo.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center rounded-sm bg-slate-100 px-2 py-0.5 text-xs font-semibold uppercase tracking-wider text-slate-700">
                          {wo.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {new Date(wo.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {wo.closedAt ? new Date(wo.closedAt).toLocaleDateString() : "-"}
                      </td>
                      <td className="px-4 py-3">
                        <StatusButtons id={wo.id} status={wo.status} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Note */}
        <div className="border-t border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
          Status flow: OPEN → IN_PROGRESS → COMPLETED. Open or in-progress orders can be cancelled. Completed and cancelled orders are final.
        </div>
      </div>
    </div>
  );
}
