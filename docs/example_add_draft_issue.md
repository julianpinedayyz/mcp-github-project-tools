# Example Output: AddDraftIssueToProject

This is an example output from calling the `AddDraftIssueToProject` MCP tool.

## Usage

```
@AddDraftIssueToProject --title="New task: Update documentation" --body="We need to update the API documentation to include the latest changes."
```

### Optional Arguments

You can also specify a project ID directly if you want to add to a project other than the one configured in your environment variables:

```
@AddDraftIssueToProject --title="New task: Update documentation" --body="We need to update the API documentation to include the latest changes." --projectId="PVT_kwDOABC123"
```

## Example Output

```markdown
✅ Successfully added draft issue "New task: Update documentation" to the project.

Draft Issue ID: PVTI_lADOABCDEF123456789
```

## Error Example

If there is an issue with adding the draft issue, you might see an error message like:

```markdown
❌ Error adding draft issue to project: No GitHub Project V2 found linked to the repository octocat/example-repo.
```

## Notes

- The draft issue is added to the project but isn't associated with any GitHub repository
- Draft issues can later be converted to regular GitHub issues if needed
- The issue will be placed in the default location in your project views, and you can move it to specific columns/fields as needed
