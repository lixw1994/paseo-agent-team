import { useRpc } from "@getpaseo/plugin/client";
import { Icon } from "@getpaseo/plugin/client/react-native";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { customRoleSchema, memberRoleTitle, roles, teamChoices, teamRequest, teamStart, type Role } from "../shared/team";
import { templateDelete, templateList, templateSave, type MemberTemplate } from "../shared/templates";
import { Badge, Button, Card, Disclosure, Notice, row, useUi } from "./ui";

const roleDetails = {
  researcher: { icon: "Search", short: "External research" },
  writer: { icon: "FileText", short: "Documentation" },
  worker: { icon: "Wrench", short: "Bounded code tasks" },
  custom: { icon: "SlidersHorizontal", short: "Your own helper" },
};

export function MemberComposer({ workspaceId, open, narrow, ready, onClose, onCreated }: {
  workspaceId: string; open: boolean; narrow: boolean; ready: boolean; onClose: () => void; onCreated: (message: string) => void;
}) {
  const { c, text, muted, label, field } = useUi();
  const choices = useRpc(teamChoices), start = useRpc(teamStart), request = useRpc(teamRequest);
  const listTemplates = useRpc(templateList), saveTemplate = useRpc(templateSave), deleteTemplate = useRpc(templateDelete);
  const configuration = useQuery({ queryKey: ["agent-team-choices"], queryFn: () => choices({}), enabled: open });
  const [role, setRole] = useState<Role>("researcher");
  const [customName, setCustomName] = useState("");
  const [responsibilities, setResponsibilities] = useState("");
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [templateMessage, setTemplateMessage] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const templates = useQuery({ queryKey: ["agent-team-templates", workspaceId], queryFn: () => listTemplates({ workspaceId }), enabled: open && role === "custom" });
  const [choiceId, setChoiceId] = useState("");
  const [search, setSearch] = useState("");
  const [picker, setPicker] = useState(false);
  const [isolated, setIsolated] = useState(false);
  const [message, setMessage] = useState("");
  const pending = useRef<{ signature: string; requestId: string } | null>(null);
  const pendingTemplate = useRef<{ signature: string; id: string } | null>(null);
  const customRole = { name: customName.trim(), instructions: responsibilities.trim() };
  const creation = useMutation({
    mutationFn: async () => {
      const isolation = role === "worker" || isolated ? "worktree" as const : "shared" as const;
      const definition = role === "custom" ? { customRole } : {};
      const signature = JSON.stringify({ workspaceId, role, choiceId, isolation, ...definition });
      if (pending.current?.signature !== signature) pending.current = { signature, ...(await request({})) };
      return start({ workspaceId, role, choiceId, isolation, ...definition, requestId: pending.current.requestId });
    },
    onSuccess: member => {
      if (member.agentId) {
        pending.current = null; setMessage(""); setPicker(false);
        onCreated("Member created. Open its conversation to assign work."); onClose();
      } else {
        setMessage("Creation is unresolved. Refresh the team to recover. Retrying this request will not launch a duplicate.");
        onCreated("");
      }
    },
  });
  const saving = useMutation({
    mutationFn: async (asNew: boolean) => {
      const isolation = isolated ? "worktree" as const : "shared" as const;
      const targetId = asNew ? null : templateId;
      const signature = JSON.stringify({ customRole, choiceId, isolation, targetId });
      if (pendingTemplate.current?.signature !== signature) pendingTemplate.current = { signature, id: targetId ?? (await request({})).requestId };
      return saveTemplate({ workspaceId, id: pendingTemplate.current.id, customRole, choiceId, isolation });
    },
    onSuccess: saved => {
      pendingTemplate.current = null; setTemplateId(saved.id); setConfirmDelete(false);
      setTemplateMessage("Preset saved for this project. Reuse it to create another member."); void templates.refetch();
    },
  });
  const deleting = useMutation({
    mutationFn: async () => { if (templateId) await deleteTemplate({ workspaceId, id: templateId }); },
    onSuccess: () => {
      setTemplateId(null); pendingTemplate.current = null; setConfirmDelete(false);
      setTemplateMessage("Preset deleted. Your draft and existing members are kept."); void templates.refetch();
    },
  });
  const selectTemplate = (template: MemberTemplate) => {
    setCustomName(template.customRole.name); setResponsibilities(template.customRole.instructions ?? "");
    setChoiceId(template.choiceId); setIsolated(template.isolation === "worktree"); setTemplateId(template.id);
    setPicker(false); setSearch(""); setConfirmDelete(false); pendingTemplate.current = null;
    saving.reset(); deleting.reset(); setTemplateMessage("Preset loaded. Review the configuration, then create a member.");
  };
  const options = configuration.data?.choices ?? [];
  const matches = options.filter(choice => `${choice.name} ${choice.config.provider} ${choice.notes}`.toLowerCase().includes(search.trim().toLowerCase()));
  const selected = options.find(choice => choice.id === choiceId);
  const busy = creation.isPending || saving.isPending || deleting.isPending;
  const validCustom = customRoleSchema.safeParse(customRole).success;
  const selectedTemplate = templates.data?.find(template => template.id === templateId);
  if (!open) return null;
  return <Card>
    <View style={{ ...row, justifyContent: "space-between" }}>
      <Text accessibilityRole="header" style={{ ...text, fontSize: 17, fontWeight: "600" }}>New member</Text>
      <Button label="Close form" icon="X" quiet onPress={onClose} disabled={busy} />
    </View>
    <View style={{ gap: 8 }}>
      <Text style={label}>Role</Text>
      <View accessibilityRole="radiogroup" style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {(Object.keys(roleDetails) as Role[]).map(value => <Pressable key={value} accessibilityRole="radio" accessibilityLabel={memberRoleTitle(value)}
          aria-checked={role === value} aria-disabled={busy} disabled={busy} onPress={() => setRole(value)}
          style={({ pressed }) => ({ flexGrow: 1, flexBasis: narrow ? "40%" : "20%", flexDirection: "row", alignItems: "center", gap: 8, padding: 10, minHeight: 56, borderWidth: 1,
            borderColor: role === value ? c.accent : c.border, backgroundColor: role === value || pressed ? c.surface1 : c.surface0, borderRadius: 8 })}>
          <Icon name={roleDetails[value].icon} size={18} color={role === value ? c.accent : c.foregroundMuted} />
          <View style={{ flex: 1 }}><Text style={label}>{memberRoleTitle(value)}</Text>{!narrow ? <Text style={muted}>{roleDetails[value].short}</Text> : null}</View>
        </Pressable>)}
      </View>
      {role !== "custom" ? <>
        <Text style={muted}>{roles[role].summary}</Text>
        <Disclosure title="Role responsibilities"><Text style={muted}>{roles[role].instructions}</Text></Disclosure>
      </> : <Text style={muted}>Define an ongoing role, or load a saved preset.</Text>}
    </View>
    {role === "custom" ? <View style={{ gap: 12 }}>
      <Disclosure title={`Project presets${templates.data?.length ? ` (${templates.data.length})` : ""}`}>
        <Text style={muted}>Reuse a role, its responsibilities, profile, and workspace preference.</Text>
        <ScrollView nestedScrollEnabled style={{ maxHeight: 240 }} contentContainerStyle={{ gap: 6 }}>
          {templates.data?.map(template => <Pressable key={template.id} accessibilityRole="button" accessibilityLabel={`Use preset ${template.customRole.name}`} disabled={busy}
            onPress={() => selectTemplate(template)} style={({ pressed }) => ({ padding: 12, gap: 3, borderWidth: 1, borderColor: templateId === template.id ? c.accent : c.border, borderRadius: 8, backgroundColor: pressed ? c.surface1 : c.surface0 })}>
            <Text style={label}>{template.customRole.name}</Text>
            <Text style={muted}>{options.find(choice => choice.id === template.choiceId)?.name ?? template.choiceId} · {template.isolation === "worktree" ? "Worktree" : "Shared"}</Text>
          </Pressable>)}
        </ScrollView>
        {!templates.data?.length ? <Text style={muted}>{templates.isPending ? "Loading presets…" : "No saved presets yet. Configure a Custom member below to save one."}</Text> : null}
        <View style={row}><Button label="Refresh presets" icon="RefreshCw" quiet onPress={() => { void templates.refetch(); }} disabled={templates.isFetching || busy} /></View>
      </Disclosure>
      {templates.error ? <Notice error>{String(templates.error)}</Notice> : null}
      <View style={{ gap: 6 }}>
        <Text style={label}>Role name</Text>
        <TextInput accessibilityLabel="Custom role name" placeholder="e.g. Accessibility reviewer" placeholderTextColor={c.foregroundMuted} value={customName} onChangeText={setCustomName} maxLength={80} editable={!busy} style={field} />
      </View>
      <View style={{ gap: 6 }}>
        <Text style={label}>Responsibilities · optional</Text>
        <TextInput accessibilityLabel="Responsibilities (optional)" placeholder="e.g. Review accessibility; report issues and fixes without editing files." placeholderTextColor={c.foregroundMuted}
          multiline value={responsibilities} onChangeText={setResponsibilities} maxLength={8000} editable={!busy} style={{ ...field, minHeight: 88, textAlignVertical: "top" }} />
        <Text style={muted}>What this role is responsible for over time. Assign specific work in its conversation after creation.</Text>
      </View>
    </View> : null}
    <View style={{ gap: 8 }}>
      <View style={{ ...row, justifyContent: "space-between" }}><Text style={label}>Profile / model</Text>
        <Button label={configuration.isFetching ? "Refreshing…" : "Refresh profiles"} icon="RefreshCw" quiet onPress={() => { void configuration.refetch(); }} disabled={configuration.isFetching || busy} />
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel={selected ? `Profile: ${selected.name}` : "Choose a profile or model"}
        aria-expanded={picker} aria-disabled={busy} disabled={busy} onPress={() => setPicker(!picker)}
        style={{ ...field, flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Icon name="Cpu" size={16} color={c.foregroundMuted} />
        <Text style={{ ...text, flex: 1 }}>{selected?.name ?? "Choose a profile or model"}</Text>
        <Icon name={picker ? "ChevronUp" : "ChevronDown"} size={16} color={c.foregroundMuted} />
      </Pressable>
      {picker ? <View style={{ borderWidth: 1, borderColor: c.border, borderRadius: 8, overflow: "hidden" }}>
        <TextInput accessibilityLabel="Search profiles and models" placeholder="Search name, provider, or notes…" placeholderTextColor={c.foregroundMuted}
          value={search} onChangeText={setSearch} editable={!busy} style={{ ...field, borderWidth: 0, borderRadius: 0, borderBottomWidth: 1 }} />
        <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled" style={{ maxHeight: 240 }}>
          {matches.map(choice => <Pressable key={choice.id} accessibilityRole="button" accessibilityLabel={choice.name} aria-disabled={busy} disabled={busy}
            onPress={() => { setChoiceId(choice.id); setPicker(false); setSearch(""); }}
            style={({ pressed }) => ({ padding: 12, gap: 2, backgroundColor: pressed || choice.id === choiceId ? c.surface1 : c.surface0 })}>
            <Text style={label}>{choice.name}</Text><Text style={muted}>{choice.config.provider}{choice.notes ? ` · ${choice.notes}` : ""}</Text>
          </Pressable>)}
          {!matches.length ? <Text style={{ ...muted, padding: 12 }}>{configuration.isPending ? "Loading profiles…" : options.length ? "No matches. Try a different search." : "Configure a provider in Paseo, then refresh profiles."}</Text> : null}
        </ScrollView>
      </View> : null}
      {role !== "custom" ? <Text style={muted}>Suggested: {roles[role].configurationHint}. Your selected profile applies.</Text> : null}
      {choiceId && !selected && configuration.data ? <Notice error>Saved profile/model is unavailable: {choiceId}. Choose an available profile to continue.</Notice> : null}
      {selected?.notes ? <Text style={muted}>{selected.notes}</Text> : null}
      {configuration.error ? <Notice error>{String(configuration.error)}</Notice> : null}
      {configuration.data?.warnings.length ? <Disclosure title="Provider notices">{configuration.data.warnings.map((warning, i) => <Text key={i} style={muted}>{warning}</Text>)}</Disclosure> : null}
    </View>
    <View style={{ gap: 8 }}>
      {role === "worker" ? <Badge label="Separate worktree required" /> : <Pressable accessibilityRole="checkbox" accessibilityLabel="Use a separate worktree"
        aria-checked={isolated} aria-disabled={busy} disabled={busy} onPress={() => setIsolated(!isolated)} style={{ ...row, flexWrap: "nowrap", minHeight: 44 }}>
        <Icon name={isolated ? "SquareCheck" : "Square"} size={18} color={isolated ? c.accent : c.foregroundMuted} />
        <Text style={{ ...text, flex: 1 }}>Use a separate worktree</Text>
      </Pressable>}
      {role === "worker" || isolated ? <Text style={muted}>Starts from the current branch. Commit required inputs first; uncommitted files are not copied. Review and merge manually.</Text> : null}
      <Disclosure title="Team rules & permissions">
        <Text style={muted}>Role responsibilities are instructions. Actual access follows the selected provider/profile permissions. Your existing primary agent owns architecture, OpenSpec/ADR, and final review.</Text>
      </Disclosure>
    </View>
    {role === "custom" ? <View style={{ gap: 10, padding: 12, borderRadius: 8, backgroundColor: c.surface1 }}>
      <Text style={label}>{selectedTemplate ? `Preset: ${selectedTemplate.customRole.name}` : "Reuse this configuration"}</Text>
      <Text style={muted}>Saves role, profile, and isolation for future members in this project. Existing members keep their own configuration.</Text>
      <View style={row}>
        <Button label={saving.isPending ? "Saving…" : templateId ? "Update preset" : "Save preset"} icon="Bookmark" onPress={() => saving.mutate(false)} disabled={busy || !validCustom || !selected || Boolean(templates.error)} />
        {templateId ? <>
          <Button label="Save as new" quiet onPress={() => saving.mutate(true)} disabled={busy || !validCustom || !selected || Boolean(templates.error)} />
          <Button label="Delete preset" quiet onPress={() => setConfirmDelete(true)} disabled={busy} />
        </> : null}
      </View>
      {confirmDelete ? <View style={{ gap: 8 }}>
        <Text style={text}>Delete this saved preset? Your draft and existing members will be kept.</Text>
        <View style={row}><Button label={deleting.isPending ? "Deleting…" : "Confirm delete"} onPress={() => deleting.mutate()} disabled={busy} /><Button label="Keep preset" quiet onPress={() => setConfirmDelete(false)} disabled={busy} /></View>
      </View> : null}
      {templateMessage ? <Text accessibilityLiveRegion="polite" style={muted}>{templateMessage}</Text> : null}
      {[saving.error, deleting.error].filter(Boolean).map((error, i) => <Notice key={i} error>{String(error)}</Notice>)}
    </View> : null}
    {creation.error ? <Notice error>{String(creation.error)}</Notice> : null}
    {message ? <Notice>{message}</Notice> : null}
    <Text style={muted}>Create this member, then send work in its conversation when you are ready.</Text>
    <View style={{ ...row, justifyContent: "flex-end", borderTopWidth: 1, borderColor: c.border, paddingTop: 14 }}>
      <Button label="Cancel" quiet onPress={onClose} disabled={busy} />
      <Button label={creation.isPending ? "Creating…" : "Create member"} icon="UserPlus" primary onPress={() => { setMessage(""); creation.mutate(); }} disabled={busy || !ready || !selected || (role === "custom" && !validCustom)} />
    </View>
  </Card>;
}
