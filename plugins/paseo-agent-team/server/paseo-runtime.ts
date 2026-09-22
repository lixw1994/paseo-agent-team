import type { PaseoApi } from "@getpaseo/client";
import { type Choices, configSchema } from "../shared/team";
import { memberPrompt, type Runtime } from "./team-service";

export function paseoRuntime(paseo: PaseoApi): Runtime {
  return {
    async directory(workspaceId) {
      const workspace = paseo.workspaces.ref(workspaceId);
      await workspace.refresh();
      const snapshot = workspace.current();
      if (!snapshot) throw new Error("The selected workspace is unavailable.");
      return snapshot.workspaceDirectory;
    },
    async choices() {
      const choices: Choices["choices"] = [], warnings: string[] = [];
      const available = await paseo.providers.listAvailable();
      if (available.error) warnings.push(available.error);
      const ids = new Set(available.providers.filter(item => item.available).map(item => item.provider));
      try {
        const { config } = await paseo.config.get();
        for (const profile of config.agentProfiles ?? []) {
          if (!ids.has(profile.provider)) continue;
          choices.push({ id: `profile:${profile.id}`, name: profile.name, notes: profile.notes ?? "",
            config: configSchema.parse({ ...profile, provider: profile.model ? `${profile.provider}/${profile.model}` : profile.provider }) });
        }
      } catch (error) { warnings.push(`Profiles unavailable: ${String(error)}`); }
      // Profiles are the preferred source; discover model choices when no usable profile exists.
      if (!choices.length) {
        for (const provider of ids) {
          try {
            const result = await paseo.providers.listModels(provider);
            if (result.error) { warnings.push(`${provider}: ${result.error}`); continue; }
            for (const model of result.models ?? []) {
              if (model.isSelectable === false) continue;
              const selection = `${provider}/${model.id}`;
              choices.push({ id: `model:${selection}`, name: `${provider} · ${model.label}`, notes: "Discovered model; provider defaults apply.", config: { provider: selection } });
            }
          } catch (error) { warnings.push(`${provider}: ${String(error)}`); }
        }
      }
      return { choices, warnings };
    },
    async createWorkspace(root, requestId) {
      const workspace = await paseo.workspaces.create({
        title: `Agent Team ${requestId.slice(0, 8)}`,
        source: { kind: "worktree", cwd: root, action: "branch-off", branchName: `agent-team/${requestId}`, worktreeSlug: `agent-team-${requestId}` },
      });
      return workspace.id;
    },
    async create(workspaceId, member, origin) {
      const agent = await paseo.workspaces.ref(workspaceId).agents.create({
        config: { ...member.config, systemPrompt: memberPrompt(member) },
        title: `Agent Team · ${member.role}`, prompt: member.task,
        labels: { "paseo-agent-team": origin, "team-request": member.requestId },
      });
      return agent.id;
    },
    async recover(requestId, workspaceId) {
      const result = await paseo.agents.list({ filter: { labels: { "paseo-agent-team": workspaceId, "team-request": requestId }, includeArchived: true }, page: { limit: 2 } });
      if (result.entries.length > 1) throw new Error("Multiple agents match this creation request; resolve the duplicate in Paseo.");
      const agent = result.entries[0]?.agent;
      return agent?.workspaceId ? { agentId: agent.id, workspaceId: agent.workspaceId } : undefined;
    },
    async inspect(agentId) {
      const handle = paseo.agents.ref(agentId), snapshot = await handle.refresh();
      if (!snapshot) return undefined;
      const agent = snapshot.agent;
      let output = "", error = agent.lastError;
      try {
        const timeline = await handle.timeline.refetch({ limit: 100 });
        output = timeline.entries.flatMap(entry => entry.item.type === "assistant_message" ? [entry.item.text] : []).join("\n\n");
      } catch (cause) { error = `Output unavailable: ${String(cause)}`; }
      return { status: agent.archivedAt ? "archived" : agent.pendingPermissions.length ? "needs-input" : agent.status, output, error };
    },
    async send(agentId, prompt) { await paseo.agents.ref(agentId).send(prompt); },
    async archive(agentId) { await paseo.agents.ref(agentId).archive(); },
  };
}
