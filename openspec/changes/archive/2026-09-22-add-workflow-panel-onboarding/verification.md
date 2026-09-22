# Verification: panel workflow onboarding

- Date: 2026-09-22
- Result: implementation matches the seven changed requirements; all eight implementation tasks complete.
- Git workflow: user explicitly authorized skipping lifecycle commit checkpoints; no commit or push performed.

## Requirement coverage

| Requirement | Evidence |
|-------------|----------|
| Read-only setup inspection | Setup service tests confirm partial detection and no state/ignore writes; live daemon inspection reports actual project and component readiness |
| Explicit bundled installation | Service validation rejects missing prerequisites, duplicate components, unsafe destinations, and nested Git targets; actual panel initializes a temporary Git project with Chinese artifact language |
| Observable bounded jobs | Tests cover concurrent request reuse, rejection of another start, cancellation, timeout, plugin shutdown, orphaned running records, and bounded process output |
| Primary-agent onboarding | Panel provides selectable prompt and verified Copy action; runtime installation creates setup state but no member state or agents |
| Native panel integration | Installed plugin compiles and reloads successfully; its actual compiled client bundle renders through React Native Web against the real daemon RPCs |
| Git hook layouts | Shell regressions cover linked worktrees, effective custom hook paths, chained user hooks, and an uninitialized sibling checkout |
| Shared installation source | Preparation packages 31 declared files; panel installs that bundle through the same root installer; repeat installation preserves instructions and existing language |

## Completed checks

- 19 plugin tests passed, including 9 setup/process tests and 10 existing team tests.
- 7 installer regression groups passed.
- TypeScript checking and shell syntax checks passed.
- OpenSpec strict validation, Markdown relative-link checks, and Git whitespace checks passed.
- Real Paseo 0.8.0 daemon: plugin reports `running`, setup inspection succeeds, panel installation succeeds, and persisted results remain available after reload.
- UI: 1280 px desktop and 390 px compact layouts, light/dark themes, review/install/repair controls, and clipboard action exercised; no horizontal overflow detected. Screenshots inspected.

## Verification boundary

UI interaction used the installed plugin's compiled bundle in an isolated React Native Web host harness connected to the actual daemon. The full Paseo Desktop shell and a physical mobile client were not separately automated. Only temporary verification projects were initialized; no team members were launched. Installation is repairable rather than transactional, and concurrent independent plugin processes remain unsupported as documented.
