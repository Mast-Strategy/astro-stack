// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

import siteConfig from './site.config.mjs';

// Which environment this build is for. Workers Builds sets WORKERS_CI_BRANCH on every build.
// - 'production': built from the production branch. Turns on analytics.
// - 'preview': built from any other branch. Turns on noindex.
// - 'unknown': anything else (e.g. npm run build on a laptop). Indexable, no analytics.
// Each behaviour only switches on when the environment is positively identified.
const branch = process.env.WORKERS_CI_BRANCH;
const deployEnv = !branch ? 'unknown' : branch === siteConfig.productionBranch ? 'production' : 'preview';

// https://astro.build/config
export default defineConfig({
  site: siteConfig.siteUrl,
  // Every page URL ends in a slash (/services/). Must match assets.html_handling in wrangler.jsonc.
  trailingSlash: 'always',
  build: { format: 'directory' },
  integrations: [
    sitemap({
      // The 404 page and the CMS admin aren't pages to list for search engines.
      filter: (page) => !page.endsWith('/404/') && !page.includes('/admin/'),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
    // Read in src/lib/environment.ts.
    define: {
      'import.meta.env.DEPLOY_ENV': JSON.stringify(deployEnv),
    },
  }
});
