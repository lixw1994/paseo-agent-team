## Context

ADR-0008 introduced historical task retention and kept retired roles readable. The user explicitly rejects this compatibility work during development. In-force ADRs reviewed: 0001, 0002, 0003, 0005, 0006, 0008; 0004 and 0007 are superseded.

## Goals / Non-Goals

**Goals:** one current member contract, no historical task or retired-role branches, current documentation.

**Non-Goals:** migrations, automatic state resets, installer changes, or changes to current-member recovery.

## Decisions

| Area | Current design |
| --- | --- |
| Schema | Reuse `roleSchema`, remove `task`, reject unrecognized member fields |
| Display | Use typed current roles and standing responsibilities only |
| Tests | Keep current-role lifecycle coverage; delete compatibility scenarios and obsolete fixtures |
| Development policy | Add compatibility only for an explicit requirement |

Keeping optional legacy fields or silently normalizing old records was rejected because both preserve an unwanted compatibility path. Use existing validation failure behavior; add no state management mechanism.

## Risks / Trade-offs

- [Outdated development data fails validation] → Intentional contract break; preserve the file unchanged without migration or reset.

## Migration Plan

No migration. Typecheck, run current tests, reload the plugin, verify its rendered current-member card, and synchronize specs.

## Open Questions

None. ADR-0009 supersedes ADR-0008's compatibility commitment; its standing-role and ownership decisions continue.
