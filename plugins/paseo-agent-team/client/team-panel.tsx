import { type PluginWorkspacePanelProps, useRpc, useWorkspace } from "@getpaseo/plugin/client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { roles, memberRoleTitle, teamArchive, teamChoices, teamFollowup, teamRequest, teamStart, teamView, type Member } from "../shared/team";

export function TeamPanel({ workspaceId, theme, layout, navigation }: PluginWorkspacePanelProps) {
  const name = useWorkspace(workspaceId, workspace => workspace.name);
  const read = useRpc(teamView), choices = useRpc(teamChoices), start = useRpc(teamStart);
  const follow = useRpc(teamFollowup), archive = useRpc(teamArchive), request = useRpc(teamRequest);
  const view = useQuery({ queryKey: ["agent-team", workspaceId], queryFn: () => read({ workspaceId }) });
  const configuration = useQuery({ queryKey: ["agent-team-choices"], queryFn: () => choices({}) });
  const [role, setRole] = useState<keyof typeof roles>("researcher");
  const [choiceId, setChoiceId] = useState("");
  const [choiceSearch, setChoiceSearch] = useState("");
  const [task, setTask] = useState("");
  const [isolated, setIsolated] = useState(false);
  const [followups, setFollowups] = useState<Record<string, string>>({});
  const pending = useRef<{ signature: string; requestId: string } | null>(null);
  const [actionMessage, setActionMessage] = useState("");
  const creation = useMutation({
    mutationFn: async () => {
      const isolation = role === "worker" || isolated ? "worktree" as const : "shared" as const;
      const signature = JSON.stringify({ workspaceId, role, task, choiceId, isolation });
      if (pending.current?.signature !== signature) pending.current = { signature, ...(await request({})) };
      return start({ workspaceId, role, task, choiceId, isolation, requestId: pending.current.requestId });
    },
    onSuccess: member => {
      if (member.agentId) { pending.current = null; setTask(""); setActionMessage("Member started. Open its conversation or refresh to collect progress."); }
      else setActionMessage("Creation is unresolved. Refresh to recover; retrying this same request will not launch a duplicate.");
      void view.refetch();
    },
  });
  const action = useMutation({
    mutationFn: async ({ member, kind }: { member: Member; kind: "follow" | "archive" }) => {
      if (kind === "archive") await archive({ workspaceId, requestId: member.requestId });
      else await follow({ workspaceId, requestId: member.requestId, prompt: followups[member.requestId] ?? "" });
      return { member, kind };
    },
    onSuccess: ({ member, kind }) => {
      if (kind === "follow") setFollowups(values => ({ ...values, [member.requestId]: "" }));
      setActionMessage(kind === "archive" ? "Member archived. Its worktree is retained for review and integration." : "Follow-up sent.");
      void view.refetch();
    },
  });
  const colors = theme.colors;
  const text = { color: colors.foreground, fontSize: 14 };
  const muted = { color: colors.foregroundMuted, fontSize: 13 };
  const field = { color: colors.foreground, backgroundColor: colors.surface0, borderColor: colors.border, borderWidth: 1, borderRadius: 8, padding: 12, minHeight: 44 };
  const busy = creation.isPending || action.isPending;
  const button = (label: string, onPress: () => void, disabled = false, selected = false) => (
    <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled, selected }} disabled={disabled} onPress={onPress}
      style={{ padding: 12, borderRadius: 8, borderWidth: 1, borderColor: selected ? colors.accent : colors.border, backgroundColor: selected ? colors.accent : colors.surface0, opacity: disabled ? 0.5 : 1 }}>
      <Text style={{ color: selected ? colors.accentForeground : colors.foreground, fontSize: 14 }}>{label}</Text>
    </Pressable>
  );
  const options = configuration.data?.choices ?? [];
  const matchingOptions = options.filter(choice => `${choice.name} ${choice.config.provider} ${choice.notes}`.toLowerCase().includes(choiceSearch.trim().toLowerCase()));
  const selectedChoice = options.find(choice => choice.id === choiceId);
  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.surface0 }} contentContainerStyle={{ padding: layout.compact ? 16 : 24, gap: 18 }}>
      <View style={{ gap: 6 }}>
        <Text style={{ ...text, fontSize: 24, fontWeight: "600" }}>Agent Team</Text>
        <Text style={muted}>{name ?? "Workspace"} · OpenSpec workflow with on-demand helpers</Text>
        <Text style={muted}>Opening this panel starts no agents. Choose one member and a bounded task when you need help.</Text>
        <Text style={muted}>Tech Lead: your existing primary agent owns architecture, core code, OpenSpec/ADR, and final review. Researcher and Writer keep bulky context separate; use Worker sparingly for simple chores.</Text>
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {button(view.isFetching ? "Refreshing…" : "Refresh team", () => { void view.refetch(); }, view.isFetching || busy)}
        {button("Refresh profiles", () => { void configuration.refetch(); }, configuration.isFetching || busy)}
      </View>
      {[view.error, configuration.error, creation.error, action.error].filter(Boolean).map((error, index) => <Text key={index} accessibilityRole="alert" style={text}>{String(error)}</Text>)}
      {actionMessage ? <Text accessibilityRole="alert" style={text}>{actionMessage}</Text> : null}
      <View style={{ gap: 8 }}>
        <Text style={{ ...text, fontWeight: "600" }}>Engineering workflow</Text>
        {view.isPending ? <Text style={muted}>Loading workspace…</Text> : !view.data?.workflowInstalled ? <Text style={muted}>Initialize the standalone workflow with this repository's init.sh before engineering work.</Text> : null}
        {view.data?.changes.map(change => <Text key={change.name} style={text}>{change.name} · {change.complete}/{change.total} tasks</Text>)}
        {view.data?.workflowInstalled && !view.data.changes.length ? <Text style={muted}>No active OpenSpec changes.</Text> : null}
      </View>
      <View style={{ gap: 10 }}>
        <Text style={{ ...text, fontWeight: "600" }}>Start a member</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {(Object.keys(roles) as (keyof typeof roles)[]).map(value => <View key={value}>{button(roles[value].title, () => setRole(value), busy, role === value)}</View>)}
        </View>
        <Text style={text}>{roles[role].summary}</Text>
        <Text style={muted}>{roles[role].instructions}</Text>
        <Text style={muted}>Prior preference: {roles[role].configurationHint}. Select a compatible Paseo profile/model below; this preference does not apply settings automatically.</Text>
        <Text style={text}>Agent profile</Text>
        {configuration.isPending ? <Text style={muted}>Loading configured profiles…</Text> : !options.length ? <Text style={muted}>No usable profiles or models. Configure a provider in Paseo, then refresh.</Text> : null}
        {options.length ? <>
          <TextInput accessibilityLabel="Search profiles and models" placeholder="Search profiles and models" placeholderTextColor={colors.foregroundMuted} value={choiceSearch} onChangeText={setChoiceSearch} style={field} />
          <Text style={muted}>{selectedChoice ? `Selected: ${selectedChoice.name}` : "Select a profile or model"} · {matchingOptions.length} matches</Text>
          <ScrollView nestedScrollEnabled style={{ maxHeight: layout.compact ? 220 : 300 }} contentContainerStyle={{ gap: 8 }}>
            {matchingOptions.map(choice => <View key={choice.id} style={{ gap: 4 }}>{button(choice.name, () => setChoiceId(choice.id), busy, choiceId === choice.id)}<Text style={muted}>{choice.config.provider}{choice.notes ? ` · ${choice.notes}` : ""}</Text></View>)}
          </ScrollView>
        </> : null}
        {configuration.data?.warnings.map((warning, index) => <Text key={index} style={muted}>{warning}</Text>)}
        {role === "worker" ? <Text style={muted}>Worker uses an isolated worktree for simple chores. Return complex work to the Tech Lead.</Text> :
          button(isolated ? "Isolation: separate worktree" : role === "writer" ? "Isolation: current workspace (docs/ edits only)" : "Isolation: current workspace (external research only)", () => setIsolated(value => !value), busy)}
        {role === "worker" || isolated ? <Text style={muted}>The worktree starts from the current branch. Commit required input changes before launching; uncommitted files are not copied. Review and merge manually.</Text> : null}
        <Text style={muted}>Role scopes are instructions; actual access follows the selected provider/profile permissions.</Text>
        <TextInput accessibilityLabel="Member task" placeholder="Include context, requirements, expected output, and acceptance criteria" placeholderTextColor={colors.foregroundMuted} multiline value={task} onChangeText={setTask} editable={!busy} style={{ ...field, minHeight: 110, textAlignVertical: "top" }} />
        {button(creation.isPending ? "Starting…" : "Start selected member", () => { setActionMessage(""); creation.mutate(); }, busy || !task.trim() || !options.some(choice => choice.id === choiceId) || !view.data?.workflowInstalled, true)}
      </View>
      <View style={{ gap: 14 }}>
        <Text style={{ ...text, fontSize: 18, fontWeight: "600" }}>Members</Text>
        {!view.data?.members.length ? <Text style={muted}>No members yet. Your standalone workflow is ready to use solo.</Text> : null}
        {view.data?.members.map(member => (
          <View key={member.requestId} style={{ gap: 10, borderWidth: 1, borderColor: colors.border, padding: 14, borderRadius: 10 }}>
            <Text style={{ ...text, fontWeight: "600" }}>{memberRoleTitle(member.role)} · {member.status}</Text>
            <Text style={muted}>{member.config.provider} · {member.isolation === "worktree" ? "isolated worktree" : "current workspace"}</Text>
            <Text selectable style={text}>{member.task}</Text>
            {member.error ? <Text accessibilityRole="alert" style={text}>{member.error}</Text> : null}
            {member.output ? <Text selectable style={text}>{member.output}</Text> : <Text style={muted}>No assistant output collected yet.</Text>}
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {member.agentId && navigation ? button("Open conversation", () => navigation.openAgent({ agentId: member.agentId! })) : null}
              {member.workspaceId && member.workspaceId !== workspaceId && navigation ? button("Open worktree", () => navigation.openWorkspace({ workspaceId: member.workspaceId! })) : null}
            </View>
            {member.agentId && member.status !== "archived" ? <>
              <TextInput accessibilityLabel={`Follow-up for ${member.role}`} placeholder="Ask for clarification or the next bounded task" placeholderTextColor={colors.foregroundMuted} multiline value={followups[member.requestId] ?? ""} onChangeText={value => setFollowups(previous => ({ ...previous, [member.requestId]: value }))} editable={!busy} style={field} />
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {button("Send follow-up", () => action.mutate({ member, kind: "follow" }), busy || !followups[member.requestId]?.trim())}
                {button(["running", "initializing"].includes(member.status) ? "Stop and archive member" : "Archive member", () => action.mutate({ member, kind: "archive" }), busy)}
              </View>
            </> : null}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
