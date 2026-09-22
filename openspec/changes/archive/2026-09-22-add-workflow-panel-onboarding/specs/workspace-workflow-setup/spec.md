## Purpose

Inspect and explicitly install or repair a project's engineering workflow from the native Paseo panel, reusing the standalone installer and preserving primary-agent ownership.

## ADDED Requirements

### Requirement: Inspect project setup without mutations

The plugin SHALL resolve the project from its Paseo workspace ID and report the canonical directory, Git root, required tools, bundled source revision, and separate instruction, OpenSpec, ADR, skill, and hook states. Opening or refreshing setup MUST NOT install files, fetch code, or launch agents. A lone OpenSpec configuration MUST NOT count as a complete installation.

#### Scenario: Partial project

- **WHEN** a project has `openspec/config.yaml` but lacks the managed schemas, instructions, or skills
- **THEN** the panel reports the missing components and offers explicit repair

### Requirement: Explicit installation from trusted bundled assets

The panel SHALL allow selection of `openspec`, `adr`, `skills`, and `hooks`, and a language for new OpenSpec configurations. Before execution it SHALL show the project, selected components, and managed paths that will change. The server MUST validate the selection, derive paths from the workspace, and execute the bundled standalone installer with an argument array. It MUST reject unsafe symlinked managed destinations and non-root Git workspace targets before mutation. Missing prerequisites SHALL produce actionable guidance without automatically installing global tools.

#### Scenario: Initialize another project

- **WHEN** the user explicitly confirms setup in a Git project with the required tools available
- **THEN** the plugin installs the selected workflow assets from its trusted bundle without requiring a separate repository checkout or starting an agent

#### Scenario: Missing prerequisite or unsafe target

- **WHEN** setup prerequisites are missing or a managed path resolves through a symlink
- **THEN** installation is blocked before project files are changed and the problem remains visible

### Requirement: Observable bounded installation lifecycle

Installations SHALL return a request identity promptly, run with a finite timeout and bounded logs, serialize by canonical project directory, and expose running, succeeded, partial, failed, cancelled, or interrupted results. Repeating the last request MUST NOT start another installation. Cancellation and plugin cleanup SHALL terminate the installer process tree. The last result SHALL survive reload; an abandoned running record MUST be reported as interrupted rather than successful. Component state SHALL be checked again after installation; a zero exit code alone MUST NOT prove success.

#### Scenario: Concurrent requests and reload

- **WHEN** two clients request setup for the same project, or a client reconnects after the reply is lost
- **THEN** only one installation runs and its request can be observed without an automatic retry

#### Scenario: Partial or cancelled installation

- **WHEN** selected components remain incomplete or the user cancels an installation
- **THEN** the panel shows the appropriate result and retained output, refreshes installed state, and allows an explicit repair

### Requirement: Onboarding stays with the primary agent

The panel SHALL provide a selectable and copyable prompt for the existing primary agent to derive current capabilities, document architecture, and record retroactive ADRs after installation. Copying the prompt MUST NOT submit it or create a helper. Desktop and compact layouts SHALL retain readable state, errors, and actions using host theme colors.

#### Scenario: Describe an existing codebase

- **WHEN** a user copies the onboarding prompt
- **THEN** they can submit it to their chosen primary conversation and no agent starts automatically
