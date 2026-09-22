import { randomUUID } from "node:crypto";
import { readFile, realpath, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { templateDeleteSchema, templateSaveSchema, templateStateSchema, type MemberTemplate, type TemplateSaveInput } from "../shared/templates";
import { prepareStateDirectory, rejectSymlink, stateDirectory, withProjectLock } from "./storage";
import type { Runtime } from "./team-service";

async function readTemplates(root: string): Promise<MemberTemplate[]> {
  const directory = join(root, stateDirectory), path = join(directory, "templates.json");
  await rejectSymlink(directory); await rejectSymlink(path);
  try { return templateStateSchema.parse(JSON.parse(await readFile(path, "utf8"))).templates; }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw new Error(`Cannot read member presets: ${String(error)}`);
  }
}
async function saveTemplates(root: string, templates: MemberTemplate[]) {
  const state = templateStateSchema.parse({ version: 1, templates });
  const directory = await prepareStateDirectory(root), target = join(directory, "templates.json");
  await rejectSymlink(target);
  const temp = join(directory, `${randomUUID()}.tmp`);
  await writeFile(temp, JSON.stringify(state, null, 2) + "\n", { mode: 0o600 });
  await rename(temp, target);
}

export class TemplateService {
  constructor(private runtime: Pick<Runtime, "directory" | "choices">) {}
  async list(workspaceId: string) {
    return readTemplates(await realpath(await this.runtime.directory(workspaceId)));
  }
  async save(input: TemplateSaveInput) {
    input = templateSaveSchema.parse(input);
    return withProjectLock(await this.runtime.directory(input.workspaceId), async root => {
      const templates = await readTemplates(root);
      if (!(await this.runtime.choices()).choices.some(choice => choice.id === input.choiceId)) throw new Error("Selected profile/model is no longer available. Choose an available profile before saving.");
      const { workspaceId: _, ...draft } = input;
      const saved = { ...draft, updatedAt: new Date().toISOString() };
      const index = templates.findIndex(template => template.id === saved.id);
      if (index === -1) templates.push(saved); else templates[index] = saved;
      await saveTemplates(root, templates);
      return saved;
    });
  }
  async delete(input: { workspaceId: string; id: string }) {
    input = templateDeleteSchema.parse(input);
    return withProjectLock(await this.runtime.directory(input.workspaceId), async root => {
      const templates = await readTemplates(root), remaining = templates.filter(template => template.id !== input.id);
      if (remaining.length === templates.length) return { deleted: false };
      await saveTemplates(root, remaining);
      return { deleted: true };
    });
  }
}
