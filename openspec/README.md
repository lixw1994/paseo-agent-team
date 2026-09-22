# Capability specifications

These specifications describe the supported behavior of Paseo Agent Team. Update them through the change workflow when implemented capabilities change.

| Capability | Scope |
|------------|-------|
| [Workflow installation](./specs/one-click-install/spec.md) | Standalone installation and managed asset updates |
| [Discipline hooks](./specs/discipline-hooks/spec.md) | OpenSpec validation and accepted ADR protection |
| [On-demand collaboration](./specs/on-demand-collaboration/spec.md) | Solo default, explicit membership, and Tech Lead ownership |
| [Paseo plugin](./specs/paseo-agent-team-plugin/spec.md) | Native panel, helper roles, state, and member operations |

Use `spec-driven-with-adr` for significant changes and `minimalist` for exploratory spikes. Active work belongs in `changes/<change>/`; completed work moves to `changes/archive/` after current specs are synchronized.

```bash
openspec list --json
openspec validate --all --strict
```

The first command lists current active changes; the second validates specs and active artifacts. See the [engineering workflow](../docs/workflow.md) and [architecture overview](../docs/architecture.md).
