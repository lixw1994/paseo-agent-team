# Use Paseo Agent Team

Use the plugin to start and manage a small set of agents for explicitly requested work. You need the standalone workflow installed in the project, a compatible Paseo 0.8.x host/client, and a usable configured provider.

## Open the panel

Install the plugin using [Getting Started](./getting-started.md), then open the target workspace. In the Command Center choose **Open Agent Team**, or submit `/agent-team`. The workspace panel also supports the Explorer location.

The panel displays active OpenSpec change names and checked/total task counts. Opening it does not create agents or team state. Refresh team to reconcile with the daemon and collect recent assistant output. Open a member's conversation for its full live history and permission requests.

## Start a member

Your current primary agent is Tech Lead. It owns architecture, core code, OpenSpec/ADR, and final review. Select a helper role and a profile, then describe a bounded task:

```text
Context: We need to check compatibility with the latest Paseo plugin API.
Requirements: Research the official plugin documentation; do not edit project files.
Expected output: Condensed findings with source links, retrieval dates, and uncertainties.
Acceptance criteria: Distinguish documented facts from inference and identify version limits.
```

| Role | Expected output | Default placement |
|------|-----------------|-------------------|
| Researcher | External research, dated sources, concise recommendations | Current workspace; only requested handoff reports may be written |
| Writer | Documentation changes and concise summaries | Current workspace; writes `docs/` only |
| Worker | Simple chore, changed files, and verification evidence | Separate worktree, required |

The form initially selects Researcher and leaves profile/model and task empty. The panel explains each scope and shows the role's model preference as guidance; it does not apply that configuration automatically. See [Team roles](./team-roles.md) for the full responsibilities and configuration preferences.

Configured Paseo profiles provide the model, mode, thinking, and feature settings; their notes appear beside the choice. If no available profile exists, the plugin discovers selectable models from available providers. Use the search field to narrow the list by name, provider, or notes. Refresh profiles after configuration changes. The plugin never hardcodes a model or changes your global provider configuration.

Press **Start selected member**. Each click with a new task creates one member; repeat deliberately for additional team members. Members are ordinary Paseo agents grouped by plugin records and labels. The first version does not automatically attach them as children of an existing primary conversation or schedule dependent tasks.

Role instructions are behavioral scope, not filesystem permissions. Choose an appropriate provider mode. Worker always uses a worktree and returns complex work to the lead. Researcher and Writer may also use an explicitly selected worktree. The plugin does not automatically merge, commit, or approve agent permissions.

## Prepare isolated work

A worktree starts from the originating repository branch. Uncommitted or untracked inputs are not copied. Commit required workflow/artifact changes before launching an isolated helper, and include the intended scope in the task.

Use **Open worktree** to inspect the member's checkout. Review and integrate changes yourself or through your primary agent. Archiving a member retains its worktree; workspace deletion is a separate deliberate Paseo operation.

## Review and follow up

Use **Open conversation** for live output or permission handling. **Refresh team** reads the current agent status and recent assistant output; the panel does not run a background status polling loop. Long output is bounded in the panel, while the full conversation remains in Paseo.

Continue independent lead work while helpers run. The Tech Lead personally reviews every result and reviews Worker code line by line; OpenSpec/ADR edits and architectural decisions remain with the lead.

Enter a follow-up and select **Send follow-up**. Once the task and integration are complete, select **Archive member**. For a currently running member the button explicitly says **Stop and archive member**. Only the selected recorded agent is affected.

## Recover after reload or interrupted creation

Task records live under `.paseo-agent-team/state.json` in the originating project. The plugin adds `.paseo-agent-team/` to `.gitignore` on the first state write. It does not put runtime membership in OpenSpec or ADRs.

A recorded request ID is idempotent. If creation succeeds but the response is lost, refresh recovers the agent by its team labels. If no matching agent can be found, the member remains **unresolved**; retrying that same request does not launch a duplicate. Check Paseo before intentionally starting a replacement. If a worktree was created before failure, its recorded workspace ID remains available for inspection.

Corrupt or unsupported state fails visibly and is preserved. The plugin rejects symbolic links for runtime state and ignore files. Back up state before manual repair. Use only one installation of this plugin to manage a given project's state; cross-process locking and multiple-host team state are outside this version.

Earlier Reviewer and Implementer records remain available with a legacy label. Refresh preserves their actual role, IDs, task, and configuration; follow-up and archival still work. These roles are no longer offered for new creation.

## Develop and reload

```bash
cd /path/to/paseo-agent-team/plugins/paseo-agent-team
npm ci
npm run typecheck
npm test
paseo plugin reload paseo-agent-team
paseo plugin logs paseo-agent-team
```

Do not restart the daemon for source changes. Check desktop and compact layouts and switch themes after client changes. The UI uses native primitives and host theme colors.

Typechecking and automated tests cover the Researcher / Writer / Worker interface contracts, team lifecycle, and legacy member compatibility. Paseo 0.8.0 installation, reload, and read-only RPC checks have also succeeded locally. Actual app visual inspection and real member launches remain untested.
