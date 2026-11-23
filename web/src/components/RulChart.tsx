"use client";

import { CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type Point = { cycle: number; predictedRul: number; trueRul: number };

/** Predicted vs actual Remaining Useful Life over the engine's cycles. */
export default function RulChart({ points }: { points: Point[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={points}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="cycle" />
        <YAxis label={{ value: "RUL (cycles)", angle: -90, position: "insideLeft" }} />
        <Tooltip />
        <Legend />
        <ReferenceLine y={75} stroke="#d97706" strokeDasharray="4 4" label="Watch" />
        <ReferenceLine y={30} stroke="#dc2626" strokeDasharray="4 4" label="Critical" />
        <Line type="monotone" dataKey="predictedRul" name="Predicted RUL" stroke="#2563eb" dot={false} isAnimationActive={false} />
        <Line type="monotone" dataKey="trueRul" name="Actual RUL" stroke="#64748b" strokeDasharray="5 5" dot={false} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
