# Install the workflow and optional plugin

Use this guide to install the engineering workflow in a project and optionally enable agent teams in Paseo. The standalone workflow works with any coding agent that reads `AGENTS.md`.

## Install the standalone workflow

Prepare Git and the OpenSpec CLI:

```bash
npm install -g @fission-ai/openspec@latest
cd /path/to/your-project
/path/to/paseo-agent-team/init.sh
```

Successful default installation creates the managed `AGENTS.md` block, OpenSpec workspace and schemas, ADR rules, companion skills, hook logic/shim, and `.paseo-agent-team.yaml`. It creates no team runtime or plugin package.

| Option | Meaning |
|--------|---------|
| `--with openspec,adr,skills,hooks` | Default components; supplying `--with` replaces the list |
| `--tools agents` | Default universal OpenSpec skill integration |
| `--language English` | Language for a new OpenSpec config; use `Simplified Chinese` if preferred |
| `PASEO_AGENT_TEAM_REPO` | Override the source repository used by remote execution |

General skills come from root `skills.txt` and `openspec/schemas/*/skills.txt`. The installer only needs workflow assets to recognize a local source.

A missing OpenSpec executable skips that component with remediation instructions. Rerun after installing it to repair incomplete initialization. Git hooks require a Git repository and are local to each machine; rerun after cloning to restore them.

Rerunning preserves the language and other project instructions in an existing `openspec/config.yaml`. To change that project's artifact language, edit its `context` field directly; `--language` applies only to initial config creation.

Remote `curl | bash` execution remains supported through a temporary clone. Until the renamed repository is published, use a local checkout or explicitly set the source URL to a repository containing this version. A source override changes acquisition only; it does not rename a remote repository.

## Upgrade an existing installation

Rerun the installer using the components you want to refresh:

```bash
/path/to/paseo-agent-team/init.sh
```

Legacy `copilot-workflow` managed blocks migrate to `paseo-agent-team` markers. The installer preserves text outside the block and existing user hook backups. A legacy managed hook is replaced rather than chain-called recursively. The old managed manifest migrates to `.paseo-agent-team.yaml`.

`COPILOT_WORKFLOW_REPO` and `COPILOT_WORKFLOW_SKIP_HOOKS` remain migration aliases; prefer `PASEO_AGENT_TEAM_REPO` and `PASEO_AGENT_TEAM_SKIP_HOOKS`. Mixed, reversed, or unpaired managed markers fail before rewriting `AGENTS.md`; repair the indicated block and rerun.

Only `openspec,adr,skills,hooks` are supported; the installer rejects other components, including `squad`, before changing files. Existing unrelated runtime directories in target projects are user-owned; review and remove those separately.

## Add Paseo enhancement

Configure a provider and a suitable agent profile in Paseo. Enable trusted plugins under **Settings → Plugins** on the target daemon, then install the plugin:

```bash
cd /path/to/paseo-agent-team/plugins/paseo-agent-team
npm ci
npm run typecheck
npm test
paseo plugin install "$PWD"
paseo plugin ls
```

Require status `running`, then open **Agent Team** from the workspace Command Center or `/agent-team`. Both client and daemon must support Paseo 0.8.x. For a remote host, use an absolute plugin path on that host and the CLI's `--host` selector.

Plugin acquisition and workflow installation are independent. Installing or enabling the plugin never starts members. Follow the [Paseo guide](./paseo-guide.md) to assign a task.

## Onboard existing code

After installation, start your coding agent with:

```text
Read this codebase and derive its current capabilities into openspec/specs/.
Backfill the important established architecture decisions under adr/, marking them as retroactive.
```

Expected output is baseline capability specs and numbered ADRs explaining existing decisions. Continue with the [engineering workflow](./workflow.md).
