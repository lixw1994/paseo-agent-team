# paseo-agent-team

English | [简体中文](./README.zh-CN.md)

An OpenSpec engineering workflow for any coding agent, with an optional native Paseo plugin for agent teams. Work solo by default and start helpers explicitly when you need them.

| Mode | Installation | Capabilities |
|------|--------------|--------------|
| Standalone workflow | Run `init.sh` in your project | OpenSpec, ADR rules, general skills, and discipline hooks |
| Paseo enhancement | Install Agent Team on your Paseo host | Project setup and repair, workflow status, profile selection, helper tasks, results, follow-ups, and archival |

## Install the engineering workflow

You need Git, Bash, and the OpenSpec CLI. Run these commands in the target Git project:

```bash
npm install -g @fission-ai/openspec@latest
curl -fsSL https://raw.githubusercontent.com/lixw1994/paseo-agent-team/main/init.sh | bash
```

The default components are `openspec,adr,skills,hooks`. Installation creates the managed project instructions and workflow assets without installing Paseo or starting a team. Missing OpenSpec skips that component and prints a remediation command.

For a local checkout or custom options:

```bash
git clone https://github.com/lixw1994/paseo-agent-team.git
cd /path/to/your-project
/path/to/paseo-agent-team/init.sh --with openspec,adr,skills,hooks
```

`--with` replaces the component list. `--language "Simplified Chinese"` sets the language for a new OpenSpec configuration; existing projects retain their context. `--tools agents` is the default tool integration.

Managed instructions and hooks use `paseo-agent-team`; `.paseo-agent-team.yaml` records each installation. `PASEO_AGENT_TEAM_REPO` overrides the remote source, and `PASEO_AGENT_TEAM_SKIP_HOOKS=1` is the maintenance bypass. Rerunning refreshes managed assets while preserving surrounding instructions and user hooks.

Describe a change to your coding agent. Significant changes follow proposal → specs → design → ADR → tasks → implementation → verification → archive. Small fixes and documentation edits can proceed directly.

## Add Agent Team in Paseo

The plugin supports Paseo 0.8.x and requires Node.js and npm for local setup. Enable trusted plugins under **Settings → Plugins** on the target daemon, then install from a checkout:

```bash
git clone https://github.com/lixw1994/paseo-agent-team.git
cd paseo-agent-team/plugins/paseo-agent-team
npm ci
npm run typecheck
npm test
paseo plugin install "$PWD"
paseo plugin ls
```

The plugin should report `running`. Install it once per daemon and use it across workspaces. In the target workspace, choose **Open Agent Team** in the Command Center or submit `/agent-team`.

The panel opens on **Team** for members and their output. Open **Project → Configure setup** to select components and artifact language, then **Review setup changes → Install selected components**. The panel runs the bundled installer on the daemon host and supports cancellation and explicit repair. Existing projects can use **Repair / update workflow**. Environment details, installation logs, and the onboarding prompt expand when needed. Git, Bash, and the OpenSpec CLI must be available on that host; missing tools are explained in the panel.

After setup, copy the onboarding prompt into your existing primary conversation to derive project specs, architecture, and ADRs. Then, when you need help:

1. Open **Team → New member** (or **Add first member**). Choose Researcher (external research), Writer (`docs/`), Worker (simple chores), or **Custom** (a named helper with optional standing responsibilities).
2. Open the searchable profile picker and select a configured Paseo profile or an available model.
3. Review the role responsibilities and isolation, then press **Create member**. It waits for an assignment.
4. Use **Open conversation** or **Message** to assign work with context, requirements, expected output, and acceptance criteria. Refresh the team to inspect status and output; expand **Details** for more.
5. Review and integrate the result, then archive the member from **Details**. Its worktree and results remain available under **Archived**.

For Custom members, **Responsibilities** describes what the role handles over time. **Save preset** retains its name, responsibilities, profile/model, and isolation preference in this project. Reuse it through **Project presets**, update it, save a new variant, or delete it. Saving a preset creates no agent. **Create member** creates the configured agent without sending work; assign work later in its conversation. Each member stores its own role configuration and results; preset edits do not alter it.

Your existing primary agent is Tech Lead and owns architecture, core code, OpenSpec/ADR, and final review. Worker requires a separate worktree. Researcher, Writer, and Custom members can use the current workspace within their role scopes. Role prompts do not replace provider permission settings.

Opening the panel starts no members. Each explicit creation action creates one member; the plugin does not automatically start a fixed team or attach members to an existing parent conversation.

## Project layout

```text
init.sh                         Standalone workflow installer
AGENTS.md                       Engineering and collaboration rules
openspec/                       Capability specs, changes, and schemas
adr/                            Architecture decisions
plugins/paseo-agent-team/        Native Paseo plugin
  client/                       Theme-aware workspace panel
  server/                       Member operations, SDK adapter, local state
  shared/                       Contracts and role definitions
scripts/                        Discipline hook and installer regressions
docs/                           Setup, workflow, roles, and architecture
```

The plugin creates ignored `.paseo-agent-team/` state in the originating project when starting setup, creating a member, or saving a preset. Setup records, bounded output, and custom presets survive plugin reload; interrupted setup is reported for explicit repair. OpenSpec and ADRs remain the sources of truth for capabilities and architecture.

## Documentation and contributions

[Getting started](./docs/getting-started.md) · [Paseo guide](./docs/paseo-guide.md) · [Team roles](./docs/team-roles.md) · [Architecture](./docs/architecture.md)

Follow [CONTRIBUTING.md](./CONTRIBUTING.md) for setup and validation. Update affected guides and both README languages together with behavior changes.

## License

[MIT](./LICENSE). Bundled schema assets retain their own license notices.
