import http from "node:http";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { createServer } from "./server.js";

const PORT = parseInt(process.env.PORT ?? "3000");

const transports: Record<string, SSEServerTransport> = {};

const httpServer = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://localhost`);

  if (req.method === "GET" && url.pathname === "/sse") {
    const server = createServer();
    const transport = new SSEServerTransport("/message", res);
    transports[transport.sessionId] = transport;
    transport.onclose = () => delete transports[transport.sessionId];
    await server.connect(transport);
    return;
  }

  if (req.method === "POST" && url.pathname === "/message") {
    const sessionId = url.searchParams.get("sessionId") ?? "";
    const transport = transports[sessionId];
    if (!transport) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Session not found");
      return;
    }
    await transport.handlePostMessage(req, res);
    return;
  }

  if (url.pathname === "/health") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("ok");
    return;
  }

  res.writeHead(404);
  res.end();
});

httpServer.listen(PORT, "0.0.0.0", () => {
  console.error(`wikijs-mcp SSE server running on port ${PORT}`);
});
