import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const createSchema = z.object({
  reportDate: z.string(),
  activityType: z.string(),
  clientId: z.string().uuid().nullable(),
  counterpartName: z.string().nullable(),
  counterpartCompany: z.string().nullable(),
  summary: z.string().nullable(),
  nextAction: z.string().nullable(),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const validated = createSchema.parse(body);

  const report = await prisma.activityReport.create({
    data: {
      userId: session.user.id,
      reportDate: new Date(validated.reportDate),
      activityType: validated.activityType,
      clientId: validated.clientId,
      counterpartName: validated.counterpartName,
      counterpartCompany: validated.counterpartCompany,
      summary: validated.summary,
      nextAction: validated.nextAction,
    },
  });

  return NextResponse.json(report);
}
