/**
 * Odd Jobs Captain — tiny zero-dependency static server.
 *
 * Run:      npm start
 * Or:       node server.js
 * Custom:   PORT=8080 npm start
 *
 * The site itself is just HTML, CSS, JavaScript and images. This file exists
 * only so the site can be opened through a normal local web server.
 */
'use strict';

const http = require('node:http');
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');

const ROOT = __dirname;
const HOST = process.env.HOST || '0.0.0.0';
const PORT = Number(process.env.PORT) || 3000;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.map': 'application/json; charset=utf-8'
};

function sendText(res, status, message, type = 'text/plain; charset=utf-8') {
  const body = Buffer.from(message);
  res.writeHead(status, {
    'Content-Type': type,
    'Content-Length': body.length,
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff'
  });
  res.end(body);
}

/** Convert a URL path to a path inside this repo, or null if it escapes ROOT. */
function toSafePath(urlPath) {
  let decoded;
  try {
    decoded = decodeURIComponent(urlPath).replace(/\0/g, '');
  } catch {
    return null;
  }

  const relative = decoded.startsWith('/') ? decoded.slice(1) : decoded;
  const absolute = path.resolve(ROOT, relative || '.');
  if (absolute !== ROOT && !absolute.startsWith(ROOT + path.sep)) {
    return null;
  }
  return absolute;
}

async function resolveFile(urlPath) {
  let filePath = toSafePath(urlPath);
  if (!filePath) return null;

  let stats = await fsp.stat(filePath).catch(() => null);

  if (stats && stats.isDirectory()) {
    filePath = path.join(filePath, 'index.html');
    stats = await fsp.stat(filePath).catch(() => null);
  } else if (!stats && !path.extname(filePath)) {
    // Let /about work as well as /about.html.
    const htmlPath = `${filePath}.html`;
    const htmlStats = await fsp.stat(htmlPath).catch(() => null);
    if (htmlStats && htmlStats.isFile()) {
      filePath = htmlPath;
      stats = htmlStats;
    }
  }

  return stats && stats.isFile() ? { filePath, stats } : null;
}

const server = http.createServer(async (req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    return sendText(res, 405, 'Method not allowed');
  }

  let pathname;
  try {
    pathname = new URL(req.url, 'http://localhost').pathname;
  } catch {
    return sendText(res, 400, 'Bad request');
  }

  const found = await resolveFile(pathname);
  if (!found) {
    return sendText(
      res,
      404,
      '<!doctype html><meta charset="utf-8"><title>Not found</title>' +
        '<h1>Page not found</h1><p><a href="/">Back to Odd Jobs Captain</a></p>',
      'text/html; charset=utf-8'
    );
  }

  const { filePath, stats } = found;
  const ext = path.extname(filePath).toLowerCase();
  const editable = ['.html', '.css', '.js'].includes(ext);

  res.writeHead(200, {
    'Content-Type': MIME[ext] || 'application/octet-stream',
    'Content-Length': stats.size,
    'Cache-Control': editable ? 'no-cache' : 'public, max-age=3600',
    'X-Content-Type-Options': 'nosniff'
  });

  if (req.method === 'HEAD') {
    return res.end();
  }

  const stream = fs.createReadStream(filePath);
  stream.on('error', () => {
    if (!res.headersSent) res.writeHead(500);
    res.end('Could not read file');
  });
  stream.pipe(res);
});

server.listen(PORT, HOST, () => {
  console.log(`Odd Jobs Captain is running at http://localhost:${PORT}`);
  console.log(`Serving files from ${ROOT}`);
});
