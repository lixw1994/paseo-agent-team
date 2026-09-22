import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";
import { TeamService, memberPrompt, type Runtime } from "./team-service";
import { readState, saveState } from "./storage";
import type { StartInput } from "../shared/team";
import { memberRoleTitle, roles } from "../shared/team";

async function fixture() {
  const root = await mkdtemp(join(tmpdir(), "paseo-agent-team-test-"));
  const agents = new Map<string, { status: string; output: string }>();
  const records = new Map<string, { agentId: string; workspaceId: string }>();
  const calls: string[] = [];
  const runtime: Runtime = {
    async directory() { return root; },
    async choices() { return { choices: [{ id: "profile:test", name: "Test", notes: "fixture only", config: { provider: "test/model", modeId: "review" } }], warnings: [] }; },
    async createWorkspace() { calls.push("worktree"); return "isolated"; },
    async create(workspaceId, member) { const agentId = randomUUID(); calls.push("create"); agents.set(agentId, { status: "idle", output: "Research result" }); records.set(member.requestId, { agentId, workspaceId }); return agentId; },
    async recover(id) { return records.get(id); },
    async inspect(id) { return agents.get(id); },
    async send(id, prompt) { calls.push(`send:${id}:${prompt}`); },
    async archive(id) { calls.push(`archive:${id}`); agents.get(id)!.status = "archived"; },
  };
  const input: StartInput = { requestId: randomUUID(), workspaceId: "origin", role: "researcher", choiceId: "profile:test", isolation: "shared" };
  return { root, runtime, input, calls, records, service: new TeamService(runtime), cleanup: () => rm(root, { recursive: true, force: true }) };
}

test("opening the panel reads OpenSpec progress without creating state or agents", async () => {
  const f = await fixture();
  try {
    await mkdir(join(f.root, "openspec/changes/example"), { recursive: true });
    await writeFile(join(f.root, "openspec/config.yaml"), "schema: spec-driven-with-adr\n");
    await writeFile(join(f.root, "openspec/changes/example/tasks.md"), "- [x] 1.1 Done\n- [ ] 1.2 Pending\n");
    const view = await f.service.view("origin");
    assert.deepEqual(view.changes, [{ name: "example", complete: 1, total: 2 }]);
    assert.deepEqual(view.members, []); assert.equal(view.workflowInstalled, true);
    assert.deepEqual(f.calls, []);
    await assert.rejects(readFile(join(f.root, ".paseo-agent-team/state.json")), { code: "ENOENT" });
  } finally { await f.cleanup(); }
});

test("concurrent retries and a new service instance reuse one persisted member", async () => {
  const f = await fixture();
  try {
    await writeFile(join(f.root, ".gitignore"), "user-entry");
    const [first, second] = await Promise.all([f.service.start(f.input), new TeamService(f.runtime).start(f.input)]);
    assert.equal(first.agentId, second.agentId);
    assert.equal(f.calls.filter(call => call === "create").length, 1);
    const reloaded = await new TeamService(f.runtime).view("origin");
    assert.equal(reloaded.members[0].output, "Research result");
    assert.equal(reloaded.members[0].config.modeId, "review");
    assert.equal(await readFile(join(f.root, ".gitignore"), "utf8"), "user-entry\n.paseo-agent-team/\n");
  } finally { await f.cleanup(); }
});

test("worker enforces worktree isolation before creating a member", async () => {
  const f = await fixture();
  try {
    await assert.rejects(f.service.start({ ...f.input, role: "worker" }), /isolated worktree/);
    assert.deepEqual(f.calls, []);
    const member = await f.service.start({ ...f.input, role: "worker", isolation: "worktree" });
    assert.equal(member.workspaceId, "isolated"); assert.deepEqual(f.calls, ["worktree", "create"]);
  } finally { await f.cleanup(); }
});

test("members wait for explicit assignments and retain their role on reload", async () => {
  const f = await fixture();
  try {
    f.runtime.inspect = async () => ({ status: "idle", output: "" });
    await f.service.start(f.input);
    const custom = await f.service.start({ ...f.input, requestId: randomUUID(), role: "custom", customRole: { name: "QA", instructions: "Report reproducible defects." } });
    assert.deepEqual(f.calls, ["create", "create"]);
    const state = await readState(f.root);
    assert.ok(state.members.every(member => !Object.hasOwn(member, "task")));
    assert.ok((await f.service.view("origin")).members.every(member => member.status === "idle" && !member.output));
    await f.service.followup("origin", custom.requestId, "Check keyboard navigation in the checkout dialog.");
    assert.deepEqual(f.calls.slice(2), [`send:${custom.agentId}:Check keyboard navigation in the checkout dialog.`]);
    const restored = await new TeamService(f.runtime).view("origin");
    assert.deepEqual(restored.members[1].customRole, custom.customRole);
    assert.equal(f.calls.length, 3, "Reload must not create an agent or send work");
  } finally { await f.cleanup(); }
});

test("creation validates unexpected fields before any side effect", async () => {
  const f = await fixture();
  try {
    await assert.rejects(f.service.start({ ...f.input, unexpected: true } as StartInput), /Unrecognized key/);
    assert.deepEqual(f.calls, []);
    await assert.rejects(readFile(join(f.root, ".paseo-agent-team/state.json")), { code: "ENOENT" });
  } finally { await f.cleanup(); }
});

test("restored helper prompts preserve lead ownership and distinct write scopes", async () => {
  const f = await fixture();
  try {
    const researcher = await f.service.start(f.input);
    const writer = await f.service.start({ ...f.input, requestId: randomUUID(), role: "writer" });
    const worker = await f.service.start({ ...f.input, requestId: randomUUID(), role: "worker", isolation: "worktree" });
    assert.deepEqual(Object.keys(roles), ["researcher", "writer", "worker"]);
    assert.equal(writer.workspaceId, "origin");
    assert.equal(worker.workspaceId, "isolated");
    assert.match(memberPrompt(researcher), /external information only/);
    assert.match(memberPrompt(researcher), /source link and retrieval date/);
    assert.match(memberPrompt(researcher), /\.paseo-agent-team\/handoff\//);
    assert.match(memberPrompt(writer), /only under docs\//);
    assert.match(memberPrompt(writer), /must not edit code/);
    assert.match(memberPrompt(writer), /tech-doc\/SKILL\.md/);
    assert.match(memberPrompt(worker), /stop editing and report/);
    assert.match(memberPrompt(worker), /line by line/);
    for (const member of [researcher, writer, worker]) {
      const prompt = memberPrompt(member);
      assert.match(prompt, /existing primary agent is the Tech Lead/);
      assert.match(prompt, /all openspec\/ and adr\/ edits belong to the Tech Lead/);
      assert.match(prompt, /Do not launch further agents\./);
      assert.match(prompt, /Wait for an explicit user assignment/);
    }
  } finally { await f.cleanup(); }
});

test("custom members retain identity through lost replies, reload, follow-up, and archive", async () => {
  const f = await fixture();
  try {
    const input: StartInput = { ...f.input, role: "custom", customRole: { name: "  Accessibility reviewer  ", instructions: "  Review keyboard access without editing files.  " } };
    const create = f.runtime.create;
    f.runtime.create = async (...args) => { await create(...args); throw new Error("reply lost"); };
    assert.equal((await f.service.start(input)).status, "unresolved");
    const recovered = await new TeamService(f.runtime).start(input);
    assert.equal(f.calls.filter(call => call === "create").length, 1);
    assert.deepEqual(recovered.customRole, { name: "Accessibility reviewer", instructions: "Review keyboard access without editing files." });
    const prompt = memberPrompt(recovered);
    assert.match(prompt, /Standing role responsibilities:\nReview keyboard access without editing files\./);
    assert.match(prompt, /Do not launch further agents/);
    assert.equal(memberRoleTitle(recovered.role, recovered.customRole?.name), "Accessibility reviewer");
    await f.service.followup("origin", input.requestId, "Check focus restoration too.");
    const archived = await f.service.archive("origin", input.requestId);
    assert.equal(archived.status, "archived");
    assert.deepEqual((await readState(f.root)).members[0].customRole, recovered.customRole);
    f.runtime.create = create;
    const blank = await f.service.start({ ...input, requestId: randomUUID(), customRole: { name: "Test helper" }, isolation: "worktree" });
    assert.equal(blank.workspaceId, "isolated");
    assert.ok(!memberPrompt(blank).includes("Standing role responsibilities:"));
    assert.match(memberPrompt(blank), /existing primary agent is the Tech Lead/);
  } finally { await f.cleanup(); }
});

test("custom definitions are validated before creation and cannot override presets", async () => {
  const f = await fixture();
  try {
    const invalid = [
      { role: "custom" }, { role: "custom", customRole: { name: "  " } },
      { role: "custom", customRole: { name: "x".repeat(81) } },
      { role: "custom", customRole: { name: "two\nlines" } },
      { role: "custom", customRole: { name: "QA", instructions: "x".repeat(8001) } },
      { role: "writer", customRole: { name: "Unrestricted writer" } },
    ];
    for (const value of invalid) await assert.rejects(f.service.start({ ...f.input, ...value } as StartInput));
    assert.deepEqual(f.calls, []);
    await assert.rejects(readFile(join(f.root, ".paseo-agent-team/state.json")), { code: "ENOENT" });
  } finally { await f.cleanup(); }
});

test("interrupted creation recovers a labeled agent without launching another", async () => {
  const f = await fixture();
  try {
    const create = f.runtime.create;
    f.runtime.create = async (...args) => { await create(...args); throw new Error("connection lost after creation"); };
    const initial = await f.service.start(f.input);
    assert.equal(initial.status, "unresolved"); assert.equal(initial.agentId, undefined);
    const recovered = await f.service.start(f.input);
    assert.ok(recovered.agentId); assert.equal(recovered.status, "idle");
    assert.equal(f.calls.filter(call => call === "create").length, 1);
  } finally { await f.cleanup(); }
});

test("failed creation remains unresolved and does not silently retry", async () => {
  const f = await fixture();
  try {
    f.runtime.create = async () => { f.calls.push("create"); throw new Error("provider unavailable"); };
    await f.service.start(f.input);
    const retry = await f.service.start(f.input);
    assert.equal(retry.status, "unresolved"); assert.equal(retry.agentId, undefined);
    assert.equal(f.calls.filter(call => call === "create").length, 1);
  } finally { await f.cleanup(); }
});

test("follow-up and archive only affect the requested member; results survive", async () => {
  const f = await fixture();
  try {
    const member = await f.service.start(f.input);
    await assert.rejects(f.service.archive("origin", "not-a-member"), /does not belong/);
    await f.service.followup("origin", f.input.requestId, "Clarify");
    const archived = await f.service.archive("origin", f.input.requestId);
    assert.equal(archived.status, "archived"); assert.equal(archived.output, "Research result");
    assert.ok(f.calls.includes(`send:${member.agentId}:Clarify`));
    assert.ok(f.calls.includes(`archive:${member.agentId}`));
    await assert.rejects(f.service.followup("origin", f.input.requestId, "Again"), /cannot accept/);
    assert.equal((await readState(f.root)).members[0].status, "archived");
  } finally { await f.cleanup(); }
});

test("ambiguous recovery stays visible without blocking healthy members", async () => {
  const f = await fixture();
  try {
    const healthy = await f.service.start(f.input);
    f.runtime.create = async () => { throw new Error("lost creation response"); };
    const interrupted = await f.service.start({ ...f.input, requestId: randomUUID() });
    f.runtime.recover = async () => { throw new Error("Multiple agents match this creation request"); };
    const view = await new TeamService(f.runtime).view("origin");
    assert.equal(view.members[0].agentId, healthy.agentId);
    assert.equal(view.members[0].status, "idle");
    assert.equal(view.members[0].output, "Research result");
    assert.equal(view.members[1].requestId, interrupted.requestId);
    assert.equal(view.members[1].status, "unresolved");
    assert.match(view.members[1].error!, /Multiple agents/);
    assert.equal((await readState(f.root)).members[1].status, "unresolved");
    assert.equal(f.calls.filter(call => call === "create").length, 1);
  } finally { await f.cleanup(); }
});

test("invalid state and symbolic links fail without overwriting external data", async () => {
  const f = await fixture(); const other = await mkdtemp(join(tmpdir(), "paseo-agent-team-external-"));
  try {
    await symlink(other, join(f.root, ".paseo-agent-team"));
    await assert.rejects(f.service.start(f.input), /symbolic link/); assert.deepEqual(f.calls, []);
    await rm(join(f.root, ".paseo-agent-team"));
    await mkdir(join(f.root, ".paseo-agent-team"));
    await writeFile(join(f.root, ".paseo-agent-team/state.json"), '{"version":99}');
    await assert.rejects(f.service.start(f.input), /Cannot read team state/);
    assert.equal(await readFile(join(f.root, ".paseo-agent-team/state.json"), "utf8"), '{"version":99}');
    await writeFile(join(other, "sentinel"), "preserve");
    await symlink(join(other, "sentinel"), join(f.root, ".gitignore"));
    await assert.rejects(saveState(f.root, { version: 1, members: [] }), /symbolic link/);
    assert.equal(await readFile(join(other, "sentinel"), "utf8"), "preserve");
  } finally { await f.cleanup(); await rm(other, { recursive: true, force: true }); }
});
