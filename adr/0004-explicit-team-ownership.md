# ADR-0004: Keep one Tech Lead and explicitly requested helpers with bounded responsibilities

- Status: accepted
- Date: 2026-09-22
- Supersedes: —
- Record type: retroactive baseline

## Context

The user wants deliberate collaboration while keeping architectural judgment and core implementation with the existing primary agent. Helpers should isolate research and drafting context or handle simple chores without forming another leadership layer.

## Decision

Work solo by default. The existing primary agent is Tech Lead and owns architecture, core code, maintenance, all OpenSpec/ADR artifacts, and final review. Never create another lead automatically.

| Helper | Responsibility | Write scope |
|--------|----------------|-------------|
| Researcher | External information, concise findings with sources and retrieval dates | Requested reports under `.paseo-agent-team/handoff/` only |
| Writer | Documentation grounded in project facts and the available tech-doc skill | `docs/` only |
| Worker | Simple, explicit, independently verifiable chores; stop when complex or architectural judgment is needed | Assigned files in an isolated worktree; no OpenSpec/ADR edits |

Every launch requires a task, available profile/model selection, and explicit user action. The form initially selects Researcher with configuration and task empty. Display role model preferences as guidance without silently selecting replacements. Researcher and Writer may use an explicitly selected worktree; Worker must use one.

Provide context, requirements, expected output, and acceptance criteria in handoffs. Continue independent lead work while helpers run. Helpers return condensed deliverables and do not delegate further. The lead personally reviews results, including Worker code line by line, before integration.

Keep persisted Reviewer/Implementer records readable and manageable as legacy roles without relabeling them or accepting new launches for them. Automatic fixed teams and generic implementation delegation were rejected because they change the user's ownership model. Relabeling saved members was rejected because their live instructions would no longer match their displayed identity.

## Consequences

- Positive: helper responsibilities stay predictable; difficult decisions and durable project artifacts have one owner.
- Negative: the lead remains responsible for integration, and explicit configuration takes additional user input. Legacy records require compatibility handling.
- Constraint: role scopes are prompt instructions. Actual access depends on provider permissions; the plugin does not enforce them as filesystem permissions.
