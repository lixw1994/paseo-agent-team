import { defineRpc } from "@getpaseo/plugin";
import { z } from "zod";

export { roles, memberRoleTitle } from "./roles";
export const roleSchema = z.enum(["researcher", "writer", "worker", "custom"]);
export type Role = z.infer<typeof roleSchema>;
export const customRoleSchema = z.object({
  name: z.string().trim().min(1).max(80).regex(/^[^\r\n\t]+$/, "Use a single-line role name"),
  instructions: z.string().trim().max(8000).optional(),
});
export type CustomRole = z.infer<typeof customRoleSchema>;
function validateCustomRole(value: { role: string; customRole?: CustomRole }, context: z.RefinementCtx) {
  if (value.role === "custom" && !value.customRole) context.addIssue({ code: "custom", path: ["customRole"], message: "Custom members require a role name" });
  if (value.role !== "custom" && value.customRole) context.addIssue({ code: "custom", path: ["customRole"], message: "Custom responsibilities cannot override a preset role" });
}
export const configSchema = z.object({
  provider: z.string().min(1), modeId: z.string().optional(),
  thinkingOptionId: z.string().optional(), featureValues: z.record(z.string(), z.unknown()).optional(),
});
export const memberSchema = z.object({
  requestId: z.string().min(1), role: roleSchema, customRole: customRoleSchema.optional(),
  config: configSchema, isolation: z.enum(["shared", "worktree"]),
  createdAt: z.string(), agentId: z.string().optional(), workspaceId: z.string().optional(),
  status: z.string(), output: z.string().default(""), error: z.string().optional(),
}).strict().superRefine(validateCustomRole);
export const stateSchema = z.object({ version: z.literal(1), members: z.array(memberSchema).max(200) });
export type Member = z.infer<typeof memberSchema>;
export type TeamState = z.infer<typeof stateSchema>;
export const scopeSchema = z.object({ workspaceId: z.string().min(1) });
export const startSchema = scopeSchema.extend({
  requestId: z.string().uuid(), role: roleSchema,
  customRole: customRoleSchema.optional(),
  choiceId: z.string().min(1), isolation: z.enum(["shared", "worktree"]),
}).strict().superRefine(validateCustomRole);
export type StartInput = z.infer<typeof startSchema>;
export const viewSchema = z.object({
  members: z.array(memberSchema),
  changes: z.array(z.object({ name: z.string(), complete: z.number(), total: z.number() })),
  workflowInstalled: z.boolean(),
});
export const teamView = defineRpc({ name: "team.view", input: scopeSchema, output: viewSchema });
export const choicesSchema = z.object({
  choices: z.array(z.object({ id: z.string(), name: z.string(), notes: z.string(), config: configSchema })),
  warnings: z.array(z.string()),
});
export type Choices = z.infer<typeof choicesSchema>;
export const teamChoices = defineRpc({ name: "team.choices", input: z.object({}), output: choicesSchema });
export const teamStart = defineRpc({ name: "team.start", input: startSchema, output: memberSchema });
export const memberInput = scopeSchema.extend({ requestId: z.string().min(1) });
export const teamFollowup = defineRpc({ name: "team.followup", input: memberInput.extend({ prompt: z.string().trim().min(1).max(16000) }), output: z.object({ accepted: z.boolean() }) });
export const teamArchive = defineRpc({ name: "team.archive", input: memberInput, output: memberSchema });

export const teamRequest = defineRpc({ name: "team.request", input: z.object({}), output: z.object({ requestId: z.string().uuid() }) });
