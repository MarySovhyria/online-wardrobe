export const MODEL_SIZE = 320;

// rembg U2netpSession: RGB / maximum RGB, then ImageNet channel mean/std.
export function modelInput(pixels: Uint8ClampedArray): Float32Array {
  if (pixels.length !== MODEL_SIZE * MODEL_SIZE * 4)
    throw new Error("Invalid model input dimensions.");
  let maximum = 0;
  for (let i = 0; i < pixels.length; i += 4)
    maximum = Math.max(maximum, pixels[i], pixels[i + 1], pixels[i + 2]);
  maximum = maximum || 1;
  const plane = MODEL_SIZE * MODEL_SIZE;
  const tensor = new Float32Array(plane * 3);
  const means = [0.485, 0.456, 0.406];
  const stds = [0.229, 0.224, 0.225];
  for (let i = 0; i < plane; i++)
    for (let channel = 0; channel < 3; channel++)
      tensor[channel * plane + i] =
        (pixels[i * 4 + channel] / maximum - means[channel]) / stds[channel];
  return tensor;
}

export function maskFromPrediction(
  prediction: Float32Array,
): Uint8ClampedArray {
  if (prediction.length !== MODEL_SIZE * MODEL_SIZE)
    throw new Error("Unexpected background model output dimensions.");
  let minimum = Infinity,
    maximum = -Infinity;
  for (const value of prediction) {
    if (!Number.isFinite(value))
      throw new Error("The background model returned an invalid mask.");
    minimum = Math.min(minimum, value);
    maximum = Math.max(maximum, value);
  }
  if (maximum - minimum < 1e-8)
    throw new Error(
      "No clear foreground was found. Try a clearer photo or keep its background.",
    );
  const result = new Uint8ClampedArray(prediction.length * 4);
  for (let i = 0; i < prediction.length; i++) {
    const value = Math.floor(
      ((prediction[i] - minimum) / (maximum - minimum)) * 255,
    );
    result[i * 4] = result[i * 4 + 1] = result[i * 4 + 2] = value;
    result[i * 4 + 3] = 255;
  }
  return result;
}
