## Why

The three built-in helper roles cannot describe every focused assignment. The current UI blurs standing responsibilities with the current task, and startup duplicates the task in both the system prompt and first message.

## What Changes

- Add Custom members with a required name and optional standing responsibilities alongside unchanged built-in roles.
- Save, select, update, and delete project-local custom templates containing role configuration, profile selection, and workspace isolation; never store the current task in a template.
- Keep standing role guidance in the system prompt and send the current task once as the initial message.
- Persist custom identity with each member, independently of later template edits or deletion, and preserve legacy members.
- Clarify the form and member details, maintaining explicit launch, primary-agent ownership, and provider-controlled permissions.

## Capabilities

### New Capabilities

- `custom-member-templates`: Explicit project-local management and reuse of custom member configurations without launching agents.

### Modified Capabilities

- `paseo-agent-team-plugin`: Custom role creation, persisted identity, legacy compatibility, and separate standing role instructions versus task messages.
- `on-demand-collaboration`: User-defined helper responsibilities within the existing single-lead ownership model.

## Impact

Shared Zod contracts, team persistence and service, Paseo runtime prompt/title creation, member composer and cards, project instructions, both READMEs, role/setup guides, and architecture documentation. New template RPCs and `.paseo-agent-team/templates.json`; no dependencies. ADR-0007 will supersede ADR-0004's closed role set while retaining lead ownership. Existing version 1 member records remain readable. Git checkpoints are skipped under the user's existing authorization; no automatic commits or pushes.
