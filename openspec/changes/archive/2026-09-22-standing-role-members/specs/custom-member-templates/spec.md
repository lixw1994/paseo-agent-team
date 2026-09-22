## MODIFIED Requirements

### Requirement: Explicit project-local template management
The panel SHALL list, save, update, and delete custom member templates, presented as Presets in the originating project. Each template SHALL have a stable ID, custom name, optional responsibilities, selected profile/model identifier, and shared/worktree preference. Saving a template MUST NOT require or persist a current task and MUST NOT launch an agent. Listing SHALL be read-only. Template updates and deletion SHALL affect only the selected template in the selected project.

#### Scenario: Save configuration without launching

- **WHEN** the user saves a valid custom role and profile
- **THEN** its template becomes reusable in that project without creating a member or agent

#### Scenario: Update or delete a template

- **WHEN** the user explicitly updates or deletes one selected template
- **THEN** only that template changes, while existing member records and other templates remain intact

### Requirement: Reuse configuration independently of the current task
Selecting a template SHALL populate Custom name, optional responsibilities, profile/model, and isolation without introducing a Task field. The user SHALL be able to edit the populated fields before launching or explicitly saving changes. Selection MUST NOT launch, save, or silently replace an unavailable profile. A missing profile SHALL be shown clearly and block launch until the user selects an available configuration. Closing and reopening the form SHALL preserve the pending custom draft and retry identity.

#### Scenario: Reuse for a different task

- **WHEN** a user selects a preset while configuring a member
- **THEN** the role configuration fills the form and a member is created only after an explicit creation action with a valid configuration

#### Scenario: Referenced profile is unavailable

- **WHEN** the template's saved profile/model is absent from current choices
- **THEN** the panel explains the missing choice and requires a new selection without an automatic fallback
