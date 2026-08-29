import app from "./backend/hono";

const port = Number(process.env.PORT) || 3000;

Bun.serve({
  fetch: app.fetch,
  port,
});

console.log(`UNISS backend running at http://localhost:${port}`);
