// Safari can decode WebP but may silently return PNG from canvas.toBlob.
// Load the free WASM encoder only when native WebP encoding is unavailable.
let fallback: Promise<typeof import("@jsquash/webp/encode.js")> | undefined;
async function webpEncoder() {
  if (!fallback) {
    fallback = import("@jsquash/webp/encode.js").then(async (encoder) => {
      await encoder.init({
        locateFile: (file: string) => `/photo-assets/${file}`,
      });
      return encoder;
    });
    fallback.catch(() => {
      fallback = undefined;
    });
  }
  return fallback;
}

export async function encodePhoto(
  canvas: HTMLCanvasElement,
  quality: number,
): Promise<Blob> {
  const native = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", quality),
  );
  if (native?.type === "image/webp") return native;
  if (!native) throw new Error("Could not process this photo.");
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Your browser could not process this image.");
  try {
    const encoder = await webpEncoder();
    const bytes = await encoder.default(
      context.getImageData(0, 0, canvas.width, canvas.height),
      {
        quality: Math.round(Math.max(0, Math.min(1, quality)) * 100),
        alpha_quality: 100,
      },
    );
    return new Blob([bytes], { type: "image/webp" });
  } catch {
    throw new Error(
      "Could not load the photo encoder. Check your connection and try again.",
    );
  }
}
