## REMOVED Requirements

### Requirement: Managed instructions and upgrade compatibility

**Reason**: Development supports current identifiers without obsolete-name compatibility branches.
**Migration**: None. No automatic conversion or deletion of unrelated project data is provided.

## ADDED Requirements

### Requirement: Current managed installation

Installation SHALL use `paseo-agent-team` instruction markers and hook identity, `.paseo-agent-team.yaml`, and `PASEO_AGENT_TEAM_REPO`. Rerunning SHALL replace exactly one current managed block, preserve surrounding user content and user hooks, and avoid backing up or recursively chaining its own managed hook. Malformed current marker blocks MUST fail before replacement. The installer and panel SHALL implement only these current identifiers without compatibility aliases or automatic conversion of former formats.

#### Scenario: Repeat a current managed installation

- **WHEN** a project with a current managed block, managed hook, and user hook backup is installed again
- **THEN** the managed block is refreshed once, surrounding user instructions stay intact, and the user hook is still invoked exactly once

#### Scenario: Reject duplicate or reversed markers

- **WHEN** a project's instructions contain duplicate current blocks or an end marker before its begin marker
- **THEN** installation fails and the instructions remain unchanged

## MODIFIED Requirements

### Requirement: Safe selected-component upgrades

Selected managed schemas and skills SHALL refresh without deleting user-owned content. Missing OpenSpec SHALL skip that component with guidance; failed initialization SHALL be retried on rerun. Self-install MUST preserve source assets. The manifest SHALL describe this run's components. The installer MUST NOT remove unrelated project files or directories.

#### Scenario: Repair incomplete initialization

- **WHEN** a previous initialization left a partial OpenSpec workspace
- **THEN** rerunning repairs generated workflow skills and records success only after initialization completes

#### Scenario: Reinitialize an existing OpenSpec configuration

- **WHEN** the target already has `openspec/config.yaml`
- **THEN** initialization omits the CLI's creation-only language option and preserves existing context and language instructions
