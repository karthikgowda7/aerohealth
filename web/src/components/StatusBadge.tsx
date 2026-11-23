export type StatusBadgeProps = {
  status: "HEALTHY" | "WATCH" | "CRITICAL";
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  let colorStyles = "bg-emerald-100 text-emerald-800 border-emerald-300";
  if (status === "WATCH") {
    colorStyles = "bg-amber-100 text-amber-800 border-amber-300";
  } else if (status === "CRITICAL") {
    colorStyles = "bg-rose-100 text-rose-800 border-rose-300";
  }

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${colorStyles}`}
    >
      {status}
    </span>
  );
}
