import 'dotenv/config'; // Load .env file variables
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

async function fetchGitHubProjects(args: ListProjectsArgs): Promise<Project[]> {
  console.log("Fetching GitHub Projects...");

  // Read token from environment variable (loaded from .env by dotenv)
  const GITHUB_PAT = process.env.GITHUB_PAT;

  if (!GITHUB_PAT) {
      throw new Error("GitHub PAT not found in environment variables. Ensure it's set in the .env file.");
  }

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
    console.log(`Fetched ${projects.length} projects.`);
    return projects;

  } catch (error) {
    console.error("Error fetching GitHub projects:", error);
    if (error instanceof Error) {
         throw new Error(`Failed to fetch projects: ${error.message}`);
    }
    throw new Error("An unknown error occurred while fetching projects.");
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
      // Handle errors and return an error message to the user
      console.error("Error in ListGithubProjects tool:", error);
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

// Start the server using stdio transport
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // Log specifically for this server instance
  console.error("GitHub MCP Server running on stdio");
}

main().catch((error) => {
  console.error("GitHub MCP Fatal error:", error);
  process.exit(1);
});