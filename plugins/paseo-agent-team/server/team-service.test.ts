import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";
import { TeamService, memberPrompt, type Runtime } from "./team-service";
import { readState, saveState } from "./storage";
import type { Member, StartInput } from "../shared/team";
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
  const input: StartInput = { requestId: randomUUID(), workspaceId: "origin", role: "researcher", task: "Research the latest official API documentation", choiceId: "profile:test", isolation: "shared" };
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

test("restored helper prompts preserve lead ownership and distinct write scopes", async () => {
  const f = await fixture();
  try {
    const researcher = await f.service.start(f.input);
    const writer = await f.service.start({ ...f.input, requestId: randomUUID(), role: "writer", task: "Update docs/usage.md only" });
    const worker = await f.service.start({ ...f.input, requestId: randomUUID(), role: "worker", isolation: "worktree", task: "Rename the specified local variable" });
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
      assert.ok(prompt.endsWith(member.task));
    }
  } finally { await f.cleanup(); }
});

test("legacy roles cannot start new agents, but saved members keep identity and management", async () => {
  const f = await fixture();
  try {
    for (const role of ["reviewer", "implementer", "tech-lead"]) {
      await assert.rejects(f.service.start({ ...f.input, role } as unknown as StartInput));
    }
    assert.deepEqual(f.calls, []);
    const first = await f.service.start(f.input);
    const second = await f.service.start({ ...f.input, requestId: randomUUID(), role: "worker", isolation: "worktree" });
    const original: Member[] = [{ ...first, role: "reviewer" }, { ...second, role: "implementer" }];
    await saveState(f.root, { version: 1, members: original });
    const view = await new TeamService(f.runtime).view("origin");
    assert.deepEqual(view.members.map(m => [m.requestId, m.agentId, m.role, m.task, m.config]), original.map(m => [m.requestId, m.agentId, m.role, m.task, m.config]));
    assert.equal(memberRoleTitle(view.members[0].role), "Reviewer (legacy)");
    assert.equal(memberRoleTitle(view.members[1].role), "Implementer (legacy)");
    await f.service.followup("origin", first.requestId, "Clarify the existing task");
    const archived = await f.service.archive("origin", second.requestId);
    assert.equal(archived.role, "implementer");
    assert.equal(archived.status, "archived");
    assert.equal(archived.output, "Research result");
    assert.equal(f.calls.filter(call => call === "create").length, 2);
    assert.equal((await readState(f.root)).members[0].role, "reviewer");
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
