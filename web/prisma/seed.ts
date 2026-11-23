// Seed the database from the files the Python pipeline wrote:
//   prisma/data/fleet.csv   (one row per test engine cycle)
//   prisma/data/model.json  (model metrics)
// Run with: npm run db:seed
import { readFileSync } from "node:fs";
import path from "node:path";
import { Prisma, PrismaClient } from "@prisma/client";
import { detectAnomalies } from "../src/lib/anomaly";
import { statusFromRul } from "../src/lib/health";
import { SENSORS } from "../src/lib/sensors";

const prisma = new PrismaClient();
const DATA_DIR = path.join(__dirname, "data");
const BATCH = 1000;

type Row = { unit: number; cycle: number; predicted_rul: number; true_rul: number } & Record<string, number>;

function readFleetCsv(): Row[] {
  const lines = readFileSync(path.join(DATA_DIR, "fleet.csv"), "utf8").trim().split(/\r?\n/);
  const header = lines[0].split(",");
  return lines.slice(1).map((line) => {
    const values = line.split(",").map(Number);
    return Object.fromEntries(header.map((h, i) => [h, values[i]])) as Row;
  });
}

async function insertInBatches<T>(items: T[], insert: (batch: T[]) => Promise<unknown>) {
  for (let i = 0; i < items.length; i += BATCH) {
    await insert(items.slice(i, i + BATCH));
  }
}

async function main() {
  const rows = readFleetCsv();
  const model = JSON.parse(readFileSync(path.join(DATA_DIR, "model.json"), "utf8"));
  console.log(`Read ${rows.length} rows from fleet.csv`);

  // Clear tables, children first (work orders block engine deletes on purpose).
  await prisma.workOrder.deleteMany();
  await prisma.alert.deleteMany();
  await prisma.reading.deleteMany();
  await prisma.engine.deleteMany();
  await prisma.modelRun.deleteMany();

  // Group rows by engine unit.
  const byUnit = new Map<number, Row[]>();
  for (const r of rows) {
    if (!byUnit.has(r.unit)) byUnit.set(r.unit, []);
    byUnit.get(r.unit)!.push(r);
  }

  let readingCount = 0;
  let alertCount = 0;
  for (const [unit, unitRows] of [...byUnit.entries()].sort((a, b) => a[0] - b[0])) {
    unitRows.sort((a, b) => a.cycle - b.cycle);
    const last = unitRows[unitRows.length - 1];

    const engine = await prisma.engine.create({
      data: {
        serial: `ESN-${String(unit).padStart(3, "0")}`,
        unitNumber: unit,
        currentCycle: last.cycle,
        predictedRul: last.predicted_rul,
        trueRul: last.true_rul,
        status: statusFromRul(last.predicted_rul),
      },
    });

    const readings: Prisma.ReadingCreateManyInput[] = unitRows.map((r) => ({
      engineId: engine.id,
      cycle: r.cycle,
      s2: r.s2, s3: r.s3, s4: r.s4, s7: r.s7, s8: r.s8, s9: r.s9, s11: r.s11,
      s12: r.s12, s13: r.s13, s14: r.s14, s15: r.s15, s17: r.s17, s20: r.s20, s21: r.s21,
      predictedRul: r.predicted_rul,
      trueRul: r.true_rul,
    }));
    await insertInBatches(readings, (batch) => prisma.reading.createMany({ data: batch }));
    readingCount += readings.length;

    const alerts = detectAnomalies(unitRows, SENSORS).map((a) => ({ ...a, engineId: engine.id }));
    if (alerts.length > 0) await prisma.alert.createMany({ data: alerts });
    alertCount += alerts.length;
  }

  await prisma.modelRun.create({
    data: {
      version: model.version,
      algorithm: model.algorithm,
      dataset: model.dataset,
      features: model.features,
      rmse: model.rmse,
      nasaScore: model.nasaScore,
      lrRmse: model.lrRmse,
      lrNasaScore: model.lrNasaScore,
      meanRmse: model.meanRmse,
      importances: model.importances,
      trainedAt: new Date(model.trainedAt),
    },
  });

  const counts = await prisma.engine.groupBy({ by: ["status"], _count: true });
  console.log(`Seeded ${byUnit.size} engines, ${readingCount} readings, ${alertCount} alerts, 1 model run`);
  console.log("Engines by status:", counts.map((c) => `${c.status}=${c._count}`).join(", "));
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
