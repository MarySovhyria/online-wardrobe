import { createHash } from "node:crypto";
import {
  readFile,
  writeFile,
  mkdir,
  copyFile,
  rename,
  rm,
} from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = new URL("../", import.meta.url);
const target = new URL("public/photo-assets/", root);
const model = new URL("u2netp.onnx", target);
const checksum = "8e83ca70e441ab06c318d82300c84806";
const digest = (bytes) => createHash("md5").update(bytes).digest("hex");
await mkdir(target, { recursive: true });
let valid = false;
try {
  valid = digest(await readFile(model)) === checksum;
} catch {}
if (!valid) {
  console.log("Downloading verified U2NetP photo model…");
  const response = await fetch(
    "https://github.com/danielgatis/rembg/releases/download/v0.0.0/u2netp.onnx",
    { signal: AbortSignal.timeout(120000) },
  );
  if (!response.ok)
    throw new Error(
      `Photo model download failed (${response.status}). Retry npm run photo:assets.`,
    );
  const bytes = Buffer.from(await response.arrayBuffer());
  if (digest(bytes) !== checksum)
    throw new Error(
      "Photo model checksum mismatch; refusing unverified model.",
    );
  const temporary = new URL(`u2netp.${process.pid}.tmp`, target);
  try {
    await writeFile(temporary, bytes);
    await rename(temporary, model);
  } finally {
    await rm(temporary, { force: true });
  }
}
const runtime = JSON.parse(
  await readFile(
    new URL("node_modules/onnxruntime-web/package.json", root),
    "utf8",
  ),
);
if (runtime.version !== "1.31.1")
  throw new Error("Expected pinned onnxruntime-web 1.31.1; run npm ci.");
for (const name of [
  "ort-wasm-simd-threaded.mjs",
  "ort-wasm-simd-threaded.wasm",
]) {
  await copyFile(
    new URL(`node_modules/onnxruntime-web/dist/${name}`, root),
    new URL(name, target),
  );
}
for (const name of [
  "U2NET-LICENSE.txt",
  "ONNXRUNTIME-LICENSE.txt",
  "NOTICE.txt",
]) {
  await copyFile(
    new URL(`scripts/notices/${name}`, root),
    new URL(name, target),
  );
}
console.log(
  `Photo assets ready at ${fileURLToPath(target)} (U2NetP + ONNX Runtime ${runtime.version}).`,
);

const codec = JSON.parse(
  await readFile(
    new URL("node_modules/@jsquash/webp/package.json", root),
    "utf8",
  ),
);
if (codec.version !== "1.5.0")
  throw new Error("Expected pinned @jsquash/webp 1.5.0; run npm ci.");
for (const name of ["webp_enc.wasm", "webp_enc_simd.wasm"]) {
  await copyFile(
    new URL(`node_modules/@jsquash/webp/codec/enc/${name}`, root),
    new URL(name, target),
  );
}
for (const [source, destination] of [
  ["LICENSE", "JSQUASH-LICENSE.txt"],
  ["codec/LICENSE.codec.md", "LIBWEBP-LICENSE.txt"],
]) {
  await copyFile(
    new URL(`node_modules/@jsquash/webp/${source}`, root),
    new URL(destination, target),
  );
}
