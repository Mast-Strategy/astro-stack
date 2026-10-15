// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  // Every page URL ends in a slash (/services/). Must match assets.html_handling in wrangler.jsonc.
  trailingSlash: 'always',
  build: { format: 'directory' },
  vite: {
    plugins: [tailwindcss()]
  }
});