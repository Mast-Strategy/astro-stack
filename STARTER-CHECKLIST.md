# New client site: setup checklist

Step-by-step setup for a new site built from this starter (Astro + Tailwind + Sveltia CMS on Cloudflare Workers). It covers the accounts, sign-in and hosting; the site's design is separate and different for every client. Allow about an hour the first time.

Related docs: `STAGING.md` (how changes are previewed, released and rolled back), `docs/pre-launch-qa.md` and `docs/cutover-runbook.md` (go-live).

Placeholders used below:

| Placeholder | Meaning | Example |
|---|---|---|
| `<owner>` | GitHub organization (or account) that owns the repo | `Mast-Strategy` |
| `<repo>` | Repository name | `astro-stack` |
| `<worker>` | Name of the site's Worker in Cloudflare | `ia-stack-test` |
| `<subdomain>` | The Cloudflare account's `workers.dev` subdomain | `square-shadow-cb0d` |
| `<domain>` | The client's real domain | `example.com` |

## Before you start

- [ ] **Decide who owns the repo.** Use a GitHub **organization** (Mast Strategy's, or one the client owns), not a personal account. Organizations can be handed over, give several people access without sharing logins, and own the CMS sign-in app (step 5).
- [ ] **Decide whose Cloudflare account hosts the site:** Mast Strategy's or the client's own. This decides which CMS login helper the site uses (step 4).
- [ ] **A way to push to GitHub that doesn't expire:**
  - **GitHub CLI:** install it, then run `gh auth login` and choose HTTPS. Git then uses it automatically.
  - **Or an SSH key:** `ssh-keygen -t ed25519`, then add the `.pub` file under GitHub → **Settings → SSH and GPG keys**, and use the `git@github.com:` address for the remote.

  Avoid personal access tokens for ongoing work: they expire, and a token made for one account's repo stops working when the repo moves to an organization.
- [ ] Find your `<subdomain>`: Cloudflare → **Workers & Pages → Overview**. It's on the right, ending in `.workers.dev`.
- [ ] Node 22.12 or later on your computer (`node -v` in a terminal).
- [ ] On a Mac: if the project lives in **Documents**, allow your terminal app under **System Settings → Privacy & Security → Files and Folders**. Otherwise commands fail with "operation not permitted".

## 1. Create the client's repo from the starter

- [ ] **Once, on the starter itself:** GitHub → the starter repo → **Settings → General** → tick **Template repository**. New sites then start from a clean copy, without the starter's history.
- [ ] Starter repo → **Use this template → Create a new repository**. Owner: `<owner>`. Name: `<repo>`. Usually **Private** for client sites.
- [ ] Clone it to your computer and run `npm install`.
- [ ] In `wrangler.jsonc`, set `"name"` to `<worker>`. It **must** match the Worker name you'll type in Cloudflare in step 3, or builds fail.
- [ ] In `package.json`, set `"name"` to the same value (tidy, not required).
- [ ] In `site.config.mjs`, set `siteUrl` to `https://<worker>.<subdomain>.workers.dev` for now. It changes to the real domain at go-live (step 9). Leave `productionBranch` as `'main'`.
- [ ] In `public/admin/config.yml`, set `repo:` to `<owner>/<repo>`. Leave `base_url` until step 7.
- [ ] Build the client's design and pages on a branch (see "Starting a new client site" in `README.md` and the workflow in `STAGING.md`). Keep every word of copy in `src/content/`, with a matching field in `public/admin/config.yml`.
- [ ] Put page images in `src/content/pages/images/` and reference them as `images/<file name>`. Use large JPGs or PNGs (about 2400 px wide); the build makes the smaller versions. Delete the example image.
- [ ] Run `npm run build`. It must end with `Complete!`.

## 2. Protect `main` (once per repo)

**Read this first:** the CMS saves straight to `main`, as whoever is signed in. A rule that requires pull requests blocks those saves too, unless the editor is on the rule's **bypass list**. GitHub can't tell a CMS save from a normal push by the same person, so bypassers can also push directly. For them, "never push to `main`" is a team rule.

- [ ] GitHub → repo → **Settings → Rules → Rulesets → New ruleset → New branch ruleset**:
  - Name `Protect main`, Enforcement **Active**.
  - **Bypass list:** **Repository admin**, set to **Always allow**. Also add every CMS editor who isn't an admin, e.g. an organization team such as `<client>-editors` (also **Always allow**).
  - **Target:** **Include default branch**.
  - **Rules:** **Restrict deletions**, **Block force pushes**, **Require a pull request before merging** (required approvals **0** if you work alone), and **Require status checks to pass** → add `build` (GitHub Actions).
- [ ] **Simpler option if a client has several editors:** tick only **Restrict deletions** and **Block force pushes**. CMS saves then never get blocked, and pull requests and CI stay the agreed way of working rather than enforced.
- [ ] Test it: a CMS save by a client editor must still work after the rule is on.
- [ ] On a **free** organization, rulesets may only be available for **public** repos. If the option is missing on a private repo, agree as a team never to push to `main`, and note the gap in the client's project notes.

## 3. Connect the repo to Cloudflare (hosting + automatic deploys)

- [ ] Cloudflare → **Workers & Pages → Create → Import a repository**. Connect GitHub, choose `<owner>`, and give Cloudflare's GitHub app access to `<repo>` only. For an organization, an org owner may need to approve the app.
- [ ] Worker name: `<worker>` (same as `wrangler.jsonc`).
- [ ] Build command: `npm run build`. Deploy command: `npx wrangler deploy`.
- [ ] If Cloudflare offers to add the `@astrojs/cloudflare` adapter or "set up automatically", **decline**. This site is plain static files and doesn't need it.
- [ ] Preview builds for other branches are usually on by default. If the dashboard has **Settings → Build → Branch control → Enable Preview Builds**, make sure it's ticked; newer dashboards may not show it.
- [ ] Keep the `"previews": {}` line in `wrangler.jsonc`. Without it, every preview build fails with "missing a `previews` block".
- [ ] Wait for the first build to finish (about a minute), then open `https://<worker>.<subdomain>.workers.dev`. The home page should load.

## 4. The CMS login helper (`sveltia-cms-auth`)

**When it's needed:** only when people who aren't developers will sign in to the CMS with GitHub (usually the client). The helper finishes GitHub's sign-in on the CMS's behalf. Mast Strategy's own sites don't need it: developers can use **Sign In Using Access Token** or **Work with Local Repository** (see "Good to know") and skip steps 4 to 6.

**One helper per Cloudflare account.** All client sites hosted in the same Cloudflare account share one helper, so skip this step if that account already has one. A client with **their own** Cloudflare account gets their own helper in that account.

- [ ] Open the `sveltia-cms-auth` project on GitHub (github.com/sveltia/sveltia-cms-auth) and click **Deploy to Cloudflare Workers**.
- [ ] It creates a GitHub repo and a Cloudflare Worker. Note its address: `https://sveltia-cms-auth.<subdomain>.workers.dev`.
- [ ] **Keep it up to date.** The repo it creates is a one-commit copy, **not a fork**, so it doesn't get the original project's fixes automatically. Every few months, compare it with github.com/sveltia/sveltia-cms-auth and copy over any changes to `src/index.js`, especially security fixes.

## 5. Create the GitHub sign-in app (OAuth app)

- [ ] Create it under the **organization that owns the repo**: GitHub → `<owner>` → **Settings → Developer settings → OAuth Apps → New OAuth App**. Not under your personal account.

  New organizations block OAuth apps owned by anyone else until an owner approves each one. An app the organization owns itself is allowed straight away.
  - Application name: e.g. "`<Client>` website editor".
  - Homepage URL: the site's address.
  - **Redirect URI** (GitHub's docs may still call it "Authorization callback URL"): `https://sveltia-cms-auth.<subdomain>.workers.dev/callback`. Don't forget `/callback`.
  - "Expire user access tokens": on by default. Leave it for now; see the open question in `SPIKE-NOTES.md`.
- [ ] Copy the **Client ID**, then click **Generate a new client secret** and copy it straight away. GitHub only shows it once.
- [ ] If one helper serves sites in **different** organizations, it can only hold one OAuth app's keys. Create the app in the organization that owns most of those sites, and have an owner of each other organization approve it under **Settings → Third-party access**.

## 6. Give the helper its keys

This is where the spike lost the most time. Read it twice.

- [ ] Cloudflare → **Workers & Pages → sveltia-cms-auth → Settings**.
- [ ] Scroll to **Variables and secrets** under the **Runtime** heading. **Not** the box under **Build**: keys put there aren't visible to the running helper, and sign-in fails with `MISCONFIGURED_CLIENT`.
- [ ] Add each of these as type **Secret** (Secrets survive the helper being rebuilt; plain variables can be wiped):
  - `GITHUB_CLIENT_ID`: from step 5
  - `GITHUB_CLIENT_SECRET`: from step 5
  - `ALLOWED_DOMAINS`: every address the CMS is opened from, comma-separated, e.g. `<worker>.<subdomain>.workers.dev, <domain>, www.<domain>`
- [ ] If the helper is shared by several sites, add each site's addresses to the same `ALLOWED_DOMAINS` list.
- [ ] **Wildcards (`*`)** work, but with two catches:
  - **A wildcard never matches the bare domain.** `*.<domain>` matches `www.<domain>` but **not** `<domain>`, so list both.
  - **A broad wildcard trusts more than you mean to.** `*.<subdomain>.workers.dev` lets **any** Worker on that Cloudflare account ask the helper for a GitHub token. For CMS sign-in on previews, use the narrower `*-<worker>.<subdomain>.workers.dev`, which only matches that site's previews. Tested: sign-in works on previews with it.
- [ ] Ignore the "keep deployments in sync" alert Cloudflare may show for the helper. It's about plain variables, and these are Secrets.

## 7. Point the CMS at the helper and test an edit

- [ ] In `public/admin/config.yml`, set `base_url: https://sveltia-cms-auth.<subdomain>.workers.dev`. Run `npm run build`, commit, and merge through a pull request.
- [ ] Open `https://<worker>.<subdomain>.workers.dev/admin/` on the live site. GitHub sign-in doesn't work from your own computer.
- [ ] The sign-in screen must show **no red error messages**. If it does, each one names the field to fix in `config.yml`.
- [ ] **Sign In with GitHub**, approve the pop-up, change one word on a page and **Save**.
- [ ] Within about a minute: GitHub shows a new commit from you, and the live site shows the change.
- [ ] **If sign-in goes wrong:**
  - **Grey "Authorize" button in the pop-up:** click inside the pop-up, wait 2–3 seconds, and use Chrome with pop-ups allowed. **Don't** open the pop-up's address in a normal tab: you can approve the app there, but the sign-in can't get back to the CMS, and you're left with a blank white page at `/callback`. Once approved, later sign-ins skip that screen.
  - **`incorrect_client_credentials`:** the helper's Client ID and client secret come from different OAuth apps, or the secret was pasted wrongly. Generate a new client secret on the app, use the copy icon, and **Rotate** `GITHUB_CLIENT_SECRET` on the helper (Runtime box).
  - **`UNSUPPORTED_DOMAIN`:** the address you're on isn't in `ALLOWED_DOMAINS`.
  - **`MISCONFIGURED_CLIENT`:** the keys are in the Build box instead of the Runtime one (step 6).

## 8. Redirects from the old site

- [ ] Get every URL from the old site: a crawl (e.g. Screaming Frog), the old `sitemap.xml`, and the top pages in Google Search Console.
- [ ] For each old URL, add one line to `public/_redirects`: `/old-path /new-page/ 301`. The file's comments explain the format.
- [ ] For each page on the new site (except the home page), add a slash line such as `/about /about/ 301`. Without it, Cloudflare still adds the slash, but with a temporary (307) redirect.
- [ ] Remove the example `/home.html` line if the old site had no such page.
- [ ] After merging, test a few: `curl -sI https://<worker>.<subdomain>.workers.dev/old-path` should show `301` and the new address.
- [ ] Open a made-up address (e.g. `/nope/`). You should see the branded "page not found" page.

## 9. Go live on the client's domain

Follow `docs/cutover-runbook.md` for the DNS move. It protects the client's email. Run `docs/pre-launch-qa.md` before and after. The site-specific steps:

- [ ] Cloudflare → `<worker>` → **Settings → Domains & Routes → Add → Custom domain** → `<domain>` (and `www.<domain>` if used). The domain's DNS must be on Cloudflare (runbook steps 3 and 4).
- [ ] In `site.config.mjs`, change `siteUrl` to `https://<domain>` (or `https://www.<domain>`, whichever is the main address). Canonical tags, the sitemap and `robots.txt` all use it.
- [ ] Add `<domain>` and `www.<domain>` to `ALLOWED_DOMAINS` on the helper (step 6), or CMS sign-in fails on the real domain.
- [ ] **Analytics:** set `PUBLIC_ANALYTICS_ID` and add the vendor snippet (see "Analytics" in `STAGING.md`).
- [ ] **Turn off the `workers.dev` address** once the real domain works, so the site isn't reachable (and indexable) at two addresses:
  - In `wrangler.jsonc`, add `"workers_dev": false` at the top level (next to `"name"`). Merge it through a pull request; the next deploy turns the address off.
  - **Don't** only switch it off in the dashboard (**Domains & Routes → workers.dev → Disable**). Cloudflare's docs say the next deploy switches it back on unless `wrangler.jsonc` says `false`.
  - Branch previews keep working: Cloudflare's docs say turning off `workers.dev` doesn't turn off preview addresses. After the change, push a test branch and check its preview loads.
  - The starter leaves `workers_dev` out on purpose, because before go-live the `workers.dev` address **is** the live site.
- [ ] Optional: update the OAuth app's Homepage URL to `https://<domain>`.
- [ ] If **Rocket Loader** is on for the domain (Cloudflare → Speed → Optimization) and `/admin/` goes blank, add `data-cfasync="false"` to the script tag in `public/admin/index.html`.
- [ ] Re-test: sign in at `https://<domain>/admin/`, save an edit, and check the redirects on the real domain.

## 10. Give the client access

- [ ] Each editor needs their **own GitHub account** (free).
- [ ] Add them to the repo with **Write** access: repo → **Settings → Collaborators and teams** (or add them to an organization team that has Write access).
- [ ] Send them the `/admin/` address and a two-minute walkthrough: sign in with GitHub, edit, Save, wait a minute.
- [ ] Check with them a day later that they're still signed in (or get a clean sign-in prompt). See "Token expiry" in `SPIKE-NOTES.md`.

## If the repo moves (e.g. transferred to an organization)

GitHub redirects the old address for Git, but these connections don't follow the move on their own:

- [ ] **Cloudflare build:** `<worker>` → **Settings → Build → Git repository** → disconnect, then connect again to `<owner>/<repo>`. If it isn't offered, give Cloudflare's GitHub app access to the repo in its new organization first: GitHub → `<owner>` → **Settings → GitHub Apps**. Push a commit to check a build starts.
- [ ] **CMS:** update `repo:` in `public/admin/config.yml` to the new `<owner>/<repo>`, and merge it.
- [ ] **OAuth app:** if it's still under a personal account, create a new one under the organization (step 5) and replace the keys on the helper (step 6).
- [ ] **Your computer:** `git remote set-url origin <new address>`.
- [ ] **Push access:** a personal access token made for the old repo won't work any more. Use the GitHub CLI or an SSH key ("Before you start").

## Good to know

- **Local editing:** on your own computer, open `http://localhost:4321/admin/index.html` (not `/admin/`) and choose **Work with Local Repository** in Chrome or Edge. Changes are saved to the files on disk; you commit them yourself.
- **Page addresses end in a slash.** In development, `/about` shows "not found" and `/about/` works. On the live site the first one redirects to the second.
- **Images:** page images go in `src/content/pages/images/` and are resized automatically. Images added inside page text go to `public/images/` and are served as uploaded, so keep those small.
- **Updating the CMS:** the version number appears twice: in the script tag in `public/admin/index.html` and in the first line of `public/admin/config.yml`. Change both together on a branch, then re-check the sign-in screen for errors on the preview.
