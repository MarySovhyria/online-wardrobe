import { test } from "node:test";
import assert from "node:assert/strict";
import {
  adjustPixels,
  suggestLighting,
  neutralLighting,
  lightPhoto,
} from "../src/lib/photo-lighting.ts";

test("neutral lighting preserves all colors and alpha exactly", () => {
  const pixels = new Uint8ClampedArray([
    17, 45, 201, 255, 250, 110, 9, 80, 24, 33, 42, 0,
  ]);
  const before = pixels.slice();
  adjustPixels(pixels, neutralLighting);
  assert.deepEqual(pixels, before);
});
test("lighting preserves pixel positions, transparency and hue of neutral fabric", () => {
  const pixels = new Uint8ClampedArray([
    20, 20, 20, 255, 120, 120, 120, 100, 30, 40, 50, 0,
  ]);
  const alpha = [pixels[3], pixels[7], pixels[11]];
  adjustPixels(pixels, { brightness: 10, contrast: 5, shadows: 8 });
  assert.deepEqual([pixels[3], pixels[7], pixels[11]], alpha);
  assert.equal(pixels.length, 12);
  assert.equal(pixels[0], pixels[1]);
  assert.equal(pixels[1], pixels[2]);
  assert.deepEqual([...pixels.slice(8)], [30, 40, 50, 0]);
  assert.ok(pixels[4] > pixels[0]);
});
test("shadow control lifts dark fabric more than highlights without replacing texture", () => {
  const pixels = new Uint8ClampedArray([
    25, 25, 25, 255, 35, 35, 35, 255, 230, 230, 230, 255,
  ]);
  adjustPixels(pixels, { brightness: 0, contrast: 0, shadows: 40 });
  assert.ok(pixels[0] - 25 > pixels[8] - 230);
  assert.ok(pixels[4] > pixels[0]);
  assert.equal(pixels[11], 255);
});
test("Auto light is bounded and ignores transparent background pixels", () => {
  const visible = new Uint8ClampedArray([60, 60, 60, 255, 100, 100, 100, 255]);
  const withTransparent = new Uint8ClampedArray([
    ...visible,
    255,
    255,
    255,
    0,
    0,
    0,
    0,
    0,
  ]);
  assert.deepEqual(suggestLighting(visible), suggestLighting(withTransparent));
  for (const values of [
    [0, 0, 0, 255],
    [255, 255, 255, 255],
    [...visible],
    [50, 50, 50, 0],
  ]) {
    const suggestion = suggestLighting(new Uint8ClampedArray(values));
    assert.ok(Math.abs(suggestion.brightness) <= 10);
    assert.ok(suggestion.contrast >= 0 && suggestion.contrast <= 5);
    assert.ok(suggestion.shadows >= 0 && suggestion.shadows <= 8);
  }
  assert.deepEqual(
    suggestLighting(new Uint8ClampedArray([30, 30, 30, 0])),
    neutralLighting,
  );
});
test("invalid adjustments cannot corrupt output, and identity reuses the prepared original", async () => {
  const pixels = new Uint8ClampedArray([50, 100, 150, 255]);
  adjustPixels(pixels, { brightness: NaN, contrast: Infinity, shadows: NaN });
  assert.deepEqual([...pixels], [50, 100, 150, 255]);
  const photo = new Blob(["prepared"], { type: "image/webp" });
  assert.equal(await lightPhoto(photo, neutralLighting), photo);
});
