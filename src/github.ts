// Remove dotenv import
// import dotenv from 'dotenv';
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// --- GitHub Specific Logic ---

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

  console.error("Fetching GitHub Projects...");

  if (!GITHUB_PAT) {
      // Error if MCP didn't inject the variable
      console.error("GitHub PAT check failed! Variable not found in process.env.");
      throw new Error("GitHub PAT not found in environment variables (expected from mcp.json 'env').");
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
    const response = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: {
        Authorization: `bearer ${GITHUB_PAT}`,
        "Content-Type": "application/json",
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
      console.error("GitHub GraphQL API errors:", data.errors);
      throw new Error(`GraphQL error: ${data.errors[0]?.message || 'Unknown GraphQL error'}`);
    }

    const projects: Project[] = data?.data?.viewer?.projectsV2?.nodes || [];
    console.error(`Fetched ${projects.length} projects.`);
    return projects;

  } catch (error) {
    // Log error details to stderr
    console.error("Error fetching GitHub projects:", error);
    if (error instanceof Error) {
         throw new Error(`Failed to fetch projects: ${error.message}`);
    }
    throw new Error("An unknown error occurred while fetching projects.");
  }
}

// New function to fetch project details
async function fetchProjectDetails(args: GetProjectDetailsArgs): Promise<ProjectDetails> {
  const GITHUB_PAT = process.env.GITHUB_PAT;
  console.error(`Checking for GITHUB_PAT in process.env`); // Debug log

  console.error(`Fetching details for project ID: ${args.projectId}...`);

  if (!GITHUB_PAT) {
    console.error("GitHub PAT check failed! Variable not found in process.env.");
    throw new Error("GitHub PAT not found in environment variables (expected from mcp.json 'env').");
  }

  // GraphQL query for project details
  const graphqlQuery = `
    query {
      node(id: "${args.projectId}") {
        ... on ProjectV2 {
          id
          title
          description
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
    const response = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: {
        Authorization: `bearer ${GITHUB_PAT}`,
        "Content-Type": "application/json",
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
      console.error("GitHub GraphQL API errors:", data.errors);
      throw new Error(`GraphQL error: ${data.errors[0]?.message || 'Unknown GraphQL error'}`);
    }

    // Extract project data from response
    const projectNode = data?.data?.node;

    if (!projectNode) {
      throw new Error("Project not found or invalid project ID");
    }

    // Format the fields, views, and items
    const fields: ProjectField[] = projectNode.fields?.nodes?.map((field: any) => ({
      id: field.id,
      name: field.name,
      dataType: field.dataType || "Unknown",
    })) || [];

    const views: ProjectView[] = projectNode.views?.nodes?.map((view: any) => ({
      id: view.id,
      name: view.name,
      layout: view.layout,
    })) || [];

    const items: ProjectItem[] = projectNode.items?.nodes?.map((item: any) => {
      const content = item.content ? {
        title: item.content.title,
        number: item.content.number,
        repository: item.content.repository?.name,
      } : undefined;

      return {
        id: item.id,
        type: item.type,
        content
      };
    }) || [];

    // Construct the project details
    const projectDetails: ProjectDetails = {
      id: projectNode.id,
      title: projectNode.title,
      description: projectNode.description,
      url: projectNode.url,
      createdAt: projectNode.createdAt,
      updatedAt: projectNode.updatedAt,
      fields,
      views,
      items
    };

    console.error(`Successfully fetched details for project: ${projectDetails.title}`);
    return projectDetails;

  } catch (error) {
    console.error("Error fetching project details:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to fetch project details: ${error.message}`);
    }
    throw new Error("An unknown error occurred while fetching project details.");
  }
}

// --- MCP Server Setup for GitHub Tool ---

// Create an MCP server instance specifically for the GitHub tool(s)
const server = new McpServer({
  // You might want a more specific name like "mcp-github-tools"
  // but keep "mcp-tools" if mcp.json expects that name for the executable
  name: "mcp-github",
  version: "1.0.0",
});

// Register the GitHub Projects Lister tool
server.tool(
  "ListGithubProjects", // Tool name for MCP
  "List your GitHub Project V2 projects",
  { /* No input arguments needed for now - defined by ListProjectsArgs */},
  async (args: ListProjectsArgs) => { // Use the args type
    try {
      // Call the fetching logic defined above
      const projects = await fetchGitHubProjects(args);

      // Format the result for MCP
      let outputText = "Your GitHub Projects:\n";
      if (projects.length === 0) {
        outputText = "No GitHub Projects V2 found.";
      } else {
        outputText += projects.map(p => `- ${p.title} (ID: ${p.id})`).join("\n");
      }

      return {
        content: [
          {
            type: "text",
            text: outputText,
          },
        ],
      };
    } catch (error: any) {
      // Log error details to stderr before returning error response
      console.error("Error in ListGithubProjects tool handler:", error);
      return {
        content: [
          {
            type: "text",
            text: `Error listing GitHub projects: ${error.message || 'Unknown error'}`,
          },
        ],
      };
    }
  }
);

// Register the new tool for getting project details
server.tool(
  "GetGithubProjectDetails", // Tool name for MCP
  "Get detailed information about a specific GitHub Project V2",
  {
    projectId: {
      description: "The ID of the project to retrieve details for",
      type: "string",
      required: true,
    },
  },
  async (args: GetProjectDetailsArgs) => {
    try {
      // Call the fetching logic for project details
      const projectDetails = await fetchProjectDetails(args);

      // Format the result for MCP
      let outputText = `# ${projectDetails.title}\n\n`;

      if (projectDetails.description) {
        outputText += `**Description:** ${projectDetails.description}\n\n`;
      }

      outputText += `**URL:** ${projectDetails.url}\n`;
      outputText += `**Created:** ${new Date(projectDetails.createdAt).toLocaleString()}\n`;
      outputText += `**Updated:** ${new Date(projectDetails.updatedAt).toLocaleString()}\n\n`;

      // Add fields information
      outputText += `## Fields (${projectDetails.fields.length})\n`;
      if (projectDetails.fields.length > 0) {
        projectDetails.fields.forEach(field => {
          outputText += `- ${field.name} (${field.dataType})\n`;
        });
      } else {
        outputText += "No fields defined\n";
      }
      outputText += "\n";

      // Add views information
      outputText += `## Views (${projectDetails.views.length})\n`;
      if (projectDetails.views.length > 0) {
        projectDetails.views.forEach(view => {
          outputText += `- ${view.name} (${view.layout})\n`;
        });
      } else {
        outputText += "No views defined\n";
      }
      outputText += "\n";

      // Add items information
      outputText += `## Items (${projectDetails.items.length})\n`;
      if (projectDetails.items.length > 0) {
        projectDetails.items.forEach(item => {
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
        outputText += "No items in this project\n";
      }

      return {
        content: [
          {
            type: "text",
            text: outputText,
          },
        ],
      };
    } catch (error: any) {
      // Log error details to stderr before returning error response
      console.error("Error in GetGithubProjectDetails tool handler:", error);
      return {
        content: [
          {
            type: "text",
            text: `Error getting project details: ${error.message || 'Unknown error'}`,
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
  console.error("GitHub MCP Server running on stdio");
}

main().catch((error) => {
  // Log fatal error to stderr
  console.error("GitHub MCP Fatal error:", error);
  process.exit(1);
});