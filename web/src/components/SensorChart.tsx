"use client";

import { useState } from "react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { SENSORS, SENSOR_LABELS, type SensorName } from "@/lib/sensors";

type Reading = { cycle: number } & Record<SensorName, number>;
type AlertPoint = { cycle: number; sensor: string };

const COLORS = ["#2563eb", "#16a34a", "#d97706", "#9333ea"];

/** Scale each sensor to 0-100 (min to max for this engine) so different units fit on one chart. */
function normalise(readings: Reading[], sensors: SensorName[]) {
  const range = Object.fromEntries(
    sensors.map((s) => {
      const vals = readings.map((r) => r[s]);
      return [s, { min: Math.min(...vals), max: Math.max(...vals) }];
    }),
  );
  return readings.map((r) => {
    const row: Record<string, number> = { cycle: r.cycle };
    for (const s of sensors) {
      const { min, max } = range[s];
      row[s] = max === min ? 50 : Number((((r[s] - min) / (max - min)) * 100).toFixed(1));
    }
    return row;
  });
}

export default function SensorChart({ readings, alerts }: { readings: Reading[]; alerts: AlertPoint[] }) {
  const [selected, setSelected] = useState<SensorName[]>(["s4", "s7", "s11", "s12"]);
  const data = normalise(readings, selected);

  function toggle(s: SensorName) {
    setSelected((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : cur.length < 4 ? [...cur, s] : cur));
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-2">
        {SENSORS.map((s) => (
          <button
            key={s}
            onClick={() => toggle(s)}
            title={SENSOR_LABELS[s]}
            className={`rounded border px-2 py-1 text-xs ${selected.includes(s) ? "bg-slate-800 text-white" : "bg-white text-slate-700"}`}
          >
            {s}
          </button>
        ))}
      </div>
      <p className="mb-2 text-xs text-slate-500">Pick up to 4 sensors. Values scaled 0 to 100 per sensor. Red dots are alerts.</p>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="cycle" label={{ value: "Cycle", position: "insideBottom", offset: -2 }} />
          <YAxis domain={[0, 100]} />
          <Tooltip />
          <Legend formatter={(v: string) => `${v} · ${SENSOR_LABELS[v as SensorName]}`} />
          {selected.map((s, i) => (
            <Line
              key={s}
              type="monotone"
              dataKey={s}
              stroke={COLORS[i]}
              strokeWidth={1.5}
              isAnimationActive={false}
              dot={(props: { cx?: number; cy?: number; payload?: { cycle: number }; index?: number }) => {
                const hit = alerts.some((a) => a.sensor === s && a.cycle === props.payload?.cycle);
                return hit ? (
                  <circle key={`${s}-${props.index}`} cx={props.cx} cy={props.cy} r={4} fill="#dc2626" />
                ) : (
                  <g key={`${s}-${props.index}`} />
                );
              }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
