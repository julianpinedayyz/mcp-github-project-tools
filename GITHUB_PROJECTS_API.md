# GitHub Projects V2 API Documentation

This document provides comprehensive documentation on using the GitHub Projects V2 API for developing features for the MCP GitHub Project Manager tool.

## Table of Contents

1. [Introduction](#introduction)
2. [Authentication](#authentication)
3. [GraphQL API Basics](#graphql-api-basics)
4. [Common Operations](#common-operations)
   - [Finding Project Information](#finding-project-information)
   - [Managing Items](#managing-items)
   - [Managing Fields](#managing-fields)
   - [Working with Iterations (Sprints)](#working-with-iterations-sprints)
   - [Project Settings](#project-settings)
5. [Creating Projects](#creating-projects)
6. [Using Webhooks](#using-webhooks)
7. [Example Code Snippets](#example-code-snippets)
8. [Resources](#resources)

## Introduction

GitHub Projects V2 is only accessible via the GitHub GraphQL API. This means all interactions with Projects must be done using GraphQL queries and mutations.

Key points:
- There is no REST API for GitHub Projects V2.
- All operations require GraphQL queries/mutations.
- The API supports projects for both organizations and users.

## Authentication

### Required Permissions

To access the GitHub Projects V2 API, you need a GitHub token with the following permissions:

- For queries: `read:project` scope
- For mutations (creating/updating): `project` scope

### Authentication in GraphQL Requests

Add the token to your requests using the Authorization header:

```
Authorization: Bearer YOUR_GITHUB_TOKEN
```

### Authentication with GitHub CLI

If using GitHub CLI, authenticate with:

```bash
gh auth login --scopes "project"
```

## GraphQL API Basics

### Endpoint

All GraphQL requests are made to:

```
https://api.github.com/graphql
```

### Request Format

GraphQL requests are POST requests with a JSON body containing a `query` field:

```json
{
  "query": "query { ... }",
  "variables": { "variableName": "value" }
}
```

### Using Variables

Variables make GraphQL queries more reusable:

```graphql
query($organization: String! $number: Int!) {
  organization(login: $organization) {
    projectV2(number: $number) {
      id
    }
  }
}
```

With variables:
```json
{
  "organization": "octo-org",
  "number": 5
}
```

## Common Operations

### Finding Project Information

#### Finding a Project's Node ID (Organization Project)

```graphql
query {
  organization(login: "ORGANIZATION") {
    projectV2(number: NUMBER) {
      id
    }
  }
}
```

#### Finding a Project's Node ID (User Project)

```graphql
query {
  user(login: "USER") {
    projectV2(number: NUMBER) {
      id
    }
  }
}
```

#### Listing All Projects (Organization)

```graphql
query {
  organization(login: "ORGANIZATION") {
    projectsV2(first: 20) {
      nodes {
        id
        title
      }
    }
  }
}
```

#### Listing All Projects (User)

```graphql
query {
  user(login: "USER") {
    projectsV2(first: 20) {
      nodes {
        id
        title
      }
    }
  }
}
```

#### Finding a Project ID for a Repository

```graphql
query GetRepositoryProject($owner: String!, $repo: String!) {
  repository(owner: $owner, name: $repo) {
    projectsV2(first: 1) {
      nodes {
        id
        title
      }
    }
  }
}
```

### Managing Items

#### Adding an Item to a Project

```graphql
mutation {
  addProjectV2ItemById(input: {
    projectId: "PROJECT_ID"
    contentId: "CONTENT_ID"
  }) {
    item {
      id
    }
  }
}
```

- `PROJECT_ID`: The node ID of the project
- `CONTENT_ID`: The node ID of the issue or pull request to add

#### Adding a Draft Issue to a Project

```graphql
mutation {
  addProjectV2DraftIssue(input: {
    projectId: "PROJECT_ID"
    title: "TITLE"
    body: "BODY"
  }) {
    projectItem {
      id
    }
  }
}
```

#### Deleting an Item from a Project

```graphql
mutation {
  deleteProjectV2Item(input: {
    projectId: "PROJECT_ID"
    itemId: "ITEM_ID"
  }) {
    deletedItemId
  }
}
```

#### Querying Items in a Project

```graphql
query {
  node(id: "PROJECT_ID") {
    ... on ProjectV2 {
      items(first: 20) {
        nodes {
          id
          fieldValues(first: 8) {
            nodes {
              ... on ProjectV2ItemFieldTextValue {
                text
                field {
                  ... on ProjectV2FieldCommon {
                    name
                  }
                }
              }
              ... on ProjectV2ItemFieldDateValue {
                date
                field {
                  ... on ProjectV2FieldCommon {
                    name
                  }
                }
              }
              ... on ProjectV2ItemFieldSingleSelectValue {
                name
                field {
                  ... on ProjectV2FieldCommon {
                    name
                  }
                }
              }
            }
          }
          content {
            ... on DraftIssue {
              title
              body
            }
            ... on Issue {
              title
              assignees(first: 10) {
                nodes {
                  login
                }
              }
            }
            ... on PullRequest {
              title
              assignees(first: 10) {
                nodes {
                  login
                }
              }
            }
          }
        }
      }
    }
  }
}
```

### Managing Fields

#### Finding Field Information

```graphql
query {
  node(id: "PROJECT_ID") {
    ... on ProjectV2 {
      fields(first: 20) {
        nodes {
          ... on ProjectV2Field {
            id
            name
          }
          ... on ProjectV2IterationField {
            id
            name
            configuration {
              iterations {
                startDate
                id
              }
            }
          }
          ... on ProjectV2SingleSelectField {
            id
            name
            options {
              id
              name
            }
          }
        }
      }
    }
  }
}
```

For a simpler view without details:

```graphql
query {
  node(id: "PROJECT_ID") {
    ... on ProjectV2 {
      fields(first: 20) {
        nodes {
          ... on ProjectV2FieldCommon {
            id
            name
          }
        }
      }
    }
  }
}
```

#### Updating Field Values

##### Updating Text, Number, or Date Fields

```graphql
mutation {
  updateProjectV2ItemFieldValue(
    input: {
      projectId: "PROJECT_ID"
      itemId: "ITEM_ID"
      fieldId: "FIELD_ID"
      value: {
        text: "Updated text"
        # OR for number: number: 42
        # OR for date: date: "2023-01-01"
      }
    }
  ) {
    projectV2Item {
      id
    }
  }
}
```

##### Updating Single Select Fields

```graphql
mutation {
  updateProjectV2ItemFieldValue(
    input: {
      projectId: "PROJECT_ID"
      itemId: "ITEM_ID"
      fieldId: "FIELD_ID"
      value: {
        singleSelectOptionId: "OPTION_ID"
      }
    }
  ) {
    projectV2Item {
      id
    }
  }
}
```

### Working with Iterations (Sprints)

#### Finding Iteration Fields and Values

```graphql
query {
  node(id: "PROJECT_ID") {
    ... on ProjectV2 {
      fields(first: 20) {
        nodes {
          ... on ProjectV2IterationField {
            id
            name
            configuration {
              iterations {
                id
                title
                startDate
                endDate
              }
            }
          }
        }
      }
    }
  }
}
```

#### Updating an Item's Iteration

```graphql
mutation {
  updateProjectV2ItemFieldValue(
    input: {
      projectId: "PROJECT_ID"
      itemId: "ITEM_ID"
      fieldId: "FIELD_ID"
      value: {
        iterationId: "ITERATION_ID"
      }
    }
  ) {
    projectV2Item {
      id
    }
  }
}
```

Note: Iteration fields are special fields in Projects V2 that allow you to associate items with specific repeating blocks of time (sprints). These can be used for sprint planning.

### Project Settings

#### Updating Project Settings

```graphql
mutation {
  updateProjectV2(
    input: {
      projectId: "PROJECT_ID",
      title: "Project title",
      public: false,
      readme: "# Project README\n\nA long description",
      shortDescription: "A short description"
    }
  ) {
    projectV2 {
      id
      title
      readme
      shortDescription
    }
  }
}
```

## Creating Projects

### Getting a User or Organization ID

```bash
# For organization
gh api -H "Accept: application/vnd.github+json" /orgs/ORGANIZATION_NAME

# For user
gh api -H "Accept: application/vnd.github+json" /users/USERNAME
```

### Creating a New Project

```graphql
mutation {
  createProjectV2(
    input: {
      ownerId: "OWNER_ID",
      title: "PROJECT_NAME"
    }
  ) {
    projectV2 {
      id
    }
  }
}
```

## Using Webhooks

You can use webhooks to subscribe to events happening in your project:

- **Event**: `projects_v2_item`
- Webhook will send a HTTP POST payload when items are added, modified, or removed from a project

For more information on setting up webhooks, see the [GitHub documentation on webhooks](https://docs.github.com/en/webhooks-and-events/webhooks/about-webhooks).

## Example Code Snippets

### Adding an Issue to a Project (TypeScript)

```typescript
async function addIssueToProject(projectId: string, issueId: string): Promise<string> {
  const query = `
    mutation {
      addProjectV2ItemById(input: {
        projectId: "${projectId}"
        contentId: "${issueId}"
      }) {
        item {
          id
        }
      }
    }
  `;

  const response = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      "Authorization": `bearer ${process.env.GITHUB_PAT}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  });

  const data = await response.json();
  return data.data.addProjectV2ItemById.item.id;
}
```

### Getting All Items in a Project (TypeScript)

```typescript
async function getProjectItems(projectId: string): Promise<any[]> {
  const query = `
    query {
      node(id: "${projectId}") {
        ... on ProjectV2 {
          items(first: 100) {
            nodes {
              id
              content {
                ... on Issue {
                  title
                  number
                }
                ... on PullRequest {
                  title
                  number
                }
                ... on DraftIssue {
                  title
                }
              }
            }
          }
        }
      }
    }
  `;

  const response = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      "Authorization": `bearer ${process.env.GITHUB_PAT}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  });

  const data = await response.json();
  return data.data.node.items.nodes;
}
```

### Setting an Item's Status Field (TypeScript)

```typescript
async function setItemStatus(
  projectId: string,
  itemId: string,
  statusFieldId: string,
  statusOptionId: string
): Promise<void> {
  const query = `
    mutation {
      updateProjectV2ItemFieldValue(
        input: {
          projectId: "${projectId}"
          itemId: "${itemId}"
          fieldId: "${statusFieldId}"
          value: {
            singleSelectOptionId: "${statusOptionId}"
          }
        }
      ) {
        projectV2Item {
          id
        }
      }
    }
  `;

  await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      "Authorization": `bearer ${process.env.GITHUB_PAT}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  });
}
```

## Resources

- [Official GitHub GraphQL API Documentation](https://docs.github.com/en/graphql)
- [GitHub Projects Documentation](https://docs.github.com/en/issues/planning-and-tracking-with-projects)
- [Using the API to manage Projects](https://docs.github.com/en/issues/planning-and-tracking-with-projects/automating-your-project/using-the-api-to-manage-projects)
- [GitHub CLI Documentation](https://cli.github.com/manual/)
- [GraphQL Explorer](https://docs.github.com/en/graphql/overview/explorer) - Interactive tool to explore the GitHub GraphQL API

---

This documentation aims to provide the necessary information for developing features related to GitHub Projects V2 for the MCP GitHub Project Manager tool. As the GitHub API may evolve over time, refer to the official GitHub documentation for the most up-to-date information.
