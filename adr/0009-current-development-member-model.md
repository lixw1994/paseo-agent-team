# ADR-0009: Use the current member model during development

- Status: accepted, supersedes ADR-0008
- Date: 2026-09-22
- Supersedes: ADR-0008

## Context

The project is in development. The user rejects the unsolicited historical task and retired-role compatibility introduced or retained by ADR-0008.

## Decision

Use one current member contract for creation and persistence: Researcher, Writer, Worker, and Custom, with role configuration and runtime associations and no task field. Remove legacy display branches and compatibility tests. Invalid data follows ordinary validation failure without migration, automatic reset, or agent recreation. Add future compatibility only when explicitly required.

Retain ADR-0008's standing-role model: creation supplies system instructions without an initial assignment, work arrives through explicit messages, and project Presets save reusable configuration independently of members. Each member snapshots its configuration. The existing primary agent remains the sole Tech Lead; all role scopes, isolation choices, explicit profile selection, no further delegation, and lead review rules continue. Current-member persistence and interrupted-request recovery remain required.

Keeping optional old fields or silently transforming old records was rejected because either adds a compatibility path without a product requirement.

## Consequences

- Positive: implementation, UI, and tests describe one member model.
- Trade-off: outdated development records are unsupported; the plugin neither migrates nor resets them.
- Constraint: this decision changes the member model, not the installer's separate managed-asset rules.
