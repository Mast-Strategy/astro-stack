# Spike notes: Astro + Tailwind + Sveltia CMS on Cloudflare Workers

Client: Initial Attack Fire Mitigation (stand-in accounts). Run on 2026-10-14.

- Site: https://ia-stack-test.square-shadow-cb0d.workers.dev
- CMS: https://ia-stack-test.square-shadow-cb0d.workers.dev/admin/
- Repo: https://github.com/anthonyashley/astro-plus-testing
- OAuth helper: https://sveltia-cms-auth.square-shadow-cb0d.workers.dev

**Verdict: the stack works end to end. The WordPress + Elementor fallback isn't needed on technical grounds.**

## Results

| # | Goal | Result | Evidence |
|---|------|--------|----------|
| 1 | Astro + Tailwind running locally | PASS | Astro 7.3.8, Tailwind v4 via `@tailwindcss/vite`. All copy comes from `src/content/`. |
| 2 | Workers static assets with Git-connected builds | PASS | The push at 17:38:31 was live at 17:39:19 (~50 s). No adapter and no Worker script. |
| 3 | Sveltia CMS with GitHub OAuth and a real edit | PASS | The headline edit in the CMS became commit `8d5b9fb` by the test account at 18:06:16 and was live at 18:06:50 (~35 s). The commit changed exactly one line. |
| 4 | 301 redirect and custom 404 | PASS | `/home.html` and `/old-services` both returned `301`. Unknown URLs returned a real `404` status with the branded page. |
| 5 | Harder than the docs suggest | See below | |

## Versions used

Astro 7.3.8 · Tailwind CSS v4 · Sveltia CMS 0.239.1 (pinned in `public/admin/`) · Wrangler 4.151.0 · Node 26 locally (Astro needs 22.12 or later).

## How it fits together

- **Content:** `src/content/pages/*.md` (home, services, not-found) and `src/content/settings/site.yml`. Templates in `src/pages` and `src/layouts` only read these files.
- **CMS:** `public/admin/index.html` and `public/admin/config.yml`. Each page is a "file collection" entry. `omit_empty_optional_fields: true` stops empty optional fields from breaking Astro's schema checks.
- **Hosting:** `wrangler.jsonc` with `assets.directory: ./dist` and `not_found_handling: 404-page`. Workers Builds runs `npm run build` and then `npx wrangler deploy` on every push to `main`.
- **Login:** the CMS opens a pop-up to the Sveltia CMS Authenticator, a separate small Worker. It swaps GitHub's sign-in code for a token using the OAuth app's secret.
- **Redirects:** `public/_redirects`, copied into `dist/`. It is read by Cloudflare and never served to the public.

## Harder than the docs suggest

1. **Cloudflare has two "Variables and secrets" boxes.** This was the biggest time sink. Keys typed into the one under the **Build** settings exist only while the code builds. The running Worker can't see them, so you get `MISCONFIGURED_CLIENT`. They belong under **Runtime variables and secrets**. Neither the Sveltia nor the Cloudflare docs warn about this.
2. **The auth helper's "Deploy to Cloudflare" button creates a Git-connected copy.** It makes a GitHub repo and a Workers Build. Cloudflare then shows a "keep deployments in sync" alert about variables set in the dashboard. Storing all helper values as **Secrets** avoids the issue, because rebuilds don't overwrite Secrets.
3. **GitHub's OAuth form has changed.** The form now says "Redirect URIs", while GitHub's own docs still say "Authorization callback URL". It also has a new "Expire user access tokens" checkbox, which is on by default. Sveltia's docs don't mention it (see open questions).
4. **Sveltia's OAuth instructions are split across two places.** The main docs only say to set `base_url`. The callback path (`/callback`) and the variable names are only in the `sveltia-cms-auth` README.
5. **GitHub sign-in can't be tested on localhost.** On `localhost` the CMS reports its domain as `cms.netlify.com`, so `ALLOWED_DOMAINS` rejects it. Locally, use "Work with Local Repository" (Chrome or Edge) and test GitHub sign-in on the deployed site.
6. **Trailing-slash redirects are 307 (temporary), not 301.** Workers' default `auto-trailing-slash` sends `/services` → `/services/` with a 307, and you can't change that code. An explicit line in `_redirects` (`/services /services/ 301`) does override it. Tested live.
7. **Cloudflare's Astro guide says two things.** It says static sites need no adapter, but its automatic-setup path adds `@astrojs/cloudflare`. We committed `wrangler.jsonc` before connecting the repo, so the automatic setup never ran.
8. **Local machine setup:**
   - macOS blocked the app from the Documents folder until it was allowed in System Settings.
   - An old GitHub login in the macOS keychain was sent automatically and rejected. The fix was putting the username in the remote URL (`https://anthonyashley@github.com/...`).
   - npm 11 blocks package install scripts by default, so Wrangler's local simulator (`workerd`) didn't finish installing. Deploys don't need it, but `wrangler dev` would.
9. **Tailwind guides are mostly out of date.** Most tutorials and Sveltia starters use `@astrojs/tailwind` and `tailwind.config.mjs`, which is Tailwind v3 and now called "legacy". `npx astro add tailwind` does the right thing.
10. **Minor:** in development the CMS is at `/admin/index.html`, because Astro's dev server doesn't serve `/admin/`. The Astro scaffold now also adds `AGENTS.md` and `CLAUDE.md`.

## Open questions to check before using this for a real client

- **Token expiry.** If "Expire user access tokens" was left on, check whether an editor is still signed in after 8+ hours, or gets a clean prompt to sign in again.
- **Editor onboarding.** Each editor needs their own GitHub account with **write** access to the repo. Decide who creates the client's account and whether that's acceptable for the owner.
- **Custom domain.** When the client domain is attached, add it to `ALLOWED_DOMAINS`. Optionally add the homepage URL to the OAuth app.
- **Preview URLs.** These are `*-ia-stack-test.square-shadow-cb0d.workers.dev`. CMS sign-in on previews needs a wildcard in `ALLOWED_DOMAINS` or a `site_domain` setting. Not tested.
- **Rocket Loader.** If it is on for the custom domain zone, the CMS page can go blank. The skill's fix is `data-cfasync="false"` on the script tag.

## To do before this becomes the starter repo

> **Update:** the starter was later made design-neutral. The client branding, services page and these labels were replaced by a minimal example. See `README.md`.

- [x] Move the remaining UI labels into content: the "Services" nav link, the 404 "Home" button, and the "Serving" prefix in the footer.
- [x] Image optimization: page images now live in `src/content/pages/images` and goes through Astro's `image()` helper, so the build makes resized WebP versions. Images inserted into page text still go to `public/images` unoptimized.
- [x] Set a trailing-slash policy: Astro `trailingSlash: 'always'` plus `html_handling: force-trailing-slash`. How to add 301s is documented in `public/_redirects`.
- [ ] Generate a 301 for each old Hostinger URL from a crawl of the old site (per client; see step 8 of `STARTER-CHECKLIST.md`).
- [ ] Replace placeholder copy, phone number and email. Remove the "auto-deploy test 1" footer text and the test headline.
- [x] Turn the Cloudflare and GitHub browser steps (below) into a checklist: `STARTER-CHECKLIST.md`. Screenshots still to add.
- [ ] Decide how to update Sveltia, since it is pinned and pre-1.0: bump the version in `index.html` and the config schema line together.
- [ ] The personal access token used to push expires in 30 days. A long-lived setup needs a different credential (e.g. the GitHub CLI or SSH key).

## Browser steps the owner or strategist had to do

1. Create an empty GitHub repo (test account).
2. Create a fine-grained personal access token (Contents: read/write, this repo only) and paste it in the terminal for the first push.
3. Cloudflare: Workers & Pages → Create → Import a repository. Worker name `ia-stack-test`, build `npm run build`, deploy `npx wrangler deploy`.
4. Deploy `sveltia-cms-auth` with its "Deploy to Cloudflare Workers" button.
5. GitHub → Developer settings → OAuth Apps → New. Redirect URI `https://sveltia-cms-auth.<subdomain>.workers.dev/callback`, then generate a client secret.
6. Cloudflare → sveltia-cms-auth → Settings → **Runtime** variables and secrets: `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `ALLOWED_DOMAINS`.
7. Sign in at `/admin/` with GitHub and save an edit.
