import * as ort from "onnxruntime-web/wasm";
import {
  MODEL_SIZE,
  modelInput,
  maskFromPrediction,
} from "./background-removal-model";

self.onmessage = async (
  event: MessageEvent<{ photo: Blob; assets: string }>,
) => {
  let session: ort.InferenceSession | undefined;
  let bitmap: ImageBitmap | undefined;
  try {
    if (typeof OffscreenCanvas === "undefined")
      throw new Error(
        "Background removal is unavailable in this browser. You can keep the photo background.",
      );
    ort.env.wasm.numThreads = 1;
    ort.env.wasm.proxy = false;
    ort.env.wasm.wasmPaths = event.data.assets;
    self.postMessage({ phase: "Downloading background model…" });
    session = await ort.InferenceSession.create(
      `${event.data.assets}u2netp.onnx`,
      { executionProviders: ["wasm"], graphOptimizationLevel: "all" },
    );
    self.postMessage({ phase: "Removing background on your device…" });
    bitmap = await createImageBitmap(event.data.photo);
    const canvas = new OffscreenCanvas(MODEL_SIZE, MODEL_SIZE);
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("Your browser could not prepare the photo.");
    // Transparent pixels composite onto white for RGB inference; source alpha is retained in the final cutout.
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, MODEL_SIZE, MODEL_SIZE);
    context.drawImage(bitmap, 0, 0, MODEL_SIZE, MODEL_SIZE);
    const tensor = new ort.Tensor(
      "float32",
      modelInput(context.getImageData(0, 0, MODEL_SIZE, MODEL_SIZE).data),
      [1, 3, MODEL_SIZE, MODEL_SIZE],
    );
    const output = await session.run({ [session.inputNames[0]]: tensor });
    const prediction = output[session.outputNames[0]].data;
    if (!(prediction instanceof Float32Array))
      throw new Error("Unexpected background model output.");
    context.putImageData(
      new ImageData(
        new Uint8ClampedArray(maskFromPrediction(prediction)),
        MODEL_SIZE,
        MODEL_SIZE,
      ),
      0,
      0,
    );
    self.postMessage({
      mask: await canvas.convertToBlob({ type: "image/png" }),
    });
  } catch (error) {
    self.postMessage({
      error:
        error instanceof Error
          ? error.message
          : "Background removal failed. Retry or keep the background.",
    });
  } finally {
    bitmap?.close();
    await session?.release();
  }
};
