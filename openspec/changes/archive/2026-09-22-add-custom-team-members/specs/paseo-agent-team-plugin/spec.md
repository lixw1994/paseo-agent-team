## MODIFIED Requirements

### Requirement: Persist and reconcile team membership

The plugin SHALL persist task and agent associations under `.paseo-agent-team/` in the originating workspace, atomically and with schema validation. It MUST mark this runtime directory ignored, preserve unrelated ignore entries, serialize mutations within a workspace, and reconcile member state with Paseo after reload. Retrying an already recorded start request MUST reuse its association rather than launch a duplicate. Ambiguous interrupted creation MUST be reported for recovery without automatic relaunch. Custom member records SHALL snapshot their name and optional responsibilities at launch; later template updates or deletion MUST NOT alter those records.

#### Scenario: Reload after creation

- **WHEN** a plugin reloads after creating a member
- **THEN** the existing member can be inspected and managed without recreating it

#### Scenario: Recover a custom member

- **WHEN** startup succeeds but its reply is lost, then the user retries or reloads
- **THEN** the member retains its custom name and responsibilities, reuses its original association, and remains follow-up/archive capable


### Requirement: Bounded helper roles and explicit creation

New members SHALL use Researcher, Writer, Worker, or Custom roles. Custom members SHALL have a nonblank display name and optional standing responsibilities; their task SHALL remain required. The existing primary agent SHALL remain Tech Lead; the plugin MUST NOT spawn a lead. Researcher SHALL investigate external sources, cite sources and retrieval dates, distinguish inference, and only write requested reports under `.paseo-agent-team/handoff/`. Writer SHALL write only `docs/`, using verifiable facts and the available tech-doc skill. Worker SHALL perform only simple, explicitly bounded, independently verifiable chores and return complex or architectural tasks to the lead. Every helper MUST leave `openspec/` and `adr/` to the Tech Lead, return condensed deliverables, and never delegate further.

The creation form SHALL initially select Researcher with no chosen profile or task. Actual startup MUST require an explicit task, available profile/model choice, and user action. Role model preferences SHALL be visible as guidance, never forced or silently substituted. Worker MUST use a worktree; Writer, Researcher, and Custom members MAY use the current workspace or an explicitly selected worktree. Custom roles SHALL have no automatically selected model. Scope prompts MUST NOT be described as OS-enforced permissions.

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
- **THEN** Researcher, Writer, Worker, and Custom are selectable, Tech Lead is explained as the existing primary agent, and no helper starts

#### Scenario: Start a custom member without standing guidance

- **WHEN** the user supplies a Custom name, task, available profile, and explicit launch action, leaving responsibilities empty
- **THEN** one custom member starts with shared team rules and its task message, without requiring duplicate task text in a role field

#### Scenario: Validate custom identity

- **WHEN** a launch lacks a Custom name, exceeds field limits, or attaches custom metadata to a built-in role
- **THEN** validation rejects it before any workspace or agent is created


### Requirement: Preserve legacy member records

The plugin SHALL read version 1 state containing reviewer or implementer members, display their original role as legacy, and retain tasks, IDs, configuration, output, follow-up, and archive support. It MUST NOT relabel them as a different current role, accept these roles for new starts, or recreate them on refresh.

#### Scenario: Refresh a team from the earlier plugin

- **WHEN** saved state includes a reviewer or implementer member
- **THEN** that record remains readable and manageable under its original role while new creation accepts Researcher, Writer, Worker, or Custom

## ADDED Requirements

### Requirement: Separate standing responsibilities from task messages

The member system prompt SHALL contain role responsibilities and shared team rules only. The current task SHALL be delivered once through Paseo's initial message field. Custom responsibilities SHALL be optional, labeled as standing guidance in the form, and distinct from task-specific goals and acceptance criteria. Built-in responsibilities SHALL be supplied automatically with optional detail disclosure.

#### Scenario: Create and follow up on a member

- **WHEN** any member is created and later receives a follow-up
- **THEN** its original task appears only in its initial user message, while standing responsibilities stay in the system prompt and the follow-up supplies the next assignment
