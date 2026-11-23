import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import SensorChart from "@/components/SensorChart";
import RulChart from "@/components/RulChart";
import StatusBadge from "@/components/StatusBadge";
import AlertList from "@/components/AlertList";
import WorkOrderForm from "@/components/WorkOrderForm";

export const dynamic = "force-dynamic";

export default async function Page({
  params,
}: {
  params: Promise<{ serial: string }>;
}) {
  const { serial } = await params;

  const engine = await prisma.engine.findUnique({
    where: { serial },
    include: {
      readings: { orderBy: { cycle: "asc" } },
      alerts: { orderBy: { cycle: "desc" } },
      workOrders: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!engine) notFound();

  return (
    <div className="space-y-6">
      {/* 2. Header Card */}
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-xs">
        <div className="mb-4">
          <Link
            href="/"
            className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-800"
          >
            ← Back to fleet
          </Link>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
              {engine.serial}
            </h1>
            <StatusBadge status={engine.status} />
          </div>

          <div className="flex flex-wrap items-center gap-6 text-sm text-slate-600">
            <div>
              <span className="text-xs uppercase text-slate-400">Current Cycle: </span>
              <span className="font-mono font-semibold text-slate-900">
                {engine.currentCycle}
              </span>
            </div>
            <div>
              <span className="text-xs uppercase text-slate-400">Predicted RUL: </span>
              <span className="font-mono font-semibold text-slate-900">
                {Math.round(engine.predictedRul)} cycles
              </span>
            </div>
            <div>
              <span className="text-xs uppercase text-slate-400">Actual RUL: </span>
              <span className="font-mono font-semibold text-slate-900">
                {Math.round(engine.trueRul)} cycles
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Two cards with headings: Sensor trends and Remaining useful life */}
      <div className="grid grid-cols-1 gap-6">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-xs">
          <h2 className="mb-4 text-base font-bold text-slate-900">Sensor trends</h2>
          <SensorChart readings={engine.readings} alerts={engine.alerts} />
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-xs">
          <h2 className="mb-4 text-base font-bold text-slate-900">Remaining useful life</h2>
          <RulChart points={engine.readings} />
        </div>
      </div>

      {/* 2-column grid on desktop: alerts left, work order form + list right */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Alerts Left Column */}
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-xs">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Sensor alerts</h2>
            <span className="text-xs text-slate-500">
              {engine.alerts.length} total alert{engine.alerts.length === 1 ? "" : "s"}
            </span>
          </div>
          <AlertList alerts={engine.alerts} />
        </div>

        {/* Work Order Form & List Right Column */}
        <div className="space-y-6">
          {/* Work Order Form Card */}
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-xs">
            <h2 className="mb-4 text-base font-bold text-slate-900">Create work order</h2>
            <WorkOrderForm engineSerial={engine.serial} />
          </div>

          {/* Engine Work Orders List Card */}
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-xs">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">Engine work orders</h2>
              <Link
                href="/work-orders"
                className="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline"
              >
                View all work orders →
              </Link>
            </div>

            {engine.workOrders.length === 0 ? (
              <div className="py-6 text-center text-sm text-slate-500">
                No work orders for this engine.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {engine.workOrders.map((wo) => {
                  const priorityColor =
                    wo.priority === "AOG"
                      ? "bg-rose-100 text-rose-800 border-rose-300"
                      : wo.priority === "HIGH"
                      ? "bg-amber-100 text-amber-800 border-amber-300"
                      : "bg-slate-100 text-slate-700 border-slate-200";

                  const statusColor =
                    wo.status === "COMPLETED"
                      ? "bg-emerald-100 text-emerald-800"
                      : wo.status === "IN_PROGRESS"
                      ? "bg-blue-100 text-blue-800"
                      : wo.status === "CANCELLED"
                      ? "bg-slate-100 text-slate-600"
                      : "bg-amber-100 text-amber-800";

                  return (
                    <div key={wo.id} className="py-3 first:pt-0 last:pb-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-medium text-slate-900">{wo.title}</div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span
                            className={`rounded-sm border px-1.5 py-0.5 text-[10px] font-bold ${priorityColor}`}
                          >
                            {wo.priority}
                          </span>
                          <span
                            className={`rounded-sm px-1.5 py-0.5 text-[10px] font-semibold uppercase ${statusColor}`}
                          >
                            {wo.status.replace("_", " ")}
                          </span>
                        </div>
                      </div>
                      {wo.description && (
                        <p className="mt-1 text-xs text-slate-600">{wo.description}</p>
                      )}
                      <p className="mt-1 text-[11px] text-slate-400">
                        Created {new Date(wo.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
