import { useRpc } from "@getpaseo/plugin/client";
import { copyText, Icon } from "@getpaseo/plugin/client/react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { componentLabels, onboardingPrompt, setupCancel, setupInspect, setupStart, setupStatus, type Component } from "../shared/setup";
import { teamRequest } from "../shared/team";
import { Badge, Button, Card, Disclosure, Notice, row, useUi } from "./ui";

const componentDescriptions: Record<Component, string> = {
  openspec: "Specs, change proposals, and implementation tasks",
  adr: "A place to record architecture decisions",
  skills: "Engineering guidance for your coding agent",
  hooks: "Check specs and protect accepted ADRs before commits",
};
const componentPaths: Record<Component, string> = {
  openspec: "openspec/config.yaml · openspec/schemas/ · generated .agents/skills/openspec-*",
  adr: "adr/README.md",
  skills: ".agents/skills/ (bundled engineering skills)",
  hooks: "scripts/pre-commit.sh · Git pre-commit hook",
};

export function SetupPanel({ workspaceId, narrow, onChanged }: { workspaceId: string; narrow: boolean; onChanged: () => void }) {
  const { c, text, muted, label, field } = useUi();
  const inspect = useRpc(setupInspect), start = useRpc(setupStart), status = useRpc(setupStatus);
  const cancel = useRpc(setupCancel), request = useRpc(teamRequest), cache = useQueryClient();
  const statusKey = ["agent-team-setup-job", workspaceId];
  const inspection = useQuery({ queryKey: ["agent-team-setup", workspaceId], queryFn: () => inspect({ workspaceId }), retry: false });
  const jobQuery = useQuery({ queryKey: statusKey, queryFn: () => status({ workspaceId }), enabled: Boolean(inspection.data), retry: false,
    refetchInterval: query => query.state.data?.status === "running" ? 1000 : false });
  const job = jobQuery.data === undefined ? inspection.data?.job : jobQuery.data;
  const [components, setComponents] = useState<Component[]>(["openspec", "adr", "skills", "hooks"]);
  const [language, setLanguage] = useState("English");
  const [step, setStep] = useState<"summary" | "configure" | "review">("summary");
  const [copied, setCopied] = useState("");
  const [promptOpen, setPromptOpen] = useState(false);
  const pending = useRef<{ signature: string; requestId: string } | null>(null);
  const lastResult = useRef("");
  const callback = useRef(onChanged); callback.current = onChanged;
  useEffect(() => {
    if (job && pending.current?.requestId === job.requestId) {
      pending.current = null;
      setStep("summary");
    }
    if (!job || job.status === "running" || lastResult.current === `${job.requestId}:${job.status}`) return;
    lastResult.current = `${job.requestId}:${job.status}`;
    void inspection.refetch(); callback.current();
  }, [job?.requestId, job?.status]);
  const install = useMutation({ mutationFn: async () => {
    const signature = JSON.stringify({ components, language });
    if (!pending.current || pending.current.signature !== signature) pending.current = { signature, ...await request({}) };
    return start({ workspaceId, requestId: pending.current.requestId, components, language });
  }, onSuccess: value => {
    cache.setQueryData(statusKey, value); pending.current = null; setStep("summary");
  }, onError: () => { void jobQuery.refetch(); void inspection.refetch(); } });
  const cancellation = useMutation({ mutationFn: async () => {
    if (job) await cancel({ workspaceId, requestId: job.requestId });
  }, onSuccess: () => { void jobQuery.refetch(); } });
  const data = inspection.data;
  const running = job?.status === "running";
  const busy = install.isPending || running || cancellation.isPending;
  const blockers = data?.prerequisites.filter(check => !check.ready && (check.id !== "openspec" || components.includes("openspec"))) ?? [];
  const languageValid = /^[\p{L}\p{N} ()_-]{1,80}$/u.test(language.trim());
  const canInstall = !busy && components.length > 0 && languageValid && !blockers.length;
  const refresh = () => { void inspection.refetch(); void jobQuery.refetch(); callback.current(); };
  return <>
    <Card>
      <View style={{ ...row, justifyContent: "space-between" }}>
        <View style={{ flex: 1, gap: 4 }}>
          <Text accessibilityRole="header" style={{ ...text, fontSize: 17, fontWeight: "600" }}>Project workflow</Text>
          <Text style={muted}>{inspection.isPending ? "Checking this project…" : data?.complete ? "Your engineering workflow is ready." : "Set up a shared way to plan, build, and review."}</Text>
        </View>
        {data ? <Badge label={running ? "Installing" : data.complete ? "Ready" : "Setup needed"} tone={running ? "active" : data.complete ? "success" : "warning"} /> : null}
      </View>
      {[inspection.error, jobQuery.error, install.error, cancellation.error].filter(Boolean).map((error, i) => <Notice key={i} error>{String(error)}</Notice>)}
      {data ? <>
        {step === "summary" ? <>
          <View style={{ gap: 8 }}>
            {data.components.map(check => <View key={check.id} style={{ ...row, justifyContent: "space-between" }}>
              <View style={{ flexDirection: "row", gap: 8, alignItems: "center", flex: 1 }}>
                <Icon name={check.ready ? "CircleCheck" : "CircleDashed"} size={16} color={check.ready ? c.statusSuccess : c.foregroundMuted} />
                <Text style={text}>{check.label}</Text>
              </View>
              <Text style={{ ...muted, fontSize: 12 }}>{check.ready ? "Installed" : "Not installed"}</Text>
            </View>)}
          </View>
          <View style={{ ...row, paddingTop: 4 }}>
            <Button label={data.complete ? "Repair / update workflow" : "Configure setup"} icon={data.complete ? "Settings2" : "ArrowRight"} primary={!data.complete} onPress={() => { install.reset(); setStep("configure"); }} disabled={busy} />
            <Button label={inspection.isFetching ? "Checking…" : "Recheck setup"} icon="RefreshCw" quiet onPress={refresh} disabled={inspection.isFetching || busy} />
          </View>
        </> : <>
          <View style={row}>
            <Badge label="1 · Configure" tone={step === "configure" ? "active" : "neutral"} />
            <Icon name="ChevronRight" size={14} color={c.foregroundMuted} />
            <Badge label="2 · Review" tone={step === "review" ? "active" : "neutral"} />
          </View>
          {step === "configure" ? <>
            <View style={{ gap: 8 }}>
              <Text style={label}>Components</Text>
              {(Object.keys(componentLabels) as Component[]).map(id => <Pressable key={id} accessibilityRole="checkbox" accessibilityLabel={componentLabels[id]}
                aria-checked={components.includes(id)} aria-disabled={busy} disabled={busy}
                onPress={() => setComponents(values => values.includes(id) ? values.filter(value => value !== id) : [...values, id])}
                style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", padding: 12, gap: 10, borderWidth: 1, borderColor: c.border, backgroundColor: pressed ? c.surface1 : c.surface0, borderRadius: 8 })}>
                <Icon name={components.includes(id) ? "SquareCheck" : "Square"} size={19} color={components.includes(id) ? c.accent : c.foregroundMuted} />
                <View style={{ flex: 1, gap: 2 }}><Text style={label}>{componentLabels[id]}</Text><Text style={muted}>{componentDescriptions[id]}</Text></View>
              </Pressable>)}
            </View>
            {data.configExists ? <Text style={muted}>Your existing OpenSpec context and language will be preserved.</Text> : <View style={{ gap: 8 }}>
              <Text style={label}>Language for new artifacts</Text>
              <TextInput accessibilityLabel="OpenSpec artifact language" value={language} onChangeText={setLanguage} editable={!busy} maxLength={80} placeholder="English" placeholderTextColor={c.foregroundMuted} style={field} />
              {!languageValid ? <Text style={muted}>Enter a language using letters, numbers, spaces, parentheses, hyphens, or underscores.</Text> : null}
            </View>}
            <View style={{ ...row, justifyContent: "flex-end" }}>
              <Button label="Cancel" quiet onPress={() => setStep("summary")} disabled={busy} />
              <Button label="Review setup changes" icon="ArrowRight" primary onPress={() => setStep("review")} disabled={!canInstall} />
            </View>
          </> : <>
            <View style={{ gap: 8, padding: 14, borderRadius: 8, backgroundColor: c.surface1 }}>
              <Text style={label}>Install into</Text>
              <Text selectable style={text}>{data.directory}</Text>
              <Text style={label}>Managed files to update</Text>
              <Text selectable style={muted}>AGENTS.md managed block · .paseo-agent-team.yaml · .gitignore runtime entry</Text>
              {components.map(id => <View key={id} style={{ gap: 2 }}><Text style={label}>{componentLabels[id]}</Text><Text selectable style={muted}>{componentPaths[id]}</Text></View>)}
              {components.includes("hooks") ? <Text selectable style={muted}>Hook location: {data.hookDirectory}. This location may be shared with other worktrees.</Text> : null}
              <Text style={muted}>{data.configExists ? "Existing artifact language is preserved." : `Artifact language: ${language}`}</Text>
            </View>
            <Text style={muted}>Selected managed files are refreshed from the installed plugin. Other project instructions, existing OpenSpec context, accepted ADRs, and user hooks are preserved.</Text>
            <Text style={muted}>Completed file changes remain if installation fails or is cancelled. Recheck and repair afterward.</Text>
            <View style={{ ...row, justifyContent: "flex-end" }}>
              <Button label="Back" icon="ArrowLeft" quiet onPress={() => setStep("configure")} disabled={busy} />
              <Button label={install.isPending ? "Starting setup…" : "Install selected components"} icon="Download" primary onPress={() => install.mutate()} disabled={!canInstall} />
            </View>
          </>}
        </>}
        {blockers.length ? <Notice error>{blockers.map(check => `${check.label}: ${check.detail}`).join("\n")}</Notice> : null}
        <View style={{ borderTopWidth: 1, borderColor: c.border, paddingTop: 4 }}>
          <Disclosure title="Environment & installation details">
            <Text selectable style={muted}>Project: {data.directory}</Text>
            {data.prerequisites.map(check => <Text key={check.id} selectable style={muted}>{check.ready ? "✓" : "○"} {check.label} · {check.detail}</Text>)}
            {data.components.map(check => <Text key={check.id} selectable style={muted}>{check.label}: {check.detail}</Text>)}
            <Text selectable style={muted}>Bundled source: {data.source}. Update the plugin source first to install a newer version.</Text>
          </Disclosure>
        </View>
      </> : <View style={row}><Button label="Recheck setup" icon="RefreshCw" onPress={refresh} disabled={inspection.isFetching} /></View>}
    </Card>
    {job ? <Card>
      <View style={{ ...row, justifyContent: "space-between" }}>
        <Text accessibilityRole="header" style={{ ...text, fontWeight: "600" }}>{running ? "Installing workflow" : "Last installation"}</Text>
        <Badge label={job.status} tone={running ? "active" : job.status === "succeeded" ? "success" : job.status === "failed" ? "danger" : "warning"} />
      </View>
      <Text accessibilityLiveRegion="polite" style={muted}>{job.message}</Text>
      {running ? <View style={row}><Button label={cancellation.isPending ? "Stopping…" : "Cancel installation"} onPress={() => cancellation.mutate()} disabled={cancellation.isPending} /></View> : null}
      {job.output ? <Disclosure title="Installation log" key={job.requestId}>
        <ScrollView nestedScrollEnabled style={{ maxHeight: narrow ? 180 : 260, backgroundColor: c.surface1, borderRadius: 8 }} contentContainerStyle={{ padding: 12 }}>
          <Text selectable style={{ ...muted, fontSize: 12, fontFamily: "monospace" }}>{job.output}</Text>
        </ScrollView>
      </Disclosure> : null}
    </Card> : null}
    {data?.components.find(check => check.id === "openspec")?.ready ? <Card>
      <View style={{ flexDirection: "row", gap: 12 }}>
        <Icon name="BookOpen" size={20} color={c.foregroundMuted} />
        <View style={{ flex: 1, gap: 5 }}>
          <Text accessibilityRole="header" style={{ ...text, fontSize: 16, fontWeight: "600" }}>Describe this codebase</Text>
          <Text style={muted}>Ask your primary agent to document the current specs, architecture, and decisions.</Text>
        </View>
      </View>
      <View style={row}>
        <Button label="Copy onboarding prompt" icon="Copy" onPress={() => { void copyText(onboardingPrompt).then(() => setCopied("Copied. Paste into your primary conversation.")).catch(() => { setPromptOpen(true); setCopied("Copy unavailable. Select the prompt below and copy it manually."); }); }} />
        <Button label={promptOpen ? "Hide prompt" : "Preview prompt"} quiet onPress={() => setPromptOpen(!promptOpen)} />
      </View>
      {promptOpen ? <Text selectable style={{ ...muted, padding: 12, backgroundColor: c.surface1, borderRadius: 8 }}>{onboardingPrompt}</Text> : null}
      {copied ? <Text accessibilityLiveRegion="polite" style={muted}>{copied}</Text> : null}
    </Card> : null}
  </>;
}
