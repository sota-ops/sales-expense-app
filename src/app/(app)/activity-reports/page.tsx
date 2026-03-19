import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { ActivityReportsClient } from "./activity-reports-client";

export default async function ActivityReportsPage() {
  const user = await getSessionUser();

  const reports = await prisma.activityReport.findMany({
    where: { userId: user.id },
    orderBy: { reportDate: "desc" },
    take: 50,
    include: {
      client: true,
      visitLog: true,
      activityEvidences: true,
    },
  });

  const clients = await prisma.client.findMany({
    where: { isActive: true },
    select: { id: true, clientName: true },
    orderBy: { clientName: "asc" },
  });

  return <ActivityReportsClient reports={reports} clients={clients} />;
}
