# discipline-hooks Specification

## Purpose

Enforce OpenSpec artifact validation and accepted ADR immutability before commits. The versioned scripts/pre-commit.sh runs through a Git hook shim; PASEO_AGENT_TEAM_SKIP_HOOKS=1 is the explicit maintenance escape hatch.

## Requirements

### Requirement: Validate OpenSpec artifacts before commit

The pre-commit hook SHALL run `openspec validate --all --strict` when the `openspec/` directory exists and the `openspec` CLI is available, rejecting the commit on validation failure.

#### Scenario: Committing with a broken spec artifact

- **WHEN** the staging area contains changes and `openspec validate --all --strict` reports errors
- **THEN** the commit is rejected and the error output is passed through to the user

#### Scenario: Environment lacks the openspec CLI

- **WHEN** the target machine has no `openspec` command
- **THEN** the hook skips spec validation, prints a one-line notice, and does not block the commit

### Requirement: Accepted ADRs are immutable

The pre-commit hook MUST reject modification or deletion of git-tracked ADR files (`NNNN-*.md`) under `adr/`; adding new ADR files is unrestricted.

#### Scenario: Modifying an existing ADR

- **WHEN** the staging area contains a content modification to the tracked `adr/0001-xxx.md`
- **THEN** the commit is rejected with the message "Commit rejected: accepted ADRs must not be modified, deleted, or renamed." and guidance to create a new ADR with a `Supersedes` field

#### Scenario: Adding an ADR

- **WHEN** the staging area only adds `adr/0002-yyy.md`
- **THEN** the hook passes

#### Scenario: Modifying adr/README.md

- **WHEN** the staging area contains a modification to `adr/README.md`
- **THEN** the hook passes (the immutability constraint applies only to numbered ADR files)

### Requirement: Named maintenance escape hatch

The discipline hook SHALL accept `PASEO_AGENT_TEAM_SKIP_HOOKS=1` as its sole maintenance bypass. Existing OpenSpec validation, user hook chaining, and ADR immutability MUST remain effective by default.

#### Scenario: Explicit maintenance bypass

- **WHEN** `PASEO_AGENT_TEAM_SKIP_HOOKS` equals 1
- **THEN** the hook reports the bypass and exits successfully without running discipline checks
