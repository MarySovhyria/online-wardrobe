import { test } from "node:test";
import assert from "node:assert/strict";
import { createFlatlayHandler } from "../src/lib/flatlay-handler.ts";

const image = Buffer.from("RIFF0000WEBPtest");
const generatedImage = "data:image/png;base64,aGVsbG8=";
function request({
  token = "session",
  piece = "upper",
  type = "image/webp",
  body = image,
} = {}) {
  return new Request(`http://localhost/api/create-flatlay?piece=${piece}`, {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      "Content-Type": type,
    },
    body,
  });
}
function setup({
  verifyUser = async () => "user",
  result = { image: generatedImage },
  generate,
} = {}) {
  const calls = [];
  const handler = createFlatlayHandler({
    verifyUser,
    generate:
      generate ||
      (async (...args) => {
        calls.push(args);
        return result;
      }),
  });
  return { handler, calls };
}
test("requires a verified login before starting a worker", async () => {
  const { handler, calls } = setup({ verifyUser: async () => null });
  assert.equal((await handler(request({ token: "" }))).status, 401);
  assert.equal((await handler(request())).status, 401);
  assert.equal(calls.length, 0);
});
test("handles unavailable authentication without invoking a worker", async () => {
  const { handler, calls } = setup({
    verifyUser: async () => {
      throw new Error("network");
    },
  });
  assert.equal((await handler(request())).status, 503);
  assert.equal(calls.length, 0);
});
test("rejects unsupported pieces, formats, bytes and oversized bodies", async () => {
  const { handler, calls } = setup();
  for (const [args, status] of [
    [{ piece: "white shirt" }, 400],
    [{ type: "image/jpeg" }, 415],
    [{ body: "invalid" }, 400],
    [{ body: new Uint8Array(3 * 1024 * 1024 + 1) }, 413],
  ])
    assert.equal((await handler(request(args))).status, status);
  assert.equal(calls.length, 0);
});
test("passes original photo and jacket selection, returns an uncached image", async () => {
  const { handler, calls } = setup();
  const response = await handler(request({ piece: "jacket" }));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.deepEqual(await response.json(), { image: generatedImage });
  assert.deepEqual(calls, [[image, "jacket"]]);
});
test("handles missing setup, invalid images, cross-process contention and unsupported hosts", async () => {
  for (const [error, status, text] of [
    ["setup_required", 503, /ai:setup:flux/],
    ["busy", 429, /Another photo/],
    ["invalid_image", 400, /32 pixels/],
    ["unsupported_platform", 503, /Apple Silicon/],
  ]) {
    const { handler } = setup({ result: { error } });
    const response = await handler(request());
    assert.equal(response.status, status);
    assert.match((await response.json()).error, text);
  }
});
test("rejects external URLs and malformed responses without exposing private errors", async () => {
  for (const result of [
    { image: "https://example.com/private.png" },
    {},
    { error: "secret" },
  ]) {
    const response = await setup({ result }).handler(request());
    assert.equal(response.status, 502);
    assert.doesNotMatch(await response.text(), /secret|example.com/);
  }
});
test("serializes generation and releases the lock after worker failure", async () => {
  let finish;
  const { handler } = setup({
    generate: () =>
      new Promise((_, reject) => {
        finish = reject;
      }),
  });
  const first = handler(request());
  while (!finish) await new Promise((resolve) => setImmediate(resolve));
  assert.equal((await handler(request())).status, 429);
  finish(new Error("timeout"));
  assert.match((await (await first).json()).error, /15 minutes/);
  const retry = handler(request());
  await new Promise((resolve) => setImmediate(resolve));
  finish(new Error("setup_required"));
  assert.equal((await retry).status, 503);
});
