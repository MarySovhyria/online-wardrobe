import { test } from "node:test";
import assert from "node:assert/strict";
import { createExtractionHandler } from "../src/lib/extraction-handler.ts";

const image = Buffer.from("RIFF0000WEBPtest");
const mask = "data:image/png;base64,aGVsbG8=";
function request({
  token = "session",
  mode = "worn",
  piece = "upper",
  type = "image/webp",
  body = image,
} = {}) {
  return new Request(
    `http://localhost/api/extract-clothing?mode=${mode}&piece=${piece}`,
    {
      method: "POST",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        "Content-Type": type,
      },
      body,
    },
  );
}
function setup({
  verifyUser = async () => "user",
  result = { masks: [mask] },
  extract,
} = {}) {
  const calls = [];
  const handler = createExtractionHandler({
    verifyUser,
    extract:
      extract ||
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
test("rejects unsupported modes, pieces, formats, bytes and oversized bodies", async () => {
  const { handler, calls } = setup();
  assert.equal((await handler(request({ mode: "remote" }))).status, 400);
  assert.equal((await handler(request({ piece: "white shirt" }))).status, 400);
  assert.equal((await handler(request({ type: "image/jpeg" }))).status, 415);
  assert.equal((await handler(request({ body: "invalid" }))).status, 400);
  assert.equal(
    (await handler(request({ body: new Uint8Array(3 * 1024 * 1024 + 1) })))
      .status,
    413,
  );
  assert.equal(calls.length, 0);
});
test("passes both modes to the local worker and returns only inline masks", async () => {
  const { handler, calls } = setup();
  for (const mode of ["worn", "standalone"]) {
    const response = await handler(request({ mode, piece: "shoes" }));
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.deepEqual(await response.json(), { masks: [mask] });
  }
  assert.deepEqual(
    calls.map((c) => c.slice(1)),
    [
      ["worn", "shoes"],
      ["standalone", "shoes"],
    ],
  );
  assert.deepEqual(calls[0][0], image);
});
test("explains missing local setup and no garment found", async () => {
  for (const [error, status, message] of [
    ["setup_required", 503, /ai:setup/],
    ["no_clothing", 422, /No matching/],
  ]) {
    const { handler } = setup({ result: { error } });
    const response = await handler(request());
    assert.equal(response.status, status);
    assert.match((await response.json()).error, message);
  }
});
test("rejects invalid worker responses instead of returning external URLs", async () => {
  for (const result of [
    { masks: ["https://example.com/mask.png"] },
    { masks: [] },
    { error: "private details" },
  ]) {
    const { handler } = setup({ result });
    const response = await handler(request());
    assert.equal(response.status, 502);
    assert.doesNotMatch(await response.text(), /private details|example.com/);
  }
});
test("serializes CPU work and releases its lock after a failure", async () => {
  let finish;
  const { handler } = setup({
    extract: () =>
      new Promise((_, reject) => {
        finish = reject;
      }),
  });
  const first = handler(request());
  while (!finish) await new Promise((resolve) => setImmediate(resolve));
  assert.equal((await handler(request())).status, 429);
  finish(new Error("timeout"));
  assert.equal((await first).status, 502);
  const retry = handler(request());
  await new Promise((resolve) => setImmediate(resolve));
  finish(new Error("setup_required"));
  assert.equal((await retry).status, 503);
});
