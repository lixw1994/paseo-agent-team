# Use Paseo Agent Team

Use the plugin to configure members with ongoing roles and assign work through their conversations. You need a compatible Paseo 0.8.x host/client and a usable configured provider. Use the **Project** tab to install OpenSpec discipline in each project, or run the standalone installer.

## Open the panel

Install the plugin using [Getting Started](./getting-started.md), then open the target workspace. In the Command Center choose **Open Agent Team**, or submit `/agent-team`. The workspace panel also supports the Explorer location.

The panel opens on **Team**. Opening it does not create agents or team state. **Refresh team** reads current status and recent assistant output. Open a member's conversation for its full live history and permission requests.

| Tab | Contents |
|-----|----------|
| **Team** | Member cards, a form opened with **New member** or **Add first member**, messages, and archived results |
| **Project** | Workflow setup and repair, environment details, installation logs, onboarding, and active OpenSpec task progress |

The panel adapts to its actual width, including a narrow Explorer sidebar. Long output, role instructions, logs, and environment details stay collapsed until needed.

## Initialize or repair a project

Open the repository root as a Paseo workspace, then select **Project**. **Project workflow** shows installation state for each component. Opening or rechecking setup does not change project files.

1. Missing prerequisites appear below the setup controls; expand **Environment & installation details** for tool versions and paths. Install missing Git, Bash, or OpenSpec using the displayed guidance; the panel does not install global tools.
2. Open **Configure setup** (or **Repair / update workflow** for an initialized project). Select OpenSpec, ADR rules, agent skills, and/or the Git discipline hook. Project instructions and an installation record accompany every selection.
3. Set the artifact language for a new OpenSpec configuration. Existing configuration context and language are preserved.
4. Select **Review setup changes**, check the destination, managed files, and hook location, then **Install selected components**. **Back** returns to your selections without starting installation.
5. Read the result and component checks; expand **Installation log** for output. Restart your agent session to load new rules. For an existing codebase, use **Copy onboarding prompt** and paste it into your primary conversation. **Preview prompt** shows the text before copying.

| Result | Next action |
|--------|-------------|
| `running` | Read the updating output or select **Cancel installation** |
| `succeeded` | Selected components are installed; start using the workflow |
| `partial` | Review missing components and output, fix prerequisites, then repair |
| `failed` | Read the error or timeout, fix its cause, then repair |
| `cancelled` / `interrupted` | Recheck installed state and explicitly repair if needed |

**Repair / update workflow** refreshes selected managed assets from the installed plugin's bundle. It preserves instructions outside the managed block, existing OpenSpec context, accepted ADR files, and chained user hooks. Keep customizations outside managed schemas, skills, and rule files. To get newer assets, update the plugin source and prepare/reload it first.

Installation stops after two minutes; output retains its latest 20,000 characters. Cancellation stops the installer and its child processes, but does not undo completed file changes. The last result is stored under `.paseo-agent-team/setup.json`; after a plugin restart, an unfinished record is shown as interrupted. Only the active setup job is polled automatically; team members still use **Refresh team**.

Git hooks may be shared by linked worktrees or redirected by `core.hooksPath`. The panel shows the effective location. Worktree hooks run the discipline script from the committing checkout, and skip that script if a sibling checkout has not installed it. Initialize a nested repository directory by opening its repository root instead. Managed destinations containing symlinks must be resolved before installation.

## Create a member

Your current primary agent is Tech Lead. It owns architecture, core code, OpenSpec/ADR, and final review. In **Team**, select **New member** or **Add first member** to open the form. Select a helper role, its responsibilities, and a profile. Creation prepares the member to receive work later.

| Role | Expected output | Default placement |
|------|-----------------|-------------------|
| Researcher | External research, dated sources, concise recommendations | Current workspace; only requested handoff reports may be written |
| Writer | Documentation changes and concise summaries | Current workspace; writes `docs/` only |
| Worker | Simple chore, changed files, and verification evidence | Separate worktree, required |
| Custom | User-defined ongoing responsibilities, with work assigned in the conversation | Current workspace or an explicitly selected worktree |

The form initially selects Researcher and leaves profile/model unselected. The panel shows built-in role summaries and model preferences as guidance; it does not apply that configuration automatically. Expand **Role responsibilities** for a built-in role's standing instructions, and **Team rules & permissions** for shared ownership rules. Custom roles have no suggested or automatically chosen model. See [Team roles](./team-roles.md).

Configured Paseo profiles provide the model, mode, thinking, and feature settings; their notes appear beside the choice. If no available profile exists, the plugin discovers selectable models from available providers. Open **Choose a profile or model**, then search by name, provider, or notes. Selecting a result closes the picker. Refresh profiles after configuration changes. The plugin never hardcodes a model or changes your global provider configuration.

Press **Create member**. The agent receives its standing instructions without an initial message and waits for an assignment. Repeat deliberately for additional team members. Members are ordinary Paseo agents grouped by plugin records and labels. The first version does not automatically attach them as children of an existing primary conversation or schedule dependent tasks.

Role instructions are behavioral scope, not filesystem permissions. Choose an appropriate provider mode. Worker always uses a worktree and returns complex work to the lead. Researcher, Writer, and Custom members may also use an explicitly selected worktree. The plugin does not automatically merge, commit, or approve agent permissions.

## Create and reuse a custom member

Choose **Custom**, enter **Role name**, and optionally fill **Responsibilities** with what this role handles over time. This is the single responsibility field. The system prompt carries that guidance and shared rules; creating the member sends no task. Assign work later in its conversation.

| Field | Example |
|-------|---------|
| Role name | Accessibility reviewer |
| Responsibilities (optional) | Review keyboard and screen-reader access. Report reproducible issues without editing files. |

To reuse the configuration:

1. Select a profile/model and the workspace preference. **Save preset** retains this configuration without creating a member.
2. Open **Project presets** under Custom and select a saved configuration. This fills name, responsibilities, profile, and isolation for review before creation.
3. Edit the draft if needed. **Update preset** saves over the selected preset; **Save as new** makes a separate variant. Neither changes existing members.
4. To remove a saved configuration, choose **Delete preset → Confirm delete**. The form draft, existing conversations, and member records remain.
5. Select **Create member** when ready, then open its conversation to assign work.

Presets belong to the originating project and persist in `.paseo-agent-team/templates.json` (up to 100). They reference a Paseo profile/model ID; they do not copy global provider configuration or credentials. If the reference is unavailable, the panel shows **Saved profile/model is unavailable** and blocks launch until you choose an available profile. Use **Refresh presets** after another client changes the list. A preset error does not prevent operating existing members.

Custom names have a limit of 80 characters; responsibilities are optional with an 8,000-character limit. Panel messages have a 16,000-character limit. Member **Details** show the custom responsibilities captured at creation. Later preset edits and deletion do not change that snapshot.

## Prepare isolated work

A worktree starts from the originating repository branch. Uncommitted or untracked inputs are not copied. Commit required workflow/artifact changes before launching an isolated helper, and include the intended scope in the task.

Expand a member's **Details**, then use **Open worktree** to inspect its checkout. Review and integrate changes yourself or through your primary agent. Archiving a member retains its worktree; workspace deletion is a separate deliberate Paseo operation.

## Assign work and review results

Use **Open conversation**, or choose **Message**, enter an assignment, and select **Send message**. For example:

```text
Context: We need to check compatibility with the latest Paseo plugin API.
Requirements: Research the official plugin documentation; do not edit project files.
Expected output: Condensed findings with source links, retrieval dates, and uncertainties.
Acceptance criteria: Distinguish documented facts from inference and identify version limits.
```

Member cards show role responsibilities and output previews. Expand **Details** to read the full collected text, or use **Open conversation** for live output or permission handling. **Refresh team** reads the current agent status and recent assistant output; the panel does not run a background status polling loop. Collected output is bounded in the panel, while the full conversation remains in Paseo.

Continue independent lead work while helpers run. The Tech Lead personally reviews every result and reviews Worker code line by line; OpenSpec/ADR edits and architectural decisions remain with the lead.

Use the same conversation or **Message** action for later assignments and follow-ups. When the member is no longer needed, expand **Details** and select **Archive member**. For a currently running member the button explicitly says **Stop and archive member**. Only the selected recorded agent is affected. Use **Archived** to inspect retained results and **Active members** to return to the current team.

## Refresh member state

Member records live under `.paseo-agent-team/state.json` in the originating project. The plugin adds `.paseo-agent-team/` to `.gitignore` on the first state write. It does not put runtime membership in OpenSpec or ADRs.

A recorded request ID is idempotent. Refresh finds an existing agent by its saved ID or team labels. If it cannot identify a matching agent, the member remains **unresolved**; retrying the same request does not launch a duplicate. Inspect the member's conversation and workspace before starting a replacement.

Invalid or unsupported state produces an error and remains untouched. Use one plugin installation to manage a project's state; multiple hosts writing the same team state are unsupported.

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

Follow [CONTRIBUTING.md](../CONTRIBUTING.md) for validation and documentation requirements.
