import { spawn } from "node:child_process";
import { resolve } from "node:path";

export async function runLocalExtraction(
  photo: Buffer,
  mode: string,
  piece: string,
): Promise<{ masks?: unknown; error?: string }> {
  return runLocalWorker(photo, "extract.py", [mode, piece]);
}

export async function runLocalFlatlay(photo: Buffer, piece: string) {
  return runLocalWorker(photo, "flatlay.py", [piece], true);
}

async function runLocalWorker(
  photo: Buffer,
  script: string,
  args: string[],
  flux = false,
): Promise<{ masks?: unknown; image?: unknown; error?: string }> {
  const python = resolve(
    flux
      ? ".venv-flux/bin/python"
      : process.platform === "win32"
        ? ".venv/Scripts/python.exe"
        : ".venv/bin/python",
  );
  return new Promise((resolveResult, reject) => {
    const child = spawn(python, [resolve("local-ai", script), ...args], {
      stdio: ["pipe", "pipe", "ignore"],
      env: {
        NODE_ENV: process.env.NODE_ENV,
        PATH: process.env.PATH,
        SYSTEMROOT: process.env.SYSTEMROOT,
        TMPDIR: process.env.TMPDIR,
        HF_HOME: resolve(".local-ai/huggingface"),
        HF_HUB_OFFLINE: "1",
      },
    });
    let output = "";
    let failure = "";
    const timer = setTimeout(
      () => {
        failure = "timeout";
        child.kill("SIGKILL");
      },
      flux ? 900_000 : 180_000,
    );
    child.stdout.on("data", (chunk: Buffer) => {
      output += chunk.toString();
      if (output.length > 6 * 1024 * 1024) {
        failure = "invalid_result";
        child.kill("SIGKILL");
      }
    });
    child.on("error", () => {
      clearTimeout(timer);
      reject(new Error("setup_required"));
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code !== 0) {
        reject(new Error(failure || "processing_failed"));
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
