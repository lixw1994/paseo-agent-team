# ADR-0001: Distribute the engineering workflow and Paseo plugin independently

- Status: accepted
- Date: 2026-09-22
- Supersedes: —
- Record type: retroactive baseline

## Context

The project supports engineering work with any coding agent and optional collaboration inside Paseo. Requiring a team runtime for project setup would prevent the standalone workflow from serving agents outside Paseo. The project needs one identity with separate installation paths.

## Decision

Use `paseo-agent-team` as the project, package, and plugin ID, and **Agent Team** as the interface name. Distribute the shell workflow installer at `init.sh` and the native Paseo plugin under `plugins/paseo-agent-team/` independently.

The default installer sets up OpenSpec, ADR rules, skills, root instructions, and Git hooks. It neither installs the plugin nor starts agents. Install the plugin separately on a compatible Paseo daemon; loading it or opening its panel never launches members.

The plugin separates native client UI, shared contracts, server operations, and an adapter to the Paseo SDK. Paseo owns agent processes, conversations, permissions, and workspaces. The plugin owns team membership, task associations, and their interface. It targets the Paseo 0.8.x API.

Making Paseo mandatory was rejected because standalone engineering is a required use case. Building another shell-based agent launcher was rejected because Paseo already provides the runtime and workspace operations.

## Consequences

- Positive: standalone projects carry no Paseo dependency; teams use native Paseo profiles, workspaces, and navigation.
- Negative: maintainers validate two installation paths, and the plugin requires compatible client and daemon versions.
- Constraint: repository naming and local installation do not publish or rename a remote repository. Team creation always requires an explicit request.
