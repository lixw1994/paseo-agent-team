## Why

The development product uses the current member model, but the installer still carries obsolete names and migration branches. Overall review also reproduced cancellation and retry failures in project setup that can leave writes running or prevent an explicit repair.

## What Changes

- **BREAKING**: remove installer marker, manifest, hook, and environment compatibility for former product names; use only current Paseo Agent Team identifiers.
- Preserve current managed installation, user content and hooks, component selection, and partial initialization repair.
- Wait for process-group termination before reporting cancellation complete; clear recovered setup request identities so a later repair starts a new job.
- Replace migration regressions with current managed-installation regressions and align current documentation and architectural decisions.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `one-click-install`: current managed identifiers and repeatable installation without legacy migration.
- `discipline-hooks`: one named maintenance bypass.

## Impact

Root installer, hook, regression fixtures, plugin setup inspection and cancellation, setup panel retries, current specs, both READMEs, and affected guides. No new dependencies or automatic changes to unrelated project data. A new ADR supersedes ADR-0002 and ADR-0003 while retaining their unchanged workflow and installation rules.
