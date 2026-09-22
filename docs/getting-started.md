# Install the workflow and optional plugin

Install the engineering workflow directly in your Git project, or install Paseo Agent Team once and initialize projects from its panel. The standalone workflow works with any coding agent that reads `AGENTS.md`.

## Install the standalone workflow

Prepare Git, Bash, Node.js, and npm. From your target project:

```bash
npm install -g @fission-ai/openspec@latest
curl -fsSL https://raw.githubusercontent.com/lixw1994/paseo-agent-team/main/init.sh | bash
```

A successful default installation creates the managed `AGENTS.md` block, OpenSpec schemas and tool integration, ADR rules, companion skills, the discipline hook, and `.paseo-agent-team.yaml`. It does not install a plugin or create team state.

To inspect the source or pass options, clone the repository and invoke its installer from your project:

```bash
git clone https://github.com/lixw1994/paseo-agent-team.git
cd /path/to/your-project
/path/to/paseo-agent-team/init.sh --language "Simplified Chinese"
```

| Option | Meaning |
|--------|---------|
| `--with openspec,adr,skills,hooks` | Default components; supplying `--with` replaces the list |
| `--tools agents` | Default shared OpenSpec skill integration |
| `--language English` | Language for a new OpenSpec configuration |
| `PASEO_AGENT_TEAM_REPO` | Override the source repository used by remote execution |
| `PASEO_AGENT_TEAM_SKIP_HOOKS=1` | Explicit maintenance bypass for discipline checks; user hooks still run |

General skills come from `skills.txt` and `openspec/schemas/*/skills.txt`. Rerunning preserves existing OpenSpec context, including its artifact language. Edit `openspec/config.yaml` directly to change that context.

If OpenSpec is unavailable, install the CLI using the command above and rerun the installer. Local Git hooks need installation after each clone. The installer resolves the effective hook directory through Git, including linked worktrees and `core.hooksPath`; shared hooks chain existing user hooks and tolerate sibling worktrees without the discipline script. The installer reports any component it could not install.

## Update workflow assets

Rerun the remote installer to install current workflow assets, or update a local checkout and run `init.sh` from the target project. Supply `--with` when you want to refresh only selected components.

The installer replaces `paseo-agent-team` managed instruction blocks, schemas, and skills. It preserves instructions outside the managed block and chains existing user hooks. Keep project-specific customization outside managed assets. The `.paseo-agent-team.yaml` manifest records the components installed by the current run.

## Add Paseo enhancement

Use a compatible Paseo 0.8.x daemon and client, with a configured provider. Enable trusted plugins under **Settings → Plugins** on the intended daemon. Install from a checkout:

```bash
git clone https://github.com/lixw1994/paseo-agent-team.git
cd paseo-agent-team/plugins/paseo-agent-team
npm ci
npm run typecheck
npm test
paseo plugin install "$PWD"
paseo plugin ls
```

Require status `running`, then open **Open Agent Team** from the workspace Command Center or submit `/agent-team`. Use **Project → Configure setup → Review setup changes → Install selected components** in each target Git project. You do not need a second source checkout in each project. The panel displays missing prerequisites, selected components, and the actual hook location before installation. See the [Paseo guide](./paseo-guide.md) for setup results, member configuration, and assignments.

For a remote daemon, use an absolute plugin directory on that host and the CLI's `--host` option. A local directory path must exist on the target host.

## Update the plugin’s bundled workflow

Panel installation uses the workflow snapshot prepared with the installed plugin; it does not fetch the latest remote installer. Update your source checkout, run `npm ci` and `npm run typecheck` from the plugin directory, then run `paseo plugin reload paseo-agent-team`. Use **Repair / update workflow** in each target project to apply the updated managed assets.

The preparation command requires the complete repository checkout, including its root workflow assets. Keep the plugin in `plugins/paseo-agent-team/` inside that checkout.

## Describe an existing codebase

After installing the workflow, use **Copy onboarding prompt** in the panel or ask your coding agent to establish its current requirements and decisions:

```text
Read this codebase and derive its current capabilities into openspec/specs/.
Record the important established architecture decisions under adr/, marking them as retroactive.
```

The result should describe implemented behavior and its rationale. Continue with the [engineering workflow](./workflow.md) for subsequent changes.
