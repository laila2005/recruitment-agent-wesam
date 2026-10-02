// Same MCP server, with the access key as a path segment: /api/mcp/<LILI_MCP_KEY>
// Wesam drops the query string on tool calls, so ?key= only works for its connection test.
// Vercel exposes the [key] segment as req.query.key, which the shared handler already checks.
export { default } from '../mcp.js';
