import type { PluginClientContext } from "@getpaseo/plugin/client";
import { TeamPanel } from "./client/team-panel";

export default function contribute(client: PluginClientContext) {
  client.addWorkspacePanel({ id: "agent-team", title: "Agent Team", icon: "Users", context: "workspace", locations: ["workspace", "explorer"], Component: TeamPanel });
  client.addCommandCenterItem({ id: "open-agent-team", title: "Open Agent Team", icon: "Users", context: "workspace", onSelect({ openPanel }) { openPanel("agent-team"); } });
  client.addSlashCommand({ name: "agent-team", description: "Open the on-demand Agent Team panel", context: "workspace", argumentHint: "", onSubmit({ openPanel }) { openPanel("agent-team"); } });
  return () => {};
}
