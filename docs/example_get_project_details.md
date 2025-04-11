# Example Output: GetGithubProjectDetails

This is an example output from calling the `GetGithubProjectDetails` MCP tool for a project configured via environment variables (e.g., project ID: `PVT_EXAMPLE123`).

```markdown
# Sample Project Board

**URL:** https://github.com/users/octocat/projects/1
**Created:** 1/1/2024, 10:00:00 AM
**Updated:** 1/15/2024, 02:30:00 PM

## Fields (8)
- Title (TITLE)
- Assignees (ASSIGNEES)
- Status (ProjectV2SingleSelectField)
- Labels (LABELS)
- Repository (REPOSITORY)
- Milestone (MILESTONE)
- Priority (ProjectV2SingleSelectField)
- Size (ProjectV2SingleSelectField)

## Views (3)
- Kanban Board (BOARD_LAYOUT)
- Task List (TABLE_LAYOUT)
- Team Roadmap (ROADMAP_LAYOUT)

## Items (3)
- Design the new UI (example-repo#10)
- Implement feature X (example-repo#12)
- Draft Issue: Document API changes
```