# Verification: add-custom-team-members

Date: 2026-09-22. Reviewed by the primary agent / Tech Lead.

## Assessment

| Dimension | Result |
|-----------|--------|
| Completeness | 9 implementation/verification tasks complete; all five planning artifacts present |
| Correctness | 8 changed/added requirements and 17 scenarios mapped to implementation and verification |
| Coherence | Project-local templates, member snapshots, explicit launch, and one task message follow ADR-0007; earlier accepted ADR files unchanged |

No critical issues or unresolved implementation warnings. Ready for archive with current specs synchronized.

## Requirement evidence

| Requirement | Implementation | Verification |
|-------------|----------------|--------------|
| Explicit template management | `shared/templates.ts`, `server/template-service.ts`, template RPC handlers, `client/member-composer.tsx` | Real compiled panel: task-free save, update, save-as-new, delete/cancel, reload; no member state or agents created |
| Reuse independent of current task | Composer template selection copies configuration only | Browser checks preserve the task draft, restore profile/isolation, reject missing profiles, and keep custom drafts after closing |
| Durable isolated storage | Separate versioned `templates.json`, atomic replacement, shared canonical-project lock | Tests cover concurrent upserts, request identity, distinct roots/canonical aliases, limits, unavailable profiles, corrupt state, and symlinks |
| Persist/reconcile membership | `customRole` snapshot and existing request-ID recovery | Lost-reply, reload, follow-up/archive tests; template deletion preserves independent member snapshots |
| Bounded roles and explicit creation | Custom validation, unchanged preset map and Worker worktree enforcement | Tests reject blank/oversize/malformed custom definitions and preset overrides before creation; optional custom guidance works |
| Legacy records | Existing reviewer/implementer schema and display remain supported | Existing legacy management and role-rejection regression tests pass |
| Separate responsibilities/task messages | `memberPrompt` contains standing guidance; `paseo-runtime.ts` passes the task only as `prompt` | SDK adapter test inspects all four role requests and custom titles; UI distinguishes responsibilities and Task |
| Single Tech Lead ownership | Shared system rules, updated `AGENTS.md`, ADR-0007 | Prompt tests preserve lead ownership, no further agents, and preset restrictions; docs/instructions match |

## Automated checks

- `npm --prefix plugins/paseo-agent-team run typecheck` — passed against Paseo SDK 0.8.0.
- `npm --prefix plugins/paseo-agent-team test` — 27 passed, 0 failed.
- `bash -n init.sh scripts/pre-commit.sh scripts/regression-test.sh` — passed.
- `bash scripts/regression-test.sh` — all 7 regression groups passed, including updated managed instructions.
- `openspec validate --all --strict` — passed for the change and current specs.
- Affected documentation links/anchors and `git diff --check` — passed.

## Runtime and UI checks

Reloaded the local `paseo-agent-team` plugin and confirmed `running` with no plugin error. Loaded its actual compiled client bundle in the React Native Web verification harness and used the real daemon template RPCs in a temporary Git workspace. Simulated a lost save response after the real write; retry reused the same template ID and produced one saved entry. Confirmed templates contain no task and create no member state.

Checked light/dark layouts at 1280, 390, and 320 pixels, plus a 380-pixel panel within a wide desktop viewport. No horizontal overflow or client errors were observed. Verified missing-profile blocking/reselection, custom creation error/retry identity, responsibility edits changing the launch signature, saved launch details, follow-up controls, and preset switching without custom metadata.

Agent mutations in browser checks used fixtures; actual agent processes were not launched for verification. Server lifecycle tests and captured SDK create requests verify launch configuration and task delivery. Native mobile-device rendering was not exercised; compact layouts were checked in the compiled web harness.

## Spec synchronization

Synchronized all three delta paths: `custom-member-templates` (new), `paseo-agent-team-plugin`, and `on-demand-collaboration`. Rechecked all 8 requirement bodies and their scenarios against the deltas, preserving unrelated requirements and existing scenarios. Used the user's authorization to skip Git checkpoints in the current main workspace; no commits or pushes.
