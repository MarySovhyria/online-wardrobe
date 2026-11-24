import test from "node:test";
import assert from "node:assert/strict";
import {
  MODEL_SIZE,
  modelInput,
  maskFromPrediction,
} from "../src/lib/background-removal-model.ts";

test("model normalization uses shared RGB maximum and planar ImageNet channels", () => {
  const pixels = new Uint8ClampedArray(MODEL_SIZE * MODEL_SIZE * 4);
  pixels.set([100, 50, 25, 0]);
  const result = modelInput(pixels);
  const plane = MODEL_SIZE * MODEL_SIZE;
  assert.ok(Math.abs(result[0] - (1 - 0.485) / 0.229) < 1e-6);
  assert.ok(Math.abs(result[plane] - (0.5 - 0.456) / 0.224) < 1e-6);
  assert.ok(Math.abs(result[plane * 2] - (0.25 - 0.406) / 0.225) < 1e-6);
  assert.ok(
    modelInput(new Uint8ClampedArray(pixels.length)).every(Number.isFinite),
  );
  assert.throws(() => modelInput(new Uint8ClampedArray(4)), /dimensions/);
});

test("prediction mask normalizes foreground strength without transparent mask pixels", () => {
  const prediction = new Float32Array(MODEL_SIZE * MODEL_SIZE).fill(0.5);
  prediction[0] = 0;
  prediction[1] = 1;
  const mask = maskFromPrediction(prediction);
  assert.deepEqual(
    [...mask.slice(0, 12)],
    [0, 0, 0, 255, 255, 255, 255, 255, 127, 127, 127, 255],
  );
  assert.throws(
    () => maskFromPrediction(new Float32Array(prediction.length)),
    /clear foreground/,
  );
  prediction[5] = NaN;
  assert.throws(() => maskFromPrediction(prediction), /invalid mask/);
  assert.throws(() => maskFromPrediction(new Float32Array(1)), /dimensions/);
});
