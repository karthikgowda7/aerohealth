export type WorkOrderStatus = "OPEN" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

// Allowed moves. COMPLETED and CANCELLED are final.
const NEXT: Record<WorkOrderStatus, WorkOrderStatus[]> = {
  OPEN: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

/** Statuses a work order can move to from `from`. */
export function nextStatuses(from: WorkOrderStatus): WorkOrderStatus[] {
  return NEXT[from];
}

/** True if the move is allowed. The same status counts as allowed (no change). */
export function canTransition(from: WorkOrderStatus, to: WorkOrderStatus): boolean {
  return from === to || NEXT[from].includes(to);
}
