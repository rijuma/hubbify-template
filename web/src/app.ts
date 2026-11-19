import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
};

const publicDir = path.join(import.meta.dirname, "..", "public");

function notFound(res: http.ServerResponse) {
  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("Not Found");
}

function serveFile(res: http.ServerResponse, filePath: string) {
  const ext = path.extname(filePath);
  const contentType = MIME_TYPES[ext] || "application/octet-stream";

  try {
    const content = fs.readFileSync(filePath);
    res.writeHead(200, { "Content-Type": contentType });
    res.end(content);
  } catch {
    notFound(res);
  }
}

function resolvePublicFile(url: string): string | undefined {
  const pathname = url.split("?")[0];
  if (pathname === "/") return path.join(publicDir, "index.html");

  const filePath = path.join(publicDir, pathname);
  return filePath.startsWith(publicDir + path.sep) ? filePath : undefined;
}

export function createApp(): http.Server {
  return http.createServer((req, res) => {
    if (req.url === "/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "ok" }));
      return;
    }

    const filePath = resolvePublicFile(req.url ?? "/");
    if (filePath === undefined) {
      notFound(res);
      return;
    }

    serveFile(res, filePath);
  });
}
