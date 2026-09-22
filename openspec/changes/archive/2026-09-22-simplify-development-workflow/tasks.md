## 1. Review fixes

- [x] 1.1 Reproduce and fix surviving installer children on cancellation, with a regression.
- [x] 1.2 Reproduce and fix stale request reuse after recovering a failed setup response in the installed panel bundle.

## 2. Current installer contract

- [x] 2.1 Remove former installer identifiers and aliases from shell code, panel inspection, and ignore rules.
- [x] 2.2 Replace migration regressions with current managed rerun and malformed-marker coverage.
- [x] 2.3 Update both READMEs and affected guides and architecture to reflect current configuration and ADR-0010.

## 3. Verification and completion

- [x] 3.1 Run typechecking, plugin tests, shell syntax and installer regressions, strict OpenSpec validation, and diff checks.
- [x] 3.2 Reload the plugin and verify the installed panel recovery flow on desktop and compact layouts; clean up test resources.
- [x] 3.3 Synchronize current specs and verify artifact and implementation alignment before archival without commit or push.
