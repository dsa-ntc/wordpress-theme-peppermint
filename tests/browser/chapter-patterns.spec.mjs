import { expect, test } from '@playwright/test';

// The preview page holds the events, embedded form, join steps, and footer-columns patterns,
// with one embed area left empty and the others filled with a sample iframe.
const route = '/theme-preview/chapter-patterns/';

test( 'empty embed areas and footer spots stay hidden on the front end', async ( { page } ) => {
	await page.goto( route );
	const empty = page.locator( ':is(.peppermint-responsive-embed, .peppermint-embed-frame):empty, .site-footer :is(p, .wp-block-social-links):empty' );
	expect( await empty.count() ).toBeGreaterThan( 0 );
	for ( const display of await empty.evaluateAll( ( elements ) => elements.map( ( element ) => getComputedStyle( element ).display ) ) ) {
		expect( display ).toBe( 'none' );
	}
} );

test( 'filled embeds fill their frame without overflowing the page', async ( { page } ) => {
	await page.goto( route );
	const frames = page.locator( ':is(.peppermint-responsive-embed, .peppermint-embed-frame):has(iframe)' );
	expect( await frames.count() ).toBeGreaterThan( 0 );
	const report = await frames.evaluateAll( ( elements ) => elements.map( ( frame ) => {
		const style = getComputedStyle( frame );
		const inner = frame.clientWidth - parseFloat( style.paddingLeft ) - parseFloat( style.paddingRight );
		return { inner, iframe: frame.querySelector( 'iframe' ).getBoundingClientRect().width };
	} ) );
	for ( const item of report ) {
		expect( Math.abs( item.iframe - item.inner ), JSON.stringify( report ) ).toBeLessThan( 2 );
	}
	expect( await page.evaluate( () => document.documentElement.scrollWidth - document.documentElement.clientWidth ) ).toBeLessThanOrEqual( 0 );
} );
