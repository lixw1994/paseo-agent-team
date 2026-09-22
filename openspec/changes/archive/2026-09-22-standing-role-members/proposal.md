## Why

The member form treats each helper as a one-off task, but users configure members to hold ongoing roles. Requiring both standing responsibilities and an initial Task obscures that model and prevents preparing a member before assigning work.

## What Changes

- Create members from a role, its standing responsibilities, profile/model, and isolation. Remove the separate Task field and create the Paseo agent without an initial message.
- Keep built-in role guidance and optional Custom responsibilities. Members receive concrete work later through their conversation or the panel message action.
- Call reusable project configurations Presets in the UI; retain save, update, reuse, and delete behavior and immutable member snapshots.
- Preserve stored historical tasks as historical assignments, never reinterpret or replay them as role instructions.
- **BREAKING**: new `team.start` requests no longer accept a task; stale clients receive validation errors instead of silently losing assignments.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `paseo-agent-team-plugin`: role-based member creation without an initial task, persistent compatibility, and conversation-based assignments.
- `custom-member-templates`: Preset terminology and configuration reuse without a task draft.
- `on-demand-collaboration`: explicit member creation separated from explicit work assignment.

## Impact

Updates shared start/member contracts, runtime creation, composer and member cards, tests, root agent instructions, both README languages, role/Paseo guides, and architecture documentation. No new dependencies or storage migration. ADR-0008 supersedes ADR-0007 while retaining ownership and snapshot rules.
