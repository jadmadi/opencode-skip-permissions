---
feature: skip-permissions
status: delivered
updated: 2026-09-12
branch: feat/skip-permissions
commits: 6c58b9f..4c64d90
---

# Skip Permissions

## Report

**What was built** - A single-file OpenCode V2 plugin that auto-approves
permission prompts for one session. `/skip-permissions on` sets a session flag
and prints a warning, `off` removes it, and `status` shows it. The plugin
registers a permission `evaluate` hook that upgrades an `ask` to `allow` only
for sessions with the flag set. A configured deny never reaches the hook, so it
still blocks. Nothing is written to the config.

**Verification** - `bun test`: 10 pass, 0 fail, 23 assertions. Live: status
showed off, on showed the warning, status showed on, and off showed off. One
review round approved with a medium and lows, all fixed: the flag is removed on
off, the command guards a missing session id, and the test asserts the warning
text.

**Journey log**

1. The spike found no rule-read API, and the design did not need one: permission
   hooks run only for allow and ask decisions, and a deny is final and never
   reaches the hook.
2. The first draft set the flag to false on off, leaving a stale key. It now
   removes the key.
3. S2 claimed the state resets when the session ends. There is no session-end
   signal, so the flag is keyed by session and a resumed session keeps it until
   it is turned off. The spec now says so.

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
  session-scoped: the flag is keyed by session id, and `/skip-permissions off`
  removes it. A new session never inherits it. There is no session-end signal,
  so a resumed session keeps the flag until it is turned off. It never turns on
  by itself.

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
- [x] T1: upgrade ask to allow for one session through the evaluate hook -
      acceptance: a fake-context test asserts an ask becomes allow when the flag
      is set, stays unchanged when it is not, and that allow and deny events are
      never changed (covers: S2; depends: T0)
- [x] T2: the /skip-permissions command with on, off, and status - acceptance: a
      test round-trips the state and shows the warning on enable (covers: S2;
      depends: T1)
- [x] T3: README with the safety note and a NOTICE - acceptance: the README
      warns about the risk and the NOTICE names MiMoCode (covers: S2; depends: T2)
