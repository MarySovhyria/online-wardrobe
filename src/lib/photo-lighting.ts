import { encodePhoto } from "./photo-encoding.ts";

export type PhotoAdjustments = {
  brightness: number;
  contrast: number;
  shadows: number;
};
export const neutralLighting: PhotoAdjustments = {
  brightness: 0,
  contrast: 0,
  shadows: 0,
};
const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, Number.isFinite(value) ? value : 0));
export function adjustPixels(
  pixels: Uint8ClampedArray,
  adjustments: PhotoAdjustments,
) {
  const exposure = 1 + clamp(adjustments.brightness, -30, 30) / 100;
  const contrast = 1 + clamp(adjustments.contrast, -30, 30) / 100;
  const shadows = clamp(adjustments.shadows, 0, 40) / 40;
  for (let i = 0; i < pixels.length; i += 4) {
    if (!pixels[i + 3]) continue;
    const luminance =
      (0.2126 * pixels[i] + 0.7152 * pixels[i + 1] + 0.0722 * pixels[i + 2]) /
      255;
    const lift = 32 * shadows * (1 - luminance) ** 2;
    for (let channel = 0; channel < 3; channel++) {
      const value = pixels[i + channel] * exposure + lift;
      pixels[i + channel] = (value - 127.5) * contrast + 127.5;
    }
  }
  return pixels;
}
/** A bounded suggestion, never applied automatically or interpreted as true garment color. */
export function suggestLighting(pixels: Uint8ClampedArray): PhotoAdjustments {
  const histogram = new Uint32Array(256);
  let count = 0;
  for (let i = 0; i < pixels.length; i += 4) {
    if (pixels[i + 3] < 128) continue;
    histogram[
      Math.round(
        0.2126 * pixels[i] + 0.7152 * pixels[i + 1] + 0.0722 * pixels[i + 2],
      )
    ]++;
    count++;
  }
  if (!count) return { ...neutralLighting };
  const percentile = (fraction: number) => {
    let sum = 0;
    for (let i = 0; i < histogram.length; i++) {
      sum += histogram[i];
      if (sum >= count * fraction) return i;
    }
    return 255;
  };
  const high = percentile(0.9),
    median = percentile(0.5),
    low = percentile(0.1);
  return {
    brightness: Math.round(clamp((220 / Math.max(1, high) - 1) * 100, -10, 10)),
    contrast: high - low < 160 ? 5 : 0,
    shadows: median < 90 ? 8 : 0,
  };
}
export async function readPhoto(photo: Blob) {
  const bitmap = await createImageBitmap(photo);
  try {
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("Your browser could not prepare this photo.");
    context.drawImage(bitmap, 0, 0);
    return {
      canvas,
      context,
      pixels: context.getImageData(0, 0, canvas.width, canvas.height),
    };
  } finally {
    bitmap.close();
  }
}
export async function lightPhoto(
  photo: Blob,
  adjustments: PhotoAdjustments,
): Promise<Blob> {
  if (Object.values(adjustments).every((value) => value === 0)) return photo;
  const { canvas, context, pixels } = await readPhoto(photo);
  adjustPixels(pixels.data, adjustments);
  context.putImageData(pixels, 0, 0);
  return encodePhoto(canvas, 0.92);
}
