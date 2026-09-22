## MODIFIED Requirements

### Requirement: Named maintenance escape hatch

The discipline hook SHALL accept `PASEO_AGENT_TEAM_SKIP_HOOKS=1` as its sole maintenance bypass. Existing OpenSpec validation, user hook chaining, and ADR immutability MUST remain effective by default.

#### Scenario: Explicit maintenance bypass

- **WHEN** `PASEO_AGENT_TEAM_SKIP_HOOKS` equals 1
- **THEN** the hook reports the bypass and exits successfully without running discipline checks
