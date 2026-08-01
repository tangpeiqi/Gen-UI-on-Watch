import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { generateFallbackWatchUi, loadDesignPack } from "./fallback-generator.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const port = Number(process.env.PORT || 8787);
const designPack = loadDesignPack(rootDir);

const contentTypeByExtension = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml"
};

function sendJson(response, status, body) {
  const json = JSON.stringify(body, null, 2);
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store"
  });
  response.end(json);
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.setEncoding("utf8");
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1024 * 1024) {
        reject(new Error("Request body is too large"));
        request.destroy();
      }
    });
    request.on("end", () => resolve(body));
    request.on("error", reject);
  });
}

function safeFilePath(urlPath) {
  const normalizedPath = decodeURIComponent(urlPath.split("?")[0]);
  const relativePath = normalizedPath === "/" ? "index.html" : normalizedPath.replace(/^\/+/, "");
  const absolutePath = path.resolve(rootDir, relativePath);
  if (!absolutePath.startsWith(rootDir)) {
    return null;
  }
  return absolutePath;
}

async function handleGenerateWatchUi(request, response) {
  try {
    const rawBody = await readBody(request);
    const body = rawBody ? JSON.parse(rawBody) : {};
    const result = generateFallbackWatchUi({
      context: body.context || {},
      preferences: body.preferences || {},
      designPack
    });
    sendJson(response, result.validation.ok ? 200 : 422, result);
  } catch (error) {
    sendJson(response, 400, {
      layout: null,
      logs: [
        { id: "read-request", status: "failed", detail: error.message },
        { id: "fallback", status: "blocked", detail: "Request could not be parsed, so no fallback layout was generated." }
      ],
      validation: {
        ok: false,
        stage: "request",
        summary: error.message,
        errors: [
          {
            severity: "error",
            stage: "request",
            code: "invalid_request",
            path: "request.body",
            message: error.message
          }
        ],
        warnings: []
      }
    });
  }
}

function serveStatic(request, response) {
  const filePath = safeFilePath(request.url || "/");
  if (!filePath) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      response.writeHead(error.code === "ENOENT" ? 404 : 500, { "content-type": "text/plain; charset=utf-8" });
      response.end(error.code === "ENOENT" ? "Not found" : error.message);
      return;
    }
    response.writeHead(200, {
      "content-type": contentTypeByExtension[path.extname(filePath)] || "application/octet-stream",
      "cache-control": "no-store"
    });
    response.end(data);
  });
}

const server = http.createServer((request, response) => {
  if (request.method === "POST" && request.url?.startsWith("/api/generate-watch-ui")) {
    handleGenerateWatchUi(request, response);
    return;
  }
  if (request.method === "GET" || request.method === "HEAD") {
    serveStatic(request, response);
    return;
  }
  response.writeHead(405, { "content-type": "text/plain; charset=utf-8" });
  response.end("Method not allowed");
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Gen UI on Watch simulator: http://127.0.0.1:${port}/`);
  console.log("POST /api/generate-watch-ui is available without OPENAI_API_KEY.");
});
