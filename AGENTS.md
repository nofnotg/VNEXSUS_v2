# VNEXSUS V2

This repository uses `VNEXSUS_V2_Codex_Docs/codex_setup/AGENTS.md` as the canonical extended instruction document.

## MCP usage policy
- Prefer local codebase inspection first when the answer can be derived from repository files.
- Use `Context7` first when you need up-to-date framework, library, SDK, or API documentation.
- Use `GitHub` first for repository, pull request, issue, branch, and remote file operations.
- Use `Sentry` first for production error, event, trace, and release investigation.
- Use `Supabase` for Supabase project, docs, logs, and managed service operations when the task is actually Supabase-related.
- Use `Neon` for Neon PostgreSQL project, branch, schema, and SQL operations when the task is actually Neon-related.
- Treat `Supabase` and `Neon` as higher-risk MCPs because they can affect infrastructure or data.
- Before any write, mutation, migration, creation, deletion, or configuration change through `Supabase` or `Neon`, explicitly confirm with the user.

## MCP operation rules
- Read-only MCP actions are allowed by default when they are necessary to answer the user's request or verify current state.
- Read-only actions include search, list, inspect, describe, get, fetch metadata, fetch logs, fetch traces, and read-only SQL or schema inspection.
- Prefer read-only MCP actions before proposing changes when the task involves external systems, production state, or hosted services.
- Any write action through an MCP requires explicit user confirmation in the current thread before execution.
- Write actions include create, update, edit, comment, assign, merge, close, reopen, delete, restore, pause, deploy, rotate keys, run migrations, execute mutating SQL, or any configuration change.
- If an MCP tool can both read and write, default to the safest read-only path first and explain the next write step before asking for confirmation.
- For `GitHub`, reading repository contents, PRs, issues, and metadata is allowed by default, but creating branches, updating files, commenting, opening PRs, or modifying issues requires confirmation.
- For `Sentry`, investigation is allowed by default, but resolving issues, changing ownership, muting, or altering project configuration requires confirmation.
- For `Supabase` and `Neon`, all mutating operations are treated as high risk and require confirmation every time, even if a similar action was approved earlier in the session.
- Never perform destructive MCP actions implicitly. If the operation can delete, overwrite, pause, or change production-visible state, ask first.

## Core priority
1. date-event extraction
2. evidence linkage
3. structured slot JSON
4. investigator/general-user outputs
5. auth/billing/admin
6. UI polish
