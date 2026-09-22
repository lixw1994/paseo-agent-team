## MODIFIED Requirements

### Requirement: Single Tech Lead ownership

Root instructions SHALL keep the primary agent responsible for architecture, core development, maintenance, and all OpenSpec/ADR artifacts. Explicitly requested Researcher and Writer work SHALL isolate external-research and documentation context; Worker SHALL be used sparingly for simple chores. User-defined Custom helpers SHALL follow their explicitly assigned responsibilities and the same shared team rules. Complex problems and final decisions MUST remain with the lead. Task handoffs SHALL specify context, requirements, expected output, and acceptance criteria; independent work SHALL continue while helpers run. All output MUST receive lead review, including line-by-line review of worker code.

#### Scenario: Delegate a helper task

- **WHEN** the user requests collaboration
- **THEN** the lead selects a defined helper scope, provides a self-contained task, continues independent work, and personally reviews the result before integration
