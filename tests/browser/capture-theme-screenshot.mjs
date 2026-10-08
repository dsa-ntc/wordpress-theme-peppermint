import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium, expect } from '@playwright/test';

// Capture local review images; keep site-owned media outside the theme repository.
let baseURL;
try {
	const target = new URL( process.env.PEPPERMINT_TEST_BASE_URL?.trim() );
	if ( ! [ 'http:', 'https:' ].includes( target.protocol ) || target.username || target.password || target.search || target.hash ) {
		throw new Error( 'Unsupported screenshot URL.' );
	}
	// A trailing slash keeps subdirectory installations in scope.
	target.pathname = `${ target.pathname.replace( /\/+$/, '' ) }/`;
	baseURL = target.href;
} catch {
	throw new Error( 'Set PEPPERMINT_TEST_BASE_URL to an HTTP(S) site root without credentials, a query, or a fragment.' );
}

const previews = [
	{ name: 'hero-and-stats', route: 'theme-preview/landing-hero/', scheme: 'light', kind: 'hero' },
	{ name: 'cards-and-frames', route: 'theme-preview/cards-and-frames/', scheme: 'dark', kind: 'cards' },
	{ name: 'project-grid', route: 'theme-preview/query-components/?query-page=2', scheme: 'light', kind: 'query' }
];
const outputDirectory = fileURLToPath( new URL( '../../.local/artifacts/readme-gallery/', import.meta.url ) );
const browser = await chromium.launch( { channel: process.env.PEPPERMINT_TEST_CHANNEL || undefined } );

try {
	await mkdir( outputDirectory, { recursive: true } );
	for ( const preview of previews ) {
		// A new anonymous context excludes admin UI and saved appearance preferences.
		const context = await browser.newContext( {
			baseURL,
			colorScheme: preview.scheme,
			deviceScaleFactor: 1,
			reducedMotion: 'reduce',
			viewport: { width: 1440, height: 1000 }
		} );
		try {
			const page = await context.newPage();
			const errors = [];
			page.on( 'pageerror', error => errors.push( error.message ) );
			const response = await page.goto( new URL( preview.route, baseURL ).href, { waitUntil: 'domcontentloaded', timeout: 30_000 } );
			expect( response?.status(), `${ preview.route } must return a public page.` ).toBe( 200 );
			await expect( page.locator( '#wpadminbar' ), 'Do not capture a signed-in administrator preview.' ).toHaveCount( 0 );
			await expect( page.locator( 'html' ) ).toHaveAttribute( 'data-peppermint-resolved-scheme', preview.scheme );
			await expect( page.getByRole( 'banner' ) ).toBeVisible();
			await expect( page.getByRole( 'main' ) ).toBeVisible();
			const region = page.locator( preview.kind === 'hero' ? '.peppermint-pattern-stats'
				: preview.kind === 'cards' ? '.subcommittee-section' : '.project-grid' ).nth( preview.kind === 'query' ? 1 : 0 );
			await expect( region ).toBeVisible();
			await region.scrollIntoViewIfNeeded();
			await page.evaluate( () => document.fonts.ready );
			const clip = await page.evaluate( ( kind ) => {
				const box = element => {
					if ( ! element ) {
						throw new Error( 'Required preview content is missing. Verify the local preview library.' );
					}
					const rect = element.getBoundingClientRect();
					return { top: rect.top + scrollY, bottom: rect.bottom + scrollY };
				};
				let start = 0;
				let end;
				if ( kind === 'hero' ) {
					end = box( document.querySelector( '.peppermint-pattern-stats' ) ).bottom;
				} else if ( kind === 'cards' ) {
					const section = box( document.querySelector( '.subcommittee-section' ) );
					start = section.top - 24;
					end = section.bottom + 32;
				} else {
					const section = document.querySelectorAll( '.project-grid' )[ 1 ];
					start = box( section ).top - 24;
					const firstRow = [ ...section.querySelectorAll( '.wp-block-post-template > li' ) ].slice( 0, 2 );
					if ( firstRow.length !== 2 ) {
						throw new Error( 'The project preview needs at least two posts.' );
					}
					end = Math.max( ...firstRow.map( element => box( element ).bottom ) ) + 32;
				}
				const y = Math.max( 0, Math.floor( start ) );
				return { x: 0, y, width: innerWidth, height: Math.ceil( end ) - y };
			}, preview.kind );
			// Scroll through the crop so lazy images load without changing page content.
			for ( let y = clip.y; y < clip.y + clip.height; y += 800 ) {
				await page.evaluate( top => window.scrollTo( { top, behavior: 'instant' } ), y );
				await page.evaluate( () => new Promise( resolve => requestAnimationFrame( resolve ) ) );
			}
			await expect.poll( () => page.evaluate( ( crop ) => {
				const images = [ ...document.images ].filter( image => {
					const box = image.getBoundingClientRect();
					return box.width > 0 && box.height > 0 && box.bottom + scrollY > crop.y && box.top + scrollY < crop.y + crop.height;
				} );
				return document.fonts.status === 'loaded' && images.every( image => image.complete && image.naturalWidth > 0 );
			}, clip ), { message: 'Fonts and captured images must finish loading.', timeout: 15_000 } ).toBe( true );
			expect( await page.evaluate( () => document.documentElement.scrollWidth - document.documentElement.clientWidth ), 'The page must not overflow horizontally.' ).toBeLessThanOrEqual( 1 );
			expect( errors, 'Resolve browser exceptions before publishing a preview.' ).toEqual( [] );
			const outputPath = fileURLToPath( new URL( `../../.local/artifacts/readme-gallery/${ preview.name }.png`, import.meta.url ) );
			await page.screenshot( { path: outputPath, clip, fullPage: true, animations: 'disabled' } );
			console.log( `${ preview.name }: ${ clip.width }x${ clip.height }, ${ preview.scheme }, ${ preview.route }\nReview ${ outputPath } locally; keep this image outside source control.` );
		} finally {
			await context.close();
		}
	}
} finally {
	await browser.close();
}
