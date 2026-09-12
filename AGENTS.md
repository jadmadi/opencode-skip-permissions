# AGENTS.md

Guidance for agents working in this repository.

## What this is

An OpenCode V2 plugin (`skip-permissions.ts`) that auto-approves permission
prompts for one session through a permission `evaluate` hook. Deny rules stay in
force. No build step, no dependencies, MIT.

## Local development

```sh
bun test
cp skip-permissions.ts ~/.config/opencode/plugins/skip-permissions.ts
touch ~/.config/opencode/plugins/skip-permissions.ts
```

Check the server log when something is off:

```sh
grep skip-permissions ~/.local/share/opencode/log/opencode.log | tail
```

## Spike result (T0)

There is no API to read the configured permission rules. That is fine: a
permission `evaluate` hook runs only for `allow` and `ask` decisions, and an
explicit configured `deny` is final and does not invoke the hook. So the plugin
never needs to read denies. It upgrades `ask` to `allow` only for sessions with
the flag set, and a deny still blocks.

## Hard constraints

- Do not import `@opencode/plugin`. Export a plain `{ id, setup }` object.
- Keep the plugin dependency-free.
- The hook must only change `ask` to `allow`. Never touch `allow` or `deny`.
- Never enable the flag automatically.
- Plugin `console` output is not visible to users. A command surfaces messages
  only by throwing.

## API notes

- `ctx.permission.hook("evaluate", async (event) => { ... })` receives
  `sessionID`, `agent`, `action`, `resources`, `effect`, and `message`. Setting
  `event.effect` changes the decision.
- The flag lives in `ctx.storage` under `skip-permissions/<sessionID>`.

## Layout

- `enabledKey` - the storage key for a session.
- `isEnabled` - reads the flag for a session.
- `evaluate` - the hook body, exported for tests.
- `setup` - registers the command and the hook.
- `skip-permissions.test.ts` - tests with a fake ctx.

## Releasing

- Semantic commit messages. Changes through a feature branch and a PR.
- Keep `NOTICE` accurate.
