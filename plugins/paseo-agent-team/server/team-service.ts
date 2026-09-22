import { realpath } from "node:fs/promises";
import { roles, roleSchema, startSchema, type Member, type StartInput, type TeamState, type Choices } from "../shared/team";
import { readState, saveState, workflow } from "./storage";

export interface Runtime {
  directory(workspaceId: string): Promise<string>;
  choices(): Promise<Choices>;
  createWorkspace(root: string, requestId: string): Promise<string>;
  create(workspaceId: string, member: Member, origin: string): Promise<string>;
  recover(requestId: string, workspaceId: string): Promise<{ agentId: string; workspaceId: string } | undefined>;
  inspect(agentId: string): Promise<{ status: string; output: string; error?: string } | undefined>;
  send(agentId: string, prompt: string): Promise<void>;
  archive(agentId: string): Promise<void>;
}
const workspaceLocks = new Map<string, Promise<unknown>>();
export class TeamService {
  private locks = workspaceLocks;
  constructor(private runtime: Runtime) {}
  private async locked<T>(workspaceId: string, action: (root: string) => Promise<T>): Promise<T> {
    const root = await realpath(await this.runtime.directory(workspaceId));
    const previous = this.locks.get(root) ?? Promise.resolve();
    const pending = previous.catch(() => {}).then(() => action(root));
    this.locks.set(root, pending);
    try { return await pending; } finally { if (this.locks.get(root) === pending) this.locks.delete(root); }
  }
  private async reconcile(member: Member, origin: string) {
    try {
      if (!member.agentId) {
        const found = await this.runtime.recover(member.requestId, origin);
        if (found) { member.agentId = found.agentId; member.workspaceId = found.workspaceId; }
        else { member.status = "unresolved"; member.error = "Creation was interrupted or failed. Check Paseo before starting a replacement."; return; }
      }
      const live = await this.runtime.inspect(member.agentId);
      if (!live) { member.status = "unavailable"; member.error = "Agent is not available on this host."; return; }
      member.status = live.status;
      if (live.output) member.output = live.output.slice(-16000);
      member.error = live.error;
    } catch (error) {
      member.status = member.agentId ? "unavailable" : "unresolved";
      member.error = String(error);
    }
  }
  async view(workspaceId: string) {
    return this.locked(workspaceId, async root => {
      const state = await readState(root);
      for (const member of state.members) await this.reconcile(member, workspaceId);
      if (state.members.length) await saveState(root, state);
      return { members: state.members, ...await workflow(root) };
    });
  }
  async start(input: StartInput) {
    input = startSchema.parse(input);
    if (input.role === "worker" && input.isolation !== "worktree") throw new Error("Worker tasks require an isolated worktree.");
    return this.locked(input.workspaceId, async root => {
      const state = await readState(root);
      const existing = state.members.find(member => member.requestId === input.requestId);
      if (existing) { await this.reconcile(existing, input.workspaceId); await saveState(root, state); return existing; }
      const choice = (await this.runtime.choices()).choices.find(item => item.id === input.choiceId);
      if (!choice) throw new Error("Selected profile/model is no longer available. Refresh the configuration choices.");
      const member: Member = { requestId: input.requestId, role: input.role, task: input.task,
        config: choice.config, isolation: input.isolation, createdAt: new Date().toISOString(), status: "creating", output: "" };
      state.members.push(member); await saveState(root, state);
      try {
        member.workspaceId = input.isolation === "worktree" ? await this.runtime.createWorkspace(root, input.requestId) : input.workspaceId;
        await saveState(root, state);
        member.agentId = await this.runtime.create(member.workspaceId, member, input.workspaceId);
        member.status = "initializing"; await saveState(root, state);
      } catch (error) {
        member.status = "unresolved"; member.error = String(error); await saveState(root, state);
      }
      return member;
    });
  }
  private async owned(workspaceId: string, requestId: string, action: (member: Member, state: TeamState, root: string) => Promise<void>) {
    return this.locked(workspaceId, async root => {
      const state = await readState(root), member = state.members.find(item => item.requestId === requestId);
      if (!member) throw new Error("This member does not belong to the selected team.");
      await this.reconcile(member, workspaceId);
      if (!member.agentId) throw new Error("Resolve the interrupted creation before managing this member.");
      await action(member, state, root);
      await saveState(root, state); return member;
    });
  }
  async followup(workspaceId: string, requestId: string, prompt: string) {
    await this.owned(workspaceId, requestId, async member => {
      if (["archived", "unavailable", "closed"].includes(member.status)) throw new Error("This member cannot accept follow-ups.");
      await this.runtime.send(member.agentId!, prompt); member.error = undefined;
    });
    return { accepted: true };
  }
  async archive(workspaceId: string, requestId: string) {
    return this.owned(workspaceId, requestId, async member => {
      await this.runtime.archive(member.agentId!); member.status = "archived"; member.error = undefined;
    });
  }
}
export function memberPrompt(member: Member) {
  const role = roles[roleSchema.parse(member.role)];
  return `You are the ${role.title} helper for a user-requested agent team. The existing primary agent is the Tech Lead; you are not the lead.
Read AGENTS.md and relevant OpenSpec/ADR context before work. Architecture, core development, maintenance, and all openspec/ and adr/ edits belong to the Tech Lead. Follow only your helper scope below.
${role.instructions}
Do not launch further agents. Do not commit or merge without an explicit user request. The Tech Lead personally reviews your result before integration.
If the task lacks the context, concrete requirements, expected output, or acceptance criteria needed to proceed, report what is missing before making changes.
Task:
${member.task}`;
}
