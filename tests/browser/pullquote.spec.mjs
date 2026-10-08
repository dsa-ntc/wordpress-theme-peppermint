import { expect, test } from '@playwright/test';

const pullquoteRoute = process.env.PEPPERMINT_PULLQUOTE_TEST_PATH || '/theme-preview-editorial-block-sampler/';

async function open( page, scheme ) {
	await page.addInitScript( ( requestedScheme ) => {
		window.localStorage.setItem( 'peppermint-color-scheme', requestedScheme );
	}, scheme );
	const response = await page.goto( pullquoteRoute, { waitUntil: 'domcontentloaded' } );
	expect( response, `No document response for ${ pullquoteRoute }` ).not.toBeNull();
	expect( response.status(), `Missing editorial sampler at ${ pullquoteRoute }` ).toBe( 200 );
	await page.evaluate( () => document.fonts.ready );
	await page.evaluate( () => new Promise( ( resolve ) => requestAnimationFrame( () => requestAnimationFrame( resolve ) ) ) );
	await expect( page.locator( 'html' ) ).toHaveAttribute( 'data-peppermint-resolved-scheme', scheme );
}

async function report( page ) {
	return page.evaluate( () => {
		const quote = document.querySelector( '.wp-block-quote' );
		const simple = document.querySelector( '.wp-block-pullquote:not(.is-style-peppermint-win95):not(.is-style-peppermint-retro):not(.is-style-peppermint-macos)' );
		const win95 = document.querySelector( '.wp-block-pullquote.is-style-peppermint-win95' );
		const retro = document.querySelector( '.wp-block-pullquote.is-style-peppermint-retro' );
		const macos = document.querySelector( '.wp-block-pullquote.is-style-peppermint-macos' );
		const details = document.querySelector( '.wp-block-details' );
		if ( ! quote || ! simple || ! win95 || ! retro || ! macos || ! details ) {
			return null;
		}

		const colorChannels = ( color ) => ( color.match( /[\d.]+/g ) || [] ).map( Number );
		const luminance = ( color ) => colorChannels( color ).slice( 0, 3 ).map( ( channel ) => channel / 255 ).map( ( channel ) => (
			channel <= 0.04045 ? channel / 12.92 : ( ( channel + 0.055 ) / 1.055 ) ** 2.4
		) ).reduce( ( total, channel, index ) => total + channel * [ 0.2126, 0.7152, 0.0722 ][ index ], 0 );
		const contrast = ( first, second ) => {
			const values = [ luminance( first ), luminance( second ) ].sort( ( a, b ) => b - a );
			return ( values[ 0 ] + 0.05 ) / ( values[ 1 ] + 0.05 );
		};
		const canvas = getComputedStyle( document.body ).backgroundColor;
		const surface = ( element ) => {
			const style = getComputedStyle( element );
			const channels = colorChannels( style.backgroundColor );
			const isTransparent = channels.length > 3 && channels[ 3 ] === 0;
			return {
				background: style.backgroundColor,
				canvasContrast: isTransparent ? 1 : contrast( style.backgroundColor, canvas ),
				clipped: element.scrollWidth > element.clientWidth + 1 || element.scrollHeight > element.clientHeight + 1,
				paddingInlineEnd: Number.parseFloat( style.paddingInlineEnd ),
				paddingTop: Number.parseFloat( style.paddingTop ),
				textContrast: isTransparent ? 1 : contrast( style.color, style.backgroundColor )
			};
		};

		const geometry = ( element ) => {
			const rect = element.getBoundingClientRect();
			const quote = element.querySelector( 'blockquote' ).getBoundingClientRect();
			const style = getComputedStyle( element );
			return {
				background: style.backgroundColor,
				borderBottom: Number.parseFloat( style.borderBottomWidth ),
				borderRight: Number.parseFloat( style.borderRightWidth ),
				clipped: element.scrollWidth > element.clientWidth + 1 || element.scrollHeight > element.clientHeight + 1,
				contained: quote.left >= rect.left - 1 && quote.right <= rect.right + 1 && quote.top >= rect.top - 1 && quote.bottom <= rect.bottom + 1,
				left: rect.left,
				right: rect.right
			};
		};

		const windowGeometry = ( element ) => {
			const before = getComputedStyle( element, '::before' );
			const after = getComputedStyle( element, '::after' );
			const blockquoteElement = element.querySelector( 'blockquote' );
			const citationElement = element.querySelector( 'cite' );
			const paragraphElement = element.querySelector( 'p' );
			const blockquote = getComputedStyle( blockquoteElement );
			const citation = getComputedStyle( citationElement );
			const paragraph = getComputedStyle( paragraphElement );
			return {
				...geometry( element ),
				blockquoteBackground: blockquote.backgroundColor,
				citationContrast: contrast( citation.color, blockquote.backgroundColor ),
				controlBackgroundImage: after.backgroundImage,
				controlContent: after.content,
				outerRadius: Number.parseFloat( getComputedStyle( element ).borderTopLeftRadius ),
				quoteTextContrast: contrast( paragraph.color, blockquote.backgroundColor ),
				titleBackground: before.backgroundColor,
				titleContent: before.content
			};
		};
		const scrollingElement = document.scrollingElement;
		const originalScrollLeft = scrollingElement.scrollLeft;
		scrollingElement.scrollLeft = scrollingElement.scrollWidth;
		const positiveScrollLeft = Math.abs( scrollingElement.scrollLeft );
		scrollingElement.scrollLeft = -scrollingElement.scrollWidth;
		const negativeScrollLeft = Math.abs( scrollingElement.scrollLeft );
		scrollingElement.scrollLeft = originalScrollLeft;
		return {
			documentOverflow: Math.max( positiveScrollLeft, negativeScrollLeft ),
			viewport: {
				bodyScrollWidth: document.body.scrollWidth,
				clientWidth: document.documentElement.clientWidth,
				innerWidth: window.innerWidth,
				rootRectWidth: document.documentElement.getBoundingClientRect().width,
				scrollWidth: document.documentElement.scrollWidth
			},
			overflowing: [ ...document.body.querySelectorAll( '*' ) ].map( ( element ) => {
				const rect = element.getBoundingClientRect();
				return {
					className: typeof element.className === 'string' ? element.className : '',
					left: rect.left,
					right: rect.right,
					tag: element.tagName
				};
			} ).filter( ( element ) => element.left < -1 || element.right > window.innerWidth + 1 ).slice( 0, 12 ),
			details: surface( details ),
			quote: surface( quote ),
			simple: {
				...geometry( simple ),
				...surface( simple )
			},
			win95: windowGeometry( win95 ),
			retro: windowGeometry( retro ),
			macos: windowGeometry( macos )
		};
	} );
}

for ( const scheme of [ 'light', 'dark' ] ) {
	test( `${ scheme } editorial surfaces and optional window pullquotes are distinct, painted, and contained`, async ( { page } ) => {
		await open( page, scheme );
		await expect( page.getByRole( 'heading', { level: 3, name: 'Simple pullquote' } ) ).toHaveCount( 1 );
		await expect( page.getByRole( 'heading', { level: 3, name: 'Windows 95 pullquote' } ) ).toHaveCount( 1 );
		await expect( page.getByRole( 'heading', { level: 3, name: 'Retro DSA pullquote' } ) ).toHaveCount( 1 );
		await expect( page.getByRole( 'heading', { level: 3, name: 'macOS pullquote' } ) ).toHaveCount( 1 );
		await expect( page.locator( '.wp-block-pullquote' ) ).toHaveCount( 4 );

		const result = await report( page );
		expect( result ).not.toBeNull();
		expect( result.documentOverflow, JSON.stringify( result, null, 2 ) ).toBeLessThanOrEqual( 1 );
		for ( const surface of [ result.quote, result.simple, result.details ] ) {
			expect( surface.background, JSON.stringify( result, null, 2 ) ).not.toBe( 'rgba(0, 0, 0, 0)' );
			expect( surface.canvasContrast, JSON.stringify( result, null, 2 ) ).toBeGreaterThan( 1.04 );
			expect( surface.canvasContrast, JSON.stringify( result, null, 2 ) ).toBeLessThan( 1.3 );
			expect( surface.textContrast, JSON.stringify( result, null, 2 ) ).toBeGreaterThanOrEqual( 4.5 );
			expect( surface.clipped, JSON.stringify( result, null, 2 ) ).toBe( false );
			expect( surface.paddingInlineEnd, JSON.stringify( result, null, 2 ) ).toBeGreaterThan( 0 );
			expect( surface.paddingTop, JSON.stringify( result, null, 2 ) ).toBeGreaterThan( 0 );
		}
		expect( result.simple.clipped, JSON.stringify( result, null, 2 ) ).toBe( false );
		for ( const window of [ result.win95, result.retro, result.macos ] ) {
			expect( window.clipped, JSON.stringify( result, null, 2 ) ).toBe( false );
			expect( window.contained, JSON.stringify( result, null, 2 ) ).toBe( true );
			expect( window.borderBottom, JSON.stringify( result, null, 2 ) ).toBeGreaterThanOrEqual( 1 );
			expect( window.borderRight, JSON.stringify( result, null, 2 ) ).toBeGreaterThanOrEqual( 1 );
			expect( [ '""', 'none' ], JSON.stringify( result, null, 2 ) ).toContain( window.titleContent );
			expect( [ '""', 'none' ], JSON.stringify( result, null, 2 ) ).toContain( window.controlContent );
			expect( window.controlBackgroundImage, JSON.stringify( result, null, 2 ) ).not.toBe( 'none' );
			expect( window.titleBackground, JSON.stringify( result, null, 2 ) ).not.toBe( 'rgba(0, 0, 0, 0)' );
			expect( window.blockquoteBackground, JSON.stringify( result, null, 2 ) ).not.toBe( 'rgba(0, 0, 0, 0)' );
			expect( window.quoteTextContrast, JSON.stringify( result, null, 2 ) ).toBeGreaterThanOrEqual( 4.5 );
			expect( window.citationContrast, JSON.stringify( result, null, 2 ) ).toBeGreaterThanOrEqual( 4.5 );
		}
		expect( result.win95.borderBottom, JSON.stringify( result, null, 2 ) ).toBeGreaterThanOrEqual( 2 );
		expect( result.retro.borderBottom, JSON.stringify( result, null, 2 ) ).toBeGreaterThanOrEqual( 2 );
		expect( result.macos.outerRadius, JSON.stringify( result, null, 2 ) ).toBeGreaterThanOrEqual( 8 );
	} );
}

test( 'editorial blocks survive RTL, long translations, long citations, and 200 percent text without clipping', async ( { page } ) => {
	await open( page, 'dark' );
	await page.locator( '.wp-block-quote, .wp-block-pullquote, .wp-block-details' ).evaluateAll( ( blocks ) => {
		document.documentElement.dir = 'rtl';
		for ( const block of blocks ) {
			const paragraph = block.querySelector( 'p' );
			if ( paragraph ) {
				paragraph.textContent = 'واجهة متينة تحافظ على وضوح المحتوى المترجم と非常に長い翻訳テキスト extraordinarilylongunbrokeninfrastructureterminology даже при увеличении шрифта.';
			}
			const citation = block.querySelector( 'cite' );
			if ( citation ) {
				citation.textContent = 'مجموعة التقنية وإمكانية الوصول المجتمعية الدولية — International community technology and accessibility working group';
			}
			const summary = block.querySelector( 'summary' );
			if ( summary ) {
				summary.textContent = 'Read an extraordinarilylongunbrokensummary from the implementation and accessibility working group';
				block.open = true;
			}
		}
		document.documentElement.style.fontSize = '200%';
	} );
	await page.evaluate( () => new Promise( ( resolve ) => requestAnimationFrame( () => requestAnimationFrame( resolve ) ) ) );

	const result = await report( page );
	expect( result ).not.toBeNull();
	await expect( page.locator( 'html' ) ).toHaveAttribute( 'dir', 'rtl' );
	expect( result.documentOverflow, JSON.stringify( result, null, 2 ) ).toBeLessThanOrEqual( 1 );
	expect( result.viewport.scrollWidth, JSON.stringify( result, null, 2 ) ).toBeLessThanOrEqual( result.viewport.clientWidth + 1 );
	expect( result.overflowing, JSON.stringify( result, null, 2 ) ).toEqual( [] );
	expect( result.quote.clipped, JSON.stringify( result, null, 2 ) ).toBe( false );
	expect( result.details.clipped, JSON.stringify( result, null, 2 ) ).toBe( false );
	expect( result.simple.clipped, JSON.stringify( result, null, 2 ) ).toBe( false );
	for ( const window of [ result.win95, result.retro, result.macos ] ) {
		expect( window.clipped, JSON.stringify( result, null, 2 ) ).toBe( false );
		expect( window.contained, JSON.stringify( result, null, 2 ) ).toBe( true );
	}
} );

test( 'editorial surfaces preserve author-selected background colors', async ( { page } ) => {
	await open( page, 'light' );
	const surfaces = page.locator( '.wp-block-quote, .wp-block-pullquote:not(.is-style-peppermint-win95):not(.is-style-peppermint-retro):not(.is-style-peppermint-macos), .wp-block-details' );
	await surfaces.evaluateAll( ( elements ) => {
		for ( const element of elements ) {
			element.classList.add( 'has-background', 'has-dsa-red-background-color' );
		}
	} );
	for ( const surface of await surfaces.all() ) {
		await expect( surface ).toHaveCSS( 'background-color', 'rgb(236, 31, 39)' );
	}

	const framed = page.locator( '.wp-block-pullquote:is(.is-style-peppermint-win95, .is-style-peppermint-retro, .is-style-peppermint-macos)' );
	await framed.evaluateAll( ( elements ) => {
		for ( const element of elements ) {
			element.classList.add( 'has-text-color', 'has-dsa-red-color' );
		}
	} );
	for ( const frame of await framed.all() ) {
		await expect( frame.locator( 'blockquote' ) ).toHaveCSS( 'color', 'rgb(236, 31, 39)' );
		await expect( frame.locator( 'cite' ) ).toHaveCSS( 'color', 'rgb(236, 31, 39)' );
	}
} );

test( 'forced colors retain every window frame and decorative control', async ( { page }, testInfo ) => {
	test.skip(
		! [ 'small-phone-chromium', 'wide-desktop-chromium' ].includes( testInfo.project.name ),
		'Forced-colors coverage is concentrated at the smallest and widest viewports.'
	);
	await page.emulateMedia( { colorScheme: 'dark', forcedColors: 'active' } );
	const response = await page.goto( pullquoteRoute, { waitUntil: 'domcontentloaded' } );
	expect( response.status() ).toBe( 200 );
	await page.evaluate( () => document.fonts.ready );
	expect( await page.evaluate( () => matchMedia( '(forced-colors: active)' ).matches ) ).toBe( true );

	const windows = page.locator( '.wp-block-pullquote:is(.is-style-peppermint-win95, .is-style-peppermint-retro, .is-style-peppermint-macos)' );
	await expect( windows ).toHaveCount( 3 );
	const forcedWindows = await windows.evaluateAll( ( quotes ) => quotes.map( ( quote ) => {
		const style = getComputedStyle( quote );
		const title = getComputedStyle( quote, '::before' );
		const control = getComputedStyle( quote, '::after' );
		return {
			bottom: Number.parseFloat( style.borderBottomWidth ),
			controlBackgroundImage: control.backgroundImage,
			right: Number.parseFloat( style.borderRightWidth ),
			titleBackground: title.backgroundColor
		};
	} ) );
	const forced = await page.locator( 'body' ).evaluate( () => {
		const inlineQuote = getComputedStyle( document.querySelector( '.wp-block-quote' ) );
		const details = getComputedStyle( document.querySelector( '.wp-block-details' ) );
		return {
			detailsBackground: details.backgroundColor,
			detailsBorder: Number.parseFloat( details.borderTopWidth ),
			quoteBackground: inlineQuote.backgroundColor,
			quoteBorder: Number.parseFloat( inlineQuote.borderInlineStartWidth )
		};
	} );
	for ( const window of forcedWindows ) {
		expect( window.bottom, JSON.stringify( forcedWindows ) ).toBeGreaterThanOrEqual( 1 );
		expect( window.right, JSON.stringify( forcedWindows ) ).toBeGreaterThanOrEqual( 1 );
		expect( window.titleBackground, JSON.stringify( forcedWindows ) ).not.toBe( 'rgba(0, 0, 0, 0)' );
		expect( window.controlBackgroundImage, JSON.stringify( forcedWindows ) ).not.toBe( 'none' );
	}
	expect( forced.quoteBackground, JSON.stringify( forced ) ).not.toBe( 'rgba(0, 0, 0, 0)' );
	expect( forced.detailsBackground, JSON.stringify( forced ) ).not.toBe( 'rgba(0, 0, 0, 0)' );
	expect( forced.quoteBorder, JSON.stringify( forced ) ).toBeGreaterThan( 0 );
	expect( forced.detailsBorder, JSON.stringify( forced ) ).toBeGreaterThan( 0 );
} );
