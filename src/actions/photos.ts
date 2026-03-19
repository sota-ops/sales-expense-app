"use server";

import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { z } from "zod";

const uploadPhotoSchema = z.object({
  visitLogId: z.string().uuid().optional(),
  expenseItemId: z.string().uuid().optional(),
  fileUrl: z.string(),
  originalFilename: z.string(),
  mimeType: z.string(),
  fileSize: z.number(),
  exifData: z
    .object({
      takenAt: z.string().nullable(),
      latitude: z.number().nullable(),
      longitude: z.number().nullable(),
      geolocationExists: z.boolean(),
      deviceMake: z.string().nullable(),
      deviceModel: z.string().nullable(),
      imageWidth: z.number().nullable(),
      imageHeight: z.number().nullable(),
      orientation: z.number().nullable(),
      timezoneInfo: z.string().nullable(),
    })
    .optional(),
});

export async function uploadPhoto(input: z.infer<typeof uploadPhotoSchema>) {
  const user = await getSessionUser();
  const validated = uploadPhotoSchema.parse(input);

  const photo = await prisma.uploadedPhoto.create({
    data: {
      userId: user.id,
      visitLogId: validated.visitLogId ?? null,
      expenseItemId: validated.expenseItemId ?? null,
      fileUrl: validated.fileUrl,
      originalFilename: validated.originalFilename,
      mimeType: validated.mimeType,
      fileSize: validated.fileSize,
    },
  });

  if (validated.exifData) {
    await prisma.photoExifMetadata.create({
      data: {
        uploadedPhotoId: photo.id,
        takenAt: validated.exifData.takenAt
          ? new Date(validated.exifData.takenAt)
          : null,
        latitude: validated.exifData.latitude,
        longitude: validated.exifData.longitude,
        geolocationExists: validated.exifData.geolocationExists,
        deviceMake: validated.exifData.deviceMake,
        deviceModel: validated.exifData.deviceModel,
        imageWidth: validated.exifData.imageWidth,
        imageHeight: validated.exifData.imageHeight,
        orientation: validated.exifData.orientation,
        timezoneInfo: validated.exifData.timezoneInfo,
      },
    });
  }

  return photo;
}

export async function getPhotos(visitLogId: string) {
  const user = await getSessionUser();

  const photos = await prisma.uploadedPhoto.findMany({
    where: { visitLogId, userId: user.id },
    include: { exifMetadata: true },
    orderBy: { uploadedAt: "desc" },
  });

  return photos;
}
