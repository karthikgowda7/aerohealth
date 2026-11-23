"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { nextStatuses, type WorkOrderStatus } from "@/lib/workorder";

export default function StatusButtons({
  id,
  status,
}: {
  id: string;
  status: WorkOrderStatus;
}) {
  const router = useRouter();
  const [loadingStatus, setLoadingStatus] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const possibleNext = nextStatuses(status);

  if (possibleNext.length === 0) {
    return <span className="text-xs font-medium text-slate-400">Closed</span>;
  }

  async function handleTransition(to: WorkOrderStatus) {
    setLoadingStatus(to);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/work-orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: to }),
      });

      if (res.status === 409) {
        const json = await res.json().catch(() => null);
        setErrorMessage(json?.error?.message ?? "Invalid transition");
      } else if (res.ok) {
        router.refresh();
      } else {
        const json = await res.json().catch(() => null);
        setErrorMessage(json?.error?.message ?? "Error updating status");
      }
    } catch {
      setErrorMessage("Network error");
    } finally {
      setLoadingStatus(null);
    }
  }

  const labels: Record<WorkOrderStatus, string> = {
    OPEN: "Reopen",
    IN_PROGRESS: "Start",
    COMPLETED: "Complete",
    CANCELLED: "Cancel",
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {possibleNext.map((next) => {
        const label = labels[next] ?? next;
        const isCancel = next === "CANCELLED";

        return (
          <button
            key={next}
            type="button"
            disabled={loadingStatus !== null}
            onClick={() => handleTransition(next)}
            className={`cursor-pointer rounded px-2.5 py-1 text-xs font-medium shadow-xs disabled:cursor-not-allowed disabled:opacity-50 ${
              isCancel
                ? "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                : next === "COMPLETED"
                ? "border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                : "border border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100"
            }`}
          >
            {loadingStatus === next ? "..." : label}
          </button>
        );
      })}
      {errorMessage && (
        <span className="text-xs font-medium text-rose-600">{errorMessage}</span>
      )}
    </div>
  );
}
