# OpenSpec baseline

The specifications describe the implemented Paseo Agent Team capabilities as of 2026-09-22. The change history starts empty; these baseline specs do not represent pending implementation work.

| Capability | Current behavior |
|------------|------------------|
| [Workflow installation](./specs/one-click-install/spec.md) | Standalone installation, selected upgrades, and compatibility handling |
| [Discipline hooks](./specs/discipline-hooks/spec.md) | OpenSpec validation and accepted ADR protection before commits |
| [On-demand collaboration](./specs/on-demand-collaboration/spec.md) | Solo default, explicit membership, and Tech Lead ownership |
| [Paseo plugin](./specs/paseo-agent-team-plugin/spec.md) | Native panel, bounded helper roles, persistence, recovery, and member operations |

Use `spec-driven-with-adr` for significant changes and `minimalist` for exploratory spikes. Keep active work under `changes/<change>/`; move completed work to `changes/archive/` after synchronizing current specs.

```bash
openspec list --json
openspec validate --all --strict
```

At the baseline, the list contains no active changes and all four specifications validate. See the [engineering workflow](../docs/workflow.md) for subsequent changes and the [architecture overview](../docs/architecture.md) for the baseline ADR index.
