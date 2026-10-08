import { expect, test } from '@playwright/test';

const signalRoute = process.env.PEPPERMINT_SIGNAL_RAIL_TEST_PATH || '/theme-preview/section-styles/';

async function settle( page ) {
	await page.evaluate( () => document.fonts.ready );
	await page.evaluate( () => new Promise( ( resolve ) => requestAnimationFrame( () => requestAnimationFrame( resolve ) ) ) );
}

async function signalHeroReport( page ) {
	return page.evaluate( () => {
		const hero = document.querySelector( '.peppermint-signal-hero, .is-style-peppermint-signal-hero' );
		if ( ! hero ) {
			return null;
		}

		const eyebrow = hero.querySelector( '.eyebrow' );
		const heading = hero.querySelector( 'h1, h2, h3' );
		if ( ! eyebrow || ! heading ) {
			return null;
		}

		const heroRect = hero.getBoundingClientRect();
		const headingRect = heading.getBoundingClientRect();
		const headingStyle = getComputedStyle( heading );
		const rail = getComputedStyle( eyebrow, '::after' );
		const before = getComputedStyle( hero, '::before' );
		const after = getComputedStyle( hero, '::after' );
		const pseudoHasInk = ( style ) => ! [ 'none', 'normal' ].includes( style.content )
			&& style.display !== 'none'
			&& ( style.backgroundImage !== 'none'
				|| style.backgroundColor !== 'rgba(0, 0, 0, 0)'
				|| Number.parseFloat( style.borderTopWidth ) > 0
				|| Number.parseFloat( style.borderRightWidth ) > 0
				|| Number.parseFloat( style.borderBottomWidth ) > 0
				|| Number.parseFloat( style.borderLeftWidth ) > 0
				|| style.boxShadow !== 'none' );

		return {
			documentOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
			experimentalClassCount: document.querySelectorAll( '[class*="peppermint-signal-hero--"]' ).length,
			headingClipped: ( [ 'clip', 'hidden' ].includes( headingStyle.overflowX ) && heading.scrollWidth > heading.clientWidth + 1 )
				|| ( [ 'clip', 'hidden' ].includes( headingStyle.overflowY ) && heading.scrollHeight > heading.clientHeight + 1 ),
			headingEscapes: headingRect.left < heroRect.left - 1 || headingRect.right > heroRect.right + 1,
			heroEscapes: heroRect.left < -1 || heroRect.right > document.documentElement.clientWidth + 1,
			parentAfterHasInk: pseudoHasInk( after ),
			parentBeforeHasInk: pseudoHasInk( before ),
			railBorder: Number.parseFloat( rail.borderBottomWidth ),
			railContent: rail.content,
			railHasInk: pseudoHasInk( rail ),
			railHeight: Number.parseFloat( rail.height ),
			railWidth: Number.parseFloat( rail.width )
		};
	} );
}

test( 'optional Signal Hero is previewed on Section Styles using core blocks', async ( { page } ) => {
	const response = await page.goto( signalRoute, { waitUntil: 'domcontentloaded' } );
	expect( response ).not.toBeNull();
	expect( response.status() ).toBe( 200 );
	await settle( page );

	const hero = page.locator( '.peppermint-signal-hero, .is-style-peppermint-signal-hero' );
	await expect( hero ).toHaveCount( 1 );
	await expect( hero.locator( '.eyebrow' ) ).toHaveCount( 1 );
	expect( await hero.locator( 'h1, h2, h3' ).count() ).toBeGreaterThanOrEqual( 1 );

	const report = await signalHeroReport( page );
	expect( report ).not.toBeNull();
	expect( report.experimentalClassCount, JSON.stringify( report, null, 2 ) ).toBe( 0 );
	expect( report.parentBeforeHasInk, JSON.stringify( report, null, 2 ) ).toBe( false );
	expect( report.parentAfterHasInk, JSON.stringify( report, null, 2 ) ).toBe( false );
	expect( report.railHasInk, JSON.stringify( report, null, 2 ) ).toBe( true );
} );

test( 'standalone Signal Rail remains previewed on a core Heading block', async ( { page } ) => {
	const response = await page.goto( signalRoute, { waitUntil: 'domcontentloaded' } );
	expect( response ).not.toBeNull();
	expect( response.status() ).toBe( 200 );
	await settle( page );

	const heading = page.getByRole( 'heading', { level: 2, name: 'Signal Rail' } );
	await expect( heading ).toHaveCount( 1 );
	await expect( heading ).toHaveClass( /is-style-peppermint-signal-rail/ );
	const rail = await heading.evaluate( ( element ) => {
		const style = getComputedStyle( element, '::after' );
		return {
			content: style.content,
			height: Number.parseFloat( style.height ),
			painted: ! [ 'none', 'normal' ].includes( style.content )
				&& style.display !== 'none'
				&& style.visibility !== 'hidden'
				&& Number.parseFloat( style.opacity ) !== 0
				&& ( style.backgroundImage !== 'none'
					|| style.backgroundColor !== 'rgba(0, 0, 0, 0)'
					|| Number.parseFloat( style.borderBottomWidth ) > 0
					|| style.boxShadow !== 'none' ),
			width: Number.parseFloat( style.width )
		};
	} );
	expect( rail.painted, JSON.stringify( rail, null, 2 ) ).toBe( true );
	expect( rail.width, JSON.stringify( rail, null, 2 ) ).toBeGreaterThan( 24 );
	expect( rail.height, JSON.stringify( rail, null, 2 ) ).toBeGreaterThanOrEqual( 8 );
} );

for ( const scheme of [ 'light', 'dark' ] ) {
	test( `${ scheme } optional Signal Hero stays clean and contained`, async ( { page } ) => {
		await page.addInitScript( ( requestedScheme ) => {
			window.localStorage.setItem( 'peppermint-color-scheme', requestedScheme );
		}, scheme );
		await page.goto( signalRoute, { waitUntil: 'domcontentloaded' } );
		await settle( page );
		await expect( page.locator( 'html' ) ).toHaveAttribute( 'data-peppermint-resolved-scheme', scheme );

		const report = await signalHeroReport( page );
		expect( report ).not.toBeNull();
		expect( report.documentOverflow, JSON.stringify( report, null, 2 ) ).toBeLessThanOrEqual( 1 );
		expect( report.experimentalClassCount, JSON.stringify( report, null, 2 ) ).toBe( 0 );
		expect( report.heroEscapes, JSON.stringify( report, null, 2 ) ).toBe( false );
		expect( report.headingEscapes, JSON.stringify( report, null, 2 ) ).toBe( false );
		expect( report.headingClipped, JSON.stringify( report, null, 2 ) ).toBe( false );
		expect( report.parentBeforeHasInk, JSON.stringify( report, null, 2 ) ).toBe( false );
		expect( report.parentAfterHasInk, JSON.stringify( report, null, 2 ) ).toBe( false );
		expect( [ '""', 'none' ], JSON.stringify( report, null, 2 ) ).toContain( report.railContent );
		expect( report.railHasInk, JSON.stringify( report, null, 2 ) ).toBe( true );
		expect( report.railWidth, JSON.stringify( report, null, 2 ) ).toBeGreaterThan( 24 );
		expect( report.railHeight, JSON.stringify( report, null, 2 ) ).toBeGreaterThanOrEqual( 8 );
	} );
}

test( 'optional Signal Hero survives 200 percent text and WCAG text spacing', async ( { page } ) => {
	await page.goto( signalRoute, { waitUntil: 'domcontentloaded' } );
	await page.addStyleTag( { content: 'html { font-size: 200% !important; }' } );
	await settle( page );
	const reports = [ await signalHeroReport( page ) ];

	await page.reload( { waitUntil: 'domcontentloaded' } );
	await page.addStyleTag( {
		content: `.peppermint-signal-hero * {
			letter-spacing: 0.12em !important;
			line-height: 1.5 !important;
			word-spacing: 0.16em !important;
		}`
	} );
	await settle( page );
	reports.push( await signalHeroReport( page ) );

	for ( const report of reports ) {
		expect( report ).not.toBeNull();
		expect( report.heroEscapes, JSON.stringify( report, null, 2 ) ).toBe( false );
		expect( report.headingEscapes, JSON.stringify( report, null, 2 ) ).toBe( false );
		expect( report.headingClipped, JSON.stringify( report, null, 2 ) ).toBe( false );
		expect( report.parentBeforeHasInk, JSON.stringify( report, null, 2 ) ).toBe( false );
		expect( report.parentAfterHasInk, JSON.stringify( report, null, 2 ) ).toBe( false );
	}
} );

test( 'forced colors retains the optional rail without adding registration marks', async ( { page }, testInfo ) => {
	test.skip(
		! [ 'small-phone-chromium', 'wide-desktop-chromium' ].includes( testInfo.project.name ),
		'Forced-colors coverage is concentrated at the smallest and widest viewports.'
	);
	await page.emulateMedia( { colorScheme: 'dark', forcedColors: 'active' } );
	await page.goto( signalRoute, { waitUntil: 'domcontentloaded' } );
	await settle( page );
	expect( await page.evaluate( () => matchMedia( '(forced-colors: active)' ).matches ) ).toBe( true );

	const report = await signalHeroReport( page );
	expect( report ).not.toBeNull();
	expect( report.railBorder, JSON.stringify( report, null, 2 ) ).toBeGreaterThanOrEqual( 1 );
	expect( report.parentBeforeHasInk, JSON.stringify( report, null, 2 ) ).toBe( false );
	expect( report.parentAfterHasInk, JSON.stringify( report, null, 2 ) ).toBe( false );
} );
