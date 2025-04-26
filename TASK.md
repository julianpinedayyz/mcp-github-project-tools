 # Task List: GitHub Project V2 Management via MCP

 This document enumerates detailed feature implementation tasks for managing GitHub Project V2 through the MCP server. Each task corresponds to an MCP tool/command to be implemented.

 ## 1. Project‑Level Commands

 1. project:create
    - Create a new Project V2 for the configured repository.
    - Inputs:
      • title (string) – project title
      • description (optional string)
      • Uses GITHUB_OWNER, GITHUB_REPO, GITHUB_PAT from env
    - Output: project ID, URL, createdAt

 2. project:list
    - List all Project V2 boards for the configured repository.
    - Inputs: none
    - Output: list of { title, id }

 3. project:get
    - Fetch detailed metadata for a specified project ID.
    - Inputs: projectId (string)
    - Output: { id, title, description, url, createdAt, updatedAt, fieldCount, viewCount, itemCount }

 4. project:update
    - Update a project’s title and/or description.
    - Inputs: projectId, title (optional), description (optional)
    - Output: updated project metadata

 5. project:delete
    - Delete a Project V2 board.
    - Inputs: projectId
    - Output: confirmation message

 ## 2. Field‑Level Commands

 6. field:list
    - List all fields for a project.
    - Inputs: projectId
    - Output: list of { id, name, dataType }

 7. field:create
    - Create a new field (Text, SingleSelect, Iteration).
    - Inputs: projectId, name, type (enum)
    - Output: new field { id, name, dataType }

 8. field:update
    - Rename or change settings on a field.
    - Inputs: fieldId, name (optional), settings (optional)
    - Output: updated field metadata

 9. field:delete
    - Delete a field from a project.
    - Inputs: fieldId
    - Output: confirmation message

 ## 3. View‑Level Commands

 10. view:list
     - List all views (Board, Table, Roadmap) for a project.
     - Inputs: projectId
     - Output: list of { id, name, layout }

 11. view:create
     - Create a new view.
     - Inputs: projectId, name, layout (enum)
     - Output: new view { id, name, layout }

 12. view:update
     - Rename or change layout of a view.
     - Inputs: viewId, name (optional), layout (optional)
     - Output: updated view metadata

 13. view:delete
     - Delete a view from a project.
     - Inputs: viewId
     - Output: confirmation message

 ## 4. Item‑Level Commands

 14. item:add
     - Add an issue, pull request, or draft issue to a project.
     - Inputs: projectId, contentId (issue/PR/draft ID), fieldValues (optional)
     - Output: added item { id, type, content }

 15. item:remove
     - Remove an item from a project.
     - Inputs: projectId, itemId
     - Output: confirmation message

 16. item:list
     - List all items in a project or in a specific view.
     - Inputs: projectId, viewId (optional)
     - Output: list of items, e.g. { id, type, title, repo#, repository }

 17. item:move
     - Move an item to a different column/field value within a board view.
     - Inputs: itemId, fieldId, newValue
     - Output: updated item field entry

 18. item:update
     - Update field values (e.g., status, assignee) on an item.
     - Inputs: itemId, fieldId, value
     - Output: updated item details

 19. item:bulk-add
     - Add multiple issues/PRs to a project in one command.
     - Inputs: projectId, contentIds (array)
     - Output: list of added item IDs

 ## 5. Utility Commands

 20. content:list
     - List open issues and PRs in the configured repository for selection.
     - Inputs: none
     - Output: list of { number, title, repository }

 21. export:json
     - Export the entire project configuration (fields, views, items) to JSON.
     - Inputs: projectId
     - Output: JSON dump of project structure

 22. import:json
     - Import project configuration from JSON to create fields, views, and items.
     - Inputs: projectId, importFilePath
     - Output: summary of created/updated entities

 23. search:projects
     - Search for projects by title across the user/org scope.
     - Inputs: query (string)
     - Output: list of matching { title, id }

 24. watch:project
     - Subscribe to updates/notifications for a project (requires webhook support).
     - Inputs: projectId, eventTypes (array)
     - Output: subscription confirmation

 25. migrate:v1-to-v2
     - Migrate an existing Project V1 to Project V2 format.
     - Inputs: oldProjectNumber
     - Output: new V2 project ID, migration report

 ## Next Steps
 For each task above:
 1. Define the Zod schema for inputs.
 2. Implement the GraphQL query/mutation.
 3. Create the MCP `server.tool()` handler.
 4. Write unit tests (Vitest) for success and error paths.
 5. Update docs (docs/ and README.md) with usage examples.
 6. Wire commands into the CLI build (`src/github.ts` → `bin/mcp-github`).