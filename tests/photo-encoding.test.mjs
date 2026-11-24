import test from "node:test";
import assert from "node:assert/strict";
import { encodePhoto } from "../src/lib/photo-encoding.ts";

test("native WebP output is returned without loading a codec or reading pixels", async () => {
  const output = new Blob(["webp"], { type: "image/webp" });
  const canvas = {
    toBlob(callback, type, quality) {
      assert.equal(type, "image/webp");
      assert.equal(quality, 0.88);
      callback(output);
    },
    getContext() {
      throw new Error("Native encoder should not read pixels");
    },
  };
  assert.equal(await encodePhoto(canvas, 0.88), output);
});

test("failed canvas serialization does not produce a mislabeled WebP", async () => {
  await assert.rejects(
    encodePhoto(
      {
        toBlob(callback) {
          callback(null);
        },
      },
      0.92,
    ),
    /Could not process/,
  );
  await assert.rejects(
    encodePhoto(
      {
        toBlob(callback) {
          callback(new Blob(["png"], { type: "image/png" }));
        },
        getContext() {
          return null;
        },
      },
      0.92,
    ),
    /could not process/,
  );
});
