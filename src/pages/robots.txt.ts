import type { APIRoute } from 'astro';
import { isNonProduction } from '../lib/environment';

// Previews block all crawling. Every other build allows it and points to the sitemap.
export const GET: APIRoute = ({ site }) => {
	const body = isNonProduction
		? 'User-agent: *\nDisallow: /\n'
		: `User-agent: *\nAllow: /\n\nSitemap: ${new URL('sitemap-index.xml', site)}\n`;

	return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
