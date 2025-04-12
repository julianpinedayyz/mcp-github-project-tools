# Cursor Configuration

To use the MCP GitHub Project Manager in Cursor, you need to configure it in your Cursor settings file. Here's how to set it up:

## Location
The configuration should be added to your Cursor settings file, typically located at:
- macOS: `~/.cursor/mcp.json`
- Linux: `~/.cursor/mcp.json`
- Windows: `%APPDATA%\Cursor\mcp.json`

## Configuration

Add the following configuration to your `mcp.json` file:

```json
{
  "mcp-github": {
    "command": "/path/to/your/mcp-github-project-manager/mcp-starter-test/bin/mcp-github",
    "env": {
      "GITHUB_PAT": "your_github_personal_access_token",
      "GITHUB_OWNER": "your_github_username",
      "GITHUB_REPO": "your_repository_name"
    }
  }
}
```

### Parameters Explained

- `command`: Full path to the MCP GitHub executable
  - Replace `/path/to/your` with the actual path where you cloned the repository

- `env`: Environment variables required by the MCP
  - `GITHUB_PAT`: Your GitHub Personal Access Token
    - Must have permissions for: `repo`, `project`
  - `GITHUB_OWNER`: Your GitHub username or organization name
  - `GITHUB_REPO`: The repository name where your project board is located

## Example with Placeholders

```json
{
  "mcp-github": {
    "command": "/Users/username/projects/mcp-starter-test/bin/mcp-github",
    "env": {
      "GITHUB_PAT": "ghp_xxxxxxxxxxxxxxxxxxxx",
      "GITHUB_OWNER": "octocat",
      "GITHUB_REPO": "example-repo"
    }
  }
}
```

## Important Notes

1. Make sure to replace all placeholder values with your actual configuration
2. Keep your GitHub PAT secure and never share it
3. The path in the `command` field should be absolute
4. Restart Cursor after making changes to the configuration