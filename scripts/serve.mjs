import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";

const root = resolve(import.meta.dirname, "..");
const mime = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8" };
const host = "127.0.0.1";
const port = Number(process.env.PORT || 4173);
const server = createServer(async (req, res) => {
  try {
    const route = new URL(req.url || "/", "http://localhost").pathname;
    const path = resolve(root, "." + decodeURIComponent(route === "/" ? "/index.html" : route));
    if (path !== root && !path.startsWith(root + sep)) {
      res.writeHead(403); res.end("Forbidden"); return;
    }
    const content = await readFile(path);
    res.writeHead(200, { "Content-Type": mime[extname(path)] || "application/octet-stream",
      "X-Content-Type-Options": "nosniff", "Cache-Control": "no-cache" });
    res.end(content);
  } catch (e) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
  }
});
server.listen(port, host, () => console.log("Cognitive Ecology Lab: http://" + host + ":" + port));
