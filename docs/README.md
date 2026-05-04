# OCR Sales — internal docs

Background and context for the AppSheet replacement project. The HTML prototype itself lives one directory up; this folder is for **planning and decisions**, not code.

## Files

| File | What's in it |
|---|---|
| [`plan.md`](plan.md) | Full implementation plan (5 phases) — context, stack, schema, phased delivery, verification gates, risks. Source-of-truth for what we're building and why. |
| [`memory/user_role.md`](memory/user_role.md) | Who the user is, their employer (One Group / Spice One Builders), the brand aesthetic to match. |
| [`memory/project_appsheet_replacement.md`](memory/project_appsheet_replacement.md) | The current state of the project — infrastructure available, schema reality from API probe, locked stack decisions. |
| [`memory/feedback_credentials.md`](memory/feedback_credentials.md) | Guidance on credential handling discovered during the project. |
| [`memory/reference_appsheet_app.md`](memory/reference_appsheet_app.md) | Pointers to the live AppSheet app, its API endpoint, and the cached schema probe. |
| [`memory/reference_hostinger_vps.md`](memory/reference_hostinger_vps.md) | The production VPS (Hostinger KVM 2 in Mumbai) details and security state. |

## Where the real secrets live

The AppSheet API access key has been **redacted** from these committed files (replaced with `<see local ~/Downloads/CLAUDE.md>`). The actual key lives only in:

- The user's local `~/Downloads/CLAUDE.md` (project instructions for Claude Code, not committed anywhere)
- The AppSheet editor's Integrations panel

GitHub's secret-scanning will auto-revoke any key that gets pushed to a public repo, so we never commit raw credentials here.

## How these files are used

Claude Code reads `~/.claude/plans/<this-plan>.md` and `~/.claude/projects/.../memory/*.md` as live context across sessions. The copies in this `docs/` folder are a **snapshot** for human readers and version history. The originals on the user's Mac are the live ones — if the live versions diverge from these, the live ones win.
