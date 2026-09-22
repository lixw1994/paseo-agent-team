# ADR-0006: Reuse the standalone installer for explicit panel setup

- Status: accepted
- Date: 2026-09-22
- Supersedes: —

## Context

Installing the daemon plugin does not initialize each project's engineering workflow. Users need to inspect and initialize projects without leaving the panel, while the standalone installer must remain independently usable. Paseo 0.8 bundles server code without a runtime source-directory contract and limits individual RPC duration.

## Decision

Package the repository's standalone installer and declared workflow assets into a generated server-only bundle during plugin preparation. Keep the installer as the installation authority. Run that trusted snapshot from a temporary source directory only after an explicit workspace setup action. Never download replacement installer code implicitly or install global prerequisites automatically.

Resolve the destination through Paseo's workspace API. Inspect actual components and prerequisites, validate managed paths, and show the installation scope before running. Expose installation through start, inspect/status, and cancel operations rather than one long RPC. Bound execution time and output; persist the last job in ignored project state. Report abandoned jobs as interrupted and partial results as partial. Setup never creates agents; existing primary agents own codebase onboarding and architectural work.

Duplicating the installer in TypeScript was rejected because two implementations would drift. Downloading the latest shell script for each panel action was rejected because installation would no longer use the trusted plugin's revision. Waiting for installation inside one RPC was rejected because host timeouts obscure the result.

## Consequences

- Positive: panel and standalone setup use the same installation rules, and another project needs no extra source checkout.
- Negative: plugin preparation must regenerate asset snapshots, and updating workflow assets requires updating the plugin's source first.
- Constraint: installation is repairable but not transactional. Cancellation leaves completed changes in place. Shared Git hooks can affect sibling worktrees, so the effective path is visible and missing discipline scripts are tolerated there.
- Constraint: runtime setup state remains separate from current OpenSpec capabilities and durable ADRs; opening the panel stays read-only.
