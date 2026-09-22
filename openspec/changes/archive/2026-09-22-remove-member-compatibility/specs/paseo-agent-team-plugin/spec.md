## REMOVED Requirements

### Requirement: Preserve legacy member records
**Reason**: The project is in development and has no requested backwards-compatibility commitment.
**Migration**: None. The plugin uses the current member contract without a data migration or automatic reset.

## ADDED Requirements

### Requirement: Current member model
Persisted members and new creation SHALL use the same current role set: Researcher, Writer, Worker, and Custom. Member records SHALL contain role configuration and runtime associations without a task field. Member details SHALL display current responsibilities and runtime results without legacy role labels or historical-task sections. Invalid records SHALL fail ordinary schema validation without being rewritten, migrated, or automatically recreated.

#### Scenario: Inspect a current member

- **WHEN** a configured member is reloaded and inspected
- **THEN** its role, responsibilities, agent association, and results remain available using the current contract

#### Scenario: Invalid member data

- **WHEN** persisted member data does not match the current schema
- **THEN** reading fails without changing the file or creating an agent
