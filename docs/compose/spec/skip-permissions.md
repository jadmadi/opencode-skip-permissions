---
feature: skip-permissions
status: in-progress
updated: 2026-09-12
branch: feat/skip-permissions
commits:
---

# Skip Permissions

## Report

## [S1] Problem

OpenCode V2 permissions are configuration only. Turning them off at runtime
means editing config and restarting. MiMoCode offers a runtime toggle that
auto-allows actions while keeping explicit deny rules in force.

## [S2] Design

A command toggles auto-allow for one session.

- `/skip-permissions on` enables auto-allow for the current session.
  `/skip-permissions off` disables it. `/skip-permissions` prints the state.
- Auto-allow is applied with a permission `evaluate` hook. Permission hooks run
  for `allow` and `ask` decisions, and an explicit configured `deny` is final
  and does not invoke the hook. So the plugin never needs to read denies.
- The hook upgrades `ask` to `allow` only when the flag is set for the event's
  session. A deny still blocks because the hook never sees it.
- Enabling prints a clear warning in the command result. The state is
  session-scoped and resets when the session ends. It never turns on by itself.

## [S3] Out of Scope

- The `--dangerously-skip-permissions` CLI flag and any global setting.
- Multi-session or persistent toggles.
- A TUI switch.
- Replacing the permission system.

## Tasks

- [x] T0: spike how to read the configured deny rules - result: there is no
      rule-read API, and none is needed. A permission `evaluate` hook runs only
      for allow and ask decisions; an explicit deny is final and never reaches
      the hook. The design uses the hook, as recorded in S2.
- [ ] T1: upgrade ask to allow for one session through the evaluate hook -
      acceptance: a fake-context test asserts an ask becomes allow when the flag
      is set, stays unchanged when it is not, and that allow and deny events are
      never changed (covers: S2; depends: T0)
- [ ] T2: the /skip-permissions command with on, off, and status - acceptance: a
      test round-trips the state and shows the warning on enable (covers: S2;
      depends: T1)
- [ ] T3: README with the safety note and a NOTICE - acceptance: the README
      warns about the risk and the NOTICE names MiMoCode (covers: S2; depends: T2)
