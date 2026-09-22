## Why

Installing Agent Team on a Paseo daemon currently leaves every new project dependent on a separate terminal command. The panel only checks for an OpenSpec configuration, so it cannot explain missing components, initialize a project, or distinguish a complete workflow from a partial installation.

## What Changes

- Add a project setup area to Agent Team with the resolved project directory, prerequisite checks, component status, and actionable remediation.
- Provide explicit initialization and repair/update actions that reuse the trusted installation's `init.sh` and workflow assets on the daemon host. Show the intended changes before execution and retain bounded installation output and completion status.
- Support component selection and the language for new OpenSpec configurations; preserve existing project context and the standalone installer entry point.
- Refresh component status after execution, distinguish partial results from success, and prevent concurrent installations in the same project.
- Provide a ready-to-use prompt for the existing primary agent to document an existing codebase's capabilities, architecture, and ADRs after setup. No agent starts merely by opening or initializing the panel.
- Keep existing explicit member creation, task progress, follow-up, and archival in the same panel, and update both README languages and affected guides.

## Capabilities

### New Capabilities

- `workspace-workflow-setup`: Inspect and explicitly initialize, repair, or update the current workspace's engineering workflow through the native panel, with bounded process execution and truthful results.

### Modified Capabilities

- `paseo-agent-team-plugin`: Integrate project setup and readiness feedback into the native Agent Team panel while preserving explicit team actions.
- `one-click-install`: Support the plugin's reuse of trusted local workflow assets and accurate installation results across supported Git workspace layouts.

## Impact

The plugin gains shared setup RPC contracts, a server-side installer service, and native setup controls. The shell installer remains the installation authority; any compatibility changes receive installer regressions. Documentation, architecture, capability specs, and a new ADR describe the additional explicit entry point. No new runtime dependency, automatic package-manager installation, global provider change, automatic commit, or automatic team launch is intended.
