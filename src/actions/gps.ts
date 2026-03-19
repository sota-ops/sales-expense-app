"use server";

import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { z } from "zod";

const captureGpsSchema = z.object({
  visitLogId: z.string().uuid().optional(),
  latitude: z.number(),
  longitude: z.number(),
  accuracy: z.number().optional(),
  sourceType: z.string(),
});

export async function captureGps(input: z.infer<typeof captureGpsSchema>) {
  const user = await getSessionUser();
  const validated = captureGpsSchema.parse(input);

  const gpsLog = await prisma.gpsLog.create({
    data: {
      userId: user.id,
      visitLogId: validated.visitLogId ?? null,
      capturedAt: new Date(),
      latitude: validated.latitude,
      longitude: validated.longitude,
      accuracy: validated.accuracy ?? null,
      sourceType: validated.sourceType,
    },
  });

  return gpsLog;
}

export async function getGpsLogs(visitLogId: string) {
  const user = await getSessionUser();

  const logs = await prisma.gpsLog.findMany({
    where: { visitLogId, userId: user.id },
    orderBy: { capturedAt: "asc" },
  });

  return logs;
}
