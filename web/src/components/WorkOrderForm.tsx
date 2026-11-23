"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function WorkOrderForm({ engineSerial }: { engineSerial: string }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH" | "AOG">("MEDIUM");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setFieldErrors({});
    setSuccessMessage(null);

    try {
      const res = await fetch("/api/work-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          engineSerial,
          title,
          description: description.trim() ? description.trim() : undefined,
          priority,
        }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        if (json?.error?.details?.fieldErrors) {
          setFieldErrors(json.error.details.fieldErrors);
        } else if (json?.error?.message) {
          setFieldErrors({ title: [json.error.message] });
        }
      } else {
        setTitle("");
        setDescription("");
        setPriority("MEDIUM");
        setFieldErrors({});
        setSuccessMessage("Work order created");
        router.refresh();
      }
    } catch {
      setFieldErrors({ title: ["An unexpected error occurred. Please try again."] });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {successMessage && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-xs font-medium text-emerald-800">
          ✓ {successMessage}
        </div>
      )}

      <div>
        <label htmlFor="wo-title" className="block text-xs font-medium uppercase text-slate-700">
          Title <span className="text-rose-500">*</span>
        </label>
        <input
          id="wo-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Inspect high pressure compressor"
          className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-xs placeholder:text-slate-400 focus:border-slate-500 focus:outline-hidden focus:ring-1 focus:ring-slate-500"
          required
        />
        {fieldErrors.title?.[0] && (
          <p className="mt-1 text-xs text-rose-600">{fieldErrors.title[0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="wo-desc" className="block text-xs font-medium uppercase text-slate-700">
          Description (optional)
        </label>
        <textarea
          id="wo-desc"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add maintenance notes or instructions..."
          className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-xs placeholder:text-slate-400 focus:border-slate-500 focus:outline-hidden focus:ring-1 focus:ring-slate-500"
        />
        {fieldErrors.description?.[0] && (
          <p className="mt-1 text-xs text-rose-600">{fieldErrors.description[0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="wo-priority" className="block text-xs font-medium uppercase text-slate-700">
          Priority
        </label>
        <select
          id="wo-priority"
          value={priority}
          onChange={(e) => setPriority(e.target.value as "LOW" | "MEDIUM" | "HIGH" | "AOG")}
          className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-xs focus:border-slate-500 focus:outline-hidden focus:ring-1 focus:ring-slate-500"
        >
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="AOG">AOG (Aircraft on ground)</option>
        </select>
        {fieldErrors.priority?.[0] && (
          <p className="mt-1 text-xs text-rose-600">{fieldErrors.priority[0]}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full cursor-pointer rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-xs hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? "Creating..." : "Create work order"}
      </button>
    </form>
  );
}
