# paseo-agent-team-plugin Specification

## Purpose

Provide explicit, recoverable agent team collaboration within Paseo while keeping the standalone OpenSpec workflow independent.

## Requirements

### Requirement: Native Agent Team panel

The plugin SHALL provide a workspace panel and command entry named Agent Team, using native, theme-aware UI on desktop and compact clients. It SHALL display active OpenSpec changes and task counts without executing a shell command from the client.

#### Scenario: View project workflow

- **WHEN** Agent Team opens in a workspace
- **THEN** it reads local OpenSpec task progress and persisted member associations without starting an agent

### Requirement: Persist and reconcile team membership

The plugin SHALL persist task and agent associations under `.paseo-agent-team/` in the originating workspace, atomically and with schema validation. It MUST mark this runtime directory ignored, preserve unrelated ignore entries, serialize mutations within a workspace, and reconcile member state with Paseo after reload. Retrying an already recorded start request MUST reuse its association rather than launch a duplicate. Ambiguous interrupted creation MUST be reported for recovery without automatic relaunch.

#### Scenario: Reload after creation

- **WHEN** a plugin reloads after creating a member
- **THEN** the existing member can be inspected and managed without recreating it

### Requirement: Review, follow up, and archive owned members

The plugin SHALL show each member's observable status and latest output, allow explicit follow-ups, and archive only agents associated with the selected team. It MUST NOT automatically delete worktrees or mark failed/unknown work complete. Errors SHALL remain visible and retryable.

#### Scenario: Follow up and finish

- **WHEN** a user asks a recorded member for clarification and later archives it
- **THEN** the prompt reaches that agent, its result remains inspectable, and unrelated agents/workspaces are untouched

### Requirement: Bounded helper roles and explicit creation

New members SHALL use Researcher, Writer, or Worker roles. The existing primary agent SHALL remain Tech Lead; the plugin MUST NOT spawn a lead. Researcher SHALL investigate external sources, cite sources and retrieval dates, distinguish inference, and only write requested reports under `.paseo-agent-team/handoff/`. Writer SHALL write only `docs/`, using verifiable facts and the available tech-doc skill. Worker SHALL perform only simple, explicitly bounded, independently verifiable chores and return complex or architectural tasks to the lead. Every helper MUST leave `openspec/` and `adr/` to the Tech Lead, return condensed deliverables, and never delegate further.

The creation form SHALL initially select Researcher with no chosen profile or task. Actual startup MUST require an explicit task, available profile/model choice, and user action. Role model preferences SHALL be visible as guidance, never forced or silently substituted. Worker MUST use a worktree; Writer and Researcher MAY use the current workspace or an explicitly selected worktree. Scope prompts MUST NOT be described as OS-enforced permissions.

#### Scenario: Start external research

- **WHEN** the user explicitly starts Researcher with a selected configuration and external research task
- **THEN** its instructions require concise sourced findings, preserve lead ownership, and prohibit project edits outside requested handoff reports

#### Scenario: Start documentation work

- **WHEN** the user starts Writer
- **THEN** its instructions allow edits only under `docs/`, prohibit OpenSpec/ADR changes, and require a concise change summary

#### Scenario: Start a bounded worker task

- **WHEN** the user selects Worker
- **THEN** creation uses an isolated worktree and instructs the member to stop and report if architecture or complex work is needed

#### Scenario: Open the role selector

- **WHEN** the panel opens without an explicit launch
- **THEN** Researcher, Writer, and Worker are selectable, Tech Lead is explained as the existing primary agent, and no helper starts

### Requirement: Preserve legacy member records

The plugin SHALL read version 1 state containing reviewer or implementer members, display their original role as legacy, and retain tasks, IDs, configuration, output, follow-up, and archive support. It MUST NOT relabel them as a different current role, accept these roles for new starts, or recreate them on refresh.

#### Scenario: Refresh a team from the earlier plugin

- **WHEN** saved state includes a reviewer or implementer member
- **THEN** that record remains readable and manageable under its original role while new creation accepts only Researcher, Writer, or Worker
