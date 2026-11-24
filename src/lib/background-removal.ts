import { createCutout } from "./clothing-cutout";

export async function removeBackground(
  photo: Blob,
  onProgress?: (phase: string) => void,
  signal?: AbortSignal,
): Promise<Blob> {
  signal?.throwIfAborted();
  if (typeof Worker === "undefined")
    throw new Error(
      "Background removal is unavailable in this browser. You can keep the photo background.",
    );
  const worker = new Worker(
    new URL("./background-removal.worker.ts", import.meta.url),
    { type: "module" },
  );
  try {
    const mask = await new Promise<Blob>((resolve, reject) => {
      const abort = () =>
        reject(new DOMException("Photo processing cancelled.", "AbortError"));
      signal?.addEventListener("abort", abort, { once: true });
      const cleanup = () => signal?.removeEventListener("abort", abort);
      worker.onerror = () => {
        cleanup();
        reject(
          new Error(
            "Background removal could not start. Retry or keep the background.",
          ),
        );
      };
      worker.onmessage = (
        event: MessageEvent<{ phase?: string; mask?: Blob; error?: string }>,
      ) => {
        if (event.data.phase) onProgress?.(event.data.phase);
        if (event.data.error) {
          cleanup();
          reject(new Error(event.data.error));
        }
        if (event.data.mask) {
          cleanup();
          resolve(event.data.mask);
        }
      };
      worker.postMessage({
        photo,
        assets: new URL("/photo-assets/", window.location.origin).href,
      });
    });
    signal?.throwIfAborted();
    onProgress?.("Finishing cutout…");
    const url = URL.createObjectURL(mask);
    try {
      const cutout = await createCutout(photo, url);
      signal?.throwIfAborted();
      return cutout;
    } finally {
      URL.revokeObjectURL(url);
    }
  } finally {
    worker.terminate();
  }
}
