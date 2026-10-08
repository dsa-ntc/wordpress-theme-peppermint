import { expect, test } from '@playwright/test';

const heroRoute = process.env.PEPPERMINT_LANDING_HERO_TEST_PATH || '/theme-preview/landing-hero/';
const heroSelector = '.wp-block-cover.peppermint-image-hero.alignfull';

async function settle( page ) {
	await page.evaluate( () => document.fonts.ready );
	await page.evaluate( () => new Promise( ( resolve ) => requestAnimationFrame( () => requestAnimationFrame( resolve ) ) ) );
}

async function openHero( page, scheme ) {
	if ( scheme ) {
		await page.addInitScript( ( requestedScheme ) => {
			window.localStorage.setItem( 'peppermint-color-scheme', requestedScheme );
		}, scheme );
	}

	const response = await page.goto( heroRoute, { waitUntil: 'domcontentloaded' } );
	expect( response, `No document response for ${ heroRoute }` ).not.toBeNull();
	expect( response.status(), `Unexpected response for ${ heroRoute }` ).toBe( 200 );

	const hero = page.locator( heroSelector );
	await expect( hero ).toHaveCount( 1 );
	await expect( hero ).toBeVisible();
	const image = hero.locator( '.wp-block-cover__image-background' );
	await expect( image ).toHaveCount( 1 );
	await expect.poll(
		() => image.evaluate( ( element ) => element.complete && element.naturalWidth > 0 && element.naturalHeight > 0 ),
		{ message: 'The landing-hero background image did not load.' }
	).toBe( true );
	await settle( page );

	return hero;
}

async function heroReport( page ) {
	return page.locator( heroSelector ).evaluate( ( hero ) => {
		const image = hero.querySelector( '.wp-block-cover__image-background' );
		const overlay = hero.querySelector( '.wp-block-cover__background' );
		const layout = hero.querySelector( '.peppermint-image-hero__layout' );
		const content = hero.querySelector( '.peppermint-image-hero__content' );
		const heading = content?.querySelector( 'h1' );
		const paragraph = content?.querySelector( 'p' );
		if ( ! image || ! overlay || ! layout || ! content || ! heading || ! paragraph ) {
			return null;
		}

		const viewportWidth = document.documentElement.clientWidth;
		const rootStyle = getComputedStyle( document.documentElement );
		const probe = document.createElement( 'span' );
		probe.style.cssText = 'position:fixed;visibility:hidden;display:block;padding:0;border:0;height:0;';
		document.body.append( probe );
		const lengthInPixels = ( value ) => {
			probe.style.width = value;
			return probe.getBoundingClientRect().width;
		};
		const contentLimit = lengthInPixels( rootStyle.getPropertyValue( '--wp--style--global--content-size' ) );
		const wideLimit = lengthInPixels( rootStyle.getPropertyValue( '--wp--style--global--wide-size' ) );
		const gutter = lengthInPixels( rootStyle.getPropertyValue( '--wp--preset--spacing--40' ) );
		probe.remove();
		const heroRect = hero.getBoundingClientRect();
		const imageRect = image.getBoundingClientRect();
		const overlayRect = overlay.getBoundingClientRect();
		const layoutRect = layout.getBoundingClientRect();
		const contentRect = content.getBoundingClientRect();
		const headingRect = heading.getBoundingClientRect();
		const paragraphRect = paragraph.getBoundingClientRect();
		const heroStyle = getComputedStyle( hero );
		const imageStyle = getComputedStyle( image );
		const overlayStyle = getComputedStyle( overlay );
		const headingStyle = getComputedStyle( heading );
		const gradient = overlayStyle.backgroundImage;
		const gradientColors = [ ...gradient.matchAll( /rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/g ) ]
			.map( ( match ) => match.slice( 1, 4 ).map( Number ) );
		const borderWidths = [
			heroStyle.borderTopWidth,
			heroStyle.borderRightWidth,
			heroStyle.borderBottomWidth,
			heroStyle.borderLeftWidth
		].map( Number.parseFloat );
		const source = image.currentSrc || image.src;
		const sourcePath = new URL( source, document.baseURI ).pathname;
		const bodySections = [ ...hero.parentElement.children ]
			.filter( ( element ) => element !== hero && ! element.classList.contains( 'alignfull' ) )
			.map( ( element ) => {
				const rect = element.getBoundingClientRect();
				return { left: rect.left, right: rect.right, width: rect.width, wide: element.classList.contains( 'alignwide' ) };
			} );

		return {
			backgroundCoversHero: imageRect.left <= heroRect.left + 1
				&& imageRect.right >= heroRect.right - 1
				&& imageRect.top <= heroRect.top + 1
				&& imageRect.bottom >= heroRect.bottom - 1,
			borderWidths,
			bodySections,
			contentLimit,
			wideLimit,
			contentInsideLayout: contentRect.left >= layoutRect.left - 1
				&& contentRect.right <= layoutRect.right + 1,
			contentCentered: Math.abs(
				( contentRect.left + contentRect.right ) / 2
				- ( layoutRect.left + layoutRect.right ) / 2
			) <= 2,
			contentWidth: contentRect.width,
			documentOverflow: document.documentElement.scrollWidth - viewportWidth,
			gradient,
			gradientHasBlue: gradientColors.some( ( [ red, green, blue ] ) => blue >= red + 30 && blue >= green + 20 ),
			gradientHasRed: gradientColors.some( ( [ red, green, blue ] ) => red >= green + 50 && red >= blue + 50 ),
			headingClipped: ( [ 'clip', 'hidden' ].includes( headingStyle.overflowX ) && heading.scrollWidth > heading.clientWidth + 1 )
				|| ( [ 'clip', 'hidden' ].includes( headingStyle.overflowY ) && heading.scrollHeight > heading.clientHeight + 1 ),
			headingInsideContent: headingRect.left >= contentRect.left - 1
				&& headingRect.right <= contentRect.right + 1,
			heroHeight: heroRect.height,
			heroHeaderGap: heroRect.top - document.querySelector( '.wp-site-blocks > header' ).getBoundingClientRect().bottom,
			heroLeft: heroRect.left,
			heroRight: heroRect.right,
			heroWidth: heroRect.width,
			gutter,
			imageComplete: image.complete,
			imageFilter: imageStyle.filter,
			imageNaturalHeight: image.naturalHeight,
			imageNaturalWidth: image.naturalWidth,
			imageObjectFit: imageStyle.objectFit,
			imageSource: source,
			isSiteMedia: new URL( source, document.baseURI ).origin === window.location.origin
				&& sourcePath.includes( '/wp-content/uploads/' ),
			layoutCentered: Math.abs( ( layoutRect.left + layoutRect.right ) / 2 - ( heroRect.left + heroRect.right ) / 2 ) <= 2,
			layoutInsideHero: layoutRect.left >= heroRect.left - 1
				&& layoutRect.right <= heroRect.right + 1,
			layoutWidth: layoutRect.width,
			overlayCoversHero: overlayRect.left <= heroRect.left + 1
				&& overlayRect.right >= heroRect.right - 1
				&& overlayRect.top <= heroRect.top + 1
				&& overlayRect.bottom >= heroRect.bottom - 1,
			overlayOpacity: Number.parseFloat( overlayStyle.opacity ),
			paragraphInsideContent: paragraphRect.left >= contentRect.left - 1
				&& paragraphRect.right <= contentRect.right + 1,
			paragraphLeftAligned: Math.abs( paragraphRect.left - contentRect.left ) <= 2,
			paragraphWidth: paragraphRect.width,
			viewportWidth
		};
	} );
}

function expectHeroGeometry( report ) {
	expect( report ).not.toBeNull();
	expect( report.documentOverflow, JSON.stringify( report, null, 2 ) ).toBeLessThanOrEqual( 1 );
	expect( Math.abs( report.heroHeaderGap ), JSON.stringify( report, null, 2 ) ).toBeLessThanOrEqual( 1 );
	expect( Math.abs( report.heroLeft ), JSON.stringify( report, null, 2 ) ).toBeLessThanOrEqual( 1 );
	expect( Math.abs( report.heroRight - report.viewportWidth ), JSON.stringify( report, null, 2 ) ).toBeLessThanOrEqual( 1 );
	expect( Math.abs( report.heroWidth - report.viewportWidth ), JSON.stringify( report, null, 2 ) ).toBeLessThanOrEqual( 2 );
	expect( report.backgroundCoversHero, JSON.stringify( report, null, 2 ) ).toBe( true );
	expect( report.overlayCoversHero, JSON.stringify( report, null, 2 ) ).toBe( true );
	expect( report.layoutInsideHero, JSON.stringify( report, null, 2 ) ).toBe( true );
	expect( report.layoutCentered, JSON.stringify( report, null, 2 ) ).toBe( true );
	expect( report.layoutWidth, JSON.stringify( report, null, 2 ) ).toBeLessThanOrEqual( Math.min( report.viewportWidth, 1280 ) + 2 );
	expect( report.contentInsideLayout, JSON.stringify( report, null, 2 ) ).toBe( true );
	expect( report.contentCentered, JSON.stringify( report, null, 2 ) ).toBe( true );
	expect( report.contentWidth, JSON.stringify( report, null, 2 ) ).toBeLessThanOrEqual( report.layoutWidth + 2 );
	if ( report.layoutWidth >= 1200 ) {
		expect( report.contentWidth / report.layoutWidth, JSON.stringify( report, null, 2 ) ).toBeGreaterThanOrEqual( 0.75 );
		expect( report.contentWidth / report.layoutWidth, JSON.stringify( report, null, 2 ) ).toBeLessThanOrEqual( 0.85 );
	}
	expect( report.headingInsideContent, JSON.stringify( report, null, 2 ) ).toBe( true );
	expect( report.headingClipped, JSON.stringify( report, null, 2 ) ).toBe( false );
	expect( report.paragraphInsideContent, JSON.stringify( report, null, 2 ) ).toBe( true );
	expect( report.paragraphLeftAligned, JSON.stringify( report, null, 2 ) ).toBe( true );
	expect( report.paragraphWidth, JSON.stringify( report, null, 2 ) ).toBeLessThanOrEqual( Math.min( report.contentWidth, report.contentLimit ) + 2 );
	expect( report.bodySections.length, JSON.stringify( report, null, 2 ) ).toBeGreaterThan( 0 );
	for ( const section of report.bodySections ) {
		const expectedBodyWidth = Math.min( section.wide ? report.wideLimit : report.contentLimit, report.viewportWidth - ( 2 * report.gutter ) );
		expect( section.width, JSON.stringify( report, null, 2 ) ).toBeLessThanOrEqual( expectedBodyWidth + 2 );
		expect(
			Math.abs( ( section.left + section.right ) / 2 - report.viewportWidth / 2 ),
			JSON.stringify( report, null, 2 )
		).toBeLessThanOrEqual( 2 );
	}
}

function expectHeroTreatment( report ) {
	expect( report.imageComplete, JSON.stringify( report, null, 2 ) ).toBe( true );
	expect( report.imageNaturalWidth, JSON.stringify( report, null, 2 ) ).toBeGreaterThan( 0 );
	expect( report.imageNaturalHeight, JSON.stringify( report, null, 2 ) ).toBeGreaterThan( 0 );
	expect( report.isSiteMedia, report.imageSource ).toBe( true );
	expect( report.imageObjectFit, JSON.stringify( report, null, 2 ) ).toBe( 'cover' );
	expect( report.imageFilter, JSON.stringify( report, null, 2 ) ).toContain( 'grayscale(1)' );
	expect( report.gradient, JSON.stringify( report, null, 2 ) ).toContain( 'linear-gradient' );
	expect( report.gradientHasBlue, JSON.stringify( report, null, 2 ) ).toBe( true );
	expect( report.gradientHasRed, JSON.stringify( report, null, 2 ) ).toBe( true );
	expect( report.overlayOpacity, JSON.stringify( report, null, 2 ) ).toBeGreaterThanOrEqual( 0.75 );
	expect( report.borderWidths.every( ( width ) => width === 0 ), JSON.stringify( report, null, 2 ) ).toBe( true );
}

test( 'landing hero is one full-bleed core Cover with clean editable content', async ( { page } ) => {
	const hero = await openHero( page );
	await expect( hero.locator( '.peppermint-image-hero__layout' ) ).toHaveCount( 1 );
	await expect( hero.locator( '.peppermint-image-hero__content' ) ).toHaveCount( 1 );
	await expect( hero.getByRole( 'heading', { level: 1 } ) ).toHaveCount( 1 );
	await expect( hero.locator( '.wp-block-button__link', { hasText: 'Explore the project' } ) ).toHaveCount( 1 );
	await expect( hero.locator( '.eyebrow, .peppermint-signal-hero, .is-style-peppermint-signal-rail' ) ).toHaveCount( 0 );
	await expect( hero ).not.toContainText( 'Project / 001' );

	const report = await heroReport( page );
	expectHeroGeometry( report );
	expectHeroTreatment( report );
} );

test( 'ordinary landing prose retains the reading width beside native wide sections', async ( { page } ) => {
	await openHero( page );
	// Test ordinary prose even when the saved page contains only wide sections.
	await page.locator( heroSelector ).evaluate( ( hero ) => {
		const prose = document.createElement( 'p' );
		prose.textContent = 'An ordinary paragraph keeps the centered reading measure below a full-width hero.';
		hero.after( prose );
	} );
	const report = await heroReport( page );
	expect( report.bodySections.some( ( section ) => ! section.wide ) ).toBe( true );
	expectHeroGeometry( report );
} );

test( 'landing hero remains centered beyond the standard desktop test width', async ( { page }, testInfo ) => {
	test.skip( testInfo.project.name !== 'wide-desktop-chromium', 'One explicit extra-wide regression check is sufficient.' );
	await page.setViewportSize( { width: 1976, height: 1000 } );
	await openHero( page );

	const report = await heroReport( page );
	expectHeroGeometry( report );
	expectHeroTreatment( report );
} );

for ( const scheme of [ 'light', 'dark' ] ) {
	test( `${ scheme } landing hero remains full-width, constrained, and overflow-free`, async ( { page } ) => {
		await openHero( page, scheme );
		await expect( page.locator( 'html' ) ).toHaveAttribute( 'data-peppermint-resolved-scheme', scheme );

		const report = await heroReport( page );
		expectHeroGeometry( report );
		expectHeroTreatment( report );
		expect( report.heroHeight, JSON.stringify( report, null, 2 ) ).toBeGreaterThanOrEqual( 479 );
	} );
}
