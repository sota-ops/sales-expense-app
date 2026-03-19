"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export async function getClients() {
  return prisma.client.findMany({
    where: { isActive: true },
    orderBy: { clientName: "asc" },
    include: {
      visitDestinations: { where: { isActive: true } },
    },
  });
}

export async function getClientsForSelect() {
  return prisma.client.findMany({
    where: { isActive: true },
    select: { id: true, clientName: true, clientCode: true },
    orderBy: { clientName: "asc" },
  });
}

const createClientSchema = z.object({
  clientCode: z.string().min(1),
  clientName: z.string().min(1),
  isProspect: z.boolean().optional(),
  address: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  phone: z.string().optional(),
});

export async function createClient(input: z.infer<typeof createClientSchema>) {
  const validated = createClientSchema.parse(input);

  const client = await prisma.client.create({
    data: {
      clientCode: validated.clientCode,
      clientName: validated.clientName,
      isProspect: validated.isProspect ?? false,
      address: validated.address ?? null,
      latitude: validated.latitude ?? null,
      longitude: validated.longitude ?? null,
      phone: validated.phone ?? null,
    },
  });

  revalidatePath("/clients");
  return client;
}
