// Per-client settings a developer sets once. Owner-editable copy lives in src/content, not here.

export default {
	// The site's canonical address, no trailing slash. Used for canonical tags, the sitemap and robots.txt.
	// Use the workers.dev address until go-live, then change it to the client's real domain.
	siteUrl: 'https://ia-stack-test.square-shadow-cb0d.workers.dev',

	// The branch Workers Builds deploys to production. Builds of any other branch are previews.
	productionBranch: 'main',
};
