# New client site: setup checklist

Step-by-step setup for a new client site built from this starter (Astro + Tailwind + Sveltia CMS on Cloudflare Workers). It covers the accounts, sign-in and hosting; the site's design is separate and different for every client. It turns the browser steps from `SPIKE-NOTES.md` into a list you can tick off. Allow about an hour the first time.

Placeholders used below:

| Placeholder | Meaning | Example from the spike |
|---|---|---|
| `<owner>/<repo>` | GitHub account and repository name | `anthonyashley/astro-plus-testing` |
| `<worker>` | Name of the site's Worker in Cloudflare | `ia-stack-test` |
| `<subdomain>` | Your Cloudflare account's `workers.dev` subdomain | `square-shadow-cb0d` |
| `<domain>` | The client's real domain | `initialattackfire.com` |

## Before you start

- [ ] A GitHub account that will own the repo. Decide now whether that's yours or the client's.
- [ ] A Cloudflare account. Find your `<subdomain>` under **Workers & Pages → Overview**: it's on the right, ending in `.workers.dev`.
- [ ] Node 22.12 or later on your computer (`node -v` in a terminal).
- [ ] On a Mac: if the project lives in **Documents**, allow your terminal app under **System Settings → Privacy & Security → Files and Folders**. Otherwise commands fail with "operation not permitted".

## 1. Copy the starter and make it the client's

- [ ] On GitHub, create a new **empty** repository (no README, no licence). Note `<owner>/<repo>`.
- [ ] Copy this starter's files into a new folder for the client and run `npm install`.
- [ ] In `wrangler.jsonc`, set `"name"` to `<worker>`. It **must** match the Worker name you'll type in Cloudflare in step 3, or builds fail.
- [ ] In `package.json`, set `"name"` to the same value (tidy, not required).
- [ ] In `public/admin/config.yml`, set `repo:` to `<owner>/<repo>`. Leave `base_url` until step 5.
- [ ] Build the client's design and pages (see "Starting a new client site" in `README.md`). Keep every word of copy in `src/content/`, with a matching field in `public/admin/config.yml`.
- [ ] Put page images in `src/content/pages/images/` and reference them as `images/<file name>`. Use large JPGs or PNGs (about 2400 px wide); the build makes the smaller versions. Delete the example image.
- [ ] Run `npm run build`. It must end with `Complete!`.

## 2. First push to GitHub

- [ ] GitHub → **Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token**.
  - Repository access: **Only select repositories** → this repo.
  - Permissions: **Contents → Read and write**.
  - Note the expiry date. These tokens expire, so plan a longer-term login (GitHub CLI or an SSH key) for ongoing work.
- [ ] Set the remote **with your username in it**, so an old saved GitHub login isn't used by mistake:
  `git remote add origin https://<your-github-username>@github.com/<owner>/<repo>.git`
- [ ] `git push -u origin main` and paste the token when asked for a password.

## 3. Connect the repo to Cloudflare (hosting + automatic deploys)

- [ ] Cloudflare → **Workers & Pages → Create → Import a repository**. Connect GitHub and pick the repo.
- [ ] Worker name: `<worker>` (same as `wrangler.jsonc`).
- [ ] Build command: `npm run build`. Deploy command: `npx wrangler deploy`.
- [ ] If Cloudflare offers to add the `@astrojs/cloudflare` adapter or "set up automatically", **decline**. This site is plain static files and doesn't need it.
- [ ] Wait for the first build to finish (about a minute), then open `https://<worker>.<subdomain>.workers.dev`. The home page should load.

## 4. Deploy the CMS login helper (once per Cloudflare account)

The CMS needs a tiny helper Worker to finish the GitHub sign-in. One helper can serve several client sites, so skip this step if you've already got one.

- [ ] Open the `sveltia-cms-auth` project on GitHub (github.com/sveltia/sveltia-cms-auth) and click **Deploy to Cloudflare Workers**.
- [ ] It creates its own GitHub repo and Cloudflare Worker. Note its address: `https://sveltia-cms-auth.<subdomain>.workers.dev`.

## 5. Create the GitHub sign-in app (OAuth app)

- [ ] GitHub → **Settings → Developer settings → OAuth Apps → New OAuth App**.
  - Application name: e.g. "`<Client>` website editor".
  - Homepage URL: the site's address.
  - **Redirect URI** (GitHub's docs may still call it "Authorization callback URL"): `https://sveltia-cms-auth.<subdomain>.workers.dev/callback`. Don't forget `/callback`.
  - "Expire user access tokens": on by default. Leave it for now; see the open question in `SPIKE-NOTES.md`.
- [ ] Copy the **Client ID**, then click **Generate a new client secret** and copy it straight away. GitHub only shows it once.

## 6. Give the helper its keys

This is where the spike lost the most time. Read it twice.

- [ ] Cloudflare → **Workers & Pages → sveltia-cms-auth → Settings**.
- [ ] Scroll to **Variables and secrets** under the **Runtime** heading. **Not** the box under **Build**: keys put there aren't visible to the running helper, and sign-in fails with `MISCONFIGURED_CLIENT`.
- [ ] Add each of these as type **Secret** (Secrets survive the helper being rebuilt; plain variables can be wiped):
  - `GITHUB_CLIENT_ID`: from step 5
  - `GITHUB_CLIENT_SECRET`: from step 5
  - `ALLOWED_DOMAINS`: the site's domain(s), comma-separated, e.g. `<worker>.<subdomain>.workers.dev, <domain>, www.<domain>`
- [ ] If the helper is shared by several clients, add each client's domains to the same `ALLOWED_DOMAINS` list.
- [ ] Ignore the "keep deployments in sync" alert Cloudflare may show for the helper. It's about plain variables, and these are Secrets.

## 7. Point the CMS at the helper and test an edit

- [ ] In `public/admin/config.yml`, set `base_url: https://sveltia-cms-auth.<subdomain>.workers.dev`. Run `npm run build`, commit and push.
- [ ] Open `https://<worker>.<subdomain>.workers.dev/admin/` on the live site. GitHub sign-in doesn't work from your own computer.
- [ ] The sign-in screen must show **no red error messages**. If it does, each one names the field to fix in `config.yml`.
- [ ] **Sign In with GitHub**, approve the pop-up, change one word on a page and **Save**.
- [ ] Within about a minute: GitHub shows a new commit from you, and the live site shows the change.

## 8. Redirects from the old site

- [ ] Get every URL from the old site: a crawl (e.g. Screaming Frog), the old `sitemap.xml`, and the top pages in Google Search Console.
- [ ] For each old URL, add one line to `public/_redirects`: `/old-path /new-page/ 301`. The file's comments explain the format.
- [ ] For each page on the new site (except the home page), add a slash line such as `/about /about/ 301`. Without it, Cloudflare still adds the slash, but with a temporary (307) redirect.
- [ ] Remove the example `/home.html` line if the old site had no such page.
- [ ] After pushing, test a few: `curl -sI https://<worker>.<subdomain>.workers.dev/old-path` should show `301` and the new address.
- [ ] Open a made-up address (e.g. `/nope/`). You should see the branded "page not found" page.

## 9. Go live on the client's domain

- [ ] Cloudflare → `<worker>` → **Settings → Domains & Routes → Add → Custom domain** → `<domain>` (and `www.<domain>` if used). The domain's DNS must be on Cloudflare.
- [ ] Add `<domain>` (and `www.<domain>`) to `ALLOWED_DOMAINS` on the helper (step 6), or CMS sign-in fails on the real domain.
- [ ] Optional: update the OAuth app's Homepage URL to `https://<domain>`.
- [ ] If **Rocket Loader** is on for the domain (Cloudflare → Speed → Optimization) and `/admin/` goes blank, add `data-cfasync="false"` to the script tag in `public/admin/index.html`.
- [ ] Re-test: sign in at `https://<domain>/admin/`, save an edit, and check the redirects on the real domain.

## 10. Give the client access

- [ ] Each editor needs their **own GitHub account** (free).
- [ ] Repo → **Settings → Collaborators → Add people** → give them **Write** access.
- [ ] Send them the `/admin/` address and a two-minute walkthrough: sign in with GitHub, edit, Save, wait a minute.
- [ ] Check with them a day later that they're still signed in (or get a clean sign-in prompt). See "Token expiry" in `SPIKE-NOTES.md`.

## Good to know

- **Local editing:** on your own computer, open `http://localhost:4321/admin/index.html` (not `/admin/`) and choose **Work with Local Repository** in Chrome or Edge. Changes are saved to the files on disk; you commit them yourself.
- **Page addresses end in a slash.** In development, `/about` shows "not found" and `/about/` works. On the live site the first one redirects to the second.
- **Images:** page images go in `src/content/pages/images/` and are resized automatically. Images added inside page text go to `public/images/` and are served as uploaded, so keep those small.
- **Updating the CMS:** the version number appears twice: in the script tag in `public/admin/index.html` and in the first line of `public/admin/config.yml`. Change both together, then re-check the sign-in screen for errors.
