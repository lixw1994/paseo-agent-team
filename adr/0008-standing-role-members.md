# ADR-0008: Create standing-role members before assigning work

- Status: accepted, supersedes ADR-0007
- Date: 2026-09-22
- Supersedes: ADR-0007

## Context

The user clarified that member configuration describes a continuing role. ADR-0007's mandatory initial task conflates configuring a member with assigning work and makes its responsibilities field appear redundant. Paseo supports creating an agent without an initial prompt.

## Decision

Create members from role, standing responsibilities, selected profile/model, and isolation. Built-in roles supply their instructions; Custom requires a name and allows optional responsibilities. Creation sends only standing instructions and shared rules as system context, with no initial user message. Responsibilities do not authorize autonomous work. Assign concrete work later through the member's Paseo conversation or the panel's message action.

Keep the existing primary agent as sole Tech Lead responsible for architecture, core development, maintenance, OpenSpec/ADR, and final review. Work solo unless collaboration is explicitly requested. Researcher handles external sources and requested handoff reports; Writer writes only `docs/`; Worker handles simple bounded chores in a required worktree. Custom follows user-defined responsibilities under the same shared rules. Researcher, Writer, and Custom may use the current workspace or an explicitly selected worktree. Helpers return condensed results, report complex decisions to the lead, and never delegate. The lead personally reviews all output, including worker code line by line.

Present reusable custom configurations as project Presets. Keep their stable IDs, separate versioned atomic storage, optional responsibilities, profile reference, and isolation preference. Saving, selecting, and deleting presets never create an agent. A member snapshots its configuration; preset updates do not change existing members. Creation defaults to Researcher without a chosen profile, and model preferences remain advisory. Provider permissions determine actual access.

New creation requests contain no task and reject stale task-bearing requests. Version 1 stored members may omit task; historical tasks remain readable assignments, never standing instructions or replayed messages. Legacy Reviewer/Implementer identities remain manageable but unavailable for new creation. Existing recovery and ownership checks continue to prevent duplicate creation.

Keeping Task as an optional creation field was rejected because it retains the confusing dual-input model. Sending responsibilities as an initial message was rejected because it could start unrequested work. Renaming historical tasks to responsibilities was rejected because it misrepresents existing records.

## Consequences

- Positive: users configure an ongoing role once, reuse presets, and assign successive work in its conversation.
- Negative: assigning the first task requires a separate message after creation; stale clients must reload before creating members.
- Constraint: existing state remains readable without migration, but older plugin versions requiring task cannot read newly created taskless records. Presets remain project-local, and existing members retain their creation configuration.
