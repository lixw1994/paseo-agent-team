# on-demand-collaboration Specification

## Purpose

Keep engineering work solo by default, with explicitly requested Paseo collaboration as an optional enhancement independent of workflow installation.

## Requirements

### Requirement: Two supported execution modes

Root agent instructions SHALL define solo OpenSpec work as the default and explicitly requested Paseo collaboration as the only optional team mode. Tool availability or environment detection MUST NOT launch a team.

#### Scenario: Work without Paseo

- **WHEN** a coding agent reads root instructions without Paseo configured
- **THEN** it completes the full engineering workflow solo

### Requirement: User-controlled team membership

The Paseo enhancement SHALL launch members only after an explicit user action specifying the task and configuration. The primary agent or user SHALL review results before integration. Unavailable Paseo SHALL leave the independent workflow usable.

#### Scenario: Open the plugin panel

- **WHEN** a user opens Agent Team
- **THEN** the panel shows workflow and team state without creating agents

### Requirement: Single Tech Lead ownership

Root instructions SHALL keep the primary agent responsible for architecture, core development, maintenance, and all OpenSpec/ADR artifacts. Explicitly requested Researcher and Writer work SHALL isolate external-research and documentation context; Worker SHALL be used sparingly for simple chores. Complex problems and final decisions MUST remain with the lead. Task handoffs SHALL specify context, requirements, expected output, and acceptance criteria; independent work SHALL continue while helpers run. All output MUST receive lead review, including line-by-line review of worker code.

#### Scenario: Delegate a helper task

- **WHEN** the user requests collaboration
- **THEN** the lead selects a defined helper scope, provides a self-contained task, continues independent work, and personally reviews the result before integration
