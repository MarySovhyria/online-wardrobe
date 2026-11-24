import { encodePhoto } from "./photo-encoding.ts";

// Keep the original RGB values; use the segmentation mask only for transparency.
export function maskPixels(
  pixels: Uint8ClampedArray,
  mask: Uint8ClampedArray,
  width: number,
  height: number,
) {
  if (pixels.length !== width * height * 4 || mask.length !== pixels.length)
    throw new Error("The clothing mask does not match the photo.");
  let left = width,
    top = height,
    right = -1,
    bottom = -1;
  for (let i = 0; i < pixels.length; i += 4) {
    pixels[i + 3] = Math.round(
      pixels[i + 3] * (mask[i] / 255) * (mask[i + 3] / 255),
    );
    if (pixels[i + 3] > 16) {
      const x = (i / 4) % width;
      const y = Math.floor(i / 4 / width);
      left = Math.min(left, x);
      top = Math.min(top, y);
      right = Math.max(right, x);
      bottom = Math.max(bottom, y);
    }
  }
  if (right < left)
    throw new Error(
      "No visible clothing found. Try a clearer photo or a different clothing type.",
    );
  const padding = Math.max(
    2,
    Math.round(Math.max(right - left, bottom - top) * 0.04),
  );
  left = Math.max(0, left - padding);
  top = Math.max(0, top - padding);
  right = Math.min(width - 1, right + padding);
  bottom = Math.min(height - 1, bottom + padding);
  return { left, top, width: right - left + 1, height: bottom - top + 1 };
}

export async function createCutout(
  photo: Blob,
  maskUrl: string,
): Promise<Blob> {
  const original = await createImageBitmap(photo);
  try {
    const mask = await createImageBitmap(await (await fetch(maskUrl)).blob());
    try {
      const canvas = document.createElement("canvas");
      canvas.width = original.width;
      canvas.height = original.height;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context)
        throw new Error("Your browser could not process this image.");
      context.drawImage(mask, 0, 0, canvas.width, canvas.height);
      const maskData = context.getImageData(0, 0, canvas.width, canvas.height);
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(original, 0, 0);
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
      const bounds = maskPixels(
        pixels.data,
        maskData.data,
        canvas.width,
        canvas.height,
      );
      context.putImageData(pixels, 0, 0);
      const cropped = document.createElement("canvas");
      cropped.width = bounds.width;
      cropped.height = bounds.height;
      const croppedContext = cropped.getContext("2d");
      if (!croppedContext)
        throw new Error("Your browser could not process this image.");
      croppedContext.drawImage(
        canvas,
        bounds.left,
        bounds.top,
        bounds.width,
        bounds.height,
        0,
        0,
        bounds.width,
        bounds.height,
      );
      return await encodePhoto(cropped, 0.92);
    } finally {
      mask.close();
    }
  } finally {
    original.close();
  }
}
