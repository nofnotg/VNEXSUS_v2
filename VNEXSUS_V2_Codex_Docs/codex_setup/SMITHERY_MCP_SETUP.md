# Smithery MCP Setup

## Goal

- Install Smithery CLI
- Keep a reusable MCP setup for this workspace
- Make at least one documentation MCP available to Codex

## What was prepared

- Smithery CLI installed globally
- Smithery authentication confirmed
- `upstash/context7-mcp` connection created in Smithery
- `github`, `sentry`, `supabase`, `neon` connections created in Smithery
- Project-level Codex MCP config added at `.codex/config.toml`

## Project MCP config

This workspace includes a project-level Codex config:

```toml
[mcp_servers.context7]
url = "https://server.smithery.ai/upstash/context7-mcp"

[mcp_servers.github]
url = "https://server.smithery.ai/github"

[mcp_servers.sentry]
url = "https://server.smithery.ai/sentry"

[mcp_servers.supabase]
url = "https://server.smithery.ai/Supabase"

[mcp_servers.neon]
url = "https://server.smithery.ai/neon"
```

This keeps the approved MCP endpoints discoverable without depending only on user-global config.

## Required commands

Install Smithery CLI:

```powershell
npm install -g @smithery/cli@latest
```

Check auth:

```powershell
smithery auth whoami
```

Search MCP servers:

```powershell
smithery mcp search context7
```

Add a server connection:

```powershell
smithery mcp add upstash/context7-mcp
```

Additional approved connections:

```powershell
smithery mcp add github
smithery mcp add sentry
smithery mcp add Supabase
smithery mcp add neon
```

List tools from the connection:

```powershell
smithery tool list context7-mcp
```

## Notes

- In this environment, `smithery mcp add upstash/context7-mcp --client codex` resolved the server but failed with `spawnSync codex EPERM`.
- Because of that, the safer setup for this repo is:
  - create the Smithery connection with `smithery mcp add ...`
  - keep Codex MCP wiring in project `.codex/config.toml`
- `context7` is usable immediately after connection.
- `github`, `sentry`, `supabase`, and `neon` require per-user OAuth authorization before tool calls will succeed.

## Verification checklist

- `smithery --help` works
- `smithery auth whoami` returns a token
- `smithery mcp list` shows `context7-mcp`
- `smithery tool list context7-mcp` returns available tools
- OAuth-backed connections may appear as `auth_required` until each user finishes the provider login flow

## Current approved MCP set

- `context7`
  - Purpose: up-to-date library and framework documentation lookup
  - Remote URL: `https://server.smithery.ai/upstash/context7-mcp`
- `github`
  - Purpose: repository, file, PR, and issue operations
  - Remote URL: `https://server.smithery.ai/github`
- `sentry`
  - Purpose: issue, event, trace, and release investigation
  - Remote URL: `https://server.smithery.ai/sentry`
- `supabase`
  - Purpose: Supabase project, docs, and database operations
  - Remote URL: `https://server.smithery.ai/Supabase`
- `neon`
  - Purpose: PostgreSQL branch and query operations for Neon
  - Remote URL: `https://server.smithery.ai/neon`
