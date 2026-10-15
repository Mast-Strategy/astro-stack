## Working rules

These apply to anyone working in this repo, people and AI agents alike. `CLAUDE.md` is a link to this file, so edit `AGENTS.md` only.

- **Never push to `main`.** Pushes to `main` deploy straight to production. Work on a branch, push the branch (it gets a preview address), and open a pull request. See `STAGING.md`.
- **Run `npm run build` before every commit.** It must end with `Complete!`. Commit in small steps with clear messages.
- **All copy lives in `src/content/`.** Templates in `src/pages/` and `src/layouts/` never contain words the owner might change. A new editable field goes in the content file, `public/admin/config.yml` and `src/content.config.ts` together.
- **Don't change Cloudflare or GitHub settings** (dashboard settings, variables, secrets, domains, DNS, OAuth apps, repo settings, branch protection). They're done by a person.
- **Leave the stack settings alone** unless the task is to change the stack: `trailingSlash` in `astro.config.mjs`, `html_handling` and `not_found_handling` in `wrangler.jsonc`, and the pinned CMS version in `public/admin/`.
- **List what needs a human instead of attempting it,** e.g. anything in a dashboard, anything needing a login, or anything that sends email or changes DNS. Say what to do and where.
- **No secrets in the repo.** Keys go in Cloudflare (Runtime secrets for the CMS login helper, Build variables for `PUBLIC_*` values).

## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
