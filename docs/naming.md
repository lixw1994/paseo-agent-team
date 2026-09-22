# Naming Paseo Agent Team

The project, plugin ID, and package use `paseo-agent-team`; the UI displays **Agent Team**. The user selected this name on 2026-09-22 to make agent collaboration explicit while retaining an independent OpenSpec workflow.

| Reference checked | Naming observation |
|-------------------|--------------------|
| [Official Linear example](https://github.com/getpaseo/paseo/tree/main/plugin-examples/linear) | Manifest ID is `linear`; display/function names can stay short |
| [Paseo Workspace Activity](https://github.com/ABorakati/paseo-workspace-activity) | Repository uses `paseo-` plus the feature; manifest ID is `workspace-activity` |
| [Paseo Usage Monitor](https://github.com/ABorakati/paseo-usage-monitor) | Repository name identifies the host and the plugin function |
| [Official community page](https://paseo.sh/docs/community) | Links to the independent paseo.cafe directory and community integrations |

These examples show conventions rather than a mandatory naming rule or a uniqueness guarantee. The selected ID makes source, local installation, logs, and project runtime paths easy to associate. It does not imply official endorsement.

Local source is `plugins/paseo-agent-team/`, runtime state is `.paseo-agent-team/`, and the workflow installer writes `.paseo-agent-team.yaml`. New environment variables use `PASEO_AGENT_TEAM_*`. Remote repository renaming and publication remain separate operations.
