import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

if (process.platform !== "darwin" || process.arch !== "arm64") {
  console.error("This FLUX setup uses MLX and requires an Apple Silicon Mac.");
  process.exit(1);
}
const python = resolve(".venv-flux/bin/python");
function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    env: { ...process.env, HF_HUB_DISABLE_TELEMETRY: "1" },
  });
  if (result.error || result.status !== 0) {
    console.error(
      "FLUX setup failed. Check the error above and retry npm run ai:setup:flux.",
    );
    process.exit(1);
  }
}
if (!existsSync(python)) run("python3", ["-m", "venv", ".venv-flux"]);
run(python, [
  "-m",
  "pip",
  "install",
  "--disable-pip-version-check",
  "--no-cache-dir",
  "-r",
  "local-ai/requirements-flux.txt",
]);
run(python, ["local-ai/setup_flux.py"]);
