import { type PluginWorkspacePanelProps, useRpc, useWorkspace } from "@getpaseo/plugin/client";
import { Icon } from "@getpaseo/plugin/client/react-native";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { memberRoleTitle, roles, teamArchive, teamFollowup, teamView, type Member } from "../shared/team";
import { MemberComposer } from "./member-composer";
import { SetupPanel } from "./setup-panel";
import { Badge, Button, Card, Disclosure, Notice, PanelTheme, row, useUi } from "./ui";

export function TeamPanel(props: PluginWorkspacePanelProps) {
  return <PanelTheme value={props.theme}><TeamWorkspace key={props.workspaceId} {...props} /></PanelTheme>;
}

function TeamWorkspace({ workspaceId, layout, navigation }: PluginWorkspacePanelProps) {
  const name = useWorkspace(workspaceId, workspace => workspace.name);
  const { c, text, muted } = useUi();
  const read = useRpc(teamView);
  const view = useQuery({ queryKey: ["agent-team", workspaceId], queryFn: () => read({ workspaceId }) });
  const [tab, setTab] = useState<"team" | "project">("team");
  const [width, setWidth] = useState(0);
  const [composer, setComposer] = useState(false);
  const [archived, setArchived] = useState(false);
  const [message, setMessage] = useState("");
  const scroll = useRef<ScrollView>(null);
  const narrow = layout.compact || width < 600;
  const members = view.data?.members ?? [];
  const active = members.filter(member => member.status !== "archived");
  const history = members.filter(member => member.status === "archived");
  const visible = archived ? history : active;
  const running = active.filter(member => ["running", "initializing"].includes(member.status)).length;
  const switchTab = (value: typeof tab) => { setTab(value); scroll.current?.scrollTo({ y: 0, animated: false }); };
  const openComposer = () => { setComposer(true); setTab("team"); setMessage(""); scroll.current?.scrollTo({ y: 0, animated: true }); };
  const refresh = () => { void view.refetch(); };
  return <View onLayout={event => setWidth(event.nativeEvent.layout.width)} style={{ flex: 1, backgroundColor: c.surface0 }}>
    <View style={{ paddingHorizontal: narrow ? 16 : 28, paddingTop: 20, borderBottomWidth: 1, borderColor: c.border }}>
      <View style={{ width: "100%", maxWidth: 920, alignSelf: "center", gap: 16 }}>
        <View style={{ ...row, justifyContent: "space-between" }}>
          <View style={{ flex: 1, minWidth: 120, gap: 3 }}>
            <Text accessibilityRole="header" style={{ ...text, fontSize: 22, lineHeight: 28, fontWeight: "600", letterSpacing: -0.5 }}>Agent Team</Text>
            <Text numberOfLines={1} style={muted}>{name ?? "Workspace"}</Text>
          </View>
          {tab === "team" && !composer && active.length ? <Button label="New member" icon="Plus" primary onPress={openComposer} disabled={!view.data?.workflowInstalled} /> : null}
        </View>
        <View accessibilityRole="tablist" style={{ flexDirection: "row", gap: 24 }}>
          {([{ id: "team", title: "Team", icon: "Users" }, { id: "project", title: "Project", icon: "FolderCog" }] as const).map(item => <Pressable key={item.id}
            accessibilityRole="tab" accessibilityLabel={item.title} aria-selected={tab === item.id} onPress={() => switchTab(item.id)}
            style={{ minHeight: 44, flexDirection: "row", alignItems: "center", gap: 7, borderBottomWidth: 2, borderBottomColor: tab === item.id ? c.accent : "transparent", paddingBottom: 2 }}>
            <Icon name={item.icon} size={16} color={tab === item.id ? c.foreground : c.foregroundMuted} />
            <Text style={{ ...text, fontWeight: tab === item.id ? "600" : "400", color: tab === item.id ? c.foreground : c.foregroundMuted }}>{item.title}</Text>
            {item.id === "team" && active.length ? <Text style={{ ...muted, fontSize: 12 }}>{active.length}</Text> : null}
          </Pressable>)}
        </View>
      </View>
    </View>
    <ScrollView ref={scroll} keyboardShouldPersistTaps="handled" style={{ flex: 1 }} contentContainerStyle={{ padding: narrow ? 16 : 28, paddingBottom: 40 }}>
      <View style={{ width: "100%", maxWidth: 920, alignSelf: "center", gap: 20 }}>
        {view.error ? <Notice error>{String(view.error)}</Notice> : null}
        <View style={{ display: tab === "team" ? "flex" : "none", gap: 20 }}>
          {view.isPending ? <Text style={muted}>Loading team…</Text> : null}
          {view.data && !view.data.workflowInstalled ? <View style={{ padding: 16, borderRadius: 10, backgroundColor: c.surface1, gap: 10 }}>
            <Text style={{ ...text, fontWeight: "600" }}>Set up this project first</Text>
            <Text style={muted}>Install the engineering workflow, then add a helper when you need one.</Text>
            <View style={row}><Button label="Set up project" icon="ArrowRight" onPress={() => switchTab("project")} /></View>
          </View> : null}
          {message ? <Notice>{message}</Notice> : null}
          <MemberComposer workspaceId={workspaceId} open={composer} narrow={narrow} ready={Boolean(view.data?.workflowInstalled)} onClose={() => setComposer(false)} onCreated={value => { setMessage(value); setArchived(false); refresh(); }} />
          <View style={{ ...row, justifyContent: "space-between" }}>
            <View style={{ gap: 2 }}>
              <Text accessibilityRole="header" style={{ ...text, fontSize: 16, fontWeight: "600" }}>{archived ? "Archived members" : "Members"}</Text>
              <Text style={muted}>{archived ? `${history.length} retained for review` : active.length ? `${active.length} members${running ? ` · ${running} running` : ""}` : "Add members with clear, ongoing responsibilities."}</Text>
            </View>
            <View style={row}>
              {history.length ? <Button label={archived ? "Active members" : `Archived (${history.length})`} quiet onPress={() => setArchived(!archived)} /> : null}
              <Button label={view.isFetching ? "Refreshing…" : "Refresh team"} icon="RefreshCw" quiet onPress={refresh} disabled={view.isFetching} />
            </View>
          </View>
          {!view.isPending && !view.error && !visible.length && !composer ? <View style={{ alignItems: "center", paddingHorizontal: 20, paddingVertical: narrow ? 32 : 48, gap: 16, borderWidth: 1, borderColor: c.border, borderRadius: 12 }}>
            <View style={{ padding: 14, backgroundColor: c.surface1, borderRadius: 14 }}><Icon name="Users" size={26} color={c.foregroundMuted} /></View>
            <View style={{ maxWidth: 370, gap: 8 }}>
              <Text style={{ ...text, textAlign: "center", fontSize: 18, fontWeight: "600" }}>{archived ? "No archived members" : "Give each member a role"}</Text>
              <Text style={{ ...muted, textAlign: "center" }}>{archived ? "Archived conversations and results stay available here." : "Choose a built-in role or define your own. Create the member, then assign work in its conversation."}</Text>
            </View>
            {!archived ? <Button label="Add first member" icon="Plus" primary onPress={openComposer} disabled={!view.data?.workflowInstalled} /> : null}
          </View> : null}
          {[...visible].reverse().map(member => <MemberCard key={member.requestId} member={member} workspaceId={workspaceId} navigation={navigation} onChanged={value => { setMessage(value); refresh(); }} />)}
          <View style={{ borderTopWidth: 1, borderColor: c.border, paddingTop: 12 }}>
            <Disclosure title="How this team works">
              <Text style={muted}>Your existing primary agent is Tech Lead: it owns architecture, core code, OpenSpec/ADR, and final review. Members hold ongoing roles and work on assignments you send. Opening this panel starts no agents.</Text>
              <Text style={muted}>Choose a built-in role or define a Custom helper. Save reusable configurations as Presets. Creating a member sends no assignment; use its conversation or Message action to give it work. Review results before integration.</Text>
            </Disclosure>
          </View>
        </View>
        <View style={{ display: tab === "project" ? "flex" : "none", gap: 20 }}>
          <SetupPanel workspaceId={workspaceId} narrow={narrow} onChanged={refresh} />
          <Card>
            <View style={{ ...row, justifyContent: "space-between" }}>
              <Text accessibilityRole="header" style={{ ...text, fontSize: 16, fontWeight: "600" }}>OpenSpec changes</Text>
              <Button label="Refresh changes" icon="RefreshCw" quiet onPress={refresh} disabled={view.isFetching} />
            </View>
            {view.data?.changes.map(change => <View key={change.name} style={{ gap: 8 }}>
              <View style={{ ...row, justifyContent: "space-between" }}><Text style={{ ...text, flex: 1 }}>{change.name}</Text><Text style={muted}>{change.complete}/{change.total} tasks</Text></View>
              <View accessibilityRole="progressbar" accessibilityLabel={change.name} aria-valuemin={0} aria-valuemax={Math.max(1, change.total)} aria-valuenow={change.complete} style={{ height: 4, backgroundColor: c.surface2, borderRadius: 2, overflow: "hidden" }}>
                <View style={{ height: 4, width: `${change.total ? Math.min(100, change.complete / change.total * 100) : 0}%`, backgroundColor: c.accent }} />
              </View>
            </View>)}
            {!view.data?.changes.length ? <Text style={muted}>{view.isPending ? "Loading changes…" : view.data?.workflowInstalled ? "No active changes. Start a change with your primary agent when you are ready." : "Project setup makes the engineering workflow available here."}</Text> : null}
          </Card>
        </View>
      </View>
    </ScrollView>
  </View>;
}

function MemberCard({ member, workspaceId, navigation, onChanged }: {
  member: Member; workspaceId: string; navigation: PluginWorkspacePanelProps["navigation"]; onChanged: (message: string) => void;
}) {
  const { c, text, muted, field } = useUi();
  const follow = useRpc(teamFollowup), archive = useRpc(teamArchive);
  const [expanded, setExpanded] = useState(false);
  const [reply, setReply] = useState(false);
  const [prompt, setPrompt] = useState("");
  const action = useMutation({
    mutationFn: async (kind: "follow" | "archive") => {
      if (kind === "archive") await archive({ workspaceId, requestId: member.requestId });
      else await follow({ workspaceId, requestId: member.requestId, prompt });
      return kind;
    },
    onSuccess: kind => {
      if (kind === "follow") { setPrompt(""); setReply(false); }
      onChanged(kind === "archive" ? "Member archived. Its worktree is retained for review and integration." : "Message sent.");
    },
  });
  const running = ["running", "initializing"].includes(member.status);
  const tone = running ? "active" : ["error", "failed"].includes(member.status) ? "danger" : ["unresolved", "needs_input", "needs-input"].includes(member.status) ? "warning" : "neutral";
  const builtinRole = member.role === "custom" ? undefined : roles[member.role];
  const responsibilities = member.customRole?.instructions || builtinRole?.summary;
  return <Card>
    <View style={{ ...row, justifyContent: "space-between" }}>
      <Text style={{ ...text, fontWeight: "600", flex: 1 }}>{memberRoleTitle(member.role, member.customRole?.name)}</Text>
      <Badge label={member.status.replaceAll("_", " ")} tone={tone} />
    </View>
    <View style={{ gap: 6 }}>
      <Text selectable numberOfLines={expanded ? undefined : 3} style={text}>{responsibilities || "No standing responsibilities added."}</Text>
      <Text style={muted}>{member.role === "custom" ? "Custom · " : ""}{member.config.provider} · {member.isolation === "worktree" ? "Separate worktree" : "Current workspace"}</Text>
    </View>
    {member.error ? <Notice error>{member.error}</Notice> : null}
    {member.output ? <View style={{ padding: 12, borderRadius: 8, backgroundColor: c.surface1, gap: 6 }}>
      <Text style={{ ...muted, fontSize: 11, fontWeight: "600", letterSpacing: 0.7 }}>LATEST OUTPUT</Text>
      {expanded ? <ScrollView nestedScrollEnabled style={{ maxHeight: 320 }}><Text selectable style={muted}>{member.output}</Text></ScrollView> : <Text selectable numberOfLines={3} style={muted}>{member.output}</Text>}
    </View> : <Text style={muted}>{member.status === "idle" ? "Ready for work. Open the conversation or send a message to assign it." : "No output collected. Refresh the team or open the conversation."}</Text>}
    <View style={row}>
      {member.agentId && navigation ? <Button label="Open conversation" icon="MessageSquare" onPress={() => navigation.openAgent({ agentId: member.agentId! })} /> : null}
      {member.agentId && member.status !== "archived" ? <Button label={reply ? "Close message" : "Message"} quiet onPress={() => setReply(!reply)} disabled={action.isPending} /> : null}
      <Pressable accessibilityRole="button" accessibilityLabel={expanded ? "Hide member details" : "Show member details"} aria-expanded={expanded} onPress={() => setExpanded(!expanded)} style={{ ...row, flexWrap: "nowrap", minHeight: 44, paddingHorizontal: 8 }}>
        <Text style={muted}>{expanded ? "Less" : "Details"}</Text><Icon name={expanded ? "ChevronUp" : "ChevronDown"} size={14} color={c.foregroundMuted} />
      </Pressable>
    </View>
    {reply && member.status !== "archived" ? <View style={{ gap: 10 }}>
      <TextInput accessibilityLabel={`Message for ${memberRoleTitle(member.role, member.customRole?.name)}`} placeholder="Assign work or ask a question…" placeholderTextColor={c.foregroundMuted} multiline value={prompt} onChangeText={setPrompt} editable={!action.isPending} maxLength={16000} style={{ ...field, minHeight: 88, textAlignVertical: "top" }} />
      <View style={row}><Button label={action.isPending ? "Sending…" : "Send message"} icon="Send" primary onPress={() => action.mutate("follow")} disabled={action.isPending || !prompt.trim()} /></View>
    </View> : null}
    {expanded ? <View style={{ gap: 10, paddingTop: 12, borderTopWidth: 1, borderColor: c.border }}>
      {member.customRole || builtinRole ? <View style={{ gap: 6 }}>
        <Text style={{ ...text, fontWeight: "600" }}>Role responsibilities</Text>
        <ScrollView nestedScrollEnabled style={{ maxHeight: 200 }}><Text selectable style={muted}>{member.customRole ? member.customRole.instructions || "No standing responsibilities added. Shared team rules apply." : builtinRole?.instructions}</Text></ScrollView>
      </View> : null}
      <Text style={muted}>Created {new Date(member.createdAt).toLocaleString()}</Text>
      <View style={row}>
        {member.workspaceId && member.workspaceId !== workspaceId && navigation ? <Button label="Open worktree" icon="GitBranch" onPress={() => navigation.openWorkspace({ workspaceId: member.workspaceId! })} /> : null}
        {member.agentId && member.status !== "archived" ? <Button label={running ? "Stop and archive member" : "Archive member"} icon="Archive" onPress={() => action.mutate("archive")} disabled={action.isPending} /> : null}
      </View>
    </View> : null}
    {action.error ? <Notice error>{String(action.error)}</Notice> : null}
  </Card>;
}
