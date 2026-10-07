import { expect, test } from '@playwright/test';

const cardRoute = process.env.NTC_CARD_TEST_PATH || '/';
const cardSelector = '.subcommittee-tile';
const titleSelector = '.subcommittee-tile__title';
const frameStyles = [ 'ntc-red-tile', 'ntc-win95', 'ntc-retro', 'ntc-macos' ];
const longTitle = [
	'Accessible technology and collaborative organizing for every chapter:',
	'international solidarity, member services, democratic participation, shared infrastructure,',
	'open source projects, and community support.',
	'Building reliable, inclusive tools together so that volunteers can share knowledge,',
	'welcome new members, maintain local websites, and participate in decisions across the organization.'
].join( ' ' );

async function settleLayout( page ) {
	await page.evaluate( () => new Promise( ( resolve ) => requestAnimationFrame( () => requestAnimationFrame( resolve ) ) ) );
}

// Test every frame on saved Cover markup in memory. No database fixtures or
// public pages showing every style are needed.
async function setFrameStyle( page, style ) {
	await page.locator( cardSelector ).evaluateAll( ( cards, requestedStyle ) => {
		for ( const card of cards ) {
			card.classList.remove( 'is-style-ntc-red-tile', 'is-style-ntc-win95', 'is-style-ntc-retro', 'is-style-ntc-macos' );
			card.classList.add( `is-style-${ requestedStyle }` );
		}
	}, style );
	await settleLayout( page );
}

async function openCards( page ) {
	const response = await page.goto( cardRoute, { waitUntil: 'domcontentloaded' } );
	expect( response, `No document response for ${ cardRoute }` ).not.toBeNull();
	expect( response.status(), `Missing or unexpected card fixture at ${ cardRoute }` ).toBe( 200 );
	const cards = page.locator( cardSelector );
	await expect( cards.first() ).toBeVisible( { timeout: 10_000 } );
	expect( await cards.count(), `${ cardRoute } needs at least three test cards` ).toBeGreaterThanOrEqual( 3 );
	await page.evaluate( () => document.fonts.ready );
	await settleLayout( page );
}

async function replaceTitles( page, titles ) {
	await page.locator( `${ cardSelector } ${ titleSelector } a` ).evaluateAll( ( links, replacements ) => {
		replacements.forEach( ( replacement, index ) => {
			links[ index ].textContent = replacement;
		} );
	}, titles );
	await settleLayout( page );
}

async function measureTitles( page, count = 3 ) {
	return page.locator( cardSelector ).evaluateAll( ( cards, requestedCount ) => cards.slice( 0, requestedCount ).map( ( card ) => {
		const title = card.querySelector( '.subcommittee-tile__title' );
		const link = title.querySelector( 'a' );
		const cardRect = card.getBoundingClientRect();
		const titleRect = title.getBoundingClientRect();
		const titleStyle = getComputedStyle( title );
		const media = card.querySelector( '.wp-block-cover__background' );
		const mediaRect = media.getBoundingClientRect();
		const imageRect = card.querySelector( '.wp-block-cover__image-background' ).getBoundingClientRect();
		const iconRect = card.querySelector( '.subcommittee-tile__icon img' )?.getBoundingClientRect();
		const range = document.createRange();
		range.selectNodeContents( link );
		const textRect = range.getBoundingClientRect();
		const clipsVertically = [ 'clip', 'hidden' ].includes( titleStyle.overflowY );

		return {
			cardHeight: cardRect.height,
			fontSize: Number.parseFloat( getComputedStyle( title ).fontSize ),
			imageOverlayDelta: Math.max( ...[ 'top', 'right', 'bottom', 'left' ].map( ( edge ) => Math.abs( mediaRect[ edge ] - imageRect[ edge ] ) ) ),
			lineCount: range.getClientRects().length,
			mediaInsets: {
				bottom: cardRect.bottom - mediaRect.bottom,
				left: mediaRect.left - cardRect.left,
				right: cardRect.right - mediaRect.right,
				top: mediaRect.top - cardRect.top
			},
			text: link.textContent.trim(),
			titleShare: titleRect.height / cardRect.height,
			withinMedia: textRect.left >= mediaRect.left - 1
				&& textRect.right <= mediaRect.right + 1
				&& textRect.top >= mediaRect.top - 1
				&& textRect.bottom <= mediaRect.bottom + 1
				&& ( ! iconRect || ( iconRect.top >= mediaRect.top - 1
					&& iconRect.bottom <= textRect.top + 1
					&& iconRect.left >= mediaRect.left - 1
					&& iconRect.right <= mediaRect.right + 1 ) ),
			withinCard: textRect.left >= cardRect.left - 1
				&& textRect.right <= cardRect.right + 1
				&& textRect.top >= cardRect.top - 1
				&& textRect.bottom <= cardRect.bottom + 1,
			withoutInternalOverflow: title.scrollWidth <= title.clientWidth + 1
				&& ( ! clipsVertically || title.scrollHeight <= title.clientHeight + 1 )
		};
	} ), count );
}

function expectNoTitleLoss( metrics ) {
	for ( const metric of metrics ) {
		expect( metric.withinCard, `${ metric.text } escaped its card` ).toBe( true );
		expect( metric.withoutInternalOverflow, `${ metric.text } was clipped` ).toBe( true );
		expect( metric.fontSize, `${ metric.text } became too small` ).toBeGreaterThanOrEqual( 28 );
	}
}

function expectFrameContentsFit( metrics, style ) {
	expectNoTitleLoss( metrics );
	for ( const metric of metrics ) {
		expect( metric.withinMedia, `${ style }: text or icon overlapped the window chrome: ${ JSON.stringify( metric ) }` ).toBe( true );
		expect( metric.imageOverlayDelta, `${ style }: image and overlay edges diverged` ).toBeLessThanOrEqual( 0.5 );
		if ( style !== 'ntc-red-tile' ) {
			for ( const [ edge, inset ] of Object.entries( metric.mediaInsets ) ) {
				expect( inset, `${ style }: missing ${ edge } frame edge` ).toBeGreaterThanOrEqual( 3 );
			}
		}
	}
}

test.beforeEach( async ( { page } ) => {
	await openCards( page );
} );

test( 'supported single-word titles fit without mid-word wrapping', async ( { page } ) => {
	await replaceTitles( page, [ 'Engagement', 'Formations', 'Engagement' ] );
	const metrics = await measureTitles( page );

	expectNoTitleLoss( metrics );
	for ( const metric of metrics ) {
		expect( metric.lineCount, `${ metric.text } should fit on one line` ).toBe( 1 );
	}
} );

test( 'multi-word titles wrap naturally within the visual target', async ( { page } ) => {
	await replaceTitles( page, [
		'Member Services',
		'Chapter Websites Commission',
		'International Solidarity and Global Organizing'
	] );
	const metrics = await measureTitles( page );

	expectNoTitleLoss( metrics );
	for ( const metric of metrics ) {
		expect( metric.titleShare, `${ metric.text } exceeded 60% at normal text size` ).toBeLessThanOrEqual( 0.6 );
	}
} );

test( 'localized and unbroken titles reflow without clipping', async ( { page } ) => {
	const fixtures = [
		{ lang: 'de', text: 'Donaudampfschifffahrtsgesellschaft' },
		{ lang: 'ja', text: '国際連帯技術委員会' },
		{ dir: 'rtl', lang: 'ar', text: 'لجنة التكنولوجيا الوطنية' }
	];
	await page.locator( `${ cardSelector } ${ titleSelector } a` ).evaluateAll( ( links, replacements ) => {
		replacements.forEach( ( replacement, index ) => {
			links[ index ].textContent = replacement.text;
			links[ index ].lang = replacement.lang;
			if ( replacement.dir ) {
				links[ index ].dir = replacement.dir;
			}
		} );
	}, fixtures );
	await page.evaluate( () => new Promise( ( resolve ) => requestAnimationFrame( () => requestAnimationFrame( resolve ) ) ) );
	const metrics = await measureTitles( page );

	expectNoTitleLoss( metrics );
	expect( metrics.map( ( metric ) => metric.text ) ).toEqual( fixtures.map( ( fixture ) => fixture.text ) );
} );

test( 'every seeded card remains complete at 200% text size', async ( { page } ) => {
	await page.addStyleTag( { content: 'html { font-size: 200% !important; }' } );
	await page.evaluate( () => new Promise( ( resolve ) => requestAnimationFrame( () => requestAnimationFrame( resolve ) ) ) );
	const count = await page.locator( cardSelector ).count();
	const metrics = await measureTitles( page, count );

	expectNoTitleLoss( metrics );
} );

test( 'titles tolerate WCAG text-spacing overrides', async ( { page } ) => {
	await page.addStyleTag( {
		content: `${ titleSelector } {
			letter-spacing: 0.12em !important;
			line-height: 1.5 !important;
			word-spacing: 0.16em !important;
		}`
	} );
	await page.evaluate( () => new Promise( ( resolve ) => requestAnimationFrame( () => requestAnimationFrame( resolve ) ) ) );
	const metrics = await measureTitles( page );

	expectNoTitleLoss( metrics );
} );

for ( const style of frameStyles ) {
	test( `${ style }: long multiword titles grow the card without shrinking type`, async ( { page } ) => {
		await setFrameStyle( page, style );
		const before = await measureTitles( page );
		await replaceTitles( page, [ longTitle, longTitle, longTitle ] );
		const after = await measureTitles( page );

		expectFrameContentsFit( after, style );
		for ( let index = 0; index < after.length; index++ ) {
			expect( after[ index ].cardHeight, `${ style }: long content did not increase card height` ).toBeGreaterThan( before[ index ].cardHeight + 1 );
			expect( after[ index ].fontSize, `${ style }: long content reduced its font size` ).toBeCloseTo( before[ index ].fontSize, 1 );
		}
	} );

	test( `${ style }: translated titles tolerate doubled text and expanded spacing`, async ( { page } ) => {
		await setFrameStyle( page, style );
		await replaceTitles( page, [
			'International Solidarity and Collaborative Organizing for Every Community',
			'Gemeinsam für barrierefreie Technologie und demokratische Zusammenarbeit in allen Ortsgruppen',
			'التكنولوجيا المتاحة للجميع والتعاون والتضامن الدولي لدعم جميع الأعضاء والمجتمعات المحلية'
		] );
		const before = await measureTitles( page );
		await page.locator( `${ cardSelector } ${ titleSelector }` ).evaluateAll( ( titles ) => {
			titles.slice( 0, 3 ).forEach( ( title, index ) => {
				title.style.setProperty( 'font-size', `${ Number.parseFloat( getComputedStyle( title ).fontSize ) * 2 }px`, 'important' );
				title.lang = [ 'en', 'de', 'ar' ][ index ];
				if ( index === 2 ) {
					title.closest( '.subcommittee-tile' ).dir = 'rtl';
				}
			} );
		} );
		await page.addStyleTag( {
			content: `${ titleSelector } {
				letter-spacing: 0.12em !important;
				line-height: 1.5 !important;
				word-spacing: 0.16em !important;
			}`
		} );
		await settleLayout( page );
		const after = await measureTitles( page );

		expectFrameContentsFit( after, style );
		for ( let index = 0; index < after.length; index++ ) {
			expect( after[ index ].fontSize ).toBeCloseTo( before[ index ].fontSize * 2, 1 );
		}
	} );

	test( `${ style }: minimum height remains editable and the whole card stays linked`, async ( { page } ) => {
		await setFrameStyle( page, style );
		await replaceTitles( page, [ 'Engagement', 'Formations', 'Member Services' ] );
		const card = page.locator( cardSelector ).first();
		await card.evaluate( ( element ) => { element.style.minHeight = '540px'; } );
		await settleLayout( page );
		expect( ( await card.boundingBox() ).height ).toBeCloseTo( 540, 0 );
		await card.scrollIntoViewIfNeeded();
		const targets = await card.evaluate( ( element ) => {
			const rect = element.getBoundingClientRect();
			const link = element.querySelector( '.subcommittee-tile__title a' );
			const points = [ [ 4, 4 ], [ rect.width - 4, 4 ], [ 4, rect.height - 4 ], [ rect.width - 4, rect.height - 4 ], [ rect.width / 2, rect.height / 2 ] ];
			return points.map( ( [ x, y ] ) => {
				const target = document.elementFromPoint( rect.left + x, rect.top + y );
				return target === link || link.contains( target );
			} );
		} );
		expect( targets, `${ style }: corners or center lost their title link` ).toEqual( [ true, true, true, true, true ] );
		await page.emulateMedia( { forcedColors: 'active' } );
		await card.locator( `${ titleSelector } a` ).focus();
		const focusStyle = await card.evaluate( ( element ) => ( {
			outlineStyle: getComputedStyle( element ).outlineStyle,
			outlineWidth: Number.parseFloat( getComputedStyle( element ).outlineWidth )
		} ) );
		expect( focusStyle.outlineStyle ).toBe( 'solid' );
		expect( focusStyle.outlineWidth ).toBeGreaterThanOrEqual( 3 );
		expectFrameContentsFit( await measureTitles( page ), style );
	} );
}

test( 'hover and keyboard focus preserve image geometry', async ( { page } ) => {
	const cards = page.locator( cardSelector );
	const count = await cards.count();
	const measureImage = ( image ) => image.evaluate( ( element ) => {
		const card = element.closest( '.subcommittee-tile' );
		const cardRect = card.getBoundingClientRect();
		const imageRect = element.getBoundingClientRect();

		return {
			height: imageRect.height,
			left: imageRect.left - cardRect.left,
			top: imageRect.top - cardRect.top,
			width: imageRect.width
		};
	} );

	for ( let index = 0; index < count; index++ ) {
		const card = cards.nth( index );
		const image = card.locator( '.wp-block-cover__image-background' );
		const link = card.locator( `${ titleSelector } a` );
		const before = await measureImage( image );

		expect( before ).not.toBeNull();
		await card.hover();
		await expect.poll( () => image.evaluate( ( element ) => getComputedStyle( element ).filter ) ).toContain( 'brightness(0.68)' );
		await settleLayout( page );
		const afterHover = await measureImage( image );
		const isHovered = await card.evaluate( ( element ) => element.matches( ':hover' ) );
		const hoverFilter = await image.evaluate( ( element ) => getComputedStyle( element ).filter );

		expect( afterHover ).not.toBeNull();
		expect( isHovered, `Card ${ index + 1 } did not retain its hover state` ).toBe( true );
		expect( Math.abs( afterHover.left - before.left ) ).toBeLessThanOrEqual( 0.5 );
		expect( Math.abs( afterHover.top - before.top ) ).toBeLessThanOrEqual( 0.5 );
		expect( Math.abs( afterHover.width - before.width ) ).toBeLessThanOrEqual( 0.5 );
		expect( Math.abs( afterHover.height - before.height ) ).toBeLessThanOrEqual( 0.5 );
		expect( hoverFilter ).toContain( 'brightness(0.68)' );

		await page.mouse.move( 0, 0 );
		await expect.poll( () => card.evaluate( ( element ) => element.matches( ':hover' ) ) ).toBe( false );
		await link.focus();
		await expect( link ).toBeFocused();
		await expect.poll( () => image.evaluate( ( element ) => getComputedStyle( element ).filter ) ).toContain( 'brightness(0.68)' );
		await settleLayout( page );
		const afterFocus = await measureImage( image );

		expect( afterFocus ).not.toBeNull();
		expect( Math.abs( afterFocus.left - before.left ) ).toBeLessThanOrEqual( 0.5 );
		expect( Math.abs( afterFocus.top - before.top ) ).toBeLessThanOrEqual( 0.5 );
		expect( Math.abs( afterFocus.width - before.width ) ).toBeLessThanOrEqual( 0.5 );
		expect( Math.abs( afterFocus.height - before.height ) ).toBeLessThanOrEqual( 0.5 );
	}
} );

test( 'window title bars repeat each framed tile heading and truncate long names', async ( { page } ) => {
	const tiles = await page.locator( cardSelector ).evaluateAll( ( cards ) => cards.map( ( card ) => {
		const bar = getComputedStyle( card, '::before' );
		return {
			bar: { overflow: bar.overflow, textOverflow: bar.textOverflow, whiteSpace: bar.whiteSpace },
			content: bar.content,
			framed: /\bis-style-ntc-(win95|retro|macos)\b/.test( card.className ),
			heading: card.querySelector( '.subcommittee-tile__title' ).textContent.replace( /\s+/g, ' ' ).trim(),
			title: card.getAttribute( 'data-ntc-window-title' )
		};
	} ) );

	expect( tiles.some( ( tile ) => tile.framed ), `${ cardRoute } needs at least one framed tile` ).toBe( true );
	for ( const tile of tiles ) {
		expect( tile.title, `${ tile.heading }: only framed tiles carry a title` ).toBe( tile.framed ? tile.heading : null );
		if ( tile.framed ) {
			expect( tile.content, `${ tile.heading }: the title bar shows the heading as decorative text` ).toBe( `${ JSON.stringify( tile.heading ) } / ""` );
			expect( tile.bar ).toEqual( { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } );
		}
	}
} );
