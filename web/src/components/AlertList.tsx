"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SENSOR_LABELS, type SensorName } from "@/lib/sensors";

export type AlertItem = {
  id: string;
  cycle: number;
  sensor: string;
  value: number;
  zScore: number;
  severity: "WARNING" | "CRITICAL";
  acknowledged: boolean;
};

export default function AlertList({ alerts }: { alerts: AlertItem[] }) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function handleAcknowledge(id: string) {
    setLoadingId(id);
    try {
      const res = await fetch(`/api/alerts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ acknowledged: true }),
      });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setLoadingId(null);
    }
  }

  if (alerts.length === 0) {
    return (
      <div className="py-6 text-center text-sm text-slate-500">
        No sensor alerts for this engine.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm text-slate-700">
        <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
          <tr>
            <th className="px-3 py-2.5">Cycle</th>
            <th className="px-3 py-2.5">Sensor</th>
            <th className="px-3 py-2.5">Value</th>
            <th className="px-3 py-2.5">z-score</th>
            <th className="px-3 py-2.5">Severity</th>
            <th className="px-3 py-2.5 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {alerts.map((alert) => {
            const label = SENSOR_LABELS[alert.sensor as SensorName] ?? alert.sensor;
            const isCritical = alert.severity === "CRITICAL";

            return (
              <tr key={alert.id} className="transition-colors hover:bg-slate-50/80">
                <td className="px-3 py-2.5 font-mono text-slate-900">{alert.cycle}</td>
                <td className="px-3 py-2.5 font-medium text-slate-900">
                  {alert.sensor} · {label}
                </td>
                <td className="px-3 py-2.5 font-mono">{alert.value.toFixed(2)}</td>
                <td className="px-3 py-2.5 font-mono">{alert.zScore.toFixed(2)}</td>
                <td className="px-3 py-2.5">
                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${
                      isCritical
                        ? "border-rose-200 bg-rose-50 text-rose-700"
                        : "border-amber-200 bg-amber-50 text-amber-700"
                    }`}
                  >
                    {alert.severity}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-right">
                  {alert.acknowledged ? (
                    <span className="text-xs font-medium text-slate-400">
                      ✓ Acknowledged
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={loadingId === alert.id}
                      onClick={() => handleAcknowledge(alert.id)}
                      className="cursor-pointer rounded border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-xs hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {loadingId === alert.id ? "Saving..." : "Acknowledge"}
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
