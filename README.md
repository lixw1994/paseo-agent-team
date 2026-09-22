# paseo-agent-team

English | [简体中文](./README.zh-CN.md)

An OpenSpec engineering workflow you can use with any coding agent, plus an optional native Paseo plugin for agent teams. Work solo by default; start a helper only when you explicitly need one.

| Mode | What you install | What you get |
|------|------------------|--------------|
| Standalone workflow | Run `init.sh` in your project | OpenSpec, ADR rules, general skills, and discipline hooks; no Paseo dependency |
| Paseo enhancement | Install the Agent Team plugin on your Paseo host | Workspace panel, configured profiles, bounded member tasks, results, follow-ups, and archival |

## Install the engineering workflow

From a local checkout, run the installer in the target project:

```bash
cd /path/to/your-project
/path/to/paseo-agent-team/init.sh
```

Install the OpenSpec CLI first with `npm install -g @fission-ai/openspec@latest`. If it is missing, the installer skips that component and explains how to restore it. Git is required; missing optional components do not block the others.

The defaults are `openspec,adr,skills,hooks`. Use `--with adr,skills` for a subset, `--language "Simplified Chinese"` for artifact language, or `--tools` for OpenSpec tool targets. Every successful selection installs the managed `AGENTS.md` instructions.

Start an agent and describe a change. Large changes follow proposal → specs → design → ADR → tasks → implementation → archive. Small changes go directly into code. No team is started by installation.

## Add Agent Team in Paseo

The plugin source is `plugins/paseo-agent-team/`. Install it once per daemon, then use it in any workspace:

```bash
cd /path/to/paseo-agent-team/plugins/paseo-agent-team
npm ci
npm run typecheck
npm test
paseo plugin install "$PWD"
paseo plugin ls
```

Enable plugins in **Settings → Plugins** on the intended host first. Plugins execute trusted code on that host. The plugin targets Paseo 0.8.x; both the daemon and connected client need compatible versions.

In a workspace, open **Agent Team** from the Command Center, or submit `/agent-team`. The panel shows active OpenSpec task counts. To collaborate:

1. Choose Researcher (external research), Writer (`docs/`), or Worker (simple chores).
2. Choose a configured Paseo profile and read its notes. If no usable profiles exist, the panel discovers available models.
3. Provide context, requirements, expected output, and acceptance criteria, then start the selected member. Worker requires a separate worktree; Researcher and Writer default to the current workspace within their role scopes.
4. Open the member's conversation, or refresh the panel for status and collected output. Send follow-ups as needed.
5. Review and integrate the result, then archive the member. Worktrees are retained for manual integration.

Your existing primary agent remains Tech Lead, owning architecture, core code, OpenSpec/ADR, and final review. Researcher and Writer isolate bulky research/drafting context; use Worker sparingly and review its code line by line. See the [role responsibilities and configuration preferences](./docs/team-roles.md).

Each explicit start creates one member; repeat to assemble the team you need. Members are grouped by this plugin's records and labels; the panel does not designate an existing conversation as their parent automatically. Role instructions do not replace provider permission settings.

See the [Paseo guide](./docs/paseo-guide.md) for recovery, isolation, and local development.

## Layout

```text
init.sh                         Standalone workflow installer
AGENTS.md                       Engineering discipline and opt-in collaboration
openspec/                       Current specs, change history, and schemas
adr/                            Immutable architectural decision history
docs/                           Setup, workflow, plugin, and architecture guides
skills.txt                      General skill declarations
scripts/                        Discipline hook and installer regressions
plugins/paseo-agent-team/        Separately installed Paseo plugin
  paseo-plugin.json             Plugin identity and compatibility
  index.client.tsx              Panel and command registration
  index.server.ts               Team RPC registration
  client/                       Native, theme-aware UI
  server/                       Team operations, SDK integration, local state
  shared/                       Typed contracts and role definitions
```

The plugin creates `.paseo-agent-team/` in the originating project only when starting a member, and adds it to `.gitignore`. It stores local task/agent associations and collected output. OpenSpec and ADRs remain the project's lasting sources of truth.

## Upgrade and development

Rerun `init.sh` to refresh selected workflow assets. Legacy `copilot-workflow` managed blocks and hooks migrate without duplicating instructions or chaining a managed hook into itself. The new installer manifest is `.paseo-agent-team.yaml`; legacy environment aliases remain accepted. See [migration](./docs/getting-started.md#upgrade-an-existing-installation).

```bash
bash scripts/regression-test.sh
npm --prefix plugins/paseo-agent-team run typecheck
npm --prefix plugins/paseo-agent-team test
openspec validate --all --strict
```

After plugin source changes, typecheck and run `paseo plugin reload paseo-agent-team`. Source creation and local validation do not publish or rename a remote repository. Use the local install path until the renamed repository is published.

[Documentation](./docs/README.md) · [Architecture](./docs/architecture.md)
