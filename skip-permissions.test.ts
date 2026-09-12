import { describe, expect, test } from "bun:test"
import plugin, { enabledKey, evaluate, isEnabled } from "./skip-permissions.ts"

function makeCtx() {
  const store = new Map<string, unknown>()
  const commands: any[] = []
  const hooks: Record<string, any> = {}
  const ctx: any = {
    storage: {
      get: async (key: string) => store.get(key),
      set: async (key: string, value: unknown) => void store.set(key, value),
    },
    command: { transform: (callback: any) => callback({ add: (definition: any) => commands.push(definition) }) },
    permission: { hook: async (name: string, callback: any) => void (hooks[name] = callback) },
  }
  return { ctx, store, commands, hooks }
}

const ask = () => ({ sessionID: "ses_1", action: "shell", resources: ["rm -rf x"], effect: "ask" })

describe("enabledKey and isEnabled", () => {
  test("keys the flag by session", async () => {
    const { ctx, store } = makeCtx()
    expect(enabledKey("ses_1")).toBe("skip-permissions/ses_1")
    expect(await isEnabled(ctx, "ses_1")).toBe(false)
    await store.set(enabledKey("ses_1"), true)
    expect(await isEnabled(ctx, "ses_1")).toBe(true)
  })
})

describe("evaluate", () => {
  test("upgrades ask to allow when the flag is set", async () => {
    const { ctx, store } = makeCtx()
    await store.set(enabledKey("ses_1"), true)
    const event = ask()
    await evaluate(ctx, event)
    expect(event.effect).toBe("allow")
    expect(event.message).toContain("skip-permissions is on")
  })

  test("leaves ask unchanged when the flag is off", async () => {
    const { ctx } = makeCtx()
    const event = ask()
    await evaluate(ctx, event)
    expect(event.effect).toBe("ask")
    expect(event.message).toBeUndefined()
  })

  test("never changes allow or deny", async () => {
    const { ctx, store } = makeCtx()
    await store.set(enabledKey("ses_1"), true)
    const allow = { ...ask(), effect: "allow" }
    const deny = { ...ask(), effect: "deny" }
    await evaluate(ctx, allow)
    await evaluate(ctx, deny)
    expect(allow.effect).toBe("allow")
    expect(deny.effect).toBe("deny")
  })

  test("ignores another session and a missing session id", async () => {
    const { ctx, store } = makeCtx()
    await store.set(enabledKey("ses_1"), true)
    const other = { ...ask(), sessionID: "ses_2" }
    const missing = { ...ask(), sessionID: undefined }
    await evaluate(ctx, other)
    await evaluate(ctx, missing)
    expect(other.effect).toBe("ask")
    expect(missing.effect).toBe("ask")
  })
})

describe("command", () => {
  const run = (commands: any[], text: string, sessionID = "ses_1") =>
    commands[0].execute({ sessionID, prompt: { text } })

  test("registers the command and the hook", async () => {
    const { ctx, commands, hooks } = makeCtx()
    await (plugin as any).setup(ctx)
    expect(commands.map((entry) => entry.name)).toEqual(["skip-permissions"])
    expect(typeof hooks.evaluate).toBe("function")
  })

  test("turns on with a warning, shows status, and turns off", async () => {
    const { ctx, store, commands } = makeCtx()
    await (plugin as any).setup(ctx)

    await expect(run(commands, "status")).rejects.toThrow(/is off/)
    await expect(run(commands, "ON")).rejects.toThrow(/is on/)
    expect(store.get(enabledKey("ses_1"))).toBe(true)
    await expect(run(commands, "")).rejects.toThrow(/is on/)
    await expect(run(commands, "off")).rejects.toThrow(/is off/)
    expect(store.get(enabledKey("ses_1"))).toBe(false)
  })

  test("rejects an unknown argument", async () => {
    const { ctx, commands } = makeCtx()
    await (plugin as any).setup(ctx)
    await expect(run(commands, "maybe")).rejects.toThrow(/use \/skip-permissions/)
  })

  test("the hook uses the stored flag", async () => {
    const { ctx, commands, hooks } = makeCtx()
    await (plugin as any).setup(ctx)
    const first = ask()
    await hooks.evaluate(first)
    expect(first.effect).toBe("ask")

    await run(commands, "on").catch(() => {})
    const second = ask()
    await hooks.evaluate(second)
    expect(second.effect).toBe("allow")
  })
})
