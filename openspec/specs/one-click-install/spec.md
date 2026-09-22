# one-click-install Specification

## Purpose

Install the standalone OpenSpec engineering workflow into a Git project with merge-based, repeatable upgrades. Paseo Agent Team is distributed separately and is never required by the workflow installer.

## Requirements

### Requirement: Standalone engineering workflow

`init.sh` SHALL install AGENTS instructions, OpenSpec schemas, ADR rules, general skills, and discipline hooks with defaults `openspec,adr,skills,hooks`. `--with` SHALL select a replacement subset. The installer MUST NOT require Paseo, install a plugin, launch agents, or accept unsupported components. It SHALL support local and remote sources, language/tool selection, progressive dependency handling, and onboarding guidance.

#### Scenario: Default standalone installation

- **WHEN** the installer runs in a Git project with OpenSpec available and Paseo absent
- **THEN** the complete engineering workflow is installed without any team runtime directory or plugin dependency

#### Scenario: Unsupported component selection

- **WHEN** `--with squad` is supplied
- **THEN** installation fails before changing the target and lists the supported workflow components

### Requirement: Managed instructions and upgrade compatibility

New installations SHALL use `paseo-agent-team` marker blocks, `.paseo-agent-team.yaml`, and `PASEO_AGENT_TEAM_REPO`. Upgrades MUST recognize legacy copilot-workflow markers and hook shims, replace the managed block with exactly one new block, preserve surrounding user content, and avoid chaining the old managed hook recursively. Malformed or mixed marker blocks MUST fail before replacement. Legacy environment aliases SHALL remain accepted for migration.

#### Scenario: Upgrade a legacy installation

- **WHEN** an existing project has a legacy managed block and hook
- **THEN** the block migrates once, user instructions and previous user hook backups remain intact, and rerunning is idempotent

### Requirement: Safe selected-component upgrades

Selected managed schemas and skills SHALL refresh without deleting user-owned content. Missing OpenSpec SHALL skip that component with guidance; failed initialization SHALL be retried on rerun. Self-install MUST preserve source assets. The manifest SHALL describe this run's components. The installer MUST NOT remove unrelated legacy runtime directories in other projects.

#### Scenario: Repair incomplete initialization

- **WHEN** a previous initialization left a partial OpenSpec workspace
- **THEN** rerunning repairs generated workflow skills and records success only after initialization completes

#### Scenario: Reinitialize an existing OpenSpec configuration

- **WHEN** the target already has `openspec/config.yaml`
- **THEN** initialization omits the CLI's creation-only language option and preserves existing context and language instructions

### Requirement: Workflow and plugin distribution are independent

The workflow source checks SHALL depend only on workflow assets. Plugin code, dependencies, and team state MUST NOT be copied into target projects by the installer.

#### Scenario: Install without plugin source

- **WHEN** a local source contains workflow assets but no plugin directory
- **THEN** workflow installation succeeds normally
