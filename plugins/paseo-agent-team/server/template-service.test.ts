import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Choices } from "../shared/team";
import { templateSchema, type TemplateSaveInput } from "../shared/templates";
import { TemplateService } from "./template-service";
import { readState, saveState } from "./storage";

async function fixture() {
  const root = await mkdtemp(join(tmpdir(), "paseo-member-templates-"));
  const choices: Choices = { choices: [{ id: "profile:test", name: "Test profile", notes: "", config: { provider: "test" } }], warnings: [] };
  const runtime = { directory: async () => root, choices: async () => choices };
  const input: TemplateSaveInput = { workspaceId: "origin", id: randomUUID(), customRole: { name: "QA reviewer", instructions: "Report reproducible failures." }, choiceId: "profile:test", isolation: "shared" };
  return { root, runtime, input, choices, service: new TemplateService(runtime), file: join(root, ".paseo-agent-team/templates.json"), cleanup: () => rm(root, { recursive: true, force: true }) };
}

test("template listing is read-only; task-free save and reload preserve only configuration", async () => {
  const f = await fixture();
  try {
    assert.deepEqual(await f.service.list("origin"), []);
    await assert.rejects(readFile(f.file), { code: "ENOENT" });
    assert.deepEqual(await f.service.delete({ workspaceId: "origin", id: f.input.id }), { deleted: false });
    await assert.rejects(readFile(join(f.root, ".gitignore")), { code: "ENOENT" });
    await writeFile(join(f.root, ".gitignore"), "local-entry\n");
    const saved = await f.service.save(f.input);
    assert.deepEqual(await new TemplateService(f.runtime).list("origin"), [saved]);
    assert.equal((await readState(f.root)).members.length, 0);
    await assert.rejects(readFile(join(f.root, ".paseo-agent-team/state.json")), { code: "ENOENT" });
    assert.deepEqual(Object.keys(JSON.parse(await readFile(f.file, "utf8")).templates[0]).sort(), ["choiceId", "customRole", "id", "isolation", "updatedAt"]);
    assert.equal(await readFile(join(f.root, ".gitignore"), "utf8"), "local-entry\n.paseo-agent-team/\n");
  } finally { await f.cleanup(); }
});

test("concurrent template saves retain distinct IDs and retries upsert one template", async () => {
  const f = await fixture();
  try {
    const second = { ...f.input, id: randomUUID(), customRole: { name: "Translator" }, isolation: "worktree" as const };
    await Promise.all([f.service.save(f.input), new TemplateService(f.runtime).save(second), f.service.save(f.input)]);
    assert.equal((await f.service.list("origin")).length, 2);
    const updated = await f.service.save({ ...f.input, customRole: { name: "Updated reviewer" } });
    assert.equal(updated.id, f.input.id);
    const snapshot = { requestId: "member", role: "custom" as const, customRole: f.input.customRole, config: { provider: "test" }, isolation: "shared" as const, createdAt: new Date().toISOString(), status: "archived", output: "Reviewed" };
    await saveState(f.root, { version: 1, members: [snapshot] });
    await f.service.delete({ workspaceId: "origin", id: f.input.id });
    assert.deepEqual((await f.service.list("origin")).map(t => t.id), [second.id]);
    assert.deepEqual((await readState(f.root)).members, [snapshot]);
  } finally { await f.cleanup(); }
});

test("templates stay project-local and canonical aliases serialize against the same file", async () => {
  const f = await fixture(), other = await fixture();
  try {
    const alias = join(other.root, "project-alias"); await symlink(f.root, alias);
    const viaAlias = new TemplateService({ ...f.runtime, directory: async () => alias });
    await Promise.all([f.service.save(f.input), viaAlias.save({ ...f.input, id: randomUUID() })]);
    assert.equal((await f.service.list("origin")).length, 2);
    assert.deepEqual(await other.service.list("origin"), []);
  } finally { await f.cleanup(); await other.cleanup(); }
});

test("invalid input, unavailable profiles, and template limits cannot overwrite saved data", async () => {
  const f = await fixture();
  try {
    for (const input of [
      { ...f.input, customRole: { name: " " } }, { ...f.input, id: "invalid-id" },
      { ...f.input, customRole: { name: "QA", instructions: "x".repeat(8001) } },
      { ...f.input, task: "Must not be saved" }, { ...f.input, choiceId: "missing" },
    ]) await assert.rejects(f.service.save(input));
    await assert.rejects(readFile(f.file), { code: "ENOENT" });
    const saved = await f.service.save(f.input);
    const full = { version: 1, templates: Array.from({ length: 100 }, (_, index) => ({ ...saved, id: index ? randomUUID() : saved.id })) };
    await writeFile(f.file, JSON.stringify(full));
    const before = await readFile(f.file, "utf8");
    await assert.rejects(f.service.save({ ...f.input, id: randomUUID() }));
    assert.equal(await readFile(f.file, "utf8"), before);
    await f.service.save({ ...f.input, customRole: { name: "Updated within limit" } });
    assert.equal((await f.service.list("origin")).length, 100);
    f.choices.choices = [];
    const unavailable = await f.service.list("origin");
    assert.equal(unavailable[0].choiceId, "profile:test");
    await assert.rejects(f.service.save(f.input), /no longer available/);
    assert.equal(templateSchema.parse(unavailable[0]).customRole.name, "Updated within limit");
  } finally { await f.cleanup(); }
});

test("corrupt and symlinked templates are preserved without blocking member reads", async () => {
  const f = await fixture(), other = await fixture();
  try {
    await mkdir(join(f.root, ".paseo-agent-team"));
    for (const bad of ['{"version":99}', 'not-json', JSON.stringify({ version: 1, templates: [{ id: "invalid" }] })]) {
      await writeFile(f.file, bad);
      await assert.rejects(f.service.list("origin"), /Cannot read member presets/);
      await assert.rejects(f.service.save(f.input), /Cannot read member presets/);
      await assert.rejects(f.service.delete({ workspaceId: "origin", id: f.input.id }), /Cannot read member presets/);
      assert.equal(await readFile(f.file, "utf8"), bad);
      assert.deepEqual(await readState(f.root), { version: 1, members: [] });
    }
    await rm(f.file);
    const sentinel = join(other.root, "sentinel"); await writeFile(sentinel, "preserve"); await symlink(sentinel, f.file);
    await assert.rejects(f.service.save(f.input), /symbolic link/);
    await assert.rejects(f.service.delete({ workspaceId: "origin", id: f.input.id }), /symbolic link/);
    assert.equal(await readFile(sentinel, "utf8"), "preserve");
    await rm(join(f.root, ".paseo-agent-team"), { recursive: true });
    await symlink(other.root, join(f.root, ".paseo-agent-team"));
    await assert.rejects(f.service.list("origin"), /symbolic link/);
  } finally { await f.cleanup(); await other.cleanup(); }
});
