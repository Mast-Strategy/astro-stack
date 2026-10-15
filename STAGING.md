# Staging and releases

How a change gets from your computer to the live site, how to review it on the way, and how to undo it. Applies to every site built from this starter.

## The three environments

| Environment | Address | Built from | Search engines | Analytics |
|---|---|---|---|---|
| **Local** | `http://localhost:4321` | Your working folder (`npm run dev`) | Blocked (noindex) | Off |
| **Preview** | `https://<branch>-<worker>.<subdomain>.workers.dev` | Any branch except `main` | Blocked (noindex, `Disallow: /`, plus Cloudflare's own `X-Robots-Tag: noindex`) | Off |
| **Production** | `https://<domain>` (or `https://<worker>.<subdomain>.workers.dev` before go-live) | `main` | Allowed, with sitemap | On, once set up |

How the site knows which one it is: Workers Builds tells every build which branch it came from (`WORKERS_CI_BRANCH`). `astro.config.mjs` compares that with `productionBranch` in `site.config.mjs`. Each behaviour only switches on when the environment is positively identified:

- **Noindex** only switches on for a branch preview or the dev server. Anything else, including a build on your laptop, stays indexable, so production can't end up hidden from Google by accident.
- **Analytics** only switch on for a build of the production branch, so previews and test builds never count as visits.

Preview addresses are **public**: anyone with the link can open them. They're hard to guess and kept out of search results, but don't put anything confidential on a branch. To require a login, protect them with Cloudflare Access (see "Needs a human" at the end).

## Making a change: branch → preview → review → merge

1. **Branch.** Never work on `main` directly.
   `git switch -c <short-description>`, e.g. `git switch -c new-services-page`
2. **Build and commit.** Run `npm run build` (it must end with `Complete!`), then commit in small steps.
3. **Push the branch.** `git push -u origin <short-description>`. Workers Builds builds it as a preview (about a minute).
4. **Open a pull request** on GitHub from your branch into `main`. Two checks appear:
   - **CI** (GitHub Actions): the site builds and every internal link works.
   - **Workers Builds**: the preview build. Its details (or a comment on the pull request) give the preview address.
5. **Review the preview.** Use the checklist below. Push more commits to the same branch to fix things; the preview updates on its own.
6. **Merge** the pull request when both checks are green and the review is done. Workers Builds then deploys `main` to production (about a minute).
7. **Check production.** Open the live site and the pages you changed.

### Reviewing a preview

- [ ] The pages you changed look right on a phone and a laptop.
- [ ] Links and buttons on those pages go where they should.
- [ ] New pages appear in the navigation (if they should).
- [ ] A made-up address on the preview (e.g. `/nope/`) still shows the branded "page not found" page.
- [ ] New redirects work: `curl -sI https://<preview-address>/old-path` shows `301` and the new address.
- [ ] Nothing on the page says "Example", "Lorem ipsum" or another placeholder.
- [ ] The CMS still loads at `https://<preview-address>/admin/` with **no red errors** on the sign-in screen. Signing in on a preview needs the preview address in `ALLOWED_DOMAINS`; this hasn't been tested yet.

## Client edits in the CMS skip the preview

The CMS saves straight to `main`. When the owner clicks **Save**, the change goes live about a minute later, with no preview and no review. That's the right default for small copy edits.

**A review step is available.** The pinned Sveltia CMS version (0.239.1) supports an "editorial workflow". Checked against the official Sveltia documentation for this version:

- Turn it on with `publish_mode: editorial_workflow` at the top of `public/admin/config.yml`, or on just one collection (e.g. reviewed pages, but site settings saved directly).
- Each save then goes to its own branch (`cms/<collection>/<entry>`) with a pull request, instead of to `main`. Nothing goes live until someone clicks **Publish** in the CMS, which merges the pull request.
- Because each draft is a branch, Workers Builds should build a preview for it.
- The CMS can show a link to that preview next to the draft, but only if it can find the preview through GitHub. Sveltia documents this for Cloudflare Pages, not for Workers Builds. **Untested**: if the link doesn't appear, the preview address is still on the pull request in GitHub.
- Editors who sign in with GitHub already have the permissions it needs.

It's **off** in the starter. Turn it on per client if they want approval before changes go live, and test it end to end first.

## Undoing a release (rollback)

Do both steps. The first is instant; the second stops the next deploy from bringing the problem back.

1. **Put the previous version back live (instant).**
   Cloudflare → **Workers & Pages** → `<worker>` → **Deployments** → **⋯** next to the last good version → **Rollback**. It goes live straight away. This works for the 100 most recent versions.
2. **Undo the change in Git.** Otherwise the next push to `main`, including a CMS save, deploys the broken version again.
   - Find the bad commit: `git log --oneline`
   - On a branch: `git switch -c revert-<thing>`, then `git revert <commit>`
   - Push, open a pull request, check the preview, merge.

A CMS save that went wrong can also be fixed by editing it back in the CMS. That's a new commit, and it's live a minute later.

## Analytics

`src/components/Analytics.astro` shows an analytics snippet only when **both** of these are true:

- the build is from the production branch;
- `PUBLIC_ANALYTICS_ID` is set.

No vendor is built in. For each client:

1. **Set the ID in Cloudflare:** `<worker>` → **Settings** → **Build** → **Variables and secrets** → add `PUBLIC_ANALYTICS_ID`. This time the **Build** box is the right one: the ID is written into the pages when they're built. The ID isn't secret, because it appears in the page source.
2. **Paste the vendor's snippet** into `src/layouts/Layout.astro` in place of `<Analytics />`, using `id` wherever the vendor's code has the ID:

   **Google Analytics 4** (ID looks like `G-XXXXXXXXXX`):

   ```astro
   <Analytics>{(id: string) => (
   	<>
   		<script is:inline async src={`https://www.googletagmanager.com/gtag/js?id=${id}`}></script>
   		<script is:inline define:vars={{ id }}>
   			window.dataLayer = window.dataLayer || [];
   			function gtag() { dataLayer.push(arguments); }
   			gtag('js', new Date());
   			gtag('config', id);
   		</script>
   	</>
   )}</Analytics>
   ```

   **Umami** (ID is the website ID, a long code with dashes):

   ```astro
   <Analytics>{(id: string) => (
   	<script is:inline defer src="https://cloud.umami.is/script.js" data-website-id={id}></script>
   )}</Analytics>
   ```

3. **Check it after the next production deploy.** View the page source on the live site and look for the snippet. It must **not** appear on a preview address.

GA4 sets cookies, so check whether the client needs a cookie notice and a privacy-page mention. Umami doesn't use cookies.

## Needs a human

These are Cloudflare or GitHub settings, not code:

- **Protect previews with a login (optional):** Cloudflare Zero Trust → Access → add an application for the Worker's previews. Cloudflare can protect all previews in the account, one Worker's previews, or specific addresses.
- **Turn on preview builds** if they're off: `<worker>` → **Settings** → **Build** → **Branch control** → **Enable Preview Builds**.
- **Require pull requests for `main`:** GitHub repo → **Settings** → **Branches** (or **Rules**) → protect `main`, require the CI check, block direct pushes. On a free organization this may only be available for public repos; check before relying on it.
