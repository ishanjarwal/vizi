## Project Guidelines

You are working on a real-time collaborative whiteboard application named Vizi. Follow these guidelines for all changes before executing tasks.

### 1. Read the Documentation

Before making significant changes, review the relevant files in `.agent/wiki`:

Treat these documents as the source of truth. If a change conflicts with them, explain the conflict before proceeding.

### 2. Understand Before Editing

- Inspect the existing code and follow its established patterns.
- Reuse the current tech stack and dependencies where possible.
- Avoid unnecessary rewrites, unrelated refactoring, and overengineering.
- If something important is unclear, ask before making a major architectural decision.

### 3. Write Maintainable Code

- Keep code simple, modular, and easy to understand.
- Use the project's existing conventions and type system.
- Validate external input, especially API and WebSocket messages.
- Handle errors explicitly; do not silently ignore failures.
- Never hardcode secrets or credentials.

### 4. Protect Collaboration and Data

- Preserve the documented rules for real-time updates, persistence, and conflict resolution.
- Make WebSocket operations safe to retry and guard against duplicate processing.
- Do not discard unsynchronized local changes or overwrite them with stale server state.
- Test relevant connection, reconnection, and offline-sync behavior when modifying these areas.

### 5. Verify Changes

- Add or update tests for new behavior and bug fixes.
- Run relevant tests, type checks, and linting when available.
- Review your changes for unintended side effects.
- Report what changed, which checks were run, and any known limitations. Never claim a check passed unless you ran it.

### 6. Keep Scope Focused

Implement only what the task requires. Prefer small, incremental changes over large rewrites. Update the documentation when an approved change affects product requirements, architecture, or the database schema.

### 7. Code Style and Conventions to follow

- Use industry best practices and file organization.
- Since most of the project is JS/TS based, follow the general conventions.
- Use modular code style and create separate functions/constants if the code is reusable
- Don't let circular import/exports occur in the code
- Use jsDoc comments wherever needed
- Don't flood the documents with comments. Only use them where necessary
