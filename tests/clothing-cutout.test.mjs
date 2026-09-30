import { test } from "node:test";
import assert from "node:assert/strict";
import { maskPixels } from "../src/lib/clothing-cutout.ts";

test("removes background, preserves fabric color and existing transparency", () => {
  const pixels = new Uint8ClampedArray([
    10, 20, 30, 255, 40, 50, 60, 128, 70, 80, 90, 255,
  ]);
  const mask = new Uint8ClampedArray([
    0, 0, 0, 255, 255, 255, 255, 255, 128, 128, 128, 255,
  ]);
  maskPixels(pixels, mask, 3, 1);
  assert.deepEqual(
    [...pixels],
    [10, 20, 30, 0, 40, 50, 60, 128, 70, 80, 90, 128],
  );
});
test("crops around selected fabric with padding, without cutting off edges", () => {
  const pixels = new Uint8ClampedArray(20 * 20 * 4).fill(255);
  const mask = new Uint8ClampedArray(pixels.length);
  for (let y = 5; y <= 10; y++)
    for (let x = 8; x <= 12; x++)
      mask.fill(255, (y * 20 + x) * 4, (y * 20 + x) * 4 + 4);
  assert.deepEqual(maskPixels(pixels, mask, 20, 20), {
    left: 6,
    top: 3,
    width: 9,
    height: 10,
  });
  const edge = new Uint8ClampedArray(4).fill(255);
  assert.deepEqual(maskPixels(edge, edge.slice(), 1, 1), {
    left: 0,
    top: 0,
    width: 1,
    height: 1,
  });
});
test("rejects empty and mismatched masks instead of saving a blank image", () => {
  assert.throws(
    () =>
      maskPixels(
        new Uint8ClampedArray(4).fill(255),
        new Uint8ClampedArray(4),
        1,
        1,
      ),
    /No visible clothing/,
  );
  assert.throws(
    () => maskPixels(new Uint8ClampedArray(4), new Uint8ClampedArray(8), 1, 1),
    /does not match/,
  );
});
