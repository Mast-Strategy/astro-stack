import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Page copy. One Markdown file per page in src/content/pages, edited through Sveltia CMS.
// Optional fields only apply to the pages that use them (e.g. hero and services on home).
const pages = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/pages' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    hero: z
      .object({
        headline: z.string(),
        subheadline: z.string().optional(),
        image: z.string().optional(),
        image_alt: z.string().optional(),
        cta_label: z.string().optional(),
        cta_link: z.string().optional(),
      })
      .optional(),
    services: z
      .array(
        z.object({
          name: z.string(),
          summary: z.string().optional(),
        }),
      )
      .optional(),
  }),
});

// Site-wide settings (business name, contact details, footer), one YAML file per settings group.
const settings = defineCollection({
  loader: glob({ pattern: '*.yml', base: './src/content/settings' }),
  schema: z.object({
    business_name: z.string(),
    tagline: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().optional(),
    service_area: z.string().optional(),
    footer_note: z.string().optional(),
  }),
});

export const collections = { pages, settings };
