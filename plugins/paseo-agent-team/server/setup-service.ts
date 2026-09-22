import { access, lstat, mkdir, mkdtemp, readFile, readdir, realpath, rename, rm, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import { dirname, isAbsolute, join, parse, relative, resolve } from "node:path";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";
import assets from "./workflow-assets.json";
import { jobSchema, setupInputSchema, type Component, type SetupInput, type SetupInspection, type SetupJob } from "../shared/setup";
import { prepareStateDirectory, rejectSymlink, stateDirectory } from "./storage";
import { runCommand } from "./setup-process";

const missing = (error: unknown) => (error as NodeJS.ErrnoException).code === "ENOENT";
const instructionTemplate = assets.files.find(file => file.path === "AGENTS.md")!.content.trim();

async function safePath(root: string, path: string) {
  const rel = relative(root, path);
  if (rel.startsWith(`..${process.platform === "win32" ? "\\" : "/"}`) || rel === ".." || isAbsolute(rel)) throw new Error("Setup path escapes the workspace");
  let current = root;
  for (const segment of rel.split(/[\\/]/).filter(Boolean)) { current = join(current, segment); await rejectSymlink(current); }
}
async function safeAbsolute(path: string) {
  await safePath(parse(path).root, path);
}
async function safeTree(root: string, path: string) {
  await safePath(root, path);
  try {
    if ((await lstat(path)).isDirectory()) for (const entry of await readdir(path)) await safeTree(root, join(path, entry));
  } catch (error) { if (!missing(error)) throw error; }
}
async function fileText(root: string, path: string) {
  await safePath(root, join(root, path));
  try { return await readFile(join(root, path), "utf8"); } catch (error) { if (missing(error)) return ""; throw error; }
}
async function hasFile(root: string, path: string) {
  await safePath(root, join(root, path));
  try { return (await lstat(join(root, path))).isFile(); } catch (error) { if (missing(error)) return false; throw error; }
}
async function allFiles(root: string, paths: string[]) {
  return (await Promise.all(paths.map(path => hasFile(root, path)))).every(Boolean);
}
function managedPaths(components: Component[]) {
  const paths = ["AGENTS.md", ".paseo-agent-team.yaml", ".gitignore", stateDirectory];
  if (components.includes("openspec")) paths.push("openspec/config.yaml", "openspec/schemas", ".agents/skills");
  if (components.includes("adr")) paths.push("adr/README.md");
  if (components.includes("skills")) paths.push(...assets.skills.map(name => `.agents/skills/${name}`));
  if (components.includes("hooks")) paths.push("scripts/pre-commit.sh");
  return paths;
}

interface LiveJob { job: SetupJob; controller: AbortController; stopStatus?: "cancelled" | "interrupted"; done: Promise<void> }
export class SetupService {
  private live = new Map<string, LiveJob>();
  private starts = new Map<string, Promise<unknown>>();
  private stopped = false;
  constructor(private directory: (workspaceId: string) => Promise<string>, private options: { env?: NodeJS.ProcessEnv; timeoutMs?: number } = {}) {}
  private root(workspaceId: string) { return this.directory(workspaceId).then(path => realpath(path)); }
  private command(root: string, command: string, args: string[]) {
    return runCommand(command, args, { cwd: root, env: this.options.env });
  }
  private async git(root: string) {
    try {
      const result = await this.command(root, "git", ["rev-parse", "--show-toplevel"]);
      if (result.code !== 0) return { gitRoot: null, hookDirectory: null };
      const gitRoot = await realpath(result.output.trim());
      const hooks = await this.command(root, "git", ["rev-parse", "--path-format=absolute", "--git-path", "hooks"]);
      return { gitRoot, hookDirectory: hooks.code === 0 ? resolve(root, hooks.output.trim()) : null };
    } catch { return { gitRoot: null, hookDirectory: null }; }
  }
  private async components(root: string, hookDirectory: string | null) {
    const instructions = (await fileText(root, "AGENTS.md")).trim();
    const begin = "<!-- paseo-agent-team:begin -->", end = "<!-- paseo-agent-team:end -->";
    const managed = instructions === instructionTemplate || (instructions.split(begin).length === 2 && instructions.split(end).length === 2 &&
      instructions.indexOf(end) > instructions.indexOf(begin) + begin.length);
    const schemas = assets.files.filter(file => file.path.startsWith("openspec/schemas/")).map(file => file.path);
    const skills = assets.files.filter(file => file.path.startsWith(".agents/skills/")).map(file => file.path);
    let hookReady = false;
    if (hookDirectory) {
      await safeAbsolute(hookDirectory);
      await rejectSymlink(join(hookDirectory, "pre-commit"));
      try {
        hookReady = (await readFile(join(hookDirectory, "pre-commit"), "utf8")).includes("paseo-agent-team hook shim");
        await access(join(hookDirectory, "pre-commit"), constants.X_OK);
        await safePath(root, join(root, "scripts/pre-commit.sh"));
        await access(join(root, "scripts/pre-commit.sh"), constants.X_OK);
      } catch (error) { if (!missing(error) && (error as NodeJS.ErrnoException).code !== "EACCES") throw error; hookReady = false; }
    }
    return [
      { id: "instructions", label: "Project instructions", ready: managed, detail: "AGENTS.md managed rules" },
      { id: "openspec", label: "OpenSpec workflow", ready: Boolean(await fileText(root, "openspec/config.yaml")) && await allFiles(root, [...schemas, ".agents/skills/openspec-apply-change/SKILL.md"]), detail: "Configuration, schemas, and generated workflow skills" },
      { id: "adr", label: "Architecture decisions", ready: await hasFile(root, "adr/README.md"), detail: "adr/README.md rules; project decisions are written by your primary agent" },
      { id: "skills", label: "Agent skills", ready: await allFiles(root, skills), detail: `${assets.skills.length} declared skills and supporting files` },
      { id: "hooks", label: "Git discipline hook", ready: hookReady, detail: hookDirectory ? join(hookDirectory, "pre-commit") : "Git hook directory unavailable" },
    ];
  }
  private async readJob(root: string): Promise<SetupJob | null> {
    const active = this.live.get(root);
    if (active) return { ...active.job };
    const text = await fileText(root, `${stateDirectory}/setup.json`);
    if (!text) return null;
    const job = jobSchema.parse(JSON.parse(text));
    return job.status === "running" ? { ...job, status: "interrupted", message: "The plugin stopped before recording a result. Inspect component status and explicitly repair if needed." } : job;
  }
  private async writeJob(root: string, job: SetupJob) {
    const directory = await prepareStateDirectory(root), target = join(directory, "setup.json");
    await rejectSymlink(target);
    const temp = join(directory, `${randomUUID()}.tmp`);
    await writeFile(temp, JSON.stringify(jobSchema.parse(job)) + "\n", { mode: 0o600 });
    await rename(temp, target);
  }
  async inspect(workspaceId: string): Promise<SetupInspection> {
    const root = await this.root(workspaceId);
    const [git, tools] = await Promise.all([this.git(root), Promise.all([
      ["bash", "Bash", "Install Bash on the daemon host."],
      ["git", "Git", "Install Git on the daemon host."],
      ["openspec", "OpenSpec CLI", "Run npm install -g @fission-ai/openspec@latest on the daemon host, then recheck."],
    ].map(async ([id, label, fix]) => {
      try { const result = await this.command(root, id, ["--version"]); return { id, label, ready: result.code === 0, detail: result.code === 0 ? result.output.split("\n")[0] : fix }; }
      catch { return { id, label, ready: false, detail: fix }; }
    }))]);
    const components = await this.components(root, git.hookDirectory);
    return { directory: root, ...git, source: `${assets.revision} / ${assets.digest.slice(0, 12)}`,
      configExists: await hasFile(root, "openspec/config.yaml"), complete: components.every(c => c.ready), components,
      prerequisites: [...tools, { id: "project", label: "Git project root", ready: git.gitRoot === root,
        detail: git.gitRoot === root ? root : git.gitRoot ? `Open the repository root: ${git.gitRoot}` : "Initialize Git in this directory before installing the workflow." }], job: await this.readJob(root) };
  }
  async status(workspaceId: string) { return this.readJob(await this.root(workspaceId)); }
  async start(raw: SetupInput) {
    const input = setupInputSchema.parse(raw), root = await this.root(input.workspaceId);
    const previous = this.starts.get(root) ?? Promise.resolve();
    const pending = previous.catch(() => {}).then(async () => {
      if (this.stopped) throw new Error("Plugin is stopping; reopen setup after reload.");
      const last = await this.readJob(root);
      if (last?.requestId === input.requestId) return last;
      if (this.live.get(root)?.job.status === "running") throw new Error("A setup job is already running for this project.");
      // A terminal result can be observed while its final write/cleanup is finishing.
      // Do not replace the active record until that work has settled.
      await this.live.get(root)?.done;
      const inspection = await this.inspect(input.workspaceId);
      const blockers = inspection.prerequisites.filter(check => !check.ready && (check.id !== "openspec" || input.components.includes("openspec")));
      if (blockers.length) throw new Error(blockers.map(check => check.detail).join("\n"));
      for (const path of managedPaths(input.components)) await safePath(root, join(root, path));
      // The OpenSpec CLI can update any generated openspec-* integration directory.
      if (input.components.includes("openspec")) {
        try { for (const name of await readdir(join(root, ".agents/skills"))) if (name.startsWith("openspec-")) await safeTree(root, join(root, ".agents/skills", name)); }
        catch (error) { if (!missing(error)) throw error; }
      }
      if (input.components.includes("hooks") && inspection.hookDirectory) {
        await safeAbsolute(inspection.hookDirectory); await rejectSymlink(join(inspection.hookDirectory, "pre-commit"));
      }
      const job: SetupJob = { version: 1, requestId: input.requestId, components: input.components,
        startedAt: new Date().toISOString(), status: "running", output: "", message: "Installing selected workflow components…" };
      await this.writeJob(root, job);
      const active: LiveJob = { job, controller: new AbortController(), done: Promise.resolve() };
      this.live.set(root, active);
      active.done = this.execute(root, input, active);
      return { ...job };
    });
    this.starts.set(root, pending);
    try { return await pending; } finally { if (this.starts.get(root) === pending) this.starts.delete(root); }
  }
  private async execute(root: string, input: SetupInput, active: LiveJob) {
    let source: string | undefined;
    const { job, controller } = active;
    try {
      source = await mkdtemp(join(tmpdir(), "paseo-workflow-source-"));
      for (const file of assets.files) {
        const path = join(source, file.path); await mkdir(dirname(path), { recursive: true });
        await writeFile(path, file.content, { mode: file.executable ? 0o755 : 0o644 });
      }
      const result = await runCommand("bash", [join(source, "init.sh"), "--with", input.components.join(","), "--language", input.language], {
        cwd: root, env: { ...(this.options.env ?? process.env), BASH_ENV: undefined, ENV: undefined },
        timeoutMs: this.options.timeoutMs ?? 120000, signal: controller.signal,
        onOutput: text => { job.output = (job.output + text).slice(-20000); },
      });
      if (controller.signal.aborted) {
        job.status = active.stopStatus ?? "interrupted";
        job.message = "Installation stopped. Completed file changes remain; recheck and repair as needed.";
      } else if (result.code !== 0 || result.timedOut) {
        job.status = "failed"; job.message = result.timedOut ? `Installation exceeded ${(this.options.timeoutMs ?? 120000) / 1000} seconds. Review output and repair explicitly.` : `Installer exited with code ${result.code}. Review output before retrying.`;
      } else {
        const git = await this.git(root), components = await this.components(root, git.hookDirectory);
        const manifest = await fileText(root, ".paseo-agent-team.yaml");
        const complete = components.find(c => c.id === "instructions")!.ready && input.components.every(id =>
          components.find(c => c.id === id)?.ready && manifest.split("\n").includes(`  - ${id}`));
        job.status = complete ? "succeeded" : "partial";
        job.message = complete ? "Selected components installed. Restart your agent session to load the project rules." : "Some selected components are incomplete. Review the checks and installer output, then repair.";
      }
    } catch (error) {
      job.status = controller.signal.aborted ? (active.stopStatus ?? "interrupted") : "failed";
      job.message = String(error);
    } finally {
      job.finishedAt = new Date().toISOString();
      let saved = false;
      try { await this.writeJob(root, job); saved = true; } catch (error) { job.status = "failed"; job.message += ` Result could not be saved: ${String(error)}`; }
      if (source) await rm(source, { recursive: true, force: true }).catch(() => {});
      if (saved) this.live.delete(root);
    }
  }
  async cancel(workspaceId: string, requestId: string) {
    const root = await this.root(workspaceId), job = await this.readJob(root);
    if (!job || job.requestId !== requestId) throw new Error("This setup request does not belong to the selected workspace.");
    const active = this.live.get(root);
    if (active) { active.stopStatus = "cancelled"; active.controller.abort(); }
    return job;
  }
  async dispose() {
    this.stopped = true;
    await Promise.allSettled([...this.starts.values()]);
    for (const active of this.live.values()) { active.stopStatus = "interrupted"; active.controller.abort(); }
    await Promise.allSettled([...this.live.values()].map(active => active.done));
  }
}
