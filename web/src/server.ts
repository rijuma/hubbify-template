import { createApp } from "./app.js";

const PORT = Number(process.env.PORT) || 3000;

const server = createApp();

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Graceful shutdown: let in-flight requests finish before exit so redeploys
// don't drop connections.
const shutdown = (signal: string) => {
  console.log(`${signal} received, shutting down`);
  server.close(() => process.exit(0));
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
