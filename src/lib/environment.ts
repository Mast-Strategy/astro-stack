// Build environment, worked out in astro.config.mjs from Workers Builds' WORKERS_CI_BRANCH.
// Both flags fail safe: an unrecognised build is indexable and has no analytics.

const deployEnv = import.meta.env.DEPLOY_ENV as 'production' | 'preview' | 'unknown';

// Built from the production branch on Workers Builds. Analytics only run here.
export const isProduction = deployEnv === 'production';

// A branch preview or the local dev server. Only these get noindex.
export const isNonProduction = deployEnv === 'preview' || import.meta.env.DEV;
