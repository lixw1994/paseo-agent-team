## Why

The project is still in development. Historical task retention and retired-role handling add compatibility work that the user does not want.

## What Changes

- **BREAKING**: member records use only the current role model, with no task field or retired role IDs.
- Remove historical task details, legacy display branches, and compatibility tests.
- Keep ordinary validation and current-member recovery; add no migration, reset, or fallback path.
- Record the development policy: compatibility requires an explicit requirement.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `paseo-agent-team-plugin`: remove legacy member support and use one current member contract.

## Impact

Shared member/role types, member cards, tests, current docs, and ADR-0009 superseding ADR-0008's compatibility decision. No dependencies or runtime data operations.
