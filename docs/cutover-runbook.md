# DNS cutover runbook

How to move a client's domain from their old host (e.g. Hostinger) to the new site on Cloudflare Workers without breaking their email. Most of the risk is in DNS records that have nothing to do with the website, so the copying step matters most.

`<domain>` is the client's domain, `<worker>` the site's Worker name.

**Why the domain has to move to Cloudflare:** a Worker can only be attached to a custom domain whose DNS zone is on Cloudflare. So the domain's **nameservers** change to Cloudflare's. The domain can stay registered where it is; only who answers DNS questions changes.

## Before cutover day

- [ ] **The new site has passed `pre-launch-qa.md`** on its `workers.dev` address.
- [ ] **Every old URL has a redirect** in `public/_redirects` (step 8 of `STARTER-CHECKLIST.md`).
- [ ] **You have logins for:** the registrar (where the domain was bought), the current DNS host (often the same as the old web host), the client's email provider, and Cloudflare.
- [ ] **Agree a time** with the client. Avoid Fridays and their busy season. Tell them email should keep working and that the website switch can take a few hours to reach everyone.

## 1. Copy every DNS record (the step that protects email)

- [ ] **Export or screenshot the full DNS zone** at the current DNS host: every record, not just the website ones. Save it in the client's project folder.
- [ ] **List what each record is for.** The ones that matter most:

| Record | Typical name | What breaks if it's missing |
|---|---|---|
| **MX** | `@` | All incoming email |
| **TXT (SPF)** | `@`, starts `v=spf1` | Outgoing email goes to spam or is rejected |
| **TXT or CNAME (DKIM)** | e.g. `google._domainkey`, `default._domainkey`, `s1._domainkey` | Outgoing email fails authentication |
| **TXT (DMARC)** | `_dmarc` | Email reports and policy |
| **CNAME / A for hosted email** | e.g. `mail`, `webmail`, `autodiscover`, `autoconfig` | Email apps can't find the server |
| **SRV** | e.g. `_autodiscover._tcp` | Outlook and similar apps can't set up |
| **TXT verifications** | `@` (Google, Microsoft, Facebook, Apple...) | Those services lose verification |
| **Other CNAMEs** | e.g. `book`, `shop`, `portal` | The client's other tools |

- [ ] **Hosted email at the old web host** (e.g. Hostinger email): the MX and mail records point at that host. Email keeps working after the move **only if those records are copied exactly** and the client keeps paying for that email plan. Check which plan the email is on before cancelling anything.

## 2. A day ahead: lower TTLs

- [ ] At the current DNS host, set the TTL of the website records (`@` and `www`) to the lowest allowed (often 300 seconds). Leave email records alone.
- [ ] Wait at least as long as the **old** TTL (often 1 to 24 hours) before step 4, so the shorter TTL is what the world has cached.

## 3. Add the domain to Cloudflare

- [ ] Cloudflare → **Add a domain** → `<domain>` → Free plan.
- [ ] Cloudflare scans the old DNS and pre-fills records. **The scan misses records.** Compare it line by line with your export from step 1, and add anything missing, especially DKIM records with unusual names.
- [ ] **Mail records must be "DNS only"** (grey cloud), never proxied (orange). Proxying MX targets or mail hostnames breaks email.
- [ ] Leave the old website records (`@` and `www` pointing at the old host) as they are for now.
- [ ] Note the two Cloudflare nameservers it gives you.

## 4. Change the nameservers

- [ ] **Turn off DNSSEC at the registrar first,** if it's on. Changing nameservers with the old DNSSEC still active makes the domain stop resolving.
- [ ] At the registrar, replace the nameservers with Cloudflare's two.
- [ ] Wait for Cloudflare to show the domain as **Active** (often minutes, up to 24 hours). Email and the old website keep working the whole time, because the records are the same in both places.

## 5. Point the domain at the new site

- [ ] Cloudflare → **Workers & Pages** → `<worker>` → **Settings** → **Domains & Routes** → **Add** → **Custom domain** → `<domain>`. Repeat for `www.<domain>` if the site uses it.
- [ ] If Cloudflare says a record already exists, delete the old `@` or `www` record pointing at the old host first, then add the custom domain again.
- [ ] Follow the go-live steps in `STARTER-CHECKLIST.md` (step 9): set `siteUrl` to `https://<domain>`, add the domain to `ALLOWED_DOMAINS`, and turn off the `workers.dev` address.

## 6. Verify

- [ ] `https://<domain>` and `https://www.<domain>` load the new site with a valid padlock (the certificate can take a few minutes).
- [ ] One of them redirects to the other, whichever is the main address.
- [ ] Re-run `pre-launch-qa.md` on the real domain, especially **redirects**, **canonicals**, **robots.txt** and **"Email still works"**.
- [ ] Check DNS from outside your network, e.g. `dig MX <domain> @1.1.1.1` and `dig MX <domain> @8.8.8.8`. Both show the same mail servers as your step 1 export.

## 7. Tell search engines

- [ ] **Google Search Console:** make sure the property covers the domain (a Domain property, verified by a DNS TXT record, survives the move). Under **Sitemaps**, submit `https://<domain>/sitemap-index.xml`. Remove an old sitemap address if it no longer exists.
- [ ] Use **URL Inspection** on the home page and a couple of key pages → **Request indexing**.
- [ ] **Bing Webmaster Tools:** submit the same sitemap, if the client uses it.
- [ ] Watch **Pages** and **404s** in Search Console over the next two weeks, and add redirects for any old URLs that show up.

## 8. Keep the old host for two weeks

- [ ] **Don't cancel the old hosting or delete its DNS zone for at least two weeks.** It's the rollback route, and some visitors and email servers may cache the old answers for a while.
- [ ] Check the client's old hosting plan doesn't include their email before cancelling (see step 1).
- [ ] After two weeks with no problems, cancel the old website hosting.

## Rollback

If the new site or email has a serious problem after cutover:

- **Website only, fastest:** in Cloudflare DNS, remove the Worker's custom domain and re-create the old `@` and `www` records pointing at the old host. This takes effect within the low TTL from step 2. Email isn't affected.
- **Everything:** at the registrar, put the **old nameservers** back. Everything then comes from the old DNS host again, which is why its zone must stay untouched for two weeks. This can take hours to reach everyone.
- Then fix the problem on a branch and preview (see `STAGING.md`) before trying again.
