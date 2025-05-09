// Remove dotenv import
// import dotenv from 'dotenv';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

// --- GitHub Specific Logic ---

// Interface for adding a draft issue to a project
interface AddDraftIssueArgs {
  title: string;
  body: string;
  // Default to using projectId from environment variables if not provided directly
  projectId?: string;
}

interface ListProjectsArgs {
  // No args needed for now
}

interface Project {
  id: string;
  title: string;
}

// New interface for project details
interface GetProjectDetailsArgs {
  projectId: string;
}

// Interface for project field type
interface ProjectField {
  id: string;
  name: string;
  dataType: string;
}

// Interface for project view
interface ProjectView {
  id: string;
  name: string;
  layout: string;
}

// Interface for project item
interface ProjectItem {
  id: string;
  type: string;
  title?: string;
  content?: {
    title?: string;
    number?: number;
    repository?: string;
  };
}

// Interface for detailed project
interface ProjectDetails extends Project {
  description: string | null;
  fields: ProjectField[];
  views: ProjectView[];
  items: ProjectItem[];
  url: string;
  createdAt: string;
  updatedAt: string;
}

// Remove path calculation logic

async function fetchGitHubProjects(args: ListProjectsArgs): Promise<Project[]> {
  // --- Read Token directly from process.env (set by mcp.json 'env') ---
  const GITHUB_PAT = process.env.GITHUB_PAT;
  console.error(`Checking for GITHUB_PAT in process.env`); // Debug log

  console.error('Fetching GitHub Projects...');

  if (!GITHUB_PAT) {
    // Error if MCP didn't inject the variable
    console.error(
      'GitHub PAT check failed! Variable not found in process.env.'
    );
    throw new Error(
      "GitHub PAT not found in environment variables (expected from mcp.json 'env')."
    );
  }
  console.error(`GITHUB_PAT found, length: ${GITHUB_PAT.length}`); // Confirm it was found

  // Token retrieved from process.env, proceed as before
  const graphqlQuery = `
    query {
      viewer {
        projectsV2(first: 20) {
          nodes {
            id
            title
          }
        }
      }
    }
  `;

  try {
    const response = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        Authorization: `bearer ${GITHUB_PAT}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: graphqlQuery }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `GitHub API request failed: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    const data = await response.json();

    if (data.errors) {
      console.error('GitHub GraphQL API errors:', data.errors);
      throw new Error(
        `GraphQL error: ${data.errors[0]?.message || 'Unknown GraphQL error'}`
      );
    }

    const projects: Project[] = data?.data?.viewer?.projectsV2?.nodes || [];
    console.error(`Fetched ${projects.length} projects.`);
    return projects;
  } catch (error) {
    // Log error details to stderr
    console.error('Error fetching GitHub projects:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to fetch projects: ${error.message}`);
    }
    throw new Error('An unknown error occurred while fetching projects.');
  }
}

// New function to fetch project details
async function fetchProjectDetails(
  args: GetProjectDetailsArgs
): Promise<ProjectDetails> {
  const GITHUB_PAT = process.env.GITHUB_PAT;
  console.error(`Checking for GITHUB_PAT in process.env`); // Debug log

  console.error(`Fetching details for project ID: ${args.projectId}...`);

  if (!GITHUB_PAT) {
    console.error(
      'GitHub PAT check failed! Variable not found in process.env.'
    );
    throw new Error(
      "GitHub PAT not found in environment variables (expected from mcp.json 'env')."
    );
  }

  // GraphQL query for project details
  const graphqlQuery = `
    query {
      node(id: "${args.projectId}") {
        ... on ProjectV2 {
          id
          title
          url
          createdAt
          updatedAt
          fields(first: 20) {
            nodes {
              ... on ProjectV2Field {
                id
                name
                dataType
              }
              ... on ProjectV2IterationField {
                id
                name
                dataType: __typename
              }
              ... on ProjectV2SingleSelectField {
                id
                name
                dataType: __typename
              }
            }
          }
          views(first: 10) {
            nodes {
              id
              name
              layout
            }
          }
          items(first: 20) {
            nodes {
              id
              type: __typename
              content {
                ... on Issue {
                  title
                  number
                  repository {
                    name
                  }
                }
                ... on PullRequest {
                  title
                  number
                  repository {
                    name
                  }
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

  try {
    const response = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        Authorization: `bearer ${GITHUB_PAT}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: graphqlQuery }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `GitHub API request failed: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    const data = await response.json();

    if (data.errors) {
      console.error('GitHub GraphQL API errors:', data.errors);
      throw new Error(
        `GraphQL error: ${data.errors[0]?.message || 'Unknown GraphQL error'}`
      );
    }

    // Extract project data from response
    const projectNode = data?.data?.node;

    if (!projectNode) {
      throw new Error('Project not found or invalid project ID');
    }

    // Format the fields, views, and items
    const fields: ProjectField[] =
      projectNode.fields?.nodes?.map((field: any) => ({
        id: field.id,
        name: field.name,
        dataType: field.dataType || 'Unknown',
      })) || [];

    const views: ProjectView[] =
      projectNode.views?.nodes?.map((view: any) => ({
        id: view.id,
        name: view.name,
        layout: view.layout,
      })) || [];

    const items: ProjectItem[] =
      projectNode.items?.nodes?.map((item: any) => {
        const content = item.content
          ? {
              title: item.content.title,
              number: item.content.number,
              repository: item.content.repository?.name,
            }
          : undefined;

        return {
          id: item.id,
          type: item.type,
          content,
        };
      }) || [];

    // Construct the project details
    const projectDetails: ProjectDetails = {
      id: projectNode.id,
      title: projectNode.title,
      description: null,
      url: projectNode.url,
      createdAt: projectNode.createdAt,
      updatedAt: projectNode.updatedAt,
      fields,
      views,
      items,
    };

    console.error(
      `Successfully fetched details for project: ${projectDetails.title}`
    );
    return projectDetails;
  } catch (error) {
    console.error('Error fetching project details:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to fetch project details: ${error.message}`);
    }
    throw new Error(
      'An unknown error occurred while fetching project details.'
    );
  }
}

// New function to fetch the Project ID for a given repository
async function fetchProjectIdForRepo(
  owner: string,
  repo: string
): Promise<string | null> {
  const GITHUB_PAT = process.env.GITHUB_PAT;
  console.error(`Checking GITHUB_PAT for Project ID lookup...`);

  if (!GITHUB_PAT) {
    console.error('GitHub PAT not found for Project ID lookup.');
    throw new Error('GitHub PAT not found in environment variables.');
  }

  console.error(`Looking for Project V2 ID for repository: ${owner}/${repo}`);

  // GraphQL query to find the project associated with the repository
  // This query assumes the project is owned by the same owner as the repo.
  // Adjust if projects can be owned by organizations or other users.
  const graphqlQuery = `
    query GetRepositoryProject($owner: String!, $repo: String!) {
      repository(owner: $owner, name: $repo) {
        projectsV2(first: 1) { # Assuming only one project per repo for this tool
          nodes {
            id
            title
          }
        }
      }
    }
  `;

  try {
    const response = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        Authorization: `bearer ${GITHUB_PAT}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: graphqlQuery,
        variables: { owner, repo },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `GitHub API request failed for Project ID lookup: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    const data = await response.json();

    if (data.errors) {
      console.error(
        'GitHub GraphQL API errors during Project ID lookup:',
        data.errors
      );
      throw new Error(
        `GraphQL error during Project ID lookup: ${
          data.errors[0]?.message || 'Unknown GraphQL error'
        }`
      );
    }

    const projectNode = data?.data?.repository?.projectsV2?.nodes?.[0];

    if (projectNode && projectNode.id) {
      console.error(
        `Found Project V2 ID: ${projectNode.id} (${projectNode.title}) for ${owner}/${repo}`
      );
      return projectNode.id;
    } else {
      console.error(
        `No Project V2 found linked to repository ${owner}/${repo}`
      );
      return null; // Return null if no project is found
    }
  } catch (error) {
    console.error('Error fetching Project ID for repository:', error);
    if (error instanceof Error) {
      throw new Error(
        `Failed to fetch Project ID for ${owner}/${repo}: ${error.message}`
      );
    }
    throw new Error(
      `An unknown error occurred while fetching the Project ID for ${owner}/${repo}.`
    );
  }
}

// Function to add a draft issue to a project
async function addDraftIssueToProject(
  args: AddDraftIssueArgs
): Promise<string> {
  const GITHUB_PAT = process.env.GITHUB_PAT;
  console.error(
    `Checking for GITHUB_PAT in process.env for adding draft issue`
  );

  if (!GITHUB_PAT) {
    console.error(
      'GitHub PAT check failed! Variable not found in process.env.'
    );
    throw new Error(
      "GitHub PAT not found in environment variables (expected from mcp.json 'env')."
    );
  }

  let projectId = args.projectId;

  // If projectId is not provided, try to get it from the environment variables
  if (!projectId) {
    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;

    if (!owner || !repo) {
      throw new Error(
        'Either provide a projectId or set GITHUB_OWNER and GITHUB_REPO in environment variables.'
      );
    }

    console.error(
      `No projectId provided, fetching from repository ${owner}/${repo}`
    );
    projectId = await fetchProjectIdForRepo(owner, repo);

    if (!projectId) {
      throw new Error(
        `No GitHub Project V2 found linked to the repository ${owner}/${repo}.`
      );
    }
  }

  console.error(
    `Adding draft issue "${args.title}" to project ID: ${projectId}`
  );

  // GraphQL mutation to add a draft issue
  const graphqlMutation = `
    mutation {
      addProjectV2DraftIssue(input: {
        projectId: "${projectId}"
        title: "${args.title.replace(/"/g, '\\"')}"
        body: "${args.body.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"
      }) {
        projectItem {
          id
        }
      }
    }
  `;

  try {
    const response = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        Authorization: `bearer ${GITHUB_PAT}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: graphqlMutation }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `GitHub API request failed: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    const data = await response.json();

    if (data.errors) {
      console.error('GitHub GraphQL API errors:', data.errors);
      throw new Error(
        `GraphQL error: ${data.errors[0]?.message || 'Unknown GraphQL error'}`
      );
    }

    const newItemId = data?.data?.addProjectV2DraftIssue?.projectItem?.id;

    if (!newItemId) {
      throw new Error('Failed to retrieve the ID of the created draft issue');
    }

    console.error(`Successfully added draft issue with ID: ${newItemId}`);
    return newItemId;
  } catch (error) {
    console.error('Error adding draft issue to project:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to add draft issue: ${error.message}`);
    }
    throw new Error('An unknown error occurred while adding the draft issue.');
  }
}

// --- MCP Server Setup for GitHub Tool ---

// Create an MCP server instance specifically for the GitHub tool(s)
const server = new McpServer({
  // You might want a more specific name like "mcp-github-tools"
  // but keep "mcp-tools" if mcp.json expects that name for the executable
  name: 'mcp-github',
  version: '1.0.0',
});

// Register the GitHub Projects Lister tool
server.tool(
  'ListGithubProjects', // Tool name for MCP
  'List your GitHub Project V2 projects',
  {
    /* No input arguments needed for now - defined by ListProjectsArgs */
  },
  async (args: ListProjectsArgs) => {
    // Use the args type
    try {
      // Call the fetching logic defined above
      const projects = await fetchGitHubProjects(args);

      // Format the result for MCP
      let outputText = 'Your GitHub Projects:\n';
      if (projects.length === 0) {
        outputText = 'No GitHub Projects V2 found.';
      } else {
        outputText += projects
          .map((p) => `- ${p.title} (ID: ${p.id})`)
          .join('\n');
      }

      return {
        content: [
          {
            type: 'text',
            text: outputText,
          },
        ],
      };
    } catch (error: any) {
      // Log error details to stderr before returning error response
      console.error('Error in ListGithubProjects tool handler:', error);
      return {
        content: [
          {
            type: 'text',
            text: `Error listing GitHub projects: ${
              error.message || 'Unknown error'
            }`,
          },
        ],
      };
    }
  }
);

// Register the GetGithubProjectDetails tool (updated)
server.tool(
  'GetGithubProjectDetails',
  'Get detailed information about the GitHub Project V2 linked to the repository configured in the environment variables (GITHUB_OWNER, GITHUB_REPO).',
  {
    /* No input arguments needed - uses environment variables */
  },
  async () => {
    // No args expected
    try {
      // Read owner and repo from environment variables
      const owner = process.env.GITHUB_OWNER;
      const repo = process.env.GITHUB_REPO;

      if (!owner || !repo) {
        throw new Error(
          'GITHUB_OWNER and GITHUB_REPO must be set in environment variables.'
        );
      }

      // Fetch the project ID for the configured repository
      const projectId = await fetchProjectIdForRepo(owner, repo);

      if (!projectId) {
        // If no project ID found, return a specific message
        return {
          content: [
            {
              type: 'text',
              text: `No GitHub Project V2 found linked to the repository ${owner}/${repo}.`,
            },
          ],
        };
      }

      // Call the fetching logic for project details with the found ID
      const projectDetails = await fetchProjectDetails({ projectId });

      // Format the result for MCP (remains the same)
      let outputText = `# ${projectDetails.title}\n\n`;
      if (projectDetails.description) {
        outputText += `**Description:** ${projectDetails.description}\n\n`;
      }
      outputText += `**URL:** ${projectDetails.url}\n`;
      outputText += `**Created:** ${new Date(
        projectDetails.createdAt
      ).toLocaleString()}\n`;
      outputText += `**Updated:** ${new Date(
        projectDetails.updatedAt
      ).toLocaleString()}\n\n`;
      outputText += `## Fields (${projectDetails.fields.length})\n`;
      if (projectDetails.fields.length > 0) {
        projectDetails.fields.forEach((field) => {
          outputText += `- ${field.name} (${field.dataType})\n`;
        });
      } else {
        outputText += 'No fields defined\n';
      }
      outputText += '\n';
      outputText += `## Views (${projectDetails.views.length})\n`;
      if (projectDetails.views.length > 0) {
        projectDetails.views.forEach((view) => {
          outputText += `- ${view.name} (${view.layout})\n`;
        });
      } else {
        outputText += 'No views defined\n';
      }
      outputText += '\n';
      outputText += `## Items (${projectDetails.items.length})\n`;
      if (projectDetails.items.length > 0) {
        projectDetails.items.forEach((item) => {
          if (item.content?.title) {
            if (item.content.number && item.content.repository) {
              outputText += `- ${item.content.title} (${item.content.repository}#${item.content.number})\n`;
            } else {
              outputText += `- ${item.content.title}\n`;
            }
          } else {
            outputText += `- ${item.type} (ID: ${item.id})\n`;
          }
        });
      } else {
        outputText += 'No items in this project\n';
      }

      return {
        content: [
          {
            type: 'text',
            text: outputText,
          },
        ],
      };
    } catch (error: any) {
      console.error('Error in GetGithubProjectDetails tool handler:', error);
      return {
        content: [
          {
            type: 'text',
            text: `Error getting project details: ${
              error.message || 'Unknown error'
            }`,
          },
        ],
      };
    }
  }
);

// Register the AddDraftIssueToProject tool
server.tool(
  'AddDraftIssueToProject',
  'Add a draft issue to the GitHub Project V2 linked to the repository configured in the environment variables.',
  {
    title: z.string().describe('The title of the draft issue to create'),
    body: z.string().describe('The content/description of the draft issue'),
    projectId: z
      .string()
      .optional()
      .describe(
        'Optional: The ID of the project to add the draft issue to. If not provided, will use the project linked to the repository in the environment variables.'
      ),
  },
  async (args: AddDraftIssueArgs) => {
    try {
      // Call the function to add a draft issue to a project
      const newItemId = await addDraftIssueToProject(args);

      // Format the success message
      return {
        content: [
          {
            type: 'text',
            text: `✅ Successfully added draft issue "${args.title}" to the project.\n\nDraft Issue ID: ${newItemId}`,
          },
        ],
      };
    } catch (error: any) {
      // Log error details to stderr before returning error response
      console.error('Error in AddDraftIssueToProject tool handler:', error);
      return {
        content: [
          {
            type: 'text',
            text: `❌ Error adding draft issue to project: ${
              error.message || 'Unknown error'
            }`,
          },
        ],
      };
    }
  }
);

// Start the server using stdio transport
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // Log server startup message to stderr
  console.error('GitHub MCP Server running on stdio');
}

main().catch((error) => {
  // Log fatal error to stderr
  console.error('GitHub MCP Fatal error:', error);
  process.exit(1);
});
