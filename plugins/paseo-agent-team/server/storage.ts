import { lstat, mkdir, readFile, readdir, realpath, rename, writeFile } from "node:fs/promises";
import { join, relative, isAbsolute } from "node:path";
import { randomUUID } from "node:crypto";
import { stateSchema, type TeamState } from "../shared/team";

export const stateDirectory = ".paseo-agent-team";
const empty = (): TeamState => ({ version: 1, members: [] });
const missing = (error: unknown) => (error as NodeJS.ErrnoException).code === "ENOENT";
export async function rejectSymlink(path: string) {
  try { if ((await lstat(path)).isSymbolicLink()) throw new Error(`Refusing symbolic link: ${path}`); }
  catch (error) { if (!missing(error)) throw error; }
}
export async function readState(root: string): Promise<TeamState> {
  const directory = join(root, stateDirectory), file = join(directory, "state.json");
  await rejectSymlink(directory); await rejectSymlink(file);
  try { return stateSchema.parse(JSON.parse(await readFile(file, "utf8"))); }
  catch (error) { if (missing(error)) return empty(); throw new Error(`Cannot read team state: ${String(error)}`); }
}
export async function saveState(root: string, state: TeamState) {
  const validated = stateSchema.parse(state), directory = join(root, stateDirectory);
  await rejectSymlink(directory); await mkdir(directory, { recursive: true });
  const ignore = join(root, ".gitignore"); await rejectSymlink(ignore);
  let text = "";
  try { text = await readFile(ignore, "utf8"); } catch (error) { if (!missing(error)) throw error; }
  if (!text.split(/\r?\n/).some(line => line === `${stateDirectory}/` || line === `/${stateDirectory}/`)) {
    await writeFile(ignore, text + (text && !text.endsWith("\n") ? "\n" : "") + `${stateDirectory}/\n`);
  }
  const target = join(directory, "state.json"); await rejectSymlink(target);
  const temp = join(directory, `${randomUUID()}.tmp`);
  await writeFile(temp, JSON.stringify(validated, null, 2) + "\n", { mode: 0o600 });
  await rename(temp, target);
}
async function contained(root: string, path: string) {
  const resolved = await realpath(path), rel = relative(root, resolved);
  if (rel === ".." || rel.startsWith("../") || isAbsolute(rel)) throw new Error("Workflow path escapes the workspace");
  return resolved;
}
export async function workflow(root: string) {
  const result = { changes: [] as { name: string; complete: number; total: number }[], workflowInstalled: false };
  try { await contained(root, join(root, "openspec/config.yaml")); result.workflowInstalled = true; }
  catch (error) { if (!missing(error)) throw error; }
  const directory = join(root, "openspec/changes");
  let entries;
  try { entries = await readdir(await contained(root, directory), { withFileTypes: true }); }
  catch (error) { if (missing(error)) return result; throw error; }
  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name === "archive") continue;
    let text = "";
    try { text = await readFile(await contained(root, join(directory, entry.name, "tasks.md")), "utf8"); }
    catch (error) { if (!missing(error)) throw error; }
    result.changes.push({ name: entry.name, total: (text.match(/^\s*- \[[ xX]\]/gm) || []).length, complete: (text.match(/^\s*- \[[xX]\]/gm) || []).length });
  }
  return result;
}
