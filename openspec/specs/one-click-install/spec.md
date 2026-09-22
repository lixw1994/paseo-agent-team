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

### Requirement: Current managed installation

Installation SHALL use `paseo-agent-team` instruction markers and hook identity, `.paseo-agent-team.yaml`, and `PASEO_AGENT_TEAM_REPO`. Rerunning SHALL replace exactly one current managed block, preserve surrounding user content and user hooks, and avoid backing up or recursively chaining its own managed hook. Malformed current marker blocks MUST fail before replacement. The installer and panel SHALL implement only these current identifiers without compatibility aliases or automatic conversion of former formats.

#### Scenario: Repeat a current managed installation

- **WHEN** a project with a current managed block, managed hook, and user hook backup is installed again
- **THEN** the managed block is refreshed once, surrounding user instructions stay intact, and the user hook is still invoked exactly once

#### Scenario: Reject duplicate or reversed markers

- **WHEN** a project's instructions contain duplicate current blocks or an end marker before its begin marker
- **THEN** installation fails and the instructions remain unchanged

### Requirement: Safe selected-component upgrades

Selected managed schemas and skills SHALL refresh without deleting user-owned content. Missing OpenSpec SHALL skip that component with guidance; failed initialization SHALL be retried on rerun. Self-install MUST preserve source assets. The manifest SHALL describe this run's components. The installer MUST NOT remove unrelated project files or directories.

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

### Requirement: Hook installation follows Git workspace layout

The installer SHALL resolve the effective hook directory through Git for ordinary repositories and linked worktrees. It SHALL preserve and chain existing hooks at that location. The generated shim MUST execute the versioned discipline script from the committing worktree and tolerate another worktree that has not installed that script.

#### Scenario: Install in a linked worktree

- **WHEN** the target contains a `.git` file and hooks are selected
- **THEN** the effective pre-commit hook is installed, prior hooks remain chained, and hooks are recorded as installed

### Requirement: Plugin preparation reuses workflow sources

Plugin preparation SHALL package the standalone installer and its declared workflow assets from this repository into a server-only bundle. The plugin MUST execute that same installer from a temporary source directory and MUST NOT silently download a different installation source.

#### Scenario: Prepare an installed plugin

- **WHEN** plugin preparation runs from a complete repository checkout
- **THEN** it creates an asset bundle containing the installer, schemas, rule files, declared skills, and their license files
