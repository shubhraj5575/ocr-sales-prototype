---
name: Credential handling for this user
description: User has pasted a GitHub PAT in chat once; warn before they paste secrets and offer safer alternatives
type: feedback
originSessionId: b5fa6d7f-0b2f-46d4-b19e-b25c629f0546
---
When this user is asked to authenticate (`gh auth login`, Hostinger login, Supabase login, etc.), they may paste raw credentials (PAT, password, API key) directly into the chat instead of running an interactive login.

**Why:** They did this on 2026-05-03 with a GitHub PAT (`ghp_U7m...`) when asked to run `gh auth login` — they preferred to paste the token over running an interactive browser flow.

**How to apply:**
- Always offer the **safer interactive path first** (`gh auth login --web`, OAuth in browser, hPanel login by them, etc.) before suggesting they paste a token.
- If they do paste a credential anyway, **use it once, then immediately tell them to revoke/rotate it** and explain how (e.g. "go to https://github.com/settings/tokens and delete this token now").
- Never echo the credential back in plain text in subsequent responses or commit it to a file (don't save in `.env`, `.git/config`, etc.). Use `GH_TOKEN` env var or one-shot URL push so the token isn't persisted.
- After deployment/use, suggest a permanent safer setup (e.g. `gh auth login` storing in macOS keychain, or `gh auth switch` between named accounts).
