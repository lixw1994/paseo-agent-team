import { defineRpc } from "@getpaseo/plugin";
import { z } from "zod";
import { customRoleSchema, scopeSchema } from "./team";

export const templateDraftSchema = z.object({
  id: z.string().uuid(), customRole: customRoleSchema,
  choiceId: z.string().trim().min(1).max(500), isolation: z.enum(["shared", "worktree"]),
});
export const templateSchema = templateDraftSchema.extend({ updatedAt: z.string().datetime() });
export type MemberTemplate = z.infer<typeof templateSchema>;
export const templateStateSchema = z.object({ version: z.literal(1), templates: z.array(templateSchema).max(100)
  .refine(items => new Set(items.map(item => item.id)).size === items.length, "Duplicate template ID") });
export const templateSaveSchema = scopeSchema.extend(templateDraftSchema.shape).strict();
export type TemplateSaveInput = z.infer<typeof templateSaveSchema>;
export const templateDeleteSchema = scopeSchema.extend({ id: z.string().uuid() }).strict();
export const templateList = defineRpc({ name: "templates.list", input: scopeSchema, output: z.array(templateSchema) });
export const templateSave = defineRpc({ name: "templates.save", input: templateSaveSchema, output: templateSchema });
export const templateDelete = defineRpc({ name: "templates.delete", input: templateDeleteSchema, output: z.object({ deleted: z.boolean() }) });
