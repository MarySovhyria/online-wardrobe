import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const python = resolve(
  process.platform === "win32"
    ? ".venv/Scripts/python.exe"
    : ".venv/bin/python",
);
function run(command, args) {
  const result = spawnSync(command, args, { stdio: "inherit" });
  if (result.error || result.status !== 0) {
    console.error(
      "Local AI setup failed. Install Python 3.11–3.13 and retry npm run ai:setup.",
    );
    process.exit(1);
  }
}
if (!existsSync(python))
  run(process.platform === "win32" ? "python" : "python3", [
    "-m",
    "venv",
    ".venv",
  ]);
run(python, [
  "-m",
  "pip",
  "install",
  "--disable-pip-version-check",
  "--no-cache-dir",
  "-r",
  "local-ai/requirements.txt",
]);
run(python, ["local-ai/setup.py"]);
