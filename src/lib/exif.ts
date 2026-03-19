import exifr from "exifr";
import type { PhotoExifData } from "@/types";

export async function extractExifData(
  file: File
): Promise<PhotoExifData | null> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const exif = await (exifr.parse as any)(file, {
      gps: true,
      exif: true,
      ifd0: true,
    });

    if (!exif) return null;

    return {
      takenAt: exif.DateTimeOriginal ?? exif.CreateDate ?? null,
      latitude: exif.latitude ?? null,
      longitude: exif.longitude ?? null,
      geolocationExists: !!(exif.latitude && exif.longitude),
      deviceMake: exif.Make ?? null,
      deviceModel: exif.Model ?? null,
      imageWidth: exif.ImageWidth ?? exif.ExifImageWidth ?? null,
      imageHeight: exif.ImageHeight ?? exif.ExifImageHeight ?? null,
      orientation: exif.Orientation ?? null,
      timezoneInfo: exif.OffsetTimeOriginal ?? exif.OffsetTime ?? null,
    };
  } catch {
    return null;
  }
}

export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3;
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLon = (lon2 - lon1) * rad;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * rad) *
      Math.cos(lat2 * rad) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
