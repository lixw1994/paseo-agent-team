## MODIFIED Requirements

### Requirement: Native Agent Team panel

The plugin SHALL provide a workspace panel and command entry named Agent Team, using native, theme-aware UI on desktop and compact clients. It SHALL display active OpenSpec changes and task counts without executing a shell command from the client. It SHALL integrate workspace setup inspection, explicit initialization or repair, installation output, and primary-agent onboarding guidance alongside the existing explicit member controls. Workflow setup jobs alone MAY be observed periodically while running; team status SHALL remain explicitly refreshed.

#### Scenario: View project workflow

- **WHEN** Agent Team opens in a workspace
- **THEN** it reads local OpenSpec task progress, component readiness, and persisted associations without starting an agent or installing files

#### Scenario: Finish setup

- **WHEN** installation completes
- **THEN** the panel refreshes setup and workflow progress and presents member controls with current readiness
