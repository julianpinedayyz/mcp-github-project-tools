# MCP GitHub Project Manager Overview

## Project Purpose

The MCP GitHub Project Manager is a Model Context Protocol (MCP) tool designed to integrate GitHub Projects V2 with the Cursor editor. It enables users to interact with GitHub Projects directly through Cursor's AI assistant, streamlining project management workflows for developers.

## What is MCP?

Model Context Protocol (MCP) is a framework that allows creating tools that can be integrated with AI assistants. In this case, the project creates a bridge between Cursor's AI assistant and GitHub's Project V2 API, allowing users to perform project management tasks without leaving their editor.

## Current Capabilities

The project currently implements two main commands:

1. **ListGithubProjects**
   - Lists all GitHub Project V2 boards the user has access to
   - Displays project titles and IDs

2. **GetGithubProjectDetails**
   - Retrieves detailed information about a specific GitHub Project that's linked to a configured repository
   - Shows project fields, views, and items (issues, pull requests, draft issues)
   - Uses environment variables (`GITHUB_OWNER`, `GITHUB_REPO`) to identify which repository's project to retrieve

## Technical Architecture

### Technology Stack
- **Language**: TypeScript
- **Runtime**: Node.js with Bun as the package manager and runtime
- **Testing**: Vitest for unit testing
- **API Integration**: GitHub GraphQL API for Projects V2
- **Build Process**: Compiles TypeScript into standalone executables using Bun

### Key Components
1. **MCP Server**: Creates a server using `@modelcontextprotocol/sdk` that registers tools
2. **GitHub API Integration**: Uses GraphQL to interact with GitHub Projects V2
3. **Configuration Management**: Uses environment variables for GitHub PAT, repository owner, and repository name
4. **Command Line Interface**: Exposes tools that can be invoked from Cursor

### Project Structure
- `src/github.ts`: Main implementation of GitHub API integration and MCP server
- `bin/mcp-github`: Compiled executable that Cursor invokes
- `docs/`: Documentation for setup and examples
- Various metadata files: README.md, ROADMAP.md, etc.

## Authentication and Configuration

The tool requires:
1. A GitHub Personal Access Token (PAT) with `repo` and `project` permissions
2. Repository owner (username or organization)
3. Repository name

These are configured in Cursor's `mcp.json` file, which specifies:
- Path to the executable
- Environment variables with the required authentication details

## Development Progress

### Implemented
- Basic MCP server architecture
- GitHub GraphQL API integration
- ListGithubProjects tool
- GetGithubProjectDetails tool
- Documentation for setup and usage

### Planned Next Features
- Add Item to Project feature/command
- Sprint planning functionality
- Project item field updates
- Iteration/sprint management

## Integration with Cursor

Users configure the tool in their Cursor `mcp.json` file:
```json
{
  "mcp-github": {
    "command": "/path/to/bin/mcp-github",
    "env": {
      "GITHUB_PAT": "your_github_personal_access_token",
      "GITHUB_OWNER": "your_github_username",
      "GITHUB_REPO": "your_repository_name"
    }
  }
}
```

Once configured, users can invoke the tools directly from Cursor's AI assistant interface.

## Development Workflow

The project follows a structured development approach:
1. Iterative development focusing on one feature at a time
2. Standardized commit message format
3. Comprehensive documentation
4. Generalized examples (avoiding user-specific data)

## Roadmap Highlights

Future development plans include:
1. **Roadmap Creation**: Tools to define high-level goals or epics
2. **Sprint Planning**: Features to select issues from backlog and assign to sprints
3. **Project Item Management**: Creating and updating items in projects
4. **Iteration Management**: Managing sprint/iteration cycles

## Summary

The MCP GitHub Project Manager effectively bridges the gap between the Cursor editor and GitHub Projects V2, allowing developers to manage their projects without context switching. The current implementation provides basic project viewing capabilities with a clear roadmap for more advanced project management features in the future.
