/**
 * Zero-dependency build for Cloudflare Workers Static Assets.
 *
 * The website is already plain HTML/CSS/JS, so there is nothing to compile.
 * This script copies only the public files into ./dist, which is the
 * [assets].directory declared in wrangler.toml.
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const ROOT = __dirname;
const OUT = path.join(ROOT, 'dist');

const FILES = [
  'index.html',
  'services.html',
  'pricing.html',
  'about.html',
  'contact.html',
  'style.css',
  'script.js',
  'favicon.png',
  'apple-touch-icon.png'
];

const DIRECTORIES = ['images'];

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

for (const name of FILES) {
  const source = path.join(ROOT, name);
  if (!fs.existsSync(source)) {
    throw new Error(`Missing required site file: ${name}`);
  }
  fs.copyFileSync(source, path.join(OUT, name));
}

for (const name of DIRECTORIES) {
  const source = path.join(ROOT, name);
  if (!fs.existsSync(source)) {
    throw new Error(`Missing required site directory: ${name}`);
  }
  fs.cpSync(source, path.join(OUT, name), { recursive: true });
}

// Workers Static Assets uses 404.html when not_found_handling = "404-page".
fs.writeFileSync(
  path.join(OUT, '404.html'),
  `<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Page not found | Odd Jobs Captain</title>
<link rel="icon" href="/favicon.png" type="image/png">
<link rel="stylesheet" href="/style.css?v=29">
</head>
<body>
<main style="max-width:42rem;margin:12vh auto;padding:2rem;text-align:center">
  <p class="eyebrow" style="justify-content:center">Odd Jobs Captain</p>
  <h1>That page has gone missing.</h1>
  <p>Try one of the usual pages instead.</p>
  <p><a class="btn btn--primary" href="/">Back to home</a></p>
  <p style="margin-top:1rem"><a href="/services.html">Services</a> · <a href="/pricing.html">Pricing</a> · <a href="/about.html">About</a> · <a href="/contact.html">Contact</a></p>
</main>
</body>
</html>
`
);

// _headers is understood natively by Workers Static Assets.
fs.writeFileSync(
  path.join(OUT, '_headers'),
  [
    '/*',
    '  X-Content-Type-Options: nosniff',
    '  Referrer-Policy: strict-origin-when-cross-origin',
    '',
    '/images/*',
    '  Cache-Control: public, max-age=300, must-revalidate',
    ''
  ].join('\n')
);

let count = 0;
for (const entry of fs.readdirSync(OUT, { withFileTypes: true })) {
  count += entry.isDirectory()
    ? fs.readdirSync(path.join(OUT, entry.name)).length
    : 1;
}

console.log(`Built static site in dist/ (${count} files)`);
