import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";
import { SetupService } from "./setup-service";
import { runCommand } from "./setup-process";
import { jobSchema, setupInputSchema, type SetupInput, type SetupJob } from "../shared/setup";

async function fixture(mode = "normal", timeoutMs?: number) {
  const directory = await mkdtemp(join(tmpdir(), "paseo-setup-test-"));
  const root = join(directory, "project with spaces"), bin = join(directory, "bin");
  await mkdir(root); await mkdir(bin);
  await runCommand("git", ["init", "-q"], { cwd: root });
  await writeFile(join(bin, "openspec"), `#!/usr/bin/env bash
if [ "$1" = '--version' ]; then ${mode === "missing" ? "exit 1" : "echo '1.10.0'; exit 0"}; fi
printf 'init\\n' >> calls.txt
${mode === "slow" ? "echo 'Installing slowly' >&2; sleep 10; echo unexpected > late-write" : ""}
mkdir -p openspec
[ -f openspec/config.yaml ] || printf 'schema: spec-driven\\ncontext: |\\n  Language: Japanese\\n' > openspec/config.yaml
${mode === "partial" ? "exit 0" : "mkdir -p .agents/skills/openspec-apply-change; echo generated > .agents/skills/openspec-apply-change/SKILL.md"}
`, { mode: 0o755 });
  const env = { ...process.env, PATH: `${bin}:${process.env.PATH}` };
  const service = new SetupService(async () => root, { env, timeoutMs });
  const input: SetupInput = { workspaceId: "workspace", requestId: randomUUID(), components: ["openspec", "adr", "skills", "hooks"], language: "Simplified Chinese" };
  return { root, directory, service, input, env, async cleanup() { await service.dispose(); await rm(directory, { recursive: true, force: true }); } };
}
async function finish(service: SetupService): Promise<SetupJob> {
  for (let i = 0; i < 300; i++) {
    const job = await service.status("workspace");
    if (job && job.status !== "running") return job;
    await new Promise(resolve => setTimeout(resolve, 20));
  }
  throw new Error("Setup did not finish within six seconds");
}

test("read-only inspection detects partial installation and creates no runtime files", async () => {
  const f = await fixture();
  try {
    await mkdir(join(f.root, "openspec")); await writeFile(join(f.root, "openspec/config.yaml"), "schema: spec-driven\n");
    const view = await f.service.inspect("workspace");
    assert.equal(view.configExists, true); assert.equal(view.complete, false);
    assert.equal(view.components.find(c => c.id === "openspec")!.ready, false);
    assert.equal(view.job, null); assert.ok(view.prerequisites.every(c => c.ready));
    await assert.rejects(readFile(join(f.root, ".paseo-agent-team/setup.json")), { code: "ENOENT" });
    await assert.rejects(readFile(join(f.root, ".gitignore")), { code: "ENOENT" });
  } finally { await f.cleanup(); }
});

test("fresh setup preserves user content, verifies all components, and can repair", async () => {
  const f = await fixture();
  try {
    await writeFile(join(f.root, "AGENTS.md"), "My project instructions.\n");
    await writeFile(join(f.root, ".git/hooks/pre-commit"), "#!/bin/sh\necho custom-hook\n", { mode: 0o755 });
    const started = await f.service.start(f.input); assert.equal(started.status, "running");
    const job = await finish(f.service); assert.equal(job.status, "succeeded", job.output + job.message);
    assert.equal((await f.service.inspect("workspace")).complete, true);
    const instructions = await readFile(join(f.root, "AGENTS.md"), "utf8"); assert.ok(instructions.startsWith("My project instructions."));
    const config = await readFile(join(f.root, "openspec/config.yaml"), "utf8"); assert.match(config, /Japanese/);
    const hook = await runCommand("bash", [".git/hooks/pre-commit"], { cwd: f.root, env: { ...f.env, PASEO_AGENT_TEAM_SKIP_HOOKS: "1" } });
    assert.equal(hook.code, 0); assert.match(hook.output, /custom-hook/);
    await rm(join(f.root, "adr/README.md"));
    await f.service.start({ ...f.input, requestId: randomUUID(), components: ["adr"] });
    assert.equal((await finish(f.service)).status, "succeeded");
    assert.equal(await readFile(join(f.root, "AGENTS.md"), "utf8"), instructions);
    assert.equal(await readFile(join(f.root, "openspec/config.yaml"), "utf8"), config);
    const reloaded = new SetupService(async () => f.root, { env: f.env });
    assert.equal((await reloaded.status("workspace"))!.status, "succeeded"); await reloaded.dispose();
  } finally { await f.cleanup(); }
});

test("missing prerequisites and invalid selections cannot start an installation", async () => {
  const f = await fixture("missing");
  try {
    await assert.rejects(f.service.start(f.input), /npm install -g/);
    assert.equal(setupInputSchema.safeParse({ ...f.input, components: ["openspec", "openspec"] }).success, false);
    assert.equal(setupInputSchema.safeParse({ ...f.input, language: "$(touch hacked)" }).success, false);
    await assert.rejects(readFile(join(f.root, "AGENTS.md")), { code: "ENOENT" });
    await assert.rejects(readFile(join(f.root, ".paseo-agent-team/setup.json")), { code: "ENOENT" });
    await f.service.start({ ...f.input, components: ["adr"] });
    assert.equal((await finish(f.service)).status, "succeeded");
  } finally { await f.cleanup(); }
});

test("zero exit status with missing generated files is partial, not success", async () => {
  const f = await fixture("partial");
  try { await f.service.start(f.input); assert.equal((await finish(f.service)).status, "partial"); }
  finally { await f.cleanup(); }
});

test("concurrent retries reuse a job, other starts are blocked, and cancellation stops children", async () => {
  const f = await fixture("slow");
  try {
    const [a, b] = await Promise.all([f.service.start(f.input), f.service.start(f.input)]);
    assert.equal(a.requestId, b.requestId);
    await assert.rejects(f.service.start({ ...f.input, requestId: randomUUID() }), /already running/);
    await assert.rejects(f.service.cancel("workspace", randomUUID()), /does not belong/);
    for (let i = 0; i < 100 && !(await f.service.status("workspace"))!.output.includes("Installing slowly"); i++) await new Promise(resolve => setTimeout(resolve, 20));
    await f.service.cancel("workspace", f.input.requestId);
    const result = await finish(f.service); assert.equal(result.status, "cancelled");
    assert.match(result.output, /Installing slowly/);
    assert.equal(await readFile(join(f.root, "calls.txt"), "utf8"), "init\n");
    assert.equal((await f.service.start(f.input)).status, "cancelled");
    await assert.rejects(readFile(join(f.root, "late-write")), { code: "ENOENT" });
  } finally { await f.cleanup(); }
});

test("timeouts and plugin shutdown are visible terminal outcomes", async () => {
  const f = await fixture("slow", 150);
  try { await f.service.start(f.input); assert.equal((await finish(f.service)).status, "failed"); }
  finally { await f.cleanup(); }
  const g = await fixture("slow");
  try {
    await g.service.start(g.input); await g.service.dispose();
    assert.equal((await g.service.status("workspace"))!.status, "interrupted");
  } finally { await g.cleanup(); }
});

test("orphaned running state is interrupted and remains untouched on inspection", async () => {
  const f = await fixture();
  try {
    await mkdir(join(f.root, ".paseo-agent-team"));
    const record = JSON.stringify(jobSchema.parse({ version: 1, requestId: f.input.requestId, components: ["adr"], status: "running", startedAt: new Date().toISOString(), output: "last output", message: "working" }));
    await writeFile(join(f.root, ".paseo-agent-team/setup.json"), record);
    assert.equal((await f.service.status("workspace"))!.status, "interrupted");
    assert.equal(await readFile(join(f.root, ".paseo-agent-team/setup.json"), "utf8"), record);
    assert.equal((await f.service.start(f.input)).status, "interrupted");
  } finally { await f.cleanup(); }
});

test("unsafe managed destinations and nested Git targets fail before mutation", async () => {
  const f = await fixture();
  try {
    const external = join(f.directory, "external"); await writeFile(external, "preserve");
    await symlink(external, join(f.root, "AGENTS.md"));
    await assert.rejects(f.service.start(f.input), /symbolic link/);
    assert.equal(await readFile(external, "utf8"), "preserve");
    await rm(join(f.root, "AGENTS.md"));
    await mkdir(join(f.root, ".agents/skills/openspec-apply-change"), { recursive: true });
    await symlink(external, join(f.root, ".agents/skills/openspec-apply-change/SKILL.md"));
    await assert.rejects(f.service.start(f.input), /symbolic link/);
    await assert.rejects(readFile(join(f.root, "AGENTS.md")), { code: "ENOENT" });
    const nested = join(f.root, "nested"); await mkdir(nested);
    const service = new SetupService(async () => nested, { env: f.env });
    await assert.rejects(service.start(f.input), /Open the repository root/); await service.dispose();
  } finally { await f.cleanup(); }
});

test("process output is bounded and arguments remain literal", async () => {
  const result = await runCommand(process.execPath, ["-e", "process.stdout.write(process.argv[1] + 'x'.repeat(30000))", "$(touch forbidden)"], { cwd: tmpdir() });
  assert.equal(result.code, 0); assert.equal(result.output.length, 20000);
});

test("cancellation stops children that ignore SIGTERM after the installer exits", async () => {
  const root = await mkdtemp(join(tmpdir(), "paseo-setup-cancel-"));
  const controller = new AbortController();
  try {
    await runCommand("bash", ["-c", "trap 'exit 0' TERM; (trap '' TERM; sleep 1; echo survived > late-write) </dev/null >/dev/null 2>&1 & echo ready; wait"], {
      cwd: root, signal: controller.signal,
      onOutput: text => { if (text.includes("ready")) controller.abort(); },
    });
    await new Promise(resolve => setTimeout(resolve, 1200));
    await assert.rejects(readFile(join(root, "late-write")), { code: "ENOENT" });
  } finally { await rm(root, { recursive: true, force: true }); }
});
