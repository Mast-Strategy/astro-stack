# Pre-launch QA

Run this on the production build before the client's domain points at it, then again on the real domain straight after cutover (see `cutover-runbook.md`). `<site>` is the address you're testing.

Tick each item, or note why it doesn't apply.

## Pages and links

- [ ] **Every page loads.** Open each page in the sitemap (`https://<site>/sitemap-index.xml` → the `sitemap-0.xml` it lists).
- [ ] **No broken links.** CI checks internal links on every pull request. Also click through the navigation and footer by hand, and check links to other websites (social profiles, booking tools, maps).
- [ ] **No placeholder copy.** Search each page for "Example", "Lorem", "TODO" and the starter's sample text.
- [ ] **Real 404 status.** `curl -sI https://<site>/nope-xyz/` shows `404` (not `200`), and the browser shows the branded "page not found" page.

## Redirects

- [ ] **Every old URL redirects.** For each line in `public/_redirects`: `curl -sI https://<site>/old-path` shows `301` and the right `location`.
- [ ] **Top old pages from Search Console** are covered (Performance → Pages, last 12 months).
- [ ] **Slash redirects are permanent.** `curl -sI https://<site>/about` shows `301` → `/about/` for each page listed in `_redirects`.

## Forms

- [ ] **Each form submits** on the live site, and the message arrives where the client expects it.
- [ ] **Errors make sense:** submit with a required field empty and with a bad email.
- [ ] **The thank-you page or message** appears after submitting.
- [ ] **Spam protection** (e.g. Turnstile) is on, if the form has it.

## Search engines

- [ ] **Canonical tags are absolute and on the real domain.** View source on a few pages: `<link rel="canonical" href="https://<domain>/page/">`. If they show `workers.dev`, update `siteUrl` in `site.config.mjs`.
- [ ] **No noindex on production.** View source shows no `<meta name="robots" content="noindex`, except on the 404 page.
- [ ] **No noindex header.** `curl -sI https://<domain>/ | grep -i robots` returns nothing.
- [ ] **robots.txt allows crawling.** `https://<domain>/robots.txt` shows `Allow: /` and a `Sitemap:` line on the real domain.
- [ ] **The sitemap** lists every page, on the real domain, and nothing else (no 404, no `/admin/`).
- [ ] **Each page has its own title and description** (view source, or a browser SEO extension).

## Analytics

- [ ] **Fires on production.** Open the live site with the browser's developer tools → Network, and look for the vendor (e.g. `googletagmanager`, `umami`). The vendor's real-time view shows your visit.
- [ ] **Doesn't fire on a preview.** Open any branch preview: the snippet is absent from view-source.
- [ ] **Doesn't fire locally** (`npm run dev`).

## Devices and speed

- [ ] **Real phones,** not just the browser's phone view: one iPhone (Safari) and one Android (Chrome). Check menus, tap targets, forms and images.
- [ ] **Lighthouse** (Chrome developer tools → Lighthouse, mobile) on the home page and one inner page. Note the scores in the launch notes; investigate anything under 90.
- [ ] **Images are sharp but not huge.** Page images should be served as `.webp` from `/_astro/`.

## Accessibility basics

- [ ] **Keyboard only:** Tab through each page. Every link, button and form field can be reached, the focus outline is visible, and the order makes sense.
- [ ] **Headings:** one `<h1>` per page, and headings in order (no jumping from `<h2>` to `<h4>`).
- [ ] **Images have descriptions** (the "Image description" fields in the CMS). Purely decorative images can be blank.
- [ ] **Text contrast** passes (Lighthouse's accessibility section flags failures).
- [ ] **Zoom to 200%:** nothing overlaps or gets cut off.

## Legal and contact

- [ ] **Privacy page** exists and is linked from the footer. It mentions analytics (and cookies, if the vendor uses them) and what forms collect.
- [ ] **Contact details** (phone, email, address) are correct and the phone number is a tap-to-call link.

## Email still works

The client's email often runs through the same domain. Check this right after cutover, and again the next day.

- [ ] **Send an email to** the client's address from an outside account (e.g. Gmail): it arrives.
- [ ] **The client sends one** to an outside account: it arrives and isn't in spam.
- [ ] **The client's other domain services** still work: calendar booking links, invoicing, any tool that sends "from" their domain.

## CMS

- [ ] **Sign in** at `https://<domain>/admin/` with GitHub. The sign-in screen shows no red errors.
- [ ] **Save a small edit;** it's live within about a minute. Then change it back.
