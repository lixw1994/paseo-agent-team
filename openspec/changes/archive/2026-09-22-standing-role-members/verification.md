# Verification: standing-role-members

Date: 2026-09-22. Verified by the primary agent on the existing main workspace under the user's explicit no-commit/no-push workflow exception.

| Dimension | Result |
| --- | --- |
| Completeness | All 6 tasks and 7 modified requirements implemented; three capability deltas synchronized |
| Correctness | 29 plugin tests passed, including no-prompt creation, idle first assignment, historical tasks, recovery, presets, and setup |
| Coherence | ADR-0008 and design match the standing-role model; prior accepted ADRs remain unchanged |

## Requirement evidence

| Requirement | Implementation and validation |
| --- | --- |
| Persist and reconcile team membership | `shared/team.ts`, `server/team-service.ts`; taskless records persist, retries reuse IDs, custom identity survives recovery |
| Bounded helper roles and explicit creation | `client/member-composer.tsx`, `shared/team.ts`; built-ins retain scopes, Custom responsibilities optional, no Task field, explicit profile and creation |
| Preserve legacy member records | Optional stored task schema, historical details in `client/team-panel.tsx`; old built-in, Custom, Reviewer, and Implementer records remain readable and manageable |
| Separate standing responsibilities from task messages | `server/paseo-runtime.ts` omits prompt; runtime tests cover all four roles and exclude historical task replay; explicit messages use the existing owned-member endpoint |
| Explicit project-local template management | Real installed preset CRUD exercised in an isolated temporary project; save reply loss reuses the UUID, selection and saving create no agents |
| Reuse configuration independently of the current task | Browser checks restore responsibilities/profile/isolation, preserve closed-form draft/retry identity, and block an unavailable profile without fallback |
| User-controlled team membership | Opening the panel and preset operations are read-only with respect to agents; creation and assignment remain separate explicit actions |

## Checks

- TypeScript typecheck passed; installed `paseo-agent-team` plugin reloaded and reports `running` with no plugin error.
- All 29 plugin tests passed; all 7 installer regression groups passed; shell syntax and `git diff --check` passed.
- `openspec validate --all --strict` passed before and after syncing the three capability specs. Every delta block matches the main spec and preserves prior scenario names.
- Local links in 9 documentation files resolve. Native-client audit found only the TypeScript `useState<string | null>` generic, with no prohibited browser API or HTML usage.
- Real installed `team.start` RPC rejects an outdated task-bearing request before creating member state.
- Browser harness loads the installed client bundle with React Native Web: light desktop at 1280px, dark 390/320px layouts, and a 380px sidebar within a wide viewport. Screenshots inspected for readable fields, role selection, wrapping, and theme colors.
- Interaction checks cover no Task field, blank optional responsibilities, preset save/update/reuse/variant/delete, reload, lost replies, missing profile, taskless create payloads, first message, and historical task details.

## Validation boundaries

Member create/message/archive actions used controlled browser fixtures and service/SDK doubles; validation did not create or run a real provider agent. Preset CRUD, profile discovery, plugin compilation/reload, and stale-request rejection used the installed daemon. Paseo SDK declarations and local daemon creation code confirm that an omitted prompt does not send an initial assignment. Native mobile apps were not launched; compact layouts were exercised with the native UI's web renderer.

No unresolved critical or warning findings. Temporary verification workspace, HTTP bridge, and isolated browser are removed/stopped after checks. Source changes remain uncommitted.
