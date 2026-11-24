import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { parseHeader, validateTicket } from "./check.mjs";

// Synthetic metadata only: these fixture claims are not live approvals/evidence.
const path = "tickets/stories/APP-001.md";
const template = await readFile(
  new URL("./templates/story.md", import.meta.url),
  "utf8",
);
const idea = template
  .replace("APP-000", "APP-001")
  .replace("YYYY-MM-DD", "2026-10-13");
const ready = idea
  .replace("status: IDEA", "status: READY")
  .replaceAll("TODO", "Fixture evidence")
  .replaceAll("- [ ] READY-", "- [x] READY-");
const done = ready
  .replace("status: READY", "status: DONE")
  .replace("qa_result: PENDING", "qa_result: PASS")
  .replaceAll("- [ ] DONE-", "- [x] DONE-");

test("draft may be incomplete; READY cannot be asserted with template gates", () => {
  assert.deepEqual(validateTicket(idea, path), []);
  assert.ok(
    validateTicket(idea, path, "READY").some((x) => x.includes("READY-01")),
  );
  assert.deepEqual(validateTicket(ready, path), []);
});

test("READY rejects missing/duplicate gate entries and unresolved scope", () => {
  assert.ok(
    validateTicket(ready.replace(/^.*READY-03:.*\n/m, ""), path).some((x) =>
      x.includes("READY-03"),
    ),
  );
  assert.ok(
    validateTicket(
      ready.replace(
        "## READY Gate",
        "## READY Gate\n\n- [x] READY-01: Duplicate",
      ),
      path,
    ).some((x) => x.includes("READY-01")),
  );
  assert.ok(
    validateTicket(
      ready.replace("## Outcome\n", "## Outcome\n\nTODO: Unresolved\n"),
      path,
    ).some((x) => x.includes("Outcome")),
  );
});

test("unchecked or placeholder gate evidence cannot pass a requested gate", () => {
  for (const replacement of [
    "- [ ] READY-01: Evidence",
    "- [x] READY-01: NEEDS_CONFIRMATION",
    "- [x] READY-01:",
  ]) {
    const fixture = ready.replace(/^- \[x\] READY-01:.*$/m, replacement);
    assert.ok(
      validateTicket(fixture, path, "READY").some((x) =>
        x.includes("READY-01"),
      ),
    );
  }
});

test("DONE enforces QA, completed evidence and recorded developer follow-up acceptance", () => {
  assert.deepEqual(validateTicket(done, path), []);
  assert.ok(
    validateTicket(
      done.replace("qa_result: PASS", "qa_result: FAIL"),
      path,
    ).some((x) => x.includes("passing QA")),
  );
  const followUp = done.replace(
    "qa_result: PASS",
    "qa_result: PASS_WITH_FOLLOW_UP",
  );
  assert.ok(
    validateTicket(followUp, path).some((x) => x.includes("acceptance")),
  );
  assert.deepEqual(
    validateTicket(
      followUp.replace("follow_up_accepted: false", "follow_up_accepted: true"),
      path,
    ),
    [],
  );
  assert.ok(
    validateTicket(
      done.replace("## Evidence\n", "## Evidence\n\nTODO: No actual result\n"),
      path,
    ).some((x) => x.includes("Evidence")),
  );
});

test("invalid ticket identity, dates and UX classification are rejected", () => {
  assert.ok(
    validateTicket(idea, "tickets/stories/APP-002.md").some((x) =>
      x.includes("Filename"),
    ),
  );
  assert.ok(
    validateTicket(idea, "tickets/bugs/APP-001.md").some((x) =>
      x.includes("directory"),
    ),
  );
  assert.ok(
    validateTicket(idea.replace("2026-10-13", "2026-02-31"), path).some((x) =>
      x.includes("date"),
    ),
  );
  assert.ok(
    validateTicket(idea.replace("ux: NONE", "ux: AUTO"), path).some((x) =>
      x.includes("UX"),
    ),
  );
});

test("front matter rejects duplicate or nested fields and permits quoted scalars", () => {
  assert.throws(
    () => parseHeader("---\nid: APP-001\nid: APP-002\n---\n"),
    /duplicate/,
  );
  assert.throws(() => parseHeader("---\nid:\n  nested: true\n---\n"));
  assert.equal(parseHeader("---\nid: 'APP-001'\n---\n").id, "APP-001");
});

test("CLI checks workspace without mutating it, rejects non-ticket paths and absent tickets", () => {
  const checker = new URL("./check.mjs", import.meta.url);
  const run = (...args) =>
    spawnSync(process.execPath, [fileURLToPath(checker), ...args], {
      encoding: "utf8",
    });
  assert.equal(run().status, 0);
  assert.equal(run("--gate", "READY", ".env.local").status, 2);
  assert.equal(
    run("--gate", "READY", "tickets/stories/APP-999999.md").status,
    1,
  );
});
