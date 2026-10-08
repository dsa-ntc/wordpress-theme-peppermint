import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const routes = ( process.env.PEPPERMINT_TEST_PATHS || '/' )
	.split( ',' )
	.map( ( route ) => route.trim() )
	.filter( Boolean );

const notFoundRoutes = ( process.env.PEPPERMINT_EXPECTED_404_PATHS || '/theme-preview-guaranteed-missing-route/' )
	.split( ',' ).map( ( route ) => route.trim() ).filter( Boolean );

for ( const route of routes ) {
	for ( const scheme of [ 'light', 'dark' ] ) {
		test( `${ scheme } appearance: ${ route }`, async ( { page } ) => {
			await page.addInitScript( ( requestedScheme ) => {
				window.localStorage.setItem( 'peppermint-color-scheme', requestedScheme );
			}, scheme );

			const response = await page.goto( route, { waitUntil: 'domcontentloaded' } );
			expect( response, `No document response for ${ route }` ).not.toBeNull();
			expect( response.status(), `Missing or unexpected fixture at ${ route }` ).toBe( notFoundRoutes.includes( route ) ? 404 : 200 );

			await expect( page.locator( '.wp-site-blocks > header' ) ).toHaveCount( 1 );
			await expect( page.locator( '.wp-site-blocks > main' ) ).toHaveCount( 1 );
			await expect( page.locator( '.wp-site-blocks > footer' ) ).toHaveCount( 1 );
			await page.evaluate( () => document.fonts.ready );

			const skipLink = page.locator( '#wp-skip-link' );
			await expect( skipLink ).toHaveCount( 1 );
			const skipTarget = await skipLink.getAttribute( 'href' );
			expect( skipTarget ).toMatch( /^#[A-Za-z][A-Za-z0-9_:.-]*$/ );
			await expect( page.locator( skipTarget ) ).toHaveCount( 1 );

			await expect( page.locator( 'html' ) ).toHaveAttribute( 'data-peppermint-resolved-scheme', scheme );

			const unsafeBlankLinks = await page.locator( 'a[target="_blank"]' ).evaluateAll( ( links ) => (
				links
					.filter( ( link ) => ! link.relList.contains( 'noopener' ) )
					.map( ( link ) => link.outerHTML )
			) );
			expect( unsafeBlankLinks, 'target="_blank" links without rel="noopener"' ).toEqual( [] );

			const results = await new AxeBuilder( { page } )
				.withTags( [ 'wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa' ] )
				.analyze();
			const summary = results.violations.map( ( violation ) => ( {
				help: violation.help,
				id: violation.id,
				impact: violation.impact,
				nodes: violation.nodes.map( ( node ) => node.target )
			} ) );

			expect( summary, JSON.stringify( summary, null, 2 ) ).toEqual( [] );
		} );
	}
}
