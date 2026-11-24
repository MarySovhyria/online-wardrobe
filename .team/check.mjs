// Read-only checks of recorded structure. Human/agent review validates evidence.
import { readFile, readdir, stat } from "node:fs/promises";
import { dirname, resolve, relative, basename, extname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const states = new Set([
  "IDEA",
  "DISCOVERY",
  "DESIGN",
  "READY",
  "IN_PROGRESS",
  "REVIEW",
  "DONE",
  "BLOCKED",
  "PARKED",
  "CANCELLED",
]);
const prefixes = {
  idea: "IDEA",
  epic: "EPIC",
  story: "APP",
  bug: "BUG",
  handoff: "HND",
};
const folders = {
  idea: "ideas",
  epic: "epics",
  story: "stories",
  bug: "bugs",
  handoff: "handoffs",
};
const placeholder = /\bTODO\b|NEEDS_CONFIRMATION|YYYY-MM-DD/i;
const requiredFiles = [
  "AGENTS.md",
  ".team/README.md",
  ".team/workflow.md",
  ".team/bootstrap-review.md",
  ...["orchestrator", "product-owner", "designer", "qa-devops"].map(
    (x) => `.team/agents/${x}.md`,
  ),
  ...[
    "idea",
    "epic",
    "story",
    "bug",
    "handoff",
    "design-review",
    "release-review",
  ].map((x) => `.team/templates/${x}.md`),
  ".team/examples/worked-example.md",
  ...["PRODUCT", "ROADMAP", "STATE", "DECISIONS", "GLOSSARY"].map(
    (x) => `product/${x}.md`,
  ),
  "tickets/README.md",
  "docs/design/README.md",
  "docs/operations/README.md",
  ...Object.values(folders).map((x) => `tickets/${x}/README.md`),
];

export function parseHeader(text) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) throw new Error("Missing YAML front matter");
  const fields = {};
  for (const raw of match[1].split(/\r?\n/)) {
    if (!raw.trim() || raw.trim().startsWith("#")) continue;
    const line = raw.match(/^([a-z_]+):[ \t]*(.*)$/);
    if (!line || Object.hasOwn(fields, line[1]))
      throw new Error("Invalid or duplicate front-matter field");
    let value = line[2].trim();
    if (/^[\[\]{>|*&!]/.test(value))
      throw new Error("Use flat scalar front matter only");
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    )
      value = value.slice(1, -1);
    if (!value) throw new Error(`Empty front-matter field: ${line[1]}`);
    fields[line[1]] = value;
  }
  return fields;
}

function section(text, title) {
  const start = text.search(new RegExp(`^## ${title}\\s*$`, "m"));
  if (start < 0) return "";
  const body = text.slice(start).replace(/^##[^\n]*\n/, "");
  return body.split(/^## /m)[0].trim();
}

export function validateTicket(text, path, gate) {
  const issues = [];
  let fields;
  try {
    fields = parseHeader(text);
  } catch (error) {
    return [error.message];
  }
  for (const key of ["id", "type", "status", "owner", "created"]) {
    if (!fields[key] || placeholder.test(fields[key]))
      issues.push(`Missing/placeholder ${key}`);
  }
  if (!prefixes[fields.type]) issues.push("Unknown ticket type");
  else {
    if (
      !new RegExp(`^${prefixes[fields.type]}-[0-9]{3,}$`).test(fields.id || "")
    )
      issues.push("ID does not match type");
    if (
      dirname(path).replaceAll("\\", "/") !== `tickets/${folders[fields.type]}`
    )
      issues.push("Ticket is in the wrong directory");
  }
  if (basename(path, extname(path)) !== fields.id)
    issues.push("Filename must equal ticket ID");
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(fields.created || "") ||
    !Number.isFinite(Date.parse(fields.created)) ||
    new Date(fields.created).toISOString().slice(0, 10) !== fields.created
  )
    issues.push("Invalid created date");
  const validStates =
    fields.type === "handoff"
      ? new Set(["OPEN", "RETURNED", "CLOSED"])
      : states;
  if (!validStates.has(fields.status)) issues.push("Unknown status");
  if (
    fields.type === "idea" &&
    !["PENDING", "BUILD", "INVESTIGATE", "PARK", "REJECT"].includes(
      fields.recommendation,
    )
  )
    issues.push("Invalid PO recommendation");
  if (fields.type === "handoff")
    for (const key of ["from", "to"])
      if (!fields[key]) issues.push(`Missing ${key}`);
  const executable = ["story", "bug"].includes(fields.type);
  if (gate && !executable)
    issues.push("READY/DONE checker applies to stories and bugs");
  if (!executable) return issues;
  for (const key of [
    "epic",
    "priority",
    "ux",
    "qa_result",
    "follow_up_accepted",
  ])
    if (!fields[key]) issues.push(`Missing ${key}`);
  if (!/^(none|EPIC-[0-9]{3,})$/.test(fields.epic || ""))
    issues.push("Invalid epic reference");
  if (!["low", "medium", "high", "critical"].includes(fields.priority))
    issues.push("Invalid priority");
  if (!["NONE", "LIGHT", "FULL"].includes(fields.ux))
    issues.push("Invalid UX classification");
  if (
    !["PENDING", "PASS", "FAIL", "PASS_WITH_FOLLOW_UP"].includes(
      fields.qa_result,
    )
  )
    issues.push("Invalid QA result");
  if (!["true", "false"].includes(fields.follow_up_accepted))
    issues.push("follow_up_accepted must be true/false");
  const done = gate === "DONE" || fields.status === "DONE";
  const ready =
    done ||
    gate === "READY" ||
    ["READY", "IN_PROGRESS", "REVIEW"].includes(fields.status);
  for (const [name, count, enforce] of [
    ["READY", 10, ready],
    ["DONE", 7, done],
  ]) {
    const body = section(text, `${name} Gate`);
    if (!body) {
      issues.push(`Missing ${name} Gate section`);
      continue;
    }
    const matches = [
      ...body.matchAll(/^- \[([ xX])\] ((?:READY|DONE)-\d{2}):[ \t]*(.*)$/gm),
    ];
    const expected = Array.from(
      { length: count },
      (_, i) => `${name}-${String(i + 1).padStart(2, "0")}`,
    );
    for (const id of expected) {
      const entries = matches.filter((x) => x[2] === id);
      if (entries.length !== 1) issues.push(`${id} must occur exactly once`);
      else if (
        enforce &&
        (entries[0][1].toLowerCase() !== "x" ||
          !entries[0][3].trim() ||
          placeholder.test(entries[0][3]))
      )
        issues.push(`${id} lacks checked evidence/rationale`);
    }
    if (matches.some((x) => !expected.includes(x[2])))
      issues.push(`Unexpected gate ID in ${name} section`);
  }
  if (ready) {
    for (const title of [
      "Problem",
      "Outcome",
      "Scope",
      "Acceptance Criteria",
      "Dependencies",
      "UX",
      "Edge Cases",
      "QA",
      "Technical Constraints",
      fields.type === "bug"
        ? "Related Requirement and Regression"
        : "Authority and Roadmap",
    ]) {
      const body = section(text, title);
      if (!body || placeholder.test(body))
        issues.push(`${title} is missing or unresolved for READY`);
    }
    if (!/\bAC1:\s*\S/.test(section(text, "Acceptance Criteria")))
      issues.push("Numbered AC1 criterion is required");
  }
  if (done) {
    if (!["PASS", "PASS_WITH_FOLLOW_UP"].includes(fields.qa_result))
      issues.push("DONE requires passing QA");
    if (
      fields.qa_result === "PASS_WITH_FOLLOW_UP" &&
      fields.follow_up_accepted !== "true"
    )
      issues.push("DONE follow-up lacks developer acceptance record");
    if (
      !section(text, "Evidence") ||
      placeholder.test(section(text, "Evidence"))
    )
      issues.push("DONE requires completed Evidence section");
  }
  if (!section(text, "History")) issues.push("Missing History section");
  return issues;
}

async function markdownFiles(folder) {
  const entries = await readdir(resolve(root, folder), { withFileTypes: true });
  const paths = [];
  for (const entry of entries) {
    const path = `${folder}/${entry.name}`;
    if (entry.isDirectory()) paths.push(...(await markdownFiles(path)));
    else if (
      entry.isFile() &&
      entry.name.endsWith(".md") &&
      entry.name !== "README.md"
    )
      paths.push(path);
  }
  return paths;
}

async function checkLinks(text, path, issues) {
  const prose = text.replace(/```[\s\S]*?```/g, "");
  for (const match of prose.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
    const target = match[1].trim().replace(/^<|>$/g, "").split("#")[0];
    if (!target || /^[a-z][a-z0-9+.-]*:/i.test(target)) continue;
    const absolute = resolve(root, dirname(path), target);
    if (relative(root, absolute).startsWith("..")) {
      issues.push(`Link leaves repository: ${target}`);
      continue;
    }
    try {
      await stat(absolute);
    } catch {
      issues.push(`Broken local link: ${target}`);
    }
  }
}

async function main(args) {
  const errors = [];
  let gate, selected;
  if (args.length) {
    if (
      args.length !== 3 ||
      args[0] !== "--gate" ||
      !["READY", "DONE"].includes(args[1])
    ) {
      console.error(
        "Usage: node .team/check.mjs [--gate READY|DONE tickets/stories/APP-001.md]",
      );
      return 2;
    }
    gate = args[1];
    selected = relative(root, resolve(process.cwd(), args[2])).replaceAll(
      "\\",
      "/",
    );
    if (!/^tickets\/(stories|bugs)\/(APP|BUG)-\d{3,}\.md$/.test(selected)) {
      console.error("Select a live story or bug in this repository.");
      return 2;
    }
  }
  for (const path of requiredFiles) {
    try {
      if (!(await stat(resolve(root, path))).isFile())
        errors.push(`${path}: not a file`);
    } catch {
      errors.push(`${path}: missing workspace file`);
    }
  }
  let paths;
  try {
    paths = await markdownFiles("tickets");
  } catch {
    errors.push("tickets/: cannot read backlog");
    paths = [];
  }
  if (selected && !paths.includes(selected))
    errors.push(`${selected}: ticket not found`);
  const ids = new Set();
  for (const path of paths) {
    const text = await readFile(resolve(root, path), "utf8");
    const issues = validateTicket(
      text,
      path,
      path === selected ? gate : undefined,
    );
    try {
      const fields = parseHeader(text);
      if (ids.has(fields.id)) issues.push("Duplicate live ticket ID");
      ids.add(fields.id);
      if (
        fields.epic &&
        fields.epic !== "none" &&
        !paths.includes(`tickets/epics/${fields.epic}.md`)
      )
        issues.push("Referenced epic does not exist");
    } catch {
      /* Header errors already captured. */
    }
    await checkLinks(text, path, issues);
    errors.push(...issues.map((x) => `${path}: ${x}`));
  }
  if (errors.length) {
    console.error(errors.join("\n"));
    return 1;
  }
  console.log(
    `PASS: workspace structure and ${paths.length} live record(s)${gate ? `; ${selected} recorded ${gate} gate` : ""}. Evidence truth still requires review.`,
  );
  return 0;
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    process.exitCode = await main(process.argv.slice(2));
  } catch (error) {
    console.error(`Workspace check failed: ${error.message}`);
    process.exitCode = 1;
  }
}
