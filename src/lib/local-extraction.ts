import { spawn } from "node:child_process";
import { resolve } from "node:path";

export async function runLocalExtraction(
  photo: Buffer,
  mode: string,
  piece: string,
): Promise<{ masks?: unknown; error?: string }> {
  const python = resolve(
    process.platform === "win32"
      ? ".venv/Scripts/python.exe"
      : ".venv/bin/python",
  );
  return new Promise((resolveResult, reject) => {
    const child = spawn(python, [resolve("local-ai/extract.py"), mode, piece], {
      stdio: ["pipe", "pipe", "ignore"],
      env: {
        NODE_ENV: process.env.NODE_ENV,
        PATH: process.env.PATH,
        SYSTEMROOT: process.env.SYSTEMROOT,
        TMPDIR: process.env.TMPDIR,
        HF_HUB_OFFLINE: "1",
      },
    });
    let output = "";
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error("timeout"));
    }, 180_000);
    child.stdout.on("data", (chunk: Buffer) => {
      output += chunk.toString();
      if (output.length > 6 * 1024 * 1024) {
        child.kill("SIGKILL");
        reject(new Error("invalid_result"));
      }
    });
    child.on("error", () => {
      clearTimeout(timer);
      reject(new Error("setup_required"));
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code !== 0) {
        reject(new Error("processing_failed"));
        return;
      }
      try {
        resolveResult(JSON.parse(output));
      } catch {
        reject(new Error("invalid_result"));
      }
    });
    child.stdin.on("error", () => {
      /* Exit/error handlers report worker failures. */
    });
    child.stdin.end(photo);
  });
}
