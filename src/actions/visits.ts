"use server";

import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const createVisitSchema = z.object({
  clientId: z.string().uuid().optional(),
  visitDestinationId: z.string().uuid().optional(),
  activityDate: z.string(),
  activityType: z.string(),
  isNewProspectVisit: z.boolean().optional(),
  needsCeoRecognition: z.boolean().optional(),
  memo: z.string().optional(),
});

export async function createVisit(input: z.infer<typeof createVisitSchema>) {
  const user = await getSessionUser();
  const validated = createVisitSchema.parse(input);

  const visit = await prisma.visitLog.create({
    data: {
      userId: user.id,
      clientId: validated.clientId ?? null,
      visitDestinationId: validated.visitDestinationId ?? null,
      activityDate: new Date(validated.activityDate),
      activityType: validated.activityType,
      isNewProspectVisit: validated.isNewProspectVisit ?? false,
      needsCeoRecognition: validated.needsCeoRecognition ?? false,
      memo: validated.memo ?? null,
    },
  });

  revalidatePath("/visits");
  return visit;
}

export async function startVisit(visitId: string) {
  const user = await getSessionUser();

  const visit = await prisma.visitLog.update({
    where: { id: visitId, userId: user.id },
    data: { visitStartAt: new Date() },
  });

  revalidatePath("/visits");
  return visit;
}

export async function endVisit(visitId: string) {
  const user = await getSessionUser();

  const visit = await prisma.visitLog.update({
    where: { id: visitId, userId: user.id },
    data: { visitEndAt: new Date() },
  });

  revalidatePath("/visits");
  return visit;
}

export async function getVisits(params?: {
  month?: string;
  page?: number;
  limit?: number;
}) {
  const user = await getSessionUser();
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 20;

  const where: Record<string, unknown> = { userId: user.id };

  if (params?.month) {
    const [year, month] = params.month.split("-").map(Number);
    where.activityDate = {
      gte: new Date(year, month - 1, 1),
      lt: new Date(year, month, 1),
    };
  }

  const [visits, total] = await Promise.all([
    prisma.visitLog.findMany({
      where,
      orderBy: { activityDate: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        client: true,
        visitDestination: true,
        gpsLogs: { orderBy: { capturedAt: "desc" }, take: 2 },
        _count: {
          select: {
            uploadedPhotos: true,
            audioRecords: true,
            activityReports: true,
          },
        },
      },
    }),
    prisma.visitLog.count({ where }),
  ]);

  return { visits, total, page, limit };
}

export async function deleteVisit(visitId: string) {
  const user = await getSessionUser();

  await prisma.visitLog.delete({
    where: { id: visitId, userId: user.id },
  });

  revalidatePath("/visits");
}
