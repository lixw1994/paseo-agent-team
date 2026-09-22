import { defineRpc } from "@getpaseo/plugin";
import { z } from "zod";
import { scopeSchema } from "./team";

export const componentSchema = z.enum(["openspec", "adr", "skills", "hooks"]);
export type Component = z.infer<typeof componentSchema>;
export const componentLabels: Record<Component, string> = {
  openspec: "OpenSpec workflow", adr: "Architecture decisions", skills: "Agent skills", hooks: "Git discipline hook",
};
export const setupInputSchema = scopeSchema.extend({
  requestId: z.string().uuid(),
  components: z.array(componentSchema).min(1).max(4).refine(items => new Set(items).size === items.length, "Duplicate component"),
  language: z.string().trim().min(1).max(80).regex(/^[\p{L}\p{N} ()_-]+$/u),
});
export type SetupInput = z.infer<typeof setupInputSchema>;
export const jobSchema = z.object({
  version: z.literal(1), requestId: z.string().uuid(),
  status: z.enum(["running", "succeeded", "partial", "failed", "cancelled", "interrupted"]),
  components: z.array(componentSchema), startedAt: z.string(), finishedAt: z.string().optional(),
  output: z.string().max(24000), message: z.string(),
});
export type SetupJob = z.infer<typeof jobSchema>;
const checkSchema = z.object({ id: z.string(), label: z.string(), ready: z.boolean(), detail: z.string() });
export const inspectionSchema = z.object({
  directory: z.string(), gitRoot: z.string().nullable(), hookDirectory: z.string().nullable(),
  source: z.string(), configExists: z.boolean(), complete: z.boolean(),
  prerequisites: z.array(checkSchema), components: z.array(checkSchema),
  job: jobSchema.nullable(),
});
export type SetupInspection = z.infer<typeof inspectionSchema>;
export const setupInspect = defineRpc({ name: "setup.inspect", input: scopeSchema, output: inspectionSchema });
export const setupStart = defineRpc({ name: "setup.start", input: setupInputSchema, output: jobSchema });
export const setupStatus = defineRpc({ name: "setup.status", input: scopeSchema, output: jobSchema.nullable() });
export const setupCancel = defineRpc({ name: "setup.cancel", input: scopeSchema.extend({ requestId: z.string().uuid() }), output: jobSchema });
export const onboardingPrompt = `Read AGENTS.md and inspect this codebase as the existing primary agent / Tech Lead.
1. Derive the implemented capabilities into openspec/specs/ without inventing planned behavior.
2. Create or update docs/architecture.md with a diagram of the main modules and flows.
3. Record the important established architecture decisions under adr/, marking new retrospective records as retroactive. Preserve accepted ADRs; supersede them when necessary.
4. Report verified facts, gaps, and the checks you ran. Preserve existing project-specific instructions and documentation.
Work solo unless I explicitly request helpers. Do not commit or push without my instruction.`;
