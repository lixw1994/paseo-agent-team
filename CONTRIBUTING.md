# Contributing

Contribute changes through a pull request to [paseo-agent-team](https://github.com/lixw1994/paseo-agent-team). Read [AGENTS.md](./AGENTS.md) and the [architecture](./docs/architecture.md) before changing behavior.

## Set up

You need Git, Bash, Node.js, npm, and the OpenSpec CLI. Plugin runtime checks also need a compatible Paseo 0.8.x host and client.

```bash
git clone https://github.com/lixw1994/paseo-agent-team.git
cd paseo-agent-team
npm install -g @fission-ai/openspec@latest
./init.sh
npm --prefix plugins/paseo-agent-team ci
```

The installer sets up the local discipline hook. It does not install the Paseo plugin or launch helpers.

## Scope a change

Use the full [OpenSpec workflow](./docs/workflow.md) for new capabilities, public interface changes, dependencies, and architectural changes. Small fixes and documentation maintenance can proceed directly. Accepted ADRs are append-only; supersede a decision with a new record when necessary.

## Update documentation with the change

Documentation is part of the implementation. Before requesting review:

- Update both `README.md` and `README.zh-CN.md` when setup, supported modes, requirements, or user-facing behavior changes.
- Update the relevant page in `docs/`; update `docs/architecture.md` when module boundaries, ownership, or persistence changes.
- Keep current capability requirements in `openspec/specs/` aligned with the implementation through the OpenSpec workflow.
- Run the documented commands affected by your change, check local links, and remove obsolete instructions and claims. Date any version-specific validation evidence.
- Describe only shipped behavior. Keep machine-specific setup, reset notes, backups, and temporary investigation reports out of public guides.

## Validate

From the repository root:

```bash
bash -n init.sh scripts/pre-commit.sh scripts/regression-test.sh
bash scripts/regression-test.sh
npm --prefix plugins/paseo-agent-team run typecheck
npm --prefix plugins/paseo-agent-team test
openspec validate --all --strict
git diff --check
```

All commands must succeed. For plugin runtime or UI changes, reload the plugin and exercise the changed operation in Paseo; check both desktop and compact layouts for UI changes. State any checks you could not run in the pull request.

The project uses the [MIT license](./LICENSE). Preserve copyright and license notices in bundled third-party assets.
