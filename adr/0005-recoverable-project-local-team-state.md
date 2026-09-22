# ADR-0005: Persist team associations locally and reconcile them with Paseo

- Status: accepted
- Date: 2026-09-22
- Supersedes: —
- Record type: retroactive baseline

## Context

Creating a member spans local storage, optional worktree creation, and Paseo agent creation. A lost response or plugin reload can leave a successful remote operation without a completed local record. Repeating an uncertain launch could create duplicate agents.

## Decision

Create `.paseo-agent-team/` only when a state mutation is needed, and ignore it in Git. Persist versioned, schema-validated member records atomically, including request IDs, agent/workspace IDs, task configuration, and collected output. Reject symlinked state and ignore files, and preserve corrupt or unsupported data for repair.

Serialize mutations by canonical originating directory within the plugin process. Persist the request before launch and each known association as it becomes available. Reuse recorded request IDs. On explicit refresh, reconcile IDs with Paseo and recover interrupted creation by team labels. Keep unresolved creation visible instead of automatically launching a replacement.

Restrict follow-up and archive operations to recorded members. Preserve results and worktrees after archival. Keep code integration, workspace deletion, and permission approvals under deliberate user or lead control. The panel refreshes on request; full live conversations remain in Paseo.

Memory-only state was rejected because reloads lose ownership and recovery information. Treating lifecycle events as a durable task queue was rejected because they do not guarantee persisted completion. Automatically retrying an uncertain create was rejected because it can duplicate work.

## Consequences

- Positive: a plugin reload can recover existing members without starting another team, and collected results survive archival.
- Negative: users must refresh to collect current status and resolve ambiguous launches. Multiple plugin processes or hosts writing the same state are unsupported.
- Constraint: team state is local operational context. It does not replace OpenSpec capabilities or architectural decisions.
