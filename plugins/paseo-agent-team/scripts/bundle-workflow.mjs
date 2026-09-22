import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { lstat, readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const plugin = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const root = resolve(plugin, "../..");
const files = [];
async function collect(path) {
  const info = await lstat(join(root, path));
  if (info.isSymbolicLink()) throw new Error(`Workflow source must not be a symlink: ${path}`);
  if (info.isDirectory()) {
    for (const name of (await readdir(join(root, path))).sort()) await collect(`${path}/${name}`);
  } else if (info.isFile()) {
    files.push({ path, content: await readFile(join(root, path), "utf8"), executable: Boolean(info.mode & 0o111) });
  }
}
for (const path of ["init.sh", "AGENTS.md", "LICENSE", "skills.txt", "adr/README.md", "scripts/pre-commit.sh", "openspec/schemas"]) await collect(path);
const names = new Set();
for (const file of files.filter(f => f.path === "skills.txt" || f.path.endsWith("/skills.txt"))) {
  for (const line of file.content.split("\n")) {
    const name = line.split("#")[0].trim();
    if (!name) continue;
    if (!/^[a-z0-9-]+$/.test(name)) throw new Error(`Invalid declared skill: ${name}`);
    names.add(name);
  }
}
for (const name of [...names].sort()) await collect(`.agents/skills/${name}`);
files.sort((a, b) => a.path.localeCompare(b.path));
const digest = createHash("sha256").update(JSON.stringify(files)).digest("hex");
let revision = "local";
try { revision = execFileSync("git", ["rev-parse", "--short", "HEAD"], { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim(); } catch {}
await writeFile(join(plugin, "server/workflow-assets.json"), JSON.stringify({ revision, digest, skills: [...names].sort(), files }) + "\n");
console.log(`Prepared ${files.length} workflow files (${revision}, ${digest.slice(0, 12)})`);
