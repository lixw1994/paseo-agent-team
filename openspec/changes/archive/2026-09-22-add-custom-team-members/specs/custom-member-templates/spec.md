## Purpose

Reuse custom helper configurations within a project while keeping current tasks and existing member identities independent of templates.

## ADDED Requirements

### Requirement: Explicit project-local template management

The panel SHALL list, save, update, and delete custom member templates in the originating project. Each template SHALL have a stable ID, custom name, optional responsibilities, selected profile/model identifier, and shared/worktree preference. Saving a template MUST NOT require or persist a current task and MUST NOT launch an agent. Listing SHALL be read-only. Template updates and deletion SHALL affect only the selected template in the selected project.

#### Scenario: Save configuration without launching

- **WHEN** the user saves a valid custom role and profile with no task
- **THEN** its template becomes reusable in that project without creating a member or agent

#### Scenario: Update or delete a template

- **WHEN** the user explicitly updates or deletes one selected template
- **THEN** only that template changes, while existing member records and other templates remain intact

### Requirement: Reuse configuration independently of the current task

Selecting a template SHALL populate Custom name, optional responsibilities, profile/model, and isolation while preserving the current task draft. The user SHALL be able to edit the populated fields before launching or explicitly saving changes. Selection MUST NOT launch, save, or silently replace an unavailable profile. A missing profile SHALL be shown clearly and block launch until the user selects an available configuration. Closing and reopening the form SHALL preserve the pending custom draft and retry identity.

#### Scenario: Reuse for a different task

- **WHEN** a user selects a template while composing an assignment
- **THEN** the task draft is retained and the member starts only after an explicit launch with a valid configuration

#### Scenario: Referenced profile is unavailable

- **WHEN** the template's saved profile/model is absent from current choices
- **THEN** the panel explains the missing choice and requires a new selection without an automatic fallback

### Requirement: Durable isolated template storage

Templates SHALL use separate, bounded, versioned, schema-validated, atomic storage under ignored `.paseo-agent-team/`. Mutations SHALL serialize by canonical project directory within the plugin process. Repeating a save with the same template ID MUST NOT create a duplicate. Corrupt, unsupported, or symlinked storage MUST fail without overwriting the data or affecting existing members.

#### Scenario: Reload after saving

- **WHEN** the plugin reloads after a template save
- **THEN** the same template ID and configuration remain selectable independently of member state

#### Scenario: Concurrent saves or invalid storage

- **WHEN** saves overlap in one project, or the stored file is invalid or symlinked
- **THEN** valid saves retain each template, while invalid storage remains untouched and the error stays visible
