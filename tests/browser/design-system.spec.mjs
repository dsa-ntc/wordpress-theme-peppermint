import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';

const theme = JSON.parse( readFileSync( new URL( '../../theme.json', import.meta.url ), 'utf8' ) );

async function open( page, path ) {
	const response = await page.goto( path, { waitUntil: 'domcontentloaded' } );
	expect( response.status() ).toBe( 200 );
	await page.evaluate( () => document.fonts.ready );
}

test( 'rendered spacing and type honor the theme preset definitions', async ( { page } ) => {
	await open( page, '/theme-preview/landing-hero/' );
	const report = await page.evaluate( ( settings ) => {
		const probe = document.createElement( 'span' );
		probe.style.cssText = 'position:fixed;visibility:hidden;display:block;padding:0;border:0;height:0;';
		document.body.append( probe );
		const width = ( value ) => { probe.style.width = value; return probe.getBoundingClientRect().width; };
		const spacing = settings.spacing.spacingSizes.map( ( preset ) => ( {
			slug: preset.slug,
			expected: width( preset.size ),
			actual: width( `var(--wp--preset--spacing--${ preset.slug })` )
		} ) );
		const type = settings.typography.fontSizes.map( ( preset ) => {
			probe.style.fontSize = `var(--wp--preset--font-size--${ preset.slug })`;
			return {
				slug: preset.slug,
				actual: Number.parseFloat( getComputedStyle( probe ).fontSize ),
				min: width( preset.fluid?.min || preset.size ),
				max: width( preset.fluid?.max || preset.size )
			};
		} );
		probe.remove();
		return { spacing, type };
	}, theme.settings );
	for ( const preset of report.spacing ) {
		expect( preset.actual, JSON.stringify( preset ) ).toBeCloseTo( preset.expected, 1 );
	}
	for ( const preset of report.type ) {
		expect( preset.actual, JSON.stringify( preset ) ).toBeGreaterThanOrEqual( preset.min - 0.1 );
		expect( preset.actual, JSON.stringify( preset ) ).toBeLessThanOrEqual( preset.max + 0.1 );
	}
} );

test( 'default section and Query headings do not orphan letters in the reviewed words', async ( { page } ) => {
	await open( page, '/' );
	for ( const word of [ 'Subcommittees', 'Internationalization' ] ) {
		const heading = page.getByRole( 'heading', { name: word, exact: true } );
		await expect( heading ).toHaveCount( 1 );
		const report = await heading.evaluate( ( element ) => {
			const walker = document.createTreeWalker( element, NodeFilter.SHOW_TEXT );
			const lines = new Map();
			let node;
			while ( ( node = walker.nextNode() ) ) {
				for ( let index = 0; index < node.length; index += 1 ) {
					if ( /\s/.test( node.textContent[ index ] ) ) { continue; }
					const range = document.createRange();
					range.setStart( node, index );
					range.setEnd( node, index + 1 );
					const top = Math.round( range.getBoundingClientRect().top );
					lines.set( top, ( lines.get( top ) || '' ) + node.textContent[ index ] );
				}
			}
			return { text: element.textContent, width: element.clientWidth, size: getComputedStyle( element ).fontSize, lines: [ ...lines.values() ] };
		} );
		expect( report.lines, JSON.stringify( report ) ).toEqual( [ word ] );
	}
} );

test( 'Query typography still accepts a different native preset and a custom size', async ( { page } ) => {
	await open( page, '/' );
	const report = await page.locator( '.project-grid .wp-block-post-title' ).first().evaluate( ( heading ) => {
		heading.className = heading.className.replace( /has-[\w-]+-font-size/g, '' );
		heading.classList.add( 'has-large-font-size' );
		const probe = document.createElement( 'span' );
		probe.className = 'has-large-font-size';
		heading.after( probe );
		const preset = { actual: getComputedStyle( heading ).fontSize, expected: getComputedStyle( probe ).fontSize };
		probe.remove();
		heading.classList.remove( 'has-large-font-size' );
		heading.style.fontSize = '47px';
		return { preset, custom: getComputedStyle( heading ).fontSize };
	} );
	expect( report.preset.actual ).toBe( report.preset.expected );
	expect( report.custom ).toBe( '47px' );
} );

test( 'section labels, headings, and prose share the constrained alignment', async ( { page } ) => {
	await open( page, '/theme-preview/section-styles/' );
	const report = await page.locator( '.ntc-signal-hero' ).evaluate( ( group ) => {
		return [ ...group.children ].filter( ( child ) => child.matches( 'p,h2' ) )
			.map( ( child ) => ( { text: child.textContent, left: child.getBoundingClientRect().left } ) );
	} );
	expect( report.length ).toBeGreaterThanOrEqual( 3 );
	for ( const child of report ) {
		expect( Math.abs( child.left - report[ 0 ].left ), JSON.stringify( report ) ).toBeLessThanOrEqual( 2 );
	}
} );

test( 'image action body starts at its own padding, not a prose heading margin', async ( { page } ) => {
	await open( page, '/theme-preview/cards-and-frames/' );
	const report = await page.locator( '.ntc-media-action-card__body' ).first().evaluate( ( body ) => {
		const heading = body.querySelector( 'h2,h3' );
		const image = body.previousElementSibling;
		return {
			beforeBody: body.getBoundingClientRect().top - image.getBoundingClientRect().bottom,
			topGap: heading.getBoundingClientRect().top - body.getBoundingClientRect().top,
			padding: Number.parseFloat( getComputedStyle( body ).paddingTop )
		};
	} );
	expect( report.beforeBody, JSON.stringify( report ) ).toBeLessThanOrEqual( 1 );
	expect( report.topGap, JSON.stringify( report ) ).toBeCloseTo( report.padding, 0 );
} );

test( 'native custom padding and heading margins remain editable inside a card', async ( { page } ) => {
	await open( page, '/theme-preview/cards-and-frames/' );
	const report = await page.locator( '.ntc-media-action-card__body' ).first().evaluate( ( body ) => {
		body.style.paddingTop = '48px';
		const heading = body.querySelector( 'h2,h3' );
		heading.style.marginTop = '36px';
		return { gap: heading.getBoundingClientRect().top - body.getBoundingClientRect().top };
	} );
	expect( report.gap, JSON.stringify( report ) ).toBeCloseTo( 84, 0 );
} );

test( 'real contained-media examples retain tiny images at their intrinsic size', async ( { page } ) => {
	await open( page, '/theme-preview/cards-and-frames/' );
	const media = page.locator( '.ntc-contained-media-preview img' );
	await expect( media ).toHaveCount( 3 );
	for ( const img of await media.all() ) {
		await img.scrollIntoViewIfNeeded();
		await expect.poll( () => img.evaluate( ( node ) => node.complete && node.naturalWidth > 0 ) ).toBe( true );
	}
	const report = await media.evaluateAll( ( images ) => images.filter( ( img ) => img.naturalWidth === 48 ).map( ( img ) => ( {
		width: img.getBoundingClientRect().width,
		height: img.getBoundingClientRect().height,
		fit: getComputedStyle( img ).objectFit
	} ) ) );
	expect( report ).toHaveLength( 2 );
	for ( const img of report ) {
		expect( img.width ).toBeLessThanOrEqual( 48 );
		expect( img.height ).toBeLessThanOrEqual( 48 );
		expect( img.fit ).toBe( 'scale-down' );
	}
} );

test( 'partner cells stretch together even when one name takes several lines', async ( { page } ) => {
	await open( page, '/theme-preview/text-intro/' );
	await page.locator( '.ntc-pattern-partner-grid__item' ).first().evaluate( ( item ) => {
		item.querySelector( 'p' ).textContent = 'A much longer translated name for the community technology and infrastructure working group';
	} );
	const report = await page.locator( '.ntc-pattern-partner-grid' ).evaluate( ( section ) => {
		return [ ...section.querySelectorAll( '.wp-block-columns' ) ].flatMap( ( row ) => {
			const cells = [ ...row.querySelectorAll( '.ntc-pattern-partner-grid__item' ) ];
			const first = cells[ 0 ]?.getBoundingClientRect();
			return cells.map( ( cell ) => {
				const rect = cell.getBoundingClientRect();
				return { sameRow: Math.abs( rect.top - first.top ) < 2, height: rect.height, firstHeight: first.height };
			} );
		} );
	} );
	expect( report ).toHaveLength( 6 );
	for ( const cell of report.filter( ( cell ) => cell.sameRow ) ) {
		expect( cell.height, JSON.stringify( report ) ).toBeCloseTo( cell.firstHeight, 0 );
	}
} );

test( 'adding a block after a partner card keeps the Column vertical and full width', async ( { page } ) => {
	await open( page, '/theme-preview/text-intro/' );
	const report = await page.locator( '.ntc-pattern-partner-grid__item' ).first().evaluate( ( item ) => {
		const paragraph = document.createElement( 'p' );
		paragraph.textContent = 'An editor-added note belongs below this card, not beside it.';
		item.after( paragraph );
		const card = item.getBoundingClientRect();
		const note = paragraph.getBoundingClientRect();
		const column = item.parentElement.getBoundingClientRect();
		return { cardBottom: card.bottom, noteTop: note.top, width: card.width, columnWidth: column.width };
	} );
	expect( report.noteTop, JSON.stringify( report ) ).toBeGreaterThanOrEqual( report.cardBottom - 1 );
	expect( report.width, JSON.stringify( report ) ).toBeCloseTo( report.columnWidth, 0 );
} );

test( 'query cards stay within narrow parent grids and use the document reading order', async ( { page } ) => {
	await open( page, '/category/blog/' );
	await page.addStyleTag( { content: '.project-grid .wp-block-query { max-inline-size: 273px !important; }' } );
	const report = await page.locator( '.project-grid .wp-block-post-template' ).evaluateAll( ( grids ) => grids.flatMap( ( grid ) => {
		const rect = grid.getBoundingClientRect();
		return [ ...grid.children ].map( ( card ) => ( {
			left: card.getBoundingClientRect().left - rect.left,
			right: card.getBoundingClientRect().right - rect.right,
			orders: [ ...card.children ].map( ( child ) => getComputedStyle( child ).order )
		} ) );
	} ) );
	expect( report.length ).toBeGreaterThan( 0 );
	for ( const card of report ) {
		expect( card.left, JSON.stringify( report ) ).toBeGreaterThanOrEqual( -1 );
		expect( card.right, JSON.stringify( report ) ).toBeLessThanOrEqual( 1 );
		expect( new Set( card.orders ).size, 'Do not visually reorder editable blocks.' ).toBeLessThanOrEqual( 1 );
	}
} );

test( 'OpenSlides cards reflow and images never cover their preceding content', async ( { page } ) => {
	await open( page, '/openslides/' );
	const report = await page.locator( '.legacy-feature-card' ).evaluateAll( ( cards ) => cards.map( ( card ) => {
		const parent = card.closest( '.wp-block-columns' );
		const width = card.getBoundingClientRect().width;
		return {
			width,
			available: parent.getBoundingClientRect().width,
			overlaps: [ ...card.querySelectorAll( '.wp-block-image' ) ].some( ( figure ) => figure.previousElementSibling && figure.getBoundingClientRect().top < figure.previousElementSibling.getBoundingClientRect().bottom - 1 )
		};
	} ) );
	expect( report ).toHaveLength( 6 );
	for ( const card of report ) {
		expect( card.width, JSON.stringify( report ) ).toBeGreaterThanOrEqual( Math.min( card.available, 200 ) - 2 );
		expect( card.overlaps, JSON.stringify( report ) ).toBe( false );
	}
} );

test( 'search empty state keeps the heading and form reading measure', async ( { page } ) => {
	await page.goto( '/?s=ntc-no-results-7cf64b', { waitUntil: 'domcontentloaded' } );
	const report = await page.evaluate( () => {
		const heading = document.querySelector( 'main .wp-block-query-title' ).getBoundingClientRect();
		const message = document.querySelector( 'main .wp-block-query-no-results' ).getBoundingClientRect();
		return { heading: heading.left, message: message.left, width: message.width, headingWidth: heading.width };
	} );
	expect( Math.abs( report.heading - report.message ), JSON.stringify( report ) ).toBeLessThanOrEqual( 2 );
	expect( report.width ).toBeLessThanOrEqual( report.headingWidth + 2 );
} );

for ( const scheme of [ 'light', 'dark' ] ) {
	test( `${ scheme }: optional font failure leaves homepage and hero text readable`, async ( { page } ) => {
		const blockedFonts = [];
		await page.route( '**/*', ( route ) => {
			if ( route.request().resourceType() === 'font' ) {
				blockedFonts.push( route.request().url() );
				return route.abort( 'failed' );
			}
			return route.continue();
		} );
		await page.addInitScript( ( requestedScheme ) => localStorage.setItem( 'ntc-color-scheme', requestedScheme ), scheme );
		const session = await page.context().newCDPSession( page );
		await session.send( 'DOM.enable' );
		await session.send( 'CSS.enable' );
		try {
			for ( const path of [ '/', '/theme-preview/landing-hero/' ] ) {
				await open( page, path );
				await expect( page.locator( 'html' ) ).toHaveAttribute( 'data-ntc-resolved-scheme', scheme );
				const selectors = path === '/'
					? [ '.subcommittee-tile__title', '.project-grid .wp-block-post-title' ]
					: [ '.ntc-image-hero h1' ];
				const report = await page.evaluate( ( selectors ) => ( {
					overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
					webFonts: [ ...document.fonts ].map( ( font ) => ( { family: font.family, status: font.status } ) ),
					headings: [ ...document.querySelectorAll( selectors.join( ',' ) ) ].map( ( heading ) => {
						const style = getComputedStyle( heading );
						const container = heading.closest( '.subcommittee-tile, .wp-block-post, .ntc-image-hero' ).getBoundingClientRect();
						const range = document.createRange();
						range.selectNodeContents( heading.querySelector( 'a' ) || heading );
						const rects = [ ...range.getClientRects() ].filter( ( rect ) => rect.width && rect.height );
						const text = heading.textContent.trim();
						const lines = new Set( rects.map( ( rect ) => Math.round( rect.top ) ) );
						return {
							text,
							fontFamily: style.fontFamily,
							opacity: Number.parseFloat( style.opacity ),
							visibleColor: style.color !== 'transparent' && ! /rgba\([^)]*,\s*0\)$/.test( style.color ),
							paintedText: rects.length > 0,
							withinContainer: rects.every( ( rect ) => rect.left >= container.left - 1 && rect.right <= container.right + 1 && rect.top >= container.top - 1 && rect.bottom <= container.bottom + 1 ),
							withoutInternalOverflow: heading.scrollWidth <= heading.clientWidth + 1 && ( ! [ 'hidden', 'clip' ].includes( style.overflowY ) || heading.scrollHeight <= heading.clientHeight + 1 ),
							singleWordCardFits: ! heading.matches( '.subcommittee-tile__title' ) || /\s/.test( text ) || lines.size === 1
						};
					} )
				} ), selectors );
				expect( report.overflow, `${ path } must not overflow when optional fonts fail.` ).toBeLessThanOrEqual( 1 );
				expect( report.webFonts.filter( ( font ) => font.status === 'loaded' ), 'No network font may mask a broken fallback.' ).toEqual( [] );
				if ( report.webFonts.length ) {
					expect( blockedFonts.length, 'Exercise font failure when this site configures optional web fonts.' ).toBeGreaterThan( 0 );
				}
				expect( report.headings.length ).toBeGreaterThan( 0 );
				for ( const heading of report.headings ) {
					expect( heading, JSON.stringify( heading ) ).toMatchObject( { visibleColor: true, paintedText: true, withinContainer: true, withoutInternalOverflow: true, singleWordCardFits: true } );
					expect( heading.opacity ).toBeGreaterThan( 0 );
					expect( heading.fontFamily ).toMatch( /Arial|Helvetica|sans-serif/i );
				}
				// Computed font-family lists requested faces, not the one that painted.
				// Chromium reports the actual platform faces used for visible glyphs.
				const { root } = await session.send( 'DOM.getDocument' );
				for ( const selector of selectors ) {
					await expect( page.locator( selector ).first() ).toBeVisible();
					const { nodeId } = await session.send( 'DOM.querySelector', { nodeId: root.nodeId, selector } );
					const { fonts } = await session.send( 'CSS.getPlatformFontsForNode', { nodeId } );
					const renderedFonts = fonts.filter( ( font ) => font.glyphCount > 0 );
					expect( renderedFonts.length, `${ path } ${ selector } must actually paint text.` ).toBeGreaterThan( 0 );
					expect( renderedFonts.every( ( font ) => ! font.isCustomFont ), `Only installed system fonts may paint after web-font failure: ${ JSON.stringify( fonts ) }` ).toBe( true );
				}
			}
		} finally {
			await session.detach();
		}
	} );
}
