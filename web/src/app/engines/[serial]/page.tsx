import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import SensorChart from "@/components/SensorChart";
import RulChart from "@/components/RulChart";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ serial: string }> }) {
  const { serial } = await params;
  const engine = await prisma.engine.findUnique({ where: { serial }, include: { readings: { orderBy: { cycle: "asc" } }, alerts: true } });
  if (!engine) notFound();
  return (
    <main className="p-4">
      <SensorChart readings={engine.readings} alerts={engine.alerts} />
      <RulChart points={engine.readings} />
    </main>
  );
}
