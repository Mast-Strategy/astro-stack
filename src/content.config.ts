import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Page copy: one Markdown file per page in src/content/pages, edited through Sveltia CMS.
// Each field here must match a field in public/admin/config.yml. Fields only some pages
// use are optional. Images sit next to the pages in src/content/pages/images, so image()
// lets Astro resize and convert them at build time (files in public/ are served as is).
const pages = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/pages' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string().optional(),
      heading: z.string().optional(),
      image: image().optional(),
      image_alt: z.string().optional(),
      link_label: z.string().optional(),
    }),
});

// Site-wide settings, one YAML file per settings group in src/content/settings.
const settings = defineCollection({
  loader: glob({ pattern: '*.yml', base: './src/content/settings' }),
  schema: z.object({
    site_name: z.string(),
    email: z.string().optional(),
    footer_text: z.string().optional(),
  }),
});

export const collections = { pages, settings };
