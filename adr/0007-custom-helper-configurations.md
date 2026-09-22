# ADR-0007: Reuse custom helper configurations independently of task messages

- Status: accepted, supersedes ADR-0004
- Date: 2026-09-22
- Supersedes: ADR-0004

## Context

The user requests custom members alongside the existing presets and asks to save their configurations for reuse. A closed role set cannot express these helpers. Standing responsibilities and current tasks also overlap because the task is duplicated in the system prompt and initial message. ADR-0004's ownership rules still apply, but its restriction to three creation roles must change.

## Decision

Keep the existing primary agent as the sole Tech Lead responsible for architecture, core development, maintenance, all OpenSpec/ADR artifacts, and final review. Work solo unless collaboration is explicitly requested. Preserve Researcher (external sources and requested handoff reports), Writer (`docs/` only), and Worker (simple, bounded, verified chores in a required worktree) as presets. Add Custom with a user-defined name and optional standing responsibilities under the same shared team rules. Custom, Researcher, and Writer may use shared or explicitly isolated workspaces. All helpers return condensed results, leave complex decisions to the lead, and do not delegate further. The lead personally reviews all output, including code line by line.

Every launch still requires a concrete task, available profile/model, and explicit user action. The form initially selects Researcher with no profile or task. Preset model preferences remain guidance; Custom has none. Existing Reviewer/Implementer records remain legacy records and are not reclassified or offered as preset creation options.

Treat a reusable custom configuration as separate from an assignment. Store templates in the originating project's ignored, versioned, atomically written state, separately from members. A template contains the custom name, optional responsibilities, profile/model reference, and isolation preference. Selection fills a draft; saving and deleting are explicit operations that never launch an agent. Tasks are not template data. Each member snapshots its launch configuration so future template edits cannot change its identity or live instructions.

Send standing responsibilities and shared rules in the system prompt; send the task once as the initial user message. A follow-up carries a later assignment in the same conversation. Leaving custom responsibilities blank is valid: the task supplies the assignment without requiring repeated text. Role instructions describe behavior; provider permissions determine actual access.

Mandatory role instructions were rejected because they force duplicate input for one-off tasks. Global templates were not chosen because team state is project-scoped and provider references vary by host. Storing tasks in templates was rejected because it risks replaying old assignments. Editing existing member instructions through template updates was rejected because it would make displayed identity diverge from live agent state.

## Consequences

- Positive: users can define and reuse focused helpers without duplicating tasks or changing preset behavior and lead ownership.
- Negative: template CRUD and validation add persistent state; missing profile references require explicit reselection. Custom instructions can be less predictable than presets.
- Constraint: existing members are snapshots. Same-template concurrent updates use the last explicit save; cross-host writing remains unsupported. Old records remain readable, while an older plugin cannot read newly created custom records.
