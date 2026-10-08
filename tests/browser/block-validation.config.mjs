import { defineConfig, devices } from '@playwright/test';

// Serialization does not depend on viewport or a running WordPress web server.
// Keep this isolated from the frontend matrix and its signed-in browser state.
export default defineConfig( {
	forbidOnly: true,
	outputDir: '../../.local/test-results/block-validation',
	fullyParallel: false,
	projects: [ {
		name: 'wordpress-block-validation',
		use: { ...devices[ 'Desktop Chrome' ] }
	} ],
	reporter: process.env.CI ? 'github' : 'list',
	retries: 0,
	testDir: '.',
	testMatch: 'block-validation.test.mjs',
	use: { channel: process.env.PEPPERMINT_TEST_CHANNEL || undefined },
	workers: 1
} );
