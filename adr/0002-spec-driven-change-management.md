# ADR-0002: Manage significant changes with OpenSpec and immutable ADRs

- Status: accepted
- Date: 2026-09-22
- Supersedes: —
- Record type: retroactive baseline

## Context

Code captures implementation but does not preserve the reasons for architectural choices across agent sessions. Maintainers need current capability specifications and a durable decision record without requiring full planning artifacts for every small edit.

## Decision

Use OpenSpec with the versioned `spec-driven-with-adr` schema. Significant changes follow proposal → specs → design → ADR → tasks, followed by implementation, verification, specification synchronization, and archive. Small fixes and local refactors can proceed directly. Exploratory spikes can use `minimalist` or skip the pipeline; production adoption requires the full design and ADR work.

Treat `openspec/specs/` as current capability requirements and `adr/` as architectural decisions. Consult both before design. Number accepted ADRs sequentially and keep them immutable; a new accepted record with `Supersedes:` replaces a decision. Keep `docs/architecture.md` aligned with structural changes.

Install a local pre-commit shim that invokes versioned `scripts/pre-commit.sh`. It validates OpenSpec when the CLI is available and rejects changes to existing numbered ADRs. Preserve and chain existing user hooks. `PASEO_AGENT_TEAM_SKIP_HOOKS=1` provides an explicit maintenance bypass; retain the legacy bypass alias for upgrades.

Documentation without structured requirements was rejected because it would weaken change verification. Requiring the full pipeline for every edit was rejected because it adds cost without proportional architectural benefit.

## Consequences

- Positive: agents share current requirements and decision rationale; local hooks catch invalid artifacts and accidental ADR rewrites.
- Negative: significant work needs five artifacts, and hooks are local to each checkout. Without the OpenSpec CLI, the hook skips specification validation with a notice.
- Constraint: specification updates and architectural decisions must reflect implemented behavior. The fresh baseline records established decisions retroactively; subsequent accepted records remain append-only.
