const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const siteDir = path.join(root, "site");
const distServerDir = path.join(root, "dist", "server");

const textExtensions = new Set([".html", ".css", ".js"]);
const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8"
};

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(fullPath));
    } else {
      files.push(fullPath);
    }
  }
  return files;
}

function toRoute(filePath) {
  const rel = path.relative(siteDir, filePath).split(path.sep).join("/");
  if (rel === "index.html") return "/";
  return `/${rel}`;
}

const files = walk(siteDir).filter((file) => textExtensions.has(path.extname(file).toLowerCase()));
const assetMap = {};

for (const file of files) {
  const route = toRoute(file);
  const ext = path.extname(file).toLowerCase();
  assetMap[route] = {
    type: contentTypes[ext],
    body: fs.readFileSync(file, "utf8")
  };
}

if (assetMap["/projects/data-organization.html"]) {
  assetMap["/projects/data-organization"] = assetMap["/projects/data-organization.html"];
}

if (assetMap["/projects/cx-ops-systems.html"]) {
  assetMap["/projects/cx-ops-systems"] = assetMap["/projects/cx-ops-systems.html"];
}

assetMap["/index.html"] = assetMap["/"];

const workerSource = `const assets = ${JSON.stringify(assetMap, null, 2)};

function resolvePath(url) {
  const requestUrl = new URL(url);
  const pathname = requestUrl.pathname;
  if (assets[pathname]) return pathname;
  if (pathname.endsWith("/")) {
    const nestedIndex = pathname + "index.html";
    if (assets[nestedIndex]) return nestedIndex;
  }
  return null;
}

export default {
  async fetch(request) {
    const resolved = resolvePath(request.url);
    if (!resolved) {
      return new Response("Not found", { status: 404 });
    }

    const asset = assets[resolved];
    return new Response(asset.body, {
      status: 200,
      headers: {
        "content-type": asset.type,
        "cache-control": "public, max-age=300"
      }
    });
  }
};
`;

fs.mkdirSync(distServerDir, { recursive: true });
fs.writeFileSync(path.join(distServerDir, "index.js"), workerSource, "utf8");

console.log(`Built static worker with ${files.length} assets.`);
