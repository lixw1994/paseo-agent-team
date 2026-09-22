import { randomUUID } from "node:crypto";
import type { PluginServerContext } from "@getpaseo/plugin/server";
import { teamArchive, teamChoices, teamFollowup, teamStart, teamView, teamRequest } from "./shared/team";
import { paseoRuntime } from "./server/paseo-runtime";
import { TeamService } from "./server/team-service";
import type { PaseoApi } from "@getpaseo/client";
import { SetupService } from "./server/setup-service";
import { setupCancel, setupInspect, setupStart, setupStatus } from "./shared/setup";
import { templateDelete, templateList, templateSave } from "./shared/templates";
import { TemplateService } from "./server/template-service";

export default function contribute(server: PluginServerContext) {
  let setup: SetupService | undefined;
  const setupService = (paseo: PaseoApi) => setup ??= new SetupService(workspaceId => paseoRuntime(paseo).directory(workspaceId));
  server.handle(setupInspect, ({ workspaceId }, { paseo }) => setupService(paseo).inspect(workspaceId));
  server.handle(setupStart, (input, { paseo }) => setupService(paseo).start(input));
  server.handle(setupStatus, ({ workspaceId }, { paseo }) => setupService(paseo).status(workspaceId));
  server.handle(setupCancel, ({ workspaceId, requestId }, { paseo }) => setupService(paseo).cancel(workspaceId, requestId));
  server.handle(teamRequest, () => ({ requestId: randomUUID() }));
  server.handle(templateList, ({ workspaceId }, { paseo }) => new TemplateService(paseoRuntime(paseo)).list(workspaceId));
  server.handle(templateSave, (input, { paseo }) => new TemplateService(paseoRuntime(paseo)).save(input));
  server.handle(templateDelete, (input, { paseo }) => new TemplateService(paseoRuntime(paseo)).delete(input));
  server.handle(teamChoices, async (_, { paseo }) => paseoRuntime(paseo).choices());
  server.handle(teamView, async ({ workspaceId }, { paseo }) => new TeamService(paseoRuntime(paseo)).view(workspaceId));
  server.handle(teamStart, async (input, { paseo }) => new TeamService(paseoRuntime(paseo)).start(input));
  server.handle(teamFollowup, async ({ workspaceId, requestId, prompt }, { paseo }) => new TeamService(paseoRuntime(paseo)).followup(workspaceId, requestId, prompt));
  server.handle(teamArchive, async ({ workspaceId, requestId }, { paseo }) => new TeamService(paseoRuntime(paseo)).archive(workspaceId, requestId));
  return () => setup?.dispose();
}
