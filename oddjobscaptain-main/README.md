# Odd Jobs Captain

A plain, static website for Odd Jobs Captain. No framework; you don't need to install anything just to view or edit the raw code. The uploaded HTML, CSS and JavaScript are kept at the top level of this repository so they are easy to open and edit.

## Run the website

From this repository's folder:

```bash
npm start
```

Then open **http://localhost:3000**.

`npm start` uses the tiny `server.js` included here. To use another port:

```bash
PORT=8080 npm start
```

Other ways to view it:

```bash
python3 -m http.server 8000 --bind 0.0.0.0
# then open http://localhost:8000
```

You can also double-click `index.html`, because every page uses relative links.

## Where the raw code is

| File | What it is |
| --- | --- |
| `index.html` | Home page |
| `services.html` | Services page |
| `pricing.html` | Pricing page |
| `about.html` | About page |
| `contact.html` | Contact page |
| `style.css` | All styles and responsive rules |
| `script.js` | Vanilla JavaScript: menu, scroll progress, tickers and parallax |
| `server.js` | Optional zero-dependency local web server |
| `build.js` | Copies public files into `dist/` for Cloudflare Workers |
| `package.json` | Local, build and deploy scripts; pins Wrangler 4.156.1 |
| `wrangler.toml` | Cloudflare Workers Static Assets configuration |
| `favicon.png`, `apple-touch-icon.png` | Supplied browser icons |

The five pages link to each other with ordinary `.html` links, so there is no routing or database to set up.

## Cloudflare Workers Builds

The Cloudflare build log used **`npx wrangler deploy`**. That means this is a **Workers Builds** project with Workers Static Assets, not a classic Cloudflare Pages project. Wrangler needs:

- `[assets] directory = "./dist"` in `wrangler.toml`
- `[build] command = "npm run build"` so `dist/` is created during the deploy
- a `name` that matches the Worker name in the Cloudflare dashboard

All three are now in `wrangler.toml`. Workers Builds runs an optional build command, then the deploy command defaults to `npx wrangler deploy` [1](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/). Wrangler's custom build step is part of its configuration [2](https://developers.cloudflare.com/workers/wrangler/configuration/), and an assets-only Worker can be configured with `[assets]` alone [3](https://developers.cloudflare.com/workers/static-assets/).

### Dashboard settings

| Setting | Value |
| --- | --- |
| Git branch / production branch | `main` |
| Root directory | `/` (or leave blank) |
| Build command | `npm run build` |
| Deploy command | `npx wrangler deploy` |
| Framework preset | **None** |
| Build output directory | Not used by Workers Builds; Wrangler reads `[assets].directory` instead |

You can leave the dashboard build command empty if you want: `[build].command` in `wrangler.toml` runs `npm run build` during `wrangler deploy`. As an extra safety net, `postinstall` also generates `dist/` when Cloudflare installs the pinned Wrangler dependency. Setting the build command in the dashboard too is harmless and makes the intent explicit.

If your Cloudflare Worker is named something other than `oddjobscaptain`, change the **`name`** line in `wrangler.toml` to match the dashboard name. Workers Builds requires those names to agree.

### What the earlier failed log meant

`Could not detect a directory containing static files (e.g. html, css and js) for the project` happened because Wrangler was asked to deploy a checkout with no static files and no valid Workers configuration. Two things contributed:

1. Cloudflare was pointed at `main`, which originally contained only `README.md`; the site lived on `arena/02d5d4b0-oddjobscaptain`.
2. The first `wrangler.toml` used `pages_build_output_dir`, which is a **Pages** setting. `wrangler deploy` ignores it and needs `[assets].directory` instead.

This fix uses the Workers format and puts the site on `main` as well.

## Images

The HTML also expects an `images/` folder, which is included:

- `images/logo-mark.png` and `images/logo-lockup.png` were derived from the supplied `apple-touch-icon.png`, so the header and footer logos match the icon you provided.
- `images/city-guilds-logo-source.png` is the supplied City & Guilds logo; `images/city-guilds-logo.png` is a transparent, tightly trimmed copy used inside the rotating hero credential badge on `index.html`.
- The `images/*.jpg` files are **generated stand-in photographs**, because the original photo files were not part of the upload. They match the descriptions already written in the HTML's `alt` text.
- `images/gate-2.jpg` currently reuses the garden-gate photo: the image tool reached its 10-images-per-turn limit on the final slot. Replace that one file with a distinct photo whenever you like.

To use real business photos, just overwrite a JPG/PNG with the **same filename**. No HTML or CSS changes are needed. The photo files are 1200×655px, which matches the aspect ratio in the markup.

## Hero credential badge

The rotating badge on `index.html` is an inline SVG, so the wording and rings stay crisp at any size. The ring wording is exactly `City & Guilds Certificate & Training to NVQ Level 2.`: the first part sits on the upright top arc and `NVQ Level 2.` sits on an upright bottom arc, so the ending is not lost on an upside-down circle. A small static `NVQ Level 2` line inside the badge repeats the qualification where it is always readable. Both arc texts spin together via the `.seal-ring` CSS animation; the centre logo and inner level line stay still. The wrapper has an `aria-label` with the exact wording for screen readers, and the animation is disabled for `prefers-reduced-motion`. It is hidden below 740px so it doesn't overlap the centred hero headline; the trust row still shows the City & Guilds credential on small screens.

## Before publishing

The supplied pages contain placeholder contact details. Check these before going live:

- phone number `+44 7988 786102`
- WhatsApp link `https://wa.me/447988786102`
- email `oddjobcaptain@gmail.com`
- prices, service area and business address text

Search and replace them across the five HTML files when you have the real details.

## GitHub Pages

To publish from this branch using GitHub Pages instead: open the repository's **Settings → Pages**, choose **Deploy from a branch**, select the branch and the `/ (root)` folder, then save. GitHub Pages will serve `index.html` automatically.
