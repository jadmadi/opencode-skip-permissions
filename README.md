# opencode-skip-permissions

An OpenCode V2 plugin that auto-approves permission prompts for one session,
while explicit deny rules still block.

## Install

```sh
mkdir -p ~/.config/opencode/plugins
curl -fsSL \
  https://raw.githubusercontent.com/jadmadi/opencode-skip-permissions/main/skip-permissions.ts \
  -o ~/.config/opencode/plugins/skip-permissions.ts
```

For one project, put it in `.opencode/plugins/`. Tested against OpenCode
`0.0.0-beta-19425`.

## Use

| Command                    | Effect                                     |
| -------------------------- | ------------------------------------------ |
| `/skip-permissions on`     | Auto-approve `ask` decisions in this session |
| `/skip-permissions off`    | Stop auto-approving                         |
| `/skip-permissions` or `/skip-permissions status` | Show the state      |

The setting is session-scoped and never turns on by itself.

## How it works

The plugin registers a permission `evaluate` hook. Permission hooks run for
`allow` and `ask` decisions, and an explicit configured `deny` is final and
never reaches the hook. So when the flag is on, the hook upgrades an `ask` to
`allow`, and a deny still blocks. Nothing is written to `opencode.json`.

## Warning

With this on, the model can run tools that would otherwise ask for approval.
Deny rules still apply, but anything only guarded by an `ask` prompt runs
without one. Use it only in a workspace you trust, and turn it off when done.

## Tests

```sh
bun test
```

## Attribution

Inspired by MiMoCode's `/skip-permissions`. See `NOTICE`.

## License

MIT
