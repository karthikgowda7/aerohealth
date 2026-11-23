import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function Page() {
  const run = await prisma.modelRun.findFirst({
    orderBy: { trainedAt: "desc" },
  });

  if (!run) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-xs">
        No model found. Run the seed script.
      </div>
    );
  }

  const imps = (run.importances as { feature: string; importance: number }[]) || [];
  const top8 = imps.slice(0, 8);
  const maxImportance = Math.max(...top8.map((i) => i.importance), 0.0001);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Predictive Model
        </h1>
        <p className="text-sm text-slate-500">
          Random Forest model architecture, training performance, and feature importances.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Card: Model */}
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-xs">
          <h2 className="mb-4 text-base font-bold text-slate-900">Model</h2>
          <dl className="divide-y divide-slate-100 text-sm">
            <div className="flex justify-between py-2">
              <dt className="text-slate-500">Version</dt>
              <dd className="font-mono font-medium text-slate-900">{run.version}</dd>
            </div>
            <div className="flex justify-between py-2">
              <dt className="text-slate-500">Algorithm</dt>
              <dd className="font-medium text-slate-900">{run.algorithm}</dd>
            </div>
            <div className="flex justify-between py-2">
              <dt className="text-slate-500">Dataset</dt>
              <dd className="font-medium text-slate-900">{run.dataset}</dd>
            </div>
            <div className="flex justify-between py-2">
              <dt className="text-slate-500">Trained Date</dt>
              <dd className="text-slate-900">
                {new Date(run.trainedAt).toLocaleDateString()}
              </dd>
            </div>
            <div className="flex justify-between py-2">
              <dt className="text-slate-500">Number of Features</dt>
              <dd className="font-mono font-medium text-slate-900">
                {run.features.length}
              </dd>
            </div>
          </dl>
        </div>

        {/* Card: Limitations */}
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-xs">
          <h2 className="mb-4 text-base font-bold text-slate-900">Limitations</h2>
          <ul className="list-inside list-disc space-y-2 text-sm text-slate-600">
            <li>Simulated NASA data, not real engine data.</li>
            <li>One operating condition and one fault mode (FD001).</li>
            <li>Predictions are made offline in batch, not live.</li>
            <li>The RUL target is capped at 125 cycles.</li>
            <li>Anomaly rule assumes the first 20 cycles are healthy.</li>
          </ul>
        </div>
      </div>

      {/* Card: Results */}
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-xs">
        <h2 className="mb-4 text-base font-bold text-slate-900">Results</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">Model</th>
                <th className="px-4 py-3">RMSE (cycles)</th>
                <th className="px-4 py-3">NASA Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="px-4 py-3 text-slate-600">Always predict the average</td>
                <td className="px-4 py-3 font-mono">{run.meanRmse.toFixed(2)}</td>
                <td className="px-4 py-3 font-mono">-</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-slate-600">Linear Regression (baseline)</td>
                <td className="px-4 py-3 font-mono">{run.lrRmse.toFixed(2)}</td>
                <td className="px-4 py-3 font-mono">{run.lrNasaScore.toFixed(1)}</td>
              </tr>
              <tr className="bg-slate-50/50 font-bold text-slate-900">
                <td className="px-4 py-3">Random Forest (used in the app)</td>
                <td className="px-4 py-3 font-mono">{run.rmse.toFixed(2)}</td>
                <td className="px-4 py-3 font-mono">{run.nasaScore.toFixed(1)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          RMSE = typical error in flight cycles. NASA score punishes late predictions
          (predicting more life than is left) more than early ones. Lower is better for both.
        </p>
      </div>

      {/* Card: Top Features */}
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-xs">
        <h2 className="mb-4 text-base font-bold text-slate-900">Top features</h2>
        <div className="space-y-3">
          {top8.map((item) => {
            const widthPct = (item.importance / maxImportance) * 100;

            return (
              <div key={item.feature} className="space-y-1">
                <div className="flex justify-between text-xs font-medium text-slate-700">
                  <span className="font-mono">{item.feature}</span>
                  <span className="font-mono text-slate-500">
                    {(item.importance * 100).toFixed(1)}% ({item.importance.toFixed(4)})
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-blue-600"
                    style={{ width: `${widthPct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
