# paseo-agent-team-plugin Specification

## Purpose

Provide explicit, recoverable agent team collaboration within Paseo while keeping the standalone OpenSpec workflow independent.

## Requirements

### Requirement: Native Agent Team panel

The plugin SHALL provide a workspace panel and command entry named Agent Team, using native, theme-aware UI on desktop and compact clients. It SHALL display active OpenSpec changes and task counts without executing a shell command from the client. It SHALL integrate workspace setup inspection, explicit initialization or repair, installation output, and primary-agent onboarding guidance alongside the existing explicit member controls. Workflow setup jobs alone MAY be observed periodically while running; team status SHALL remain explicitly refreshed.

#### Scenario: View project workflow

- **WHEN** Agent Team opens in a workspace
- **THEN** it reads local OpenSpec task progress, component readiness, and persisted associations without starting an agent or installing files

#### Scenario: Finish setup

- **WHEN** installation completes
- **THEN** the panel refreshes setup and workflow progress and presents member controls with current readiness

### Requirement: Persist and reconcile team membership
The plugin SHALL persist role configuration and agent associations under `.paseo-agent-team/` in the originating workspace, atomically and with schema validation. It MUST mark this runtime directory ignored, preserve unrelated ignore entries, serialize mutations within a workspace, and reconcile member state with Paseo after reload. Retrying an already recorded start request MUST reuse its association rather than launch a duplicate. Ambiguous interrupted creation MUST be reported for recovery without automatic relaunch. Custom member records SHALL snapshot their name and optional responsibilities at creation; later preset updates or deletion MUST NOT alter those records.

#### Scenario: Reload after creation

- **WHEN** a plugin reloads after creating a member
- **THEN** the existing member can be inspected and managed without recreating it

#### Scenario: Recover a custom member

- **WHEN** startup succeeds but its reply is lost, then the user retries or reloads
- **THEN** the member retains its custom name and responsibilities, reuses its original association, and remains follow-up/archive capable

### Requirement: Review, follow up, and archive owned members

The plugin SHALL show each member's observable status and latest output, allow explicit follow-ups, and archive only agents associated with the selected team. It MUST NOT automatically delete worktrees or mark failed/unknown work complete. Errors SHALL remain visible and retryable.

#### Scenario: Follow up and finish

- **WHEN** a user asks a recorded member for clarification and later archives it
- **THEN** the prompt reaches that agent, its result remains inspectable, and unrelated agents/workspaces are untouched

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

### Requirement: Separate standing responsibilities from task messages
The member system prompt SHALL contain role responsibilities and shared team rules only. Creation SHALL omit Paseo's initial message field and SHALL NOT start an assignment. The agent SHALL wait for work sent explicitly through its conversation or the panel message action; standing responsibilities SHALL NOT themselves trigger work. Custom responsibilities SHALL be optional, labeled as ongoing role guidance in the form, with only one responsibility input. Built-in responsibilities SHALL be supplied automatically with optional detail disclosure.

#### Scenario: Create and follow up on a member

- **WHEN** any member is created and later receives its first assignment
- **THEN** creation sends no user message, standing responsibilities stay in the system prompt, and the explicit assignment reaches the existing member once

### Requirement: Current member model
Persisted members and new creation SHALL use the same current role set: Researcher, Writer, Worker, and Custom. Member records SHALL contain role configuration and runtime associations without a task field. Member details SHALL display current responsibilities and runtime results without legacy role labels or historical-task sections. Invalid records SHALL fail ordinary schema validation without being rewritten, migrated, or automatically recreated.

#### Scenario: Inspect a current member

- **WHEN** a configured member is reloaded and inspected
- **THEN** its role, responsibilities, agent association, and results remain available using the current contract

#### Scenario: Invalid member data

- **WHEN** persisted member data does not match the current schema
- **THEN** reading fails without changing the file or creating an agent
