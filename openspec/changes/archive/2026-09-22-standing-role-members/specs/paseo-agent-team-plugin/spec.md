## MODIFIED Requirements

### Requirement: Persist and reconcile team membership
The plugin SHALL persist role configuration and agent associations under `.paseo-agent-team/` in the originating workspace, atomically and with schema validation. It MUST mark this runtime directory ignored, preserve unrelated ignore entries, serialize mutations within a workspace, and reconcile member state with Paseo after reload. Retrying an already recorded start request MUST reuse its association rather than launch a duplicate. Ambiguous interrupted creation MUST be reported for recovery without automatic relaunch. Custom member records SHALL snapshot their name and optional responsibilities at creation; later preset updates or deletion MUST NOT alter those records.

#### Scenario: Reload after creation

- **WHEN** a plugin reloads after creating a member
- **THEN** the existing member can be inspected and managed without recreating it

#### Scenario: Recover a custom member

- **WHEN** startup succeeds but its reply is lost, then the user retries or reloads
- **THEN** the member retains its custom name and responsibilities, reuses its original association, and remains follow-up/archive capable

### Requirement: Bounded helper roles and explicit creation
New members SHALL use Researcher, Writer, Worker, or Custom roles. Custom members SHALL have a nonblank display name and optional standing responsibilities; creation SHALL NOT require a task. The existing primary agent SHALL remain Tech Lead; the plugin MUST NOT spawn a lead. Researcher SHALL investigate external sources, cite sources and retrieval dates, distinguish inference, and only write requested reports under `.paseo-agent-team/handoff/`. Writer SHALL write only `docs/`, using verifiable facts and the available tech-doc skill. Worker SHALL perform only simple, explicitly bounded, independently verifiable chores and return complex or architectural tasks to the lead. Every helper MUST leave `openspec/` and `adr/` to the Tech Lead, return condensed deliverables, and never delegate further.

The creation form SHALL initially select Researcher with no chosen profile. Creation MUST require an available profile/model choice and explicit user action; the form SHALL contain no separate Task field. Role model preferences SHALL be visible as guidance, never forced or silently substituted. Worker MUST use a worktree; Writer, Researcher, and Custom members MAY use the current workspace or an explicitly selected worktree. Custom roles SHALL have no automatically selected model. Scope prompts MUST NOT be described as OS-enforced permissions.

#### Scenario: Start external research

- **WHEN** the user explicitly creates Researcher with a selected configuration
- **THEN** the agent awaits a later assignment and its instructions require concise sourced findings, preserve lead ownership, and prohibit project edits outside requested handoff reports

#### Scenario: Start documentation work

- **WHEN** the user starts Writer
- **THEN** its instructions allow edits only under `docs/`, prohibit OpenSpec/ADR changes, and require a concise change summary

#### Scenario: Start a bounded worker task

- **WHEN** the user selects Worker
- **THEN** creation uses an isolated worktree and instructs the member to stop and report if architecture or complex work is needed

#### Scenario: Open the role selector

- **WHEN** the panel opens without an explicit launch
- **THEN** Researcher, Writer, Worker, and Custom are selectable, Tech Lead is explained as the existing primary agent, and no helper starts

#### Scenario: Start a custom member without standing guidance

- **WHEN** the user supplies a Custom name, available profile, and explicit creation action, leaving responsibilities empty
- **THEN** one custom member is created with shared team rules and awaits an assignment without an initial message

#### Scenario: Validate custom identity

- **WHEN** a launch lacks a Custom name, exceeds field limits, or attaches custom metadata to a built-in role
- **THEN** validation rejects it before any workspace or agent is created


#### Scenario: Reject an outdated task-bearing creation request

- **WHEN** a stale client sends a task in a new creation request
- **THEN** validation rejects the request before creating state, a worktree, or an agent

### Requirement: Preserve legacy member records
The plugin SHALL read version 1 state with or without a stored task and retain IDs, configuration, output, follow-up, and archive support. Stored tasks SHALL remain historical assignments, displayed in member details and never promoted to standing responsibilities or replayed. Reviewer and implementer members SHALL retain their original role displayed as legacy. It MUST NOT relabel them as a different current role, accept these roles for new starts, or recreate them on refresh.

#### Scenario: Refresh a team from the earlier plugin

- **WHEN** saved state includes a reviewer or implementer member
- **THEN** that record remains readable and manageable under its original role while new creation accepts Researcher, Writer, Worker, or Custom


#### Scenario: Inspect an older assignment

- **WHEN** an existing custom or built-in member has a stored task
- **THEN** its original task remains historical detail and refresh never submits it as new work

### Requirement: Separate standing responsibilities from task messages
The member system prompt SHALL contain role responsibilities and shared team rules only. Creation SHALL omit Paseo's initial message field and SHALL NOT start an assignment. The agent SHALL wait for work sent explicitly through its conversation or the panel message action; standing responsibilities SHALL NOT themselves trigger work. Custom responsibilities SHALL be optional, labeled as ongoing role guidance in the form, with only one responsibility input. Built-in responsibilities SHALL be supplied automatically with optional detail disclosure.

#### Scenario: Create and follow up on a member

- **WHEN** any member is created and later receives its first assignment
- **THEN** creation sends no user message, standing responsibilities stay in the system prompt, and the explicit assignment reaches the existing member once
