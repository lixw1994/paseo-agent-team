# ADR-0010: Use current workflow identifiers during development

- Status: accepted, supersedes ADR-0002 and ADR-0003
- Date: 2026-09-22
- Supersedes: ADR-0002, ADR-0003

## Context

ADR-0002 and ADR-0003 require former installer identifiers and environment aliases. The product is in development and the user requires the current model without unsolicited compatibility. Those commitments need replacement while retaining the engineering discipline and safe repeatable installation.

## Decision

Use only `paseo-agent-team` managed instruction markers and hook identity, `.paseo-agent-team.yaml`, `PASEO_AGENT_TEAM_REPO`, and `PASEO_AGENT_TEAM_SKIP_HOOKS`. Do not add compatibility aliases or convert, delete, or reset former project formats unless explicitly required.

Retain the OpenSpec `spec-driven-with-adr` workflow: significant changes follow proposal → specs → design → ADR → tasks, implementation, verification, specification synchronization, and archive. Small fixes may proceed directly; spikes may use `minimalist`, but adoption requires the full design and ADR work. Consult current specs and in-force decisions before design, keep numbered accepted ADRs immutable, supersede with new records, and maintain `docs/architecture.md`.

Retain standalone installation defaults `openspec,adr,skills,hooks` and replacement subset selection. Refresh the current managed instruction block and selected assets, preserve surrounding user content, validate malformed markers, and avoid source-to-self copies. Rerun OpenSpec initialization to repair partial integration, preserve existing project context, and give remediation guidance when prerequisites are unavailable. Read general and schema skill manifests independently of plugin sources; record this run's components and source version in the ignored manifest. Preserve unrelated project files and directories.

Resolve hooks through Git for each workspace, preserve and chain user hooks, and avoid backing up or recursively invoking managed shims. The shim invokes versioned discipline logic from the committing worktree. Validate OpenSpec when available and reject mutation of existing numbered ADRs. The current named environment variable is the sole maintenance bypass.

Keeping dormant aliases was rejected because it adds an unsupported contract. Replacing user-owned files was rejected because it loses project content. Workflow installation continues to exclude this repository's capability specs, numbered ADRs, plugin dependencies, and team runtime state.

## Consequences

- Positive: installer, panel inspection, documentation, and regressions describe one current contract while retaining safe repair and engineering discipline.
- Trade-off: former identifiers receive no special installation handling. Hooks remain local, and missing OpenSpec skips validation with a notice.
- Constraint: compatibility requires an explicit future requirement. Accepted historical ADRs remain unchanged.
