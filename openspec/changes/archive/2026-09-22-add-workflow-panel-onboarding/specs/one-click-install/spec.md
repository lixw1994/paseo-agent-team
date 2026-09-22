## ADDED Requirements

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
