# Verification: remove-member-compatibility

Date: 2026-09-22.

| Dimension | Result |
| --- | --- |
| Completeness | Current member contract replaces legacy support; code, tests, current docs, and development policy updated |
| Correctness | Typecheck and all 28 plugin tests pass; seven installer regression groups pass |
| Coherence | ADR-0009 supersedes the compatibility commitment; no migration, reset, or new storage mechanism added |

Member storage now reuses the creation role enum, has no task property, and uses strict ordinary schema validation. Role titles and cards have no retired-role or historical-task branches. Existing current-role tests cover persistence, reload, explicit assignments, recovery, validation failures, presets, and archive. Removed compatibility tests and outdated fixtures instead of preserving them behind flags.

The installed plugin was reloaded and reports running. A browser harness loaded its actual client bundle with read-only current-member fixtures: all four roles render their responsibilities and details at 1280px light and 320px dark without horizontal overflow or script errors. No provider agent was created; native mobile apps were not launched. The isolated browser and HTTP bridge were stopped after verification.

Shell syntax, documentation links, OpenSpec strict validation, and whitespace checks pass. Source search finds no historical-task or retired-role handling in the member UI, contracts, or tests. The main spec contains the current-member requirement and no legacy-record requirement. Prior accepted ADRs and archived changes remain decision history.

No outstanding findings. Work remains on main without commits or pushes under the user's existing authorization.
