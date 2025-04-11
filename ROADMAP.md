# Project Roadmap: GitHub Project V2 MCP Tools

This document outlines the planned features for the GitHub Project V2 MCP tools, based on the initial concepts from the `mcp-github-project-manager` idea.

## Core Goals

The primary objective is to create MCP tools that facilitate common project management workflows directly within Cursor using GitHub Projects V2.

## High-Level Features

1.  **Create Roadmap:**
    *   **Concept:** Allow users to define high-level goals or epics for a project.
    *   **Potential Implementation:**
        *   Tool takes input like goal titles, descriptions, target dates (optional).
        *   Could create specific "Epic" issue types (if configured in GitHub) or use labels/custom fields within the chosen Project V2.
        *   May involve creating multiple issues/items within the project and potentially linking them.
        *   Might need interaction with Project V2 views or custom fields related to roadmapping.

2.  **Plan a Sprint:**
    *   **Concept:** Help users select issues/items from a backlog (or the project itself) and assign them to a specific sprint/iteration.
    *   **Potential Implementation:**
        *   Tool lists available items (issues/PRs) within a project, potentially filtering by status (e.g., "Backlog", "Todo").
        *   User selects items to include in the sprint.
        *   Tool updates the "Iteration" field (a standard Project V2 field type) for the selected items, either creating a new iteration or assigning to an existing one.
        *   Might involve querying/creating `ProjectV2IterationField` values.

## Foundational Tools (Implemented/Next Steps)

*   **List Projects:** (Implemented) Allows users to see available Project V2 boards. Necessary for selecting the target project for other operations.
*   **List Project Items:** (Needed) Fetch issues/PRs within a specific project, potentially with filtering (by status, iteration, assignee). Essential for sprint planning.
*   **Update Project Item Field:** (Needed) Generic tool to modify a specific field (e.g., Status, Iteration, Assignee, custom fields) for a given item. Core requirement for sprint planning and potentially roadmap creation.
*   **Create Project Item:** (Needed) Add new items (issues) to a project. Required for roadmap creation.
*   **Manage Iterations:** (Needed) List, create, and potentially update iterations (sprints) for a project. Required for sprint planning.

## Future Considerations

*   More complex reporting (e.g., sprint burndown).
*   Integration with GitHub Issues beyond just adding/updating items in projects.
*   Visualizations within the MCP results (if feasible).