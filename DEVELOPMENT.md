# Development Log

This document tracks the development process for adding GitHub Project V2 integration to the `mcp-starter-test` project.

## Initial Setup (Tool: List Projects)

1.  **Goal:** Implement a simple interaction with the GitHub Project V2 API as a starting point.
2.  **API Choice:** Determined that GitHub Project V2 is primarily managed via the **GraphQL API**.
3.  **First Tool:** Selected **"List Projects"** as the initial tool due to its relative simplicity (read-only, basic query).
4.  **Structure Iteration:**
    *   Initial attempts involved integrating the GitHub logic into the existing `hello.ts` server or creating a separate non-server module.
    *   This was incorrect for the established pattern where each tool is served by its own compiled executable.
    *   **Corrected Approach:** Modeled `src/github.ts` precisely after `src/hello.ts`, making it a self-contained MCP server script that initializes its own `McpServer` and uses `StdioServerTransport`.
5.  **Build Process:**
    *   Modified `package.json` to add a `build:github` script (`bun build src/github.ts --compile ... --outfile bin/mcp-github`).
    *   Updated the `build:all` script to include `build:github`.
6.  **Authentication:**
    *   Implemented the GraphQL query in `src/github.ts`.
    *   **Temporarily hardcoded a GitHub Personal Access Token (PAT)** directly in `src/github.ts` for testing purposes. **(Security Warning: This is insecure and should be replaced with environment variables via `.env` before any production use or public sharing).** The PAT requires the `project` scope.
7.  **Configuration:**
    *   Updated `.cursor/mcp.json` to add a new server entry (e.g., `"mcp-github"`) pointing to the `bin/mcp-github` executable and registering the `ListGithubProjects` tool.
8.  **Testing:** Successfully executed the `@ListGithubProjects` tool via Cursor, confirming the API call works and returns the list of projects associated with the PAT.

## Next Steps (Immediate)

*   Document project roadmap in `ROADMAP.md`.
*   Clean the `mcp-starter-test` folder (remove unused files like `weather.ts`, `blog.ts` if desired).
*   Initialize a Git repository.
*   Commit initial setup.
*   Implement secure PAT handling using environment variables (`.env` file).