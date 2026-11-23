import Link from "next/link";
import { prisma } from "@/lib/db";
import StatusBadge from "@/components/StatusBadge";
import type { HealthStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; sort?: string }>;
}) {
  const { status: rawStatus, sort: rawSort } = await searchParams;

  const validStatuses: HealthStatus[] = ["HEALTHY", "WATCH", "CRITICAL"];
  const currentStatus = validStatuses.includes(rawStatus as HealthStatus)
    ? (rawStatus as HealthStatus)
    : undefined;

  const currentSort = rawSort === "serial" ? "serial" : "rul";

  const [
    totalEngines,
    criticalEngines,
    watchEngines,
    healthyEngines,
    openAlerts,
    openWorkOrders,
    engines,
  ] = await Promise.all([
    prisma.engine.count(),
    prisma.engine.count({ where: { status: "CRITICAL" } }),
    prisma.engine.count({ where: { status: "WATCH" } }),
    prisma.engine.count({ where: { status: "HEALTHY" } }),
    prisma.alert.count({ where: { acknowledged: false } }),
    prisma.workOrder.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } } }),
    prisma.engine.findMany({
      where: currentStatus ? { status: currentStatus } : undefined,
      include: {
        _count: {
          select: { alerts: { where: { acknowledged: false } } },
        },
      },
      orderBy:
        currentSort === "serial"
          ? { serial: "asc" }
          : { predictedRul: "asc" },
    }),
  ]);

  function buildHref(statusParam?: string, sortParam?: string) {
    const params = new URLSearchParams();
    if (statusParam) params.set("status", statusParam);
    if (sortParam && sortParam !== "rul") params.set("sort", sortParam);
    const q = params.toString();
    return q ? `/?${q}` : "/";
  }

  return (
    <div className="space-y-6">
      {/* KPI Tiles */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Total Engines
          </p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{totalEngines}</p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
          <p className="text-xs font-medium uppercase tracking-wider text-rose-600">
            Critical
          </p>
          <p className="mt-1 text-2xl font-bold text-rose-600">{criticalEngines}</p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
          <p className="text-xs font-medium uppercase tracking-wider text-amber-600">
            Watch
          </p>
          <p className="mt-1 text-2xl font-bold text-amber-600">{watchEngines}</p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
          <p className="text-xs font-medium uppercase tracking-wider text-emerald-600">
            Healthy
          </p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">{healthyEngines}</p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Open Alerts
          </p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{openAlerts}</p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Open Work Orders
          </p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{openWorkOrders}</p>
        </div>
      </section>

      {/* Filter and Engine Table Container */}
      <div className="rounded-lg border border-slate-200 bg-white shadow-xs">
        {/* Filters Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-600">Filter:</span>
            <div className="inline-flex rounded-md border border-slate-200 bg-slate-50 p-1 text-xs">
              <Link
                href={buildHref(undefined, currentSort)}
                className={`rounded px-2.5 py-1 font-medium transition-colors ${
                  currentStatus === undefined
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                All
              </Link>
              <Link
                href={buildHref("CRITICAL", currentSort)}
                className={`rounded px-2.5 py-1 font-medium transition-colors ${
                  currentStatus === "CRITICAL"
                    ? "bg-white text-rose-600 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Critical
              </Link>
              <Link
                href={buildHref("WATCH", currentSort)}
                className={`rounded px-2.5 py-1 font-medium transition-colors ${
                  currentStatus === "WATCH"
                    ? "bg-white text-amber-600 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Watch
              </Link>
              <Link
                href={buildHref("HEALTHY", currentSort)}
                className={`rounded px-2.5 py-1 font-medium transition-colors ${
                  currentStatus === "HEALTHY"
                    ? "bg-white text-emerald-600 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Healthy
              </Link>
            </div>
          </div>

          <span className="text-xs text-slate-500">
            Showing {engines.length} engine{engines.length === 1 ? "" : "s"}
          </span>
        </div>

        {/* Engine Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">
                  <Link
                    href={buildHref(currentStatus ? currentStatus : undefined, "serial")}
                    className="inline-flex items-center gap-1 hover:text-slate-900"
                  >
                    Serial
                    {currentSort === "serial" && <span>▲</span>}
                  </Link>
                </th>
                <th className="px-4 py-3">Current Cycle</th>
                <th className="px-4 py-3">
                  <Link
                    href={buildHref(currentStatus ? currentStatus : undefined, "rul")}
                    className="inline-flex items-center gap-1 hover:text-slate-900"
                  >
                    Predicted RUL
                    {currentSort === "rul" && <span>▲</span>}
                  </Link>
                </th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Open Alerts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {engines.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    No engines matching the selected filter.
                  </td>
                </tr>
              ) : (
                engines.map((engine) => {
                  const barWidth =
                    (Math.min(Math.max(engine.predictedRul, 0), 125) / 125) * 100;
                  const barColor =
                    engine.status === "HEALTHY"
                      ? "bg-emerald-500"
                      : engine.status === "WATCH"
                      ? "bg-amber-500"
                      : "bg-rose-500";

                  return (
                    <tr key={engine.id} className="transition-colors hover:bg-slate-50/80">
                      <td className="px-4 py-3 font-medium text-slate-900">
                        <Link
                          href={`/engines/${engine.serial}`}
                          className="text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {engine.serial}
                        </Link>
                      </td>
                      <td className="px-4 py-3 font-mono">{engine.currentCycle}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="w-10 font-mono font-medium">
                            {Math.round(engine.predictedRul)}
                          </span>
                          <div className="h-2 w-28 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className={`h-full rounded-full ${barColor}`}
                              style={{ width: `${barWidth}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={engine.status} />
                      </td>
                      <td className="px-4 py-3">
                        {engine._count.alerts > 0 ? (
                          <span className="inline-flex items-center rounded-full bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-700">
                            {engine._count.alerts} alert{engine._count.alerts === 1 ? "" : "s"}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">None</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Note */}
        <div className="border-t border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
          Data: NASA C-MAPSS FD001 simulated turbofan engines. Not real engine data.
        </div>
      </div>
    </div>
  );
}
