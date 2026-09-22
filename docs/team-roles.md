# Team roles

This reference describes the responsibilities of Paseo Agent Team members. Use it to configure an ongoing role and assign work later while keeping architecture and engineering ownership with your existing primary agent.

| Role | Responsibility | Write scope | Return to the lead |
|------|----------------|-------------|--------------------|
| Tech Lead | Architecture, core development, maintenance, OpenSpec/ADR, quality gate | Entire project | Reviewed and integrated work |
| Researcher | External documentation, issues, releases, papers, third-party comparisons | Requested reports under `.paseo-agent-team/handoff/` only | Condensed conclusion, sources and retrieval dates, risks, recommendations |
| Writer | Documentation based on lead input and verifiable project facts | `docs/` only | Changed paths, brief summaries, unresolved TODOs |
| Worker | Simple, explicit, independently verifiable chores; use sparingly | Task-specified files in an isolated worktree; no OpenSpec/ADR edits | Changed files, verification evidence, deviations or questions |
| Custom | User-defined ongoing responsibilities; assignments arrive in its conversation | Defined by the assignment under shared lead ownership and provider permissions | Concise deliverables and verification evidence |

The Tech Lead is the current primary agent. The plugin does not create another lead. Researcher, Writer, Worker, and Custom are the new-member choices; the form initially selects Researcher, with no model selected. No members start until explicitly requested.

## Responsibilities, presets, and members

| Concept | Lifetime | Example |
|---------|----------|---------|
| Role name | Member identity | Accessibility reviewer |
| Role responsibilities | Standing guidance across assignments; optional for Custom | Report accessibility issues without editing files |
| Preset | Reusable project configuration | Saved name, responsibilities, profile/model ID, and isolation |
| Member | Actual agent with the configured role | An Accessibility reviewer waiting for work |
| Conversation message | A concrete assignment or follow-up | Review keyboard navigation in the checkout dialog |

Built-in roles supply responsibilities automatically. Custom responsibilities are optional; shared team rules always apply. Standing guidance goes into the system prompt. Creation sends no assignment; send work through the conversation or the panel Message action when ready.

Presets do not redefine existing members: each member keeps its creation identity and responsibilities. See [Create and reuse a custom member](./paseo-guide.md#create-and-reuse-a-custom-member) for preset operations.

## Ownership and delegation

The Tech Lead personally handles hard problems, architectural decisions, core implementation, and every `openspec/` or `adr/` artifact. It reviews all helper output before integration, including Worker code line by line.

Researcher and Writer isolate bulky source material and drafting from the lead's context. They return condensed results instead of raw research dumps or entire document bodies. Worker handles simple chores when useful and stops to report if the work needs architectural judgment, crosses the assigned scope, or requires repeated clarification.

A handoff contains four elements:

```text
Context: New contributors need examples for selecting a helper.
Requirements: Add task examples for each helper role in docs/paseo-guide.md.
Expected output: A brief change summary and any facts needing confirmation.
Acceptance criteria: Only docs/ changes; links resolve; no OpenSpec/ADR edits.
```

The lead continues independent work while the helper runs. Waiting is appropriate only when its next action depends on that result. Helpers do not delegate further. Commits and merges require an explicit request.

## Role details

Researcher cites source links and retrieval dates for conclusions, separates fact from inference, and marks unreliable claims as unverified. It does not review project code or make technology decisions. Reports use English unless the task requests another language; a file report is optional and must be requested.

Writer may read the repository for facts but cannot edit root README files, code, configuration, scripts, `openspec/`, or `adr/`. It reads the available tech-doc skill, uses plain language and diagrams for complex explanations, and marks uncertain facts with TODOs for the lead. Documents use English unless the task says otherwise.

Worker follows a literal scope such as a mechanical rename, small validation patch, or specified test. It does not independently add dependencies, change public interfaces, or restructure directories. If the task is more complex than described, it stops editing and returns the decision to the lead. Verification evidence is required before work is considered finished.

## Configuration preferences

The panel displays the user's role preferences as guidance; it does not apply model or reasoning settings automatically.

| Role | Preferred configuration | Paseo configuration to select |
|------|---------------------|------------------------------|
| Researcher | Grok `grok-4.6`, reasoning `xhigh` | A compatible available Grok profile/provider |
| Writer | Pi, Google Vertex `gemini-3.7-flash` | `pi/google-vertex/gemini-3.7-flash` or a matching profile |
| Worker | Codex `gpt-5.6-sol`, reasoning `medium` | A matching Codex profile with the intended reasoning setting |

Actual choices come from Paseo profiles or provider discovery. A matching model name alone does not apply the preferred reasoning setting. Configure that setting in a Paseo profile where supported, then select the profile. Unavailable preferences are not silently replaced.

Custom has no model preference; select an available profile or model explicitly. Researcher, Writer, and Custom can use the current workspace or an explicitly selected worktree. Worker always uses a worktree; uncommitted inputs are not copied. Role write scopes are prompt instructions, not operating-system permission enforcement.
