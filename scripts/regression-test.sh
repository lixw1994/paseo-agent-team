#!/usr/bin/env bash
# Focused regressions for installer standalone installation and legacy upgrades.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEST_ROOT="$(mktemp -d "${TMPDIR:-/tmp}/paseo-agent-team-regressions.XXXXXX")"

cleanup() {
  [ -n "${TEST_ROOT:-}" ] && [ -d "$TEST_ROOT" ] && rm -rf -- "$TEST_ROOT"
}
trap cleanup EXIT

fail() {
  printf 'FAIL: %s\n' "$*" >&2
  exit 1
}

test_openspec_recovery() {
  local target="$TEST_ROOT/installer-target"
  local fake_bin="$TEST_ROOT/installer-bin"
  local state="$TEST_ROOT/openspec-state"
  local calls="$TEST_ROOT/openspec-calls"
  local first_output="$TEST_ROOT/installer-first-output"
  local second_output="$TEST_ROOT/installer-second-output"

  mkdir -p "$target" "$fake_bin"
  cat > "$fake_bin/openspec" <<'FAKE_OPEN_SPEC'
#!/usr/bin/env bash
set -eu
: "${FAKE_OPEN_SPEC_STATE:?}"
: "${FAKE_OPEN_SPEC_CALLS:?}"
printf 'init\n' >> "$FAKE_OPEN_SPEC_CALLS"
mkdir -p "$PWD/openspec"
if [ ! -f "$FAKE_OPEN_SPEC_STATE" ]; then
  : > "$FAKE_OPEN_SPEC_STATE"
  exit 1
fi
mkdir -p "$PWD/.agents/skills"
: > "$PWD/.agents/skills/.openspec-target"
[ -f "$PWD/openspec/config.yaml" ] || printf 'schema: spec-driven\n' > "$PWD/openspec/config.yaml"
FAKE_OPEN_SPEC
  chmod +x "$fake_bin/openspec"

  if (
    cd "$target"
    PATH="$fake_bin:$PATH" FAKE_OPEN_SPEC_STATE="$state" FAKE_OPEN_SPEC_CALLS="$calls" \
      "$REPO_ROOT/init.sh" --with openspec
  ) >"$first_output" 2>&1; then
    fail "first incomplete OpenSpec initialization unexpectedly succeeded"
  fi
  [ -d "$target/openspec" ] || fail "failed initialization did not leave the partial openspec directory"
  [ ! -f "$target/.agents/skills/.openspec-target" ] || fail "failed initialization unexpectedly created the skills marker"

  (
    cd "$target"
    PATH="$fake_bin:$PATH" FAKE_OPEN_SPEC_STATE="$state" FAKE_OPEN_SPEC_CALLS="$calls" \
      "$REPO_ROOT/init.sh" --with openspec
  ) >"$second_output" 2>&1 || fail "rerun did not repair the incomplete OpenSpec initialization"

  [ "$(wc -l < "$calls" | tr -d ' ')" = "2" ] || fail "openspec init was not invoked on both runs"
  [ -f "$target/.agents/skills/.openspec-target" ] || fail "rerun did not restore the workflow skills marker"
  [ -d "$target/openspec/schemas/spec-driven-with-adr" ] || fail "rerun did not install the default schema"
  [ -f "$target/openspec/schemas/spec-driven-with-adr/LICENSE" ] || fail "default schema license was not installed"
  [ -f "$target/openspec/schemas/minimalist/LICENSE" ] || fail "minimalist schema license was not installed"
  [ ! -e "$target/openspec/schemas/LICENSE" ] || fail "installer leaked a license into the schemas parent directory"
  grep -q '^  - openspec$' "$target/.paseo-agent-team.yaml" \
    || fail "manifest did not record the repaired OpenSpec component"

  printf 'ok: incomplete OpenSpec initialization self-heals on rerun\n'
}

setup_openspec() {
  mkdir -p "$TEST_ROOT/bin"
  cat > "$TEST_ROOT/bin/openspec" <<'FAKE'
#!/usr/bin/env bash
set -eu
language_seen=0
for argument in "$@"; do
  [ "$argument" != '--language' ] || language_seen=1
done
if [ -f openspec/config.yaml ] && [ "$language_seen" = 1 ]; then
  echo '--language does not overwrite an existing OpenSpec config' >&2
  exit 1
fi
if [ ! -f openspec/config.yaml ] && [ "$language_seen" = 0 ]; then
  echo 'fresh initialization must receive the requested language' >&2
  exit 1
fi
mkdir -p openspec
[ -f openspec/config.yaml ] || printf 'schema: spec-driven\n' > openspec/config.yaml
FAKE
  chmod +x "$TEST_ROOT/bin/openspec"
}
run_install() {
  local target="$1"; shift
  (cd "$target" && PATH="$TEST_ROOT/bin:$PATH" "$REPO_ROOT/init.sh" "$@") > "$TEST_ROOT/output" 2>&1 \
    || { cat "$TEST_ROOT/output"; fail "installation failed"; }
}
test_standalone_installation() {
  local target="$TEST_ROOT/default-target"
  mkdir -p "$target"
  git -C "$target" init -q
  run_install "$target"
  [ -f "$target/AGENTS.md" ] || fail "instructions missing"
  for component in openspec adr skills hooks; do
    grep -qx "  - $component" "$target/.paseo-agent-team.yaml" || fail "missing $component"
  done
  for skill in tech-doc eli5 architectural-decision-records openspec-git-discipline; do
    [ -f "$target/.agents/skills/$skill/SKILL.md" ] || fail "missing $skill"
  done
  [ -x "$target/.git/hooks/pre-commit" ] || fail "missing hook"
  [ ! -e "$target/.paseo-agent-team" ] || fail "default install created runtime state"
  [ ! -e "$target/plugins" ] || fail "installer copied plugin code"
  [ ! -e "$target/package.json" ] || fail "installer added a Node dependency"
  local subset
  for subset in adr skills; do
    mkdir -p "$TEST_ROOT/$subset-only"
    printf 'Original instructions.\n' > "$TEST_ROOT/$subset-only/AGENTS.md"
    run_install "$TEST_ROOT/$subset-only" --with "$subset"
    [ "$(head -n 1 "$TEST_ROOT/$subset-only/AGENTS.md")" = 'Original instructions.' ] || fail "user instructions overwritten"
    grep -q 'Solo by default' "$TEST_ROOT/$subset-only/AGENTS.md" || fail "managed block missing"
  done
  mkdir -p "$TEST_ROOT/rejected"
  if (cd "$TEST_ROOT/rejected" && "$REPO_ROOT/init.sh" --with squad) > "$TEST_ROOT/output" 2>&1; then
    fail "retired component was accepted"
  fi
  [ ! -e "$TEST_ROOT/rejected/AGENTS.md" ] || fail "invalid selection changed target"
  printf 'ok: standalone defaults and subsets have no team dependencies\n'
}

test_existing_openspec_config() {
  local target="$TEST_ROOT/existing-config"
  mkdir -p "$target/openspec"
  cat > "$target/openspec/config.yaml" <<'CONFIG'
schema: spec-driven-with-adr
context: |
  Language: Japanese
  Preserve project-specific instructions.
CONFIG
  cp "$target/openspec/config.yaml" "$TEST_ROOT/expected-config"
  run_install "$target" --with openspec --language 'Simplified Chinese'
  cmp "$target/openspec/config.yaml" "$TEST_ROOT/expected-config" || fail "existing OpenSpec context changed"
  grep -qx '  - openspec' "$target/.paseo-agent-team.yaml" || fail "existing OpenSpec initialization was skipped"
  printf 'ok: OpenSpec reinitialization preserves existing language and context\n'
}

test_legacy_upgrade() {
  local target="$TEST_ROOT/legacy-target"
  mkdir -p "$target"
  git -C "$target" init -q
  cat > "$target/AGENTS.md" <<'LEGACY'
User prefix.
<!-- copilot-workflow:begin -->
Old managed instructions.
<!-- copilot-workflow:end -->
User suffix.
LEGACY
  printf 'template: copilot-workflow\n' > "$target/.copilot-workflow.yaml"
  cat > "$target/.git/hooks/pre-commit" <<'HOOK'
#!/usr/bin/env bash
# copilot-workflow hook shim
exit 99
HOOK
  cat > "$target/.git/hooks/pre-commit.backup.user" <<'HOOK'
#!/usr/bin/env bash
printf 'user-hook\n' >> user-hook.log
HOOK
  chmod +x "$target/.git/hooks/pre-commit" "$target/.git/hooks/pre-commit.backup.user"
  run_install "$target"
  cp "$target/AGENTS.md" "$TEST_ROOT/expected-agents"
  run_install "$target"
  cmp "$target/AGENTS.md" "$TEST_ROOT/expected-agents" || fail "rerun changed managed instructions"
  [ "$(head -n 1 "$target/AGENTS.md")" = 'User prefix.' ] || fail "prefix changed"
  [ "$(tail -n 1 "$target/AGENTS.md")" = 'User suffix.' ] || fail "suffix changed"
  [ "$(grep -cF '<!-- paseo-agent-team:begin -->' "$target/AGENTS.md")" = 1 ] || fail "duplicate new blocks"
  if grep -qF '<!-- copilot-workflow:begin -->' "$target/AGENTS.md"; then fail "legacy marker retained"; fi
  [ ! -e "$target/.copilot-workflow.yaml" ] || fail "legacy manifest not migrated"
  (cd "$target" && PASEO_AGENT_TEAM_SKIP_HOOKS=1 .git/hooks/pre-commit) > "$TEST_ROOT/output" 2>&1 || fail "upgraded hook failed"
  [ "$(cat "$target/user-hook.log")" = 'user-hook' ] || fail "user hook did not run exactly once"
  (cd "$target" && COPILOT_WORKFLOW_SKIP_HOOKS=1 scripts/pre-commit.sh) > "$TEST_ROOT/output" 2>&1 || fail "legacy bypass alias failed"
  (cd "$target" && PASEO_AGENT_TEAM_SKIP_HOOKS=0 COPILOT_WORKFLOW_SKIP_HOOKS=1 scripts/pre-commit.sh) > "$TEST_ROOT/output" 2>&1 || fail "legacy bypass failed when both variables were set"
  grep -q 'skipping discipline checks' "$TEST_ROOT/output" || fail "legacy bypass was masked by the new variable"
  printf 'ok: legacy markers, manifest, hook, and bypass migrate without recursion\n'
}

test_bad_markers() {
  local target="$TEST_ROOT/bad-markers"
  mkdir -p "$target"
  printf '<!-- paseo-agent-team:end -->\nUser data\n<!-- paseo-agent-team:begin -->\n' > "$target/AGENTS.md"
  cp "$target/AGENTS.md" "$TEST_ROOT/bad-original"
  if (cd "$target" && "$REPO_ROOT/init.sh" --with adr) > "$TEST_ROOT/output" 2>&1; then fail "reversed markers accepted"; fi
  cmp "$target/AGENTS.md" "$TEST_ROOT/bad-original" || fail "invalid block was overwritten"
  printf '<!-- copilot-workflow:begin -->\n<!-- copilot-workflow:end -->\n<!-- paseo-agent-team:begin -->\n<!-- paseo-agent-team:end -->\n' > "$target/AGENTS.md"
  if (cd "$target" && "$REPO_ROOT/init.sh" --with adr) > "$TEST_ROOT/output" 2>&1; then fail "mixed markers accepted"; fi
  printf 'ok: malformed and mixed managed blocks fail without data loss\n'
}

test_workflow_only_source() {
  local source="$TEST_ROOT/workflow-source" target="$TEST_ROOT/workflow-target"
  mkdir -p "$source/openspec/schemas" "$source/adr" "$target"
  cp "$REPO_ROOT/init.sh" "$REPO_ROOT/AGENTS.md" "$source/"
  cp "$REPO_ROOT/adr/README.md" "$source/adr/"
  cp -R "$REPO_ROOT/openspec/schemas/spec-driven-with-adr" "$source/openspec/schemas/"
  (cd "$target" && "$source/init.sh" --with adr) > "$TEST_ROOT/output" 2>&1 || fail "workflow-only source was rejected"
  [ -f "$target/adr/README.md" ] || fail "workflow-only source did not install"
  printf 'ok: local source resolution needs no plugin or retired runtime\n'
}
setup_openspec
test_standalone_installation
test_existing_openspec_config
test_legacy_upgrade
test_bad_markers
test_workflow_only_source
test_openspec_recovery
printf 'All regression tests passed.\n'
