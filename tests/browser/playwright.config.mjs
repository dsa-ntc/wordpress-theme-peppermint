import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.NTC_TEST_BASE_URL?.trim();

if ( ! baseURL || ! baseURL.trim() ) {
	throw new Error( 'Set NTC_TEST_BASE_URL to the URL of a disposable NTC Block test site.' );
}

try {
	const origin = new URL( baseURL );
	if ( ! [ 'http:', 'https:' ].includes( origin.protocol ) || origin.username || origin.password ) {
		throw new Error( 'Unsupported test URL.' );
	}
} catch {
	throw new Error( 'NTC_TEST_BASE_URL must be an HTTP(S) test-site URL without embedded credentials.' );
}

// Reject typos instead of silently skipping routes or appearance modes.
// Validate here so --list checks the same inputs as a full run.
const routeLists = [ 'NTC_TEST_PATHS', 'NTC_RESPONSIVE_TEST_PATHS', 'NTC_EXPECTED_404_PATHS' ];
const singleRoutes = [ 'NTC_CARD_TEST_PATH', 'NTC_LANDING_HERO_TEST_PATH', 'NTC_SIGNAL_RAIL_TEST_PATH', 'NTC_APPEARANCE_TEST_PATH', 'NTC_PULLQUOTE_TEST_PATH' ];
for ( const name of [ ...routeLists, ...singleRoutes ] ) {
	if ( process.env[ name ] === undefined ) {
		continue;
	}
	const routes = ( routeLists.includes( name ) ? process.env[ name ].split( ',' ) : [ process.env[ name ] ] )
		.map( ( route ) => route.trim() );
	if ( routes.some( ( route ) => ! route ) || new Set( routes ).size !== routes.length ) {
		throw new Error( `${ name } must contain nonempty, unique site-relative paths.` );
	}
	for ( const route of routes ) {
		try {
			decodeURI( route );
			if ( ! route.startsWith( '/' ) || route.startsWith( '//' ) || /[\s\\]/u.test( route )
				|| new URL( route, 'https://ntc-test.invalid' ).origin !== 'https://ntc-test.invalid' ) {
				throw new Error( 'Invalid site-relative path.' );
			}
		} catch {
			throw new Error( `${ name } must use site-relative paths starting with /; encode spaces and special URL characters.` );
		}
	}
	// Share normalized values with every spec, including single-route tests.
	process.env[ name ] = routes.join( ',' );
}
if ( process.env.NTC_RESPONSIVE_SCHEMES !== undefined ) {
	const schemes = process.env.NTC_RESPONSIVE_SCHEMES.split( ',' ).map( ( scheme ) => scheme.trim() );
	if ( schemes.some( ( scheme ) => ! [ 'light', 'dark' ].includes( scheme ) ) || new Set( schemes ).size !== schemes.length ) {
		throw new Error( 'NTC_RESPONSIVE_SCHEMES must be light, dark, or light,dark without duplicate or empty entries.' );
	}
	process.env.NTC_RESPONSIVE_SCHEMES = schemes.join( ',' );
}

export default defineConfig( {
	forbidOnly: true,
	outputDir: '../../.local/test-results/frontend',
	fullyParallel: true,
	projects: [
		{
			name: 'small-phone-chromium',
			use: {
				...devices[ 'Desktop Chrome' ],
				viewport: { height: 720, width: 320 }
			}
		},
		{
			name: 'mobile-chromium',
			use: { ...devices[ 'Pixel 7' ] }
		},
		{
			name: 'tablet-chromium',
			use: {
				...devices[ 'Desktop Chrome' ],
				viewport: { height: 1024, width: 768 }
			}
		},
		{
			name: 'narrow-three-column-chromium',
			use: {
				...devices[ 'Desktop Chrome' ],
				viewport: { height: 900, width: 800 }
			}
		},
		{
			name: 'desktop-chromium',
			use: { ...devices[ 'Desktop Chrome' ] }
		},
		{
			name: 'laptop-chromium',
			use: {
				...devices[ 'Desktop Chrome' ],
				viewport: { height: 768, width: 1366 }
			}
		},
		{
			name: 'wide-desktop-chromium',
			use: {
				...devices[ 'Desktop Chrome' ],
				viewport: { height: 900, width: 1440 }
			}
		}
	],
	reporter: process.env.CI ? 'github' : 'list',
	retries: process.env.CI ? 2 : 0,
	testDir: '.',
	testMatch: '*.spec.mjs',
	use: {
		baseURL,
		channel: process.env.NTC_TEST_CHANNEL || undefined,
		screenshot: 'only-on-failure',
		trace: 'retain-on-failure'
	},
	workers: process.env.CI ? 2 : undefined
} );
