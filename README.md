# Astro + Sveltia CMS starter (Cloudflare Workers)

A design-neutral starting point for client websites. It provides the software stack, not a look:

- **Astro 7** builds the site into plain static files. **Tailwind v4** is installed but not used yet.
- **Sveltia CMS** at `/admin/` lets the owner edit copy and images in the browser. Each save is a Git commit.
- **Cloudflare Workers** hosts the files and rebuilds the site on every push to `main` (about a minute).

The example content (a home page, a 404 page and site settings) only shows how the pieces connect. Replace it for each client.

## How content gets to the page

Every piece of editable copy goes through three places, and they must agree on field names:

1. **Content file** in `src/content/`: the words and image paths (e.g. `src/content/pages/home.md`).
2. **CMS config** in `public/admin/config.yml`: which fields the owner sees in `/admin/`.
3. **Schema** in `src/content.config.ts`: what Astro expects, so a missing or misnamed field fails the build instead of silently disappearing.

Templates in `src/pages/` and `src/layouts/` read the content files and never contain copy themselves.

Images for pages go in `src/content/pages/images/`. The schema's `image()` helper makes Astro produce resized WebP versions at build time. Files in `public/` are served exactly as uploaded.

## Starting a new client site

Follow `STARTER-CHECKLIST.md` for the full account and hosting setup. The values that change per client:

| Value | Where | Set it to |
|---|---|---|
| Worker name | `"name"` in `wrangler.jsonc` (and `package.json`) | The Worker name in Cloudflare. Must match exactly. |
| Repo | `backend.repo` in `public/admin/config.yml` | `<github-owner>/<repo-name>` |
| Login helper | `backend.base_url` in `public/admin/config.yml` | `https://sveltia-cms-auth.<subdomain>.workers.dev` |
| Allowed domains | `ALLOWED_DOMAINS` secret on the `sveltia-cms-auth` Worker in Cloudflare (not in this repo) | Every domain the CMS is used from: the `workers.dev` address plus the client's domain(s) |
| Redirects | `public/_redirects` | 301s from the old site's URLs, plus one slash line per page |

Where the design work goes:

- `src/layouts/Layout.astro`: the shared page shell (header, footer, fonts). It's deliberately unstyled.
- `src/pages/`: one `.astro` file per page, plus `404.astro`.
- `src/styles/global.css`: Tailwind theme (colours, fonts) for the client.
- Any new editable text: add it to the content file, `config.yml` and `content.config.ts` together, then check `/admin/index.html` locally for errors on the sign-in screen.

Leave these alone unless you mean to change the stack: `astro.config.mjs` (`trailingSlash: 'always'`), `wrangler.jsonc` (`html_handling`, `not_found_handling`) and `public/admin/index.html` (the pinned CMS version).

## Commands

| Command | What it does |
|---|---|
| `npm install` | Installs everything into this folder (nothing global) |
| `npm run dev` | Local preview at `http://localhost:4321`; CMS at `/admin/index.html` |
| `npm run build` | Builds the site into `dist/`. Run before every commit. |

## Background

`SPIKE-NOTES.md` is the record of the technical spike that proved this stack, including the setup problems found along the way.
