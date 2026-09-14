// OpenCode V2 skip-permissions plugin.
//
// Auto-approves permission prompts for one session through a permission
// `evaluate` hook. Permission hooks run for `allow` and `ask` decisions, and an
// explicit configured `deny` is final and never reaches the hook, so a deny
// still blocks. Nothing is written to the config.
//
// The runtime does not resolve @opencode/plugin, so this file exports a plain
// { id, setup } object.

const VERSION = "0.1.0"

const PREFIX = "skip-permissions/"

function enabledKey(sessionID: string): string {
  return `${PREFIX}${sessionID}`
}

async function isEnabled(ctx: any, sessionID: string): Promise<boolean> {
  return (await ctx.storage.get(enabledKey(sessionID))) === true
}

// The hook body. It only ever changes an `ask` to an `allow`, and only for a
// session with the flag set. `allow` and `deny` events are left alone.
async function evaluate(ctx: any, event: any): Promise<void> {
  if (event?.effect !== "ask") return
  if (typeof event?.sessionID !== "string") return
  if (!(await isEnabled(ctx, event.sessionID))) return
  event.effect = "allow"
  event.message = "skip-permissions is on for this session"
}

const plugin = {
  id: "skip-permissions",
  async setup(ctx: any) {
    await ctx.command.transform((editor: any) => {
      editor.add({
        name: "skip-permissions",
        description: "Auto-approve ask decisions for this session, or show the state",
        execute: async ({ sessionID, prompt }: any) => {
          if (typeof sessionID !== "string") throw new Error("skip-permissions needs a session id")
          const text = typeof prompt?.text === "string" ? prompt.text.trim().toLowerCase() : ""

          if (!text || text === "status") {
            const state = (await isEnabled(ctx, sessionID)) ? "on" : "off"
            throw new Error(`skip-permissions is ${state} for this session\nskip-permissions ${VERSION}`)
          }

          if (text === "on") {
            await ctx.storage.set(enabledKey(sessionID), true)
            throw new Error(
              "skip-permissions is on. Ask prompts run without approval in this session. Deny rules still block. Turn it off with /skip-permissions off.",
            )
          }

          if (text === "off") {
            await ctx.storage.remove(enabledKey(sessionID))
            throw new Error(`skip-permissions is off\nskip-permissions ${VERSION}`)
          }

          throw new Error("use /skip-permissions on, /skip-permissions off, or /skip-permissions status")
        },
      })
    })

    await ctx.permission.hook("evaluate", (event: any) => evaluate(ctx, event))
  },
}

export { enabledKey, evaluate, isEnabled, VERSION }
export default plugin
