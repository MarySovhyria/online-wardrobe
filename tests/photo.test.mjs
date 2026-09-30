import { test } from "node:test";
import assert from "node:assert/strict";
import { preparePhoto } from "../src/lib/supabase.ts";

test("rejects unsupported image types before decoding", async () => {
  await assert.rejects(
    preparePhoto(new File(["x"], "photo.heic", { type: "image/heic" })),
    /JPEG, PNG, or WebP/,
  );
});
test("rejects images larger than 10 MiB", async () => {
  await assert.rejects(
    preparePhoto(
      new File([new Uint8Array(10 * 1024 * 1024 + 1)], "photo.png", {
        type: "image/png",
      }),
    ),
    /smaller than 10 MB/,
  );
});
test("resizes, encodes, preserves small image size, and releases decoded images", async (t) => {
  let closed = 0;
  let width = 3200;
  let height = 2400;
  let failEncode = false;
  const canvas = {
    width: 0,
    height: 0,
    getContext: () => ({ drawImage() {} }),
    toBlob(callback, type, quality) {
      assert.equal(type, "image/webp");
      assert.equal(quality, 0.88);
      callback(failEncode ? null : new Blob(["encoded"], { type }));
    },
  };
  t.mock.method(globalThis, "createImageBitmap", async () => ({
    width,
    height,
    close() {
      closed++;
    },
  }));
  t.mock.method(globalThis.document, "createElement", () => canvas);
  const file = new File(["image"], "photo.png", { type: "image/png" });
  const result = await preparePhoto(file);
  assert.equal(result.type, "image/webp");
  assert.equal(canvas.width, 1600);
  assert.equal(canvas.height, 1200);
  assert.equal(closed, 1);
  width = 300;
  height = 500;
  await preparePhoto(file);
  assert.equal(canvas.width, 300);
  assert.equal(canvas.height, 500);
  assert.equal(closed, 2);
  failEncode = true;
  await assert.rejects(preparePhoto(file), /Could not process/);
  assert.equal(closed, 3);
});

// Browser API seams used only by the image-processing test above.
globalThis.createImageBitmap = async () => {
  throw new Error("Unmocked decoder");
};
globalThis.document = {
  createElement() {
    throw new Error("Unmocked canvas");
  },
};
