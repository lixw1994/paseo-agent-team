import { randomUUID } from "node:crypto";
import type { PluginServerContext } from "@getpaseo/plugin/server";
import { teamArchive, teamChoices, teamFollowup, teamStart, teamView, teamRequest } from "./shared/team";
import { paseoRuntime } from "./server/paseo-runtime";
import { TeamService } from "./server/team-service";

export default function contribute(server: PluginServerContext) {
  server.handle(teamRequest, () => ({ requestId: randomUUID() }));
  server.handle(teamChoices, async (_, { paseo }) => paseoRuntime(paseo).choices());
  server.handle(teamView, async ({ workspaceId }, { paseo }) => new TeamService(paseoRuntime(paseo)).view(workspaceId));
  server.handle(teamStart, async (input, { paseo }) => new TeamService(paseoRuntime(paseo)).start(input));
  server.handle(teamFollowup, async ({ workspaceId, requestId, prompt }, { paseo }) => new TeamService(paseoRuntime(paseo)).followup(workspaceId, requestId, prompt));
  server.handle(teamArchive, async ({ workspaceId, requestId }, { paseo }) => new TeamService(paseoRuntime(paseo)).archive(workspaceId, requestId));
  return () => {};
}
