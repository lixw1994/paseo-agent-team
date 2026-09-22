# ADR-0003: Install and upgrade managed workflow assets without replacing user content

- Status: accepted
- Date: 2026-09-22
- Supersedes: —
- Record type: retroactive baseline

## Context

Target projects may already have agent instructions, hooks, and OpenSpec configuration. Installation must support subsets, repeated upgrades, and recovery from partial initialization. The same repository also supplies its own workflow assets.

## Decision

Default to `openspec,adr,skills,hooks`; `--with` selects a replacement subset. Install the root instruction block for every successful selection. Refresh only managed directories and the `paseo-agent-team` marker block, preserving surrounding user text. Skip source-to-self copies in this template repository.

Rerun OpenSpec initialization to repair incomplete generated integration. Read general and schema-specific skill manifests independently of plugin source. Handle missing OpenSpec progressively, with remediation instructions. Record installed components and source version for the current run in ignored `.paseo-agent-team.yaml`.

Accept legacy `copilot-workflow` blocks, managed hooks, manifests, and environment aliases solely for upgrade compatibility. Migrate to current identifiers without duplicated blocks or recursive managed hook calls. Reject malformed markers and unsupported component selections. Preserve unrelated runtime directories in target projects.

Replacing complete user-owned files was rejected because it would destroy project-specific instructions. Copying plugin assets with the workflow was rejected because the distributions have independent dependencies and lifecycles.

## Consequences

- Positive: projects can install subsets, repair incomplete initialization, and refresh managed assets without discarding user instructions.
- Negative: managed markers and migration aliases add validation and regression-test obligations. Edits inside managed directories may be replaced by an upgrade.
- Constraint: project capability specs, numbered ADRs, plugin dependencies, and team runtime state are not copied from this repository into new targets.
