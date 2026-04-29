import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { WikiJSClient } from "./client.js";

export function createServer(): McpServer {
  const client = new WikiJSClient();
  const server = new McpServer({ name: "wikijs", version: "1.0.0" });

  // ── Pages ────────────────────────────────────────────────────────────────

  server.tool(
    "pages_list",
    "List all pages ordered by title",
    {
      orderBy: z
        .enum(["TITLE", "CREATED", "UPDATED", "ID", "PATH"])
        .optional()
        .default("TITLE")
        .describe("Sort order"),
    },
    async ({ orderBy }) => {
      const data = await client.query<{
        pages: { list: { id: number; path: string; title: string; createdAt: string; updatedAt: string }[] };
      }>(`{ pages { list(orderBy: ${orderBy}) { id path title createdAt updatedAt } } }`);
      return { content: [{ type: "text", text: JSON.stringify(data.pages.list, null, 2) }] };
    }
  );

  server.tool(
    "pages_search",
    "Full-text search across all Wiki.js pages",
    {
      query: z.string().min(1).describe("Search terms"),
    },
    async ({ query }) => {
      const data = await client.query<{
        pages: { search: { results: { id: number; path: string; title: string; description: string }[] } };
      }>(
        `query Search($query: String!) { pages { search(query: $query) { results { id path title description } } } }`,
        { query }
      );
      return { content: [{ type: "text", text: JSON.stringify(data.pages.search.results, null, 2) }] };
    }
  );

  server.tool(
    "pages_get",
    "Get full content and metadata of a single page by ID",
    {
      id: z.number().int().positive().describe("Page ID"),
    },
    async ({ id }) => {
      const data = await client.query<{
        pages: {
          single: {
            id: number;
            path: string;
            title: string;
            description: string;
            content: string;
            tags: { tag: string }[];
            createdAt: string;
            updatedAt: string;
          };
        };
      }>(
        `query GetPage($id: Int!) {
          pages {
            single(id: $id) {
              id path title description content tags { tag } createdAt updatedAt
            }
          }
        }`,
        { id }
      );
      return { content: [{ type: "text", text: JSON.stringify(data.pages.single, null, 2) }] };
    }
  );

  server.tool(
    "pages_create",
    "Create a new Wiki.js page",
    {
      path: z.string().describe("URL path (e.g. docs/getting-started)"),
      title: z.string().describe("Page title"),
      content: z.string().describe("Page content in Markdown"),
      description: z.string().optional().default("").describe("Short description"),
      tags: z.array(z.string()).optional().default([]).describe("Tag list"),
      isPublished: z.boolean().optional().default(true).describe("Publish immediately"),
      locale: z.string().optional().default("en").describe("Locale code"),
      editor: z.string().optional().default("markdown").describe("Editor type"),
    },
    async ({ path, title, content, description, tags, isPublished, locale, editor }) => {
      const data = await client.query<{
        pages: {
          create: {
            responseResult: { succeeded: boolean; errorCode: number; message: string };
            page: { id: number };
          };
        };
      }>(
        `mutation CreatePage(
          $path: String! $title: String! $content: String! $description: String!
          $tags: [String]! $isPublished: Boolean! $locale: String! $editor: String!
        ) {
          pages {
            create(
              path: $path title: $title content: $content description: $description
              tags: $tags isPublished: $isPublished locale: $locale editor: $editor
            ) {
              responseResult { succeeded errorCode message }
              page { id }
            }
          }
        }`,
        { path, title, content, description, tags, isPublished, locale, editor }
      );
      return { content: [{ type: "text", text: JSON.stringify(data.pages.create, null, 2) }] };
    }
  );

  server.tool(
    "pages_update",
    "Update an existing Wiki.js page",
    {
      id: z.number().int().positive().describe("Page ID to update"),
      content: z.string().optional().describe("New Markdown content"),
      title: z.string().optional().describe("New title"),
      description: z.string().optional().describe("New description"),
      tags: z.array(z.string()).optional().describe("New tag list"),
      isPublished: z.boolean().optional().describe("Published state"),
    },
    async ({ id, ...fields }) => {
      const args = Object.entries(fields)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
        .join(" ");

      const data = await client.query<{
        pages: {
          update: {
            responseResult: { succeeded: boolean; errorCode: number; message: string };
            page: { id: number; updatedAt: string };
          };
        };
      }>(
        `mutation { pages { update(id: ${id} ${args}) {
          responseResult { succeeded errorCode message }
          page { id updatedAt }
        } } }`
      );
      return { content: [{ type: "text", text: JSON.stringify(data.pages.update, null, 2) }] };
    }
  );

  server.tool(
    "pages_delete",
    "Delete a Wiki.js page by ID",
    {
      id: z.number().int().positive().describe("Page ID to delete"),
    },
    async ({ id }) => {
      const data = await client.query<{
        pages: { delete: { responseResult: { succeeded: boolean; errorCode: number; message: string } } };
      }>(
        `mutation { pages { delete(id: ${id}) { responseResult { succeeded errorCode message } } } }`
      );
      return { content: [{ type: "text", text: JSON.stringify(data.pages.delete, null, 2) }] };
    }
  );

  // ── Users ────────────────────────────────────────────────────────────────

  server.tool(
    "users_search",
    "Search Wiki.js users by name or email",
    {
      query: z.string().min(1).describe("Search term (name or email)"),
    },
    async ({ query }) => {
      const data = await client.query<{
        users: { search: { id: number; name: string; email: string }[] };
      }>(
        `query SearchUsers($query: String!) { users { search(query: $query) { id name email } } }`,
        { query }
      );
      return { content: [{ type: "text", text: JSON.stringify(data.users.search, null, 2) }] };
    }
  );

  server.tool(
    "users_get",
    "Get a Wiki.js user by ID",
    {
      id: z.number().int().positive().describe("User ID"),
    },
    async ({ id }) => {
      const data = await client.query<{
        users: {
          single: {
            id: number;
            name: string;
            email: string;
            providerKey: string;
            isActive: boolean;
            groups: { id: number; name: string }[];
            createdAt: string;
          };
        };
      }>(
        `query GetUser($id: Int!) {
          users {
            single(id: $id) {
              id name email providerKey isActive
              groups { id name }
              createdAt
            }
          }
        }`,
        { id }
      );
      return { content: [{ type: "text", text: JSON.stringify(data.users.single, null, 2) }] };
    }
  );

  server.tool(
    "users_create",
    "Create a new local Wiki.js user",
    {
      email: z.string().email().describe("User email"),
      name: z.string().describe("Full name"),
      password: z.string().min(8).describe("Initial password"),
      groups: z.array(z.number().int()).optional().default([1]).describe("Group IDs to assign"),
      mustChangePassword: z.boolean().optional().default(false),
      sendWelcomeEmail: z.boolean().optional().default(false),
    },
    async ({ email, name, password, groups, mustChangePassword, sendWelcomeEmail }) => {
      const data = await client.query<{
        users: {
          create: {
            responseResult: { succeeded: boolean; errorCode: number; message: string };
            user: { id: number };
          };
        };
      }>(
        `mutation CreateUser(
          $email: String! $name: String! $password: String!
          $groups: [Int]! $mustChangePassword: Boolean! $sendWelcomeEmail: Boolean!
        ) {
          users {
            create(
              email: $email name: $name passwordRaw: $password
              providerKey: "local" groups: $groups
              mustChangePassword: $mustChangePassword sendWelcomeEmail: $sendWelcomeEmail
            ) {
              responseResult { succeeded errorCode message }
              user { id }
            }
          }
        }`,
        { email, name, password, groups, mustChangePassword, sendWelcomeEmail }
      );
      return { content: [{ type: "text", text: JSON.stringify(data.users.create, null, 2) }] };
    }
  );

  // ── Groups ───────────────────────────────────────────────────────────────

  server.tool(
    "groups_list",
    "List all Wiki.js permission groups",
    {},
    async () => {
      const data = await client.query<{
        groups: { list: { id: number; name: string; isSystem: boolean; userCount: number }[] };
      }>(
        `{ groups { list(orderBy: NAME) { id name isSystem userCount } } }`
      );
      return { content: [{ type: "text", text: JSON.stringify(data.groups.list, null, 2) }] };
    }
  );

  server.tool(
    "groups_create",
    "Create a new Wiki.js permission group",
    {
      name: z.string().describe("Group name"),
    },
    async ({ name }) => {
      const data = await client.query<{
        groups: {
          create: {
            responseResult: { succeeded: boolean; errorCode: number; message: string };
            group: { id: number };
          };
        };
      }>(
        `mutation CreateGroup($name: String!) {
          groups {
            create(name: $name) {
              responseResult { succeeded errorCode message }
              group { id }
            }
          }
        }`,
        { name }
      );
      return { content: [{ type: "text", text: JSON.stringify(data.groups.create, null, 2) }] };
    }
  );

  // ── Raw escape hatch ─────────────────────────────────────────────────────

  server.tool(
    "graphql_query",
    "Execute any raw GraphQL query or mutation against the Wiki.js API. Use when no dedicated tool covers the operation.",
    {
      query: z.string().describe("GraphQL query or mutation string"),
      variables: z
        .record(z.unknown())
        .optional()
        .describe("Variables object (JSON)"),
    },
    async ({ query, variables }) => {
      const data = await client.query(query, variables);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  return server;
}
