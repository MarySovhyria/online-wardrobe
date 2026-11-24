import { test } from "node:test";
import assert from "node:assert/strict";
import {
  mkdtemp,
  mkdir,
  copyFile,
  writeFile,
  access,
  rm,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

test("asset preparation rejects altered model bytes before writing a deployable model", async () => {
  const directory = await mkdtemp(join(tmpdir(), "wardrobe-model-integrity-"));
  try {
    await mkdir(join(directory, "scripts"));
    const script = join(directory, "scripts", "prepare-photo-assets.mjs");
    await copyFile(
      new URL("../scripts/prepare-photo-assets.mjs", import.meta.url),
      script,
    );
    const preload = join(directory, "fetch-fixture.mjs");
    await writeFile(
      preload,
      "globalThis.fetch = async () => new Response('altered model bytes');\n",
    );
    const result = spawnSync(process.execPath, ["--import", preload, script], {
      encoding: "utf8",
    });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /checksum mismatch; refusing unverified model/);
    await assert.rejects(
      access(join(directory, "public", "photo-assets", "u2netp.onnx")),
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
