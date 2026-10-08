import { expect, test } from '@playwright/test';

// Stress rendered templates in memory without saving blocks, creating posts,
// or contacting the dashboard application.
// Contracts: WCAG 1.4.10 Reflow (320 CSS px), 1.4.4 Resize Text (200%),
// 1.3.2 Meaningful Sequence, and MDN's wbr / object-fit / iframe guidance.
const fingerprint = 'openpgp4fpr:FBCDCC2F20A31C717F8EF5324C1D612B9C3E2AE8';
const queryRoute = '/theme-preview-posts/';

async function settle( page ) {
	await page.evaluate( () => document.fonts.ready );
	await page.evaluate( () => new Promise( ( resolve ) => requestAnimationFrame( () => requestAnimationFrame( resolve ) ) ) );
}

async function open( page, route ) {
	const response = await page.goto( route, { waitUntil: 'domcontentloaded' } );
	expect( response, `No document response for ${ route }` ).not.toBeNull();
	expect( response.status(), `Expected a seeded public route: ${ route }` ).toBe( 200 );
	await settle( page );
}

// Count painted text lines. Nested spans, wrap opportunities, and block wrappers
// can produce extra rectangles that must not count as separate lines.
async function textMetrics( locator ) {
	return locator.evaluate( ( element ) => {
		const walker = document.createTreeWalker( element, NodeFilter.SHOW_TEXT );
		const lines = [];
		let node;
		while ( ( node = walker.nextNode() ) ) {
			for ( let index = 0; index < node.length; index++ ) {
				const range = document.createRange();
				range.setStart( node, index );
				range.setEnd( node, index + 1 );
				const rect = [ ...range.getClientRects() ].filter( ( candidate ) => candidate.width > 0 && candidate.height > 0 ).at( -1 );
				if ( ! rect ) {
					continue;
				}
				let line = lines.find( ( candidate ) => Math.abs( candidate.top - rect.top ) < 1 );
				if ( ! line ) {
					line = { top: rect.top, left: rect.left, right: rect.right, text: '' };
					lines.push( line );
				}
				line.text += node.textContent[ index ];
				line.left = Math.min( line.left, rect.left );
				line.right = Math.max( line.right, rect.right );
			}
		}
		const rect = element.getBoundingClientRect();
		return {
			text: element.textContent,
			lines: lines.sort( ( a, b ) => a.top - b.top ).map( ( line ) => ( { ...line, text: line.text.trim() } ) ).filter( ( line ) => line.text ),
			left: rect.left,
			right: rect.right,
			fontSize: Number.parseFloat( getComputedStyle( element ).fontSize ),
			hyphens: getComputedStyle( element ).hyphens,
			wordBreak: getComputedStyle( element ).wordBreak,
			viewport: document.documentElement.clientWidth,
			documentWidth: document.documentElement.scrollWidth
		};
	} );
}

function expectInlineFit( report ) {
	expect( report.lines.length, JSON.stringify( report ) ).toBeGreaterThan( 0 );
	for ( const line of report.lines ) {
		expect( line.left, JSON.stringify( report ) ).toBeGreaterThanOrEqual( Math.max( 0, report.left ) - 1 );
		expect( line.right, JSON.stringify( report ) ).toBeLessThanOrEqual( Math.min( report.viewport, report.right ) + 1 );
	}
	expect( report.documentWidth, JSON.stringify( report ) ).toBeLessThanOrEqual( report.viewport + 1 );
}

for ( const scheme of [ 'light', 'dark' ] ) {
	test.describe( `${ scheme } content resilience`, () => {
		test.beforeEach( async ( { page } ) => {
			await page.addInitScript( ( appearance ) => localStorage.setItem( 'ntc-color-scheme', appearance ), scheme );
			await page.emulateMedia( { reducedMotion: 'reduce' } );
		} );

		test( 'long single-post title avoids a lone final letter at 320px and 200% text', async ( { page } ) => {
			await page.setViewportSize( { width: 320, height: 720 } );
			await open( page, '/theme-preview-interoperability/' );
			const title = page.locator( 'main h1.wp-block-post-title' );
			const ordinary = await textMetrics( title );
			expect( ordinary.text.trim() ).toBe( 'Interoperability' );
			expectInlineFit( ordinary );
			expect.soft( ordinary.lines.at( -1 ).text.length, JSON.stringify( ordinary ) ).toBeGreaterThan( 1 );

			// Double the computed font size: changing rem alone may hit a fluid clamp
			// before the text reaches 200%.
			await title.evaluate( ( element ) => {
				element.style.setProperty( 'font-size', `${ Number.parseFloat( getComputedStyle( element ).fontSize ) * 2 }px`, 'important' );
			} );
			await settle( page );
			const enlarged = await textMetrics( title );
			expect( enlarged.fontSize ).toBeCloseTo( ordinary.fontSize * 2, 1 );
			expect( enlarged.text ).toBe( ordinary.text );
			expectInlineFit( enlarged );
			expect( enlarged.lines.at( -1 ).text.length, JSON.stringify( enlarged ) ).toBeGreaterThan( 1 );
		} );

		test( 'footer keeps its exact copyable fingerprint and complete four-character wrap groups', async ( { page } ) => {
			await open( page, '/theme-preview-interoperability/' );
			const identifier = page.locator( '.footer-fingerprint' );
			await expect( identifier ).toHaveAttribute( 'dir', 'ltr' );
			expect( await identifier.locator( 'wbr' ).count() ).toBeGreaterThan( 0 );
			for ( const scale of [ 1, 2 ] ) {
				if ( scale === 2 ) {
					await identifier.evaluate( ( element ) => {
						element.style.fontSize = `${ Number.parseFloat( getComputedStyle( element ).fontSize ) * 2 }px`;
					} );
					await settle( page );
				}
				const report = await textMetrics( identifier );
				expect( report.text, 'Break opportunities must not add spaces, hyphens, or translated URI text.' ).toBe( fingerprint );
				expectInlineFit( report );
				expect( report.lines.at( -1 ).text.length, JSON.stringify( report ) ).toBeGreaterThanOrEqual( 4 );
				for ( const line of report.lines ) {
					expect( line.text.replace( 'openpgp4fpr:', '' ).length % 4, JSON.stringify( report ) ).toBe( 0 );
				}
			}
		} );

		test( 'opened mobile navigation keeps real inline gutters', async ( { page } ) => {
			await page.setViewportSize( { width: 320, height: 720 } );
			await open( page, '/' );
			await page.locator( '.wp-block-navigation__responsive-container-open' ).click();
			const menu = page.locator( '.wp-block-navigation__responsive-container.is-menu-open' );
			await expect( menu ).toBeVisible();
			const report = await menu.evaluate( ( container ) => {
				const style = getComputedStyle( container );
				const rect = container.getBoundingClientRect();
				return {
					left: rect.left,
					right: rect.right,
					paddingLeft: Number.parseFloat( style.paddingLeft ),
					paddingRight: Number.parseFloat( style.paddingRight ),
					links: [ ...container.querySelectorAll( '.wp-block-navigation-item__content' ) ].map( ( link ) => ( {
						label: link.textContent.trim(), left: link.getBoundingClientRect().left, right: link.getBoundingClientRect().right
					} ) )
				};
			} );
			expect( report.paddingLeft, JSON.stringify( report ) ).toBeGreaterThan( 0 );
			expect( report.paddingRight, JSON.stringify( report ) ).toBeGreaterThan( 0 );
			expect( report.links.length ).toBeGreaterThan( 0 );
			for ( const link of report.links ) {
				expect( link.left, JSON.stringify( report ) ).toBeGreaterThanOrEqual( report.left + report.paddingLeft - 1 );
				expect( link.right, JSON.stringify( report ) ).toBeLessThanOrEqual( report.right - report.paddingRight + 1 );
			}
			await page.locator( '.wp-block-navigation__responsive-container-close' ).click();
			await expect( menu ).toHaveCount( 0 );
		} );

		// WCAG 1.4.11: each keyboard focus ring needs 3:1 against the overlay.
		test( 'opened mobile navigation focus rings contrast with the overlay', async ( { page } ) => {
			await page.setViewportSize( { width: 320, height: 720 } );
			await open( page, '/' );
			await page.locator( '.wp-block-navigation__responsive-container-open' ).click();
			const menu = page.locator( '.wp-block-navigation__responsive-container.is-menu-open' );
			await expect( menu ).toBeVisible();
			const stops = await menu.locator( 'a, button' ).count();
			expect( stops ).toBeGreaterThan( 1 );
			for ( let stop = 0; stop < stops; stop++ ) {
				await page.keyboard.press( 'Tab' );
				const ring = await menu.evaluate( ( container ) => {
					const focused = document.activeElement;
					const channels = ( color ) => ( color.match( /[\d.]+/g ) || [] ).slice( 0, 3 ).map( Number );
					const luminance = ( color ) => channels( color ).map( ( channel ) => channel / 255 ).map( ( channel ) => (
						channel <= 0.04045 ? channel / 12.92 : ( ( channel + 0.055 ) / 1.055 ) ** 2.4
					) ).reduce( ( total, channel, index ) => total + channel * [ 0.2126, 0.7152, 0.0722 ][ index ], 0 );
					const outline = getComputedStyle( focused ).outlineColor;
					const background = getComputedStyle( container ).backgroundColor;
					const [ lighter, darker ] = [ luminance( outline ), luminance( background ) ].sort( ( a, b ) => b - a );
					return {
						label: focused.textContent.trim() || focused.getAttribute( 'aria-label' ),
						inside: container.contains( focused ),
						focusVisible: focused.matches( ':focus-visible' ),
						outline,
						background,
						contrast: ( lighter + 0.05 ) / ( darker + 0.05 )
					};
				} );
				expect( ring.inside && ring.focusVisible, JSON.stringify( ring ) ).toBe( true );
				expect( ring.contrast, JSON.stringify( ring ) ).toBeGreaterThanOrEqual( 3 );
			}
		} );

		test( 'query image slots align mixed media, and disappear only when genuinely empty on stacked phones', async ( { page } ) => {
			await open( page, queryRoute );
			const report = await page.locator( '.project-grid .wp-block-post-template' ).first().evaluate( ( grid ) => {
				const bounds = grid.getBoundingClientRect();
				return {
					viewport: innerWidth,
					cards: [ ...grid.children ].map( ( card ) => {
						const slot = card.querySelector( ':scope > .project-card__media' );
						const rect = card.getBoundingClientRect();
						return {
							text: card.querySelector( '.wp-block-post-title' )?.textContent,
							left: rect.left - bounds.left,
							right: rect.right - bounds.right,
							top: rect.top,
							titleTop: card.querySelector( '.wp-block-post-title' )?.getBoundingClientRect().top,
							hasSlot: Boolean( slot ),
							hasImage: Boolean( slot?.querySelector( 'img' ) ),
							empty: slot ? slot.children.length === 0 : null,
							width: slot?.getBoundingClientRect().width,
							height: slot?.getBoundingClientRect().height
						};
					} )
				};
			} );
			expect( report.cards.some( ( card ) => card.hasImage ), JSON.stringify( report ) ).toBe( true );
			expect( report.cards.some( ( card ) => card.empty ), JSON.stringify( report ) ).toBe( true );
			for ( const card of report.cards ) {
				expect( card.hasSlot, JSON.stringify( card ) ).toBe( true );
				expect( card.left, JSON.stringify( card ) ).toBeGreaterThanOrEqual( -1 );
				expect( card.right, JSON.stringify( card ) ).toBeLessThanOrEqual( 1 );
				if ( card.empty && report.viewport < 600 ) {
					expect( card.height, JSON.stringify( card ) ).toBe( 0 );
				} else {
					expect( card.height, JSON.stringify( card ) ).toBeGreaterThan( 0 );
					expect( card.width / card.height, JSON.stringify( card ) ).toBeCloseTo( 16 / 9, 1 );
				}
				for ( const neighbor of report.cards.filter( ( candidate ) => Math.abs( candidate.top - card.top ) < 1 ) ) {
					expect( Math.abs( card.titleTop - neighbor.titleTop ), JSON.stringify( [ card, neighbor ] ) ).toBeLessThanOrEqual( 1 );
				}
			}
		} );

		test( 'authored media captions and inserted query blocks remain visible in document order', async ( { page } ) => {
			await open( page, queryRoute );
			await page.locator( '.project-grid .wp-block-post-template' ).first().evaluate( ( grid ) => {
				const card = [ ...grid.children ].find( ( item ) => item.querySelector( '.project-card__media' )?.children.length === 0 );
				if ( ! card ) {
					throw new Error( 'The Query fixture must retain at least one no-image example.' );
				}
				card.dataset.resilienceCard = 'true';
				const caption = document.createElement( 'p' );
				caption.dataset.resilienceCaption = 'true';
				caption.textContent = 'An authored explanation remains useful even without an image. '.repeat( 10 ).trim();
				card.querySelector( '.project-card__media' ).append( caption );
				const extra = document.createElement( 'p' );
				extra.dataset.resilienceExtra = 'true';
				extra.textContent = 'An editor-inserted summary belongs between this title and its excerpt.';
				card.querySelector( '.wp-block-post-title' ).after( extra );
			} );
			await settle( page );
			const caption = page.locator( '[data-resilience-caption]' );
			await expect( caption ).toBeVisible();
			const report = await page.locator( '[data-resilience-card]' ).evaluate( ( card ) => {
				const captionElement = card.querySelector( '[data-resilience-caption]' );
				const range = document.createRange();
				range.selectNodeContents( captionElement );
				const text = range.getBoundingClientRect();
				const clips = [];
				for ( let ancestor = captionElement.parentElement; ancestor && ancestor !== card.parentElement; ancestor = ancestor.parentElement ) {
					const style = getComputedStyle( ancestor );
					const rect = ancestor.getBoundingClientRect();
					if ( [ 'clip', 'hidden' ].includes( style.overflowY ) && ( text.top < rect.top - 1 || text.bottom > rect.bottom + 1 ) ) {
						clips.push( { className: ancestor.className, textBottom: text.bottom, bottom: rect.bottom } );
					}
				}
				return {
					clips,
					children: [ ...card.children ].filter( ( child ) => child.getBoundingClientRect().height > 0 ).map( ( child ) => ( {
						text: child.textContent.trim().slice( 0, 80 ), top: child.getBoundingClientRect().top, bottom: child.getBoundingClientRect().bottom
					} ) )
				};
			} );
			expect( report.clips, JSON.stringify( report ) ).toEqual( [] );
			for ( let index = 1; index < report.children.length; index++ ) {
				expect( report.children[ index ].top, JSON.stringify( report ) ).toBeGreaterThanOrEqual( report.children[ index - 1 ].bottom - 1 );
			}
		} );

		test( 'contained featured artwork can preserve a small source without cropping or upscaling', async ( { page } ) => {
			await open( page, queryRoute );
			const figure = page.locator( '.project-grid .wp-block-post-featured-image' ).first();
			await expect( figure ).toBeVisible();
			await figure.evaluate( ( element ) => {
				element.classList.add( 'is-style-ntc-contained-media' );
				const image = element.querySelector( 'img' );
				image.removeAttribute( 'srcset' );
				image.removeAttribute( 'sizes' );
				// A small transparent fixture avoids Media Library and network dependencies.
				image.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent( '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><path fill="#EC1F27" d="M8 8h32v32H8z"/></svg>' );
				image.loading = 'eager';
			} );
			await figure.locator( 'img' ).evaluate( ( image ) => image.decode() );
			const report = await figure.locator( 'img' ).evaluate( ( image ) => {
				// Check the canvas behind transparent pixels, not just the image background.
				const canvases = [];
				for ( let node = image; node && node !== image.closest( '.wp-block-post' ); node = node.parentElement ) {
					canvases.push( getComputedStyle( node ).backgroundColor );
				}
				return {
					fit: getComputedStyle( image ).objectFit,
					canvases,
					naturalWidth: image.naturalWidth,
					naturalHeight: image.naturalHeight,
					width: image.getBoundingClientRect().width,
					height: image.getBoundingClientRect().height
				};
			} );
			expect( report.naturalWidth, JSON.stringify( report ) ).toBeGreaterThan( 0 );
			expect( report.naturalWidth, 'Keep the small-source regression fixture genuinely small.' ).toBeLessThanOrEqual( 64 );
			expect( report.width, JSON.stringify( report ) ).toBeGreaterThan( report.naturalWidth );
			expect( report.fit, 'scale-down uses the smaller of none and contain, so pixels never enlarge.' ).toBe( 'scale-down' );
			expect( report.canvases.some( ( color ) => ! /^(transparent|rgba\(0, 0, 0, 0\))$/.test( color ) ), JSON.stringify( report ) ).toBe( true );
		} );

		test( 'featured-image keyboard focus indicator is not clipped by its media slot', async ( { page } ) => {
			await open( page, queryRoute );
			const link = page.locator( '.project-grid .wp-block-post-featured-image a' ).first();
			await link.focus();
			await page.keyboard.press( 'Tab' );
			await page.keyboard.press( 'Shift+Tab' );
			await expect( link ).toBeFocused();
			const report = await link.evaluate( ( focused ) => {
				const indicators = [];
				for ( let element = focused; element && element !== focused.closest( '.wp-block-post' ).parentElement; element = element.parentElement ) {
					const style = getComputedStyle( element );
					const width = Number.parseFloat( style.outlineWidth );
					if ( style.outlineStyle === 'none' || width <= 0 ) {
						continue;
					}
					const rect = element.getBoundingClientRect();
					const extent = width + Number.parseFloat( style.outlineOffset );
					const clips = [];
					for ( let ancestor = element.parentElement; ancestor; ancestor = ancestor.parentElement ) {
						const ancestorStyle = getComputedStyle( ancestor );
						const bounds = ancestor.getBoundingClientRect();
						const clipsInline = [ 'clip', 'hidden' ].includes( ancestorStyle.overflowX )
							&& ( rect.left - extent < bounds.left + ancestor.clientLeft - 1 || rect.right + extent > bounds.left + ancestor.clientLeft + ancestor.clientWidth + 1 );
						const clipsBlock = [ 'clip', 'hidden' ].includes( ancestorStyle.overflowY )
							&& ( rect.top - extent < bounds.top + ancestor.clientTop - 1 || rect.bottom + extent > bounds.top + ancestor.clientTop + ancestor.clientHeight + 1 );
						if ( clipsInline || clipsBlock ) {
							clips.push( ancestor.className );
						}
					}
					indicators.push( { className: element.className, width, offset: style.outlineOffset, clips } );
				}
				return { focusVisible: focused.matches( ':focus-visible' ), indicators };
			} );
			expect( report.focusVisible, JSON.stringify( report ) ).toBe( true );
			expect( report.indicators.length, JSON.stringify( report ) ).toBeGreaterThan( 0 );
			expect( report.indicators.some( ( indicator ) => indicator.clips.length === 0 ), JSON.stringify( report ) ).toBe( true );
		} );

		test( 'dashboard has a responsive, titled viewport and a direct-open fallback link', async ( { page } ) => {
			// Verify only the local embed shell: external application uptime,
			// permissions, cookies, and internal responsive behavior are out of scope.
			await page.route( 'https://appsmith.ntc.dsausa.org/**', ( route ) => route.fulfill( { contentType: 'text/html', body: '<!doctype html><title>Dashboard shell test</title>' } ) );
			await open( page, '/con-dashboard/' );
			const frame = page.locator( 'main iframe' );
			await expect( frame ).toHaveCount( 1 );
			const report = await frame.evaluate( ( iframe ) => {
				const rect = iframe.getBoundingClientRect();
				const parent = iframe.parentElement.getBoundingClientRect();
				const source = new URL( iframe.src );
				return {
					title: iframe.title.trim(),
					width: rect.width,
					height: rect.height,
					parentWidth: parent.width,
					leftDelta: rect.left - parent.left,
					rightDelta: rect.right - parent.right,
					viewportHeight: innerHeight,
					viewport: document.documentElement.clientWidth,
					documentWidth: document.documentElement.scrollWidth,
					fallbacks: [ ...document.querySelectorAll( 'main a[href]' ) ].filter( ( link ) => {
						const url = new URL( link.href );
						const box = link.getBoundingClientRect();
						return url.origin === source.origin && url.pathname === source.pathname && link.textContent.trim()
							&& box.width > 0 && box.height > 0 && getComputedStyle( link ).visibility !== 'hidden';
					} ).map( ( link ) => ( { text: link.textContent.trim(), href: link.href } ) )
				};
			} );
			expect( report.title, JSON.stringify( report ) ).not.toBe( '' );
			expect( report.width, JSON.stringify( report ) ).toBeCloseTo( report.parentWidth, 0 );
			expect( report.leftDelta, JSON.stringify( report ) ).toBeGreaterThanOrEqual( -1 );
			expect( report.rightDelta, JSON.stringify( report ) ).toBeLessThanOrEqual( 1 );
			expect( report.height, 'The dashboard must be an usable application viewport, not the iframe default thumbnail.' ).toBeGreaterThanOrEqual( Math.min( report.viewportHeight / 2, 400 ) );
			expect( report.documentWidth, JSON.stringify( report ) ).toBeLessThanOrEqual( report.viewport + 1 );
			expect( report.fallbacks.length, JSON.stringify( report ) ).toBeGreaterThan( 0 );
		} );

		for ( const route of [ '/about/', '/theme-preview-interoperability/', '/theme-preview/text-intro/' ] ) {
			test( `wide Post Content preserves ordinary reading measure and source order: ${ route }`, async ( { page } ) => {
				await open( page, route );
				const content = page.locator( 'main .entry-content' ).first();
				await expect( content ).toBeVisible();
				const report = await content.evaluate( ( container ) => {
					const first = document.createElement( 'p' );
					first.textContent = 'A normal paragraph stays on the readable central measure. '.repeat( 5 );
					const wide = document.createElement( 'div' );
					wide.className = 'wp-block-group alignwide';
					wide.textContent = 'An explicitly wide block may use the wider layout.';
					const following = first.cloneNode( true );
					container.append( first, wide, following );
					const probe = document.createElement( 'span' );
					probe.style.cssText = 'position:fixed;visibility:hidden;display:block;box-sizing:content-box;padding:0;border:0;height:0;';
					document.body.append( probe );
					const resolve = ( value ) => { probe.style.width = value; return probe.getBoundingClientRect().width; };
					const contentMeasure = resolve( 'var(--wp--style--global--content-size)' );
					const wideMeasure = resolve( 'var(--wp--style--global--wide-size)' );
					probe.remove();
					const box = ( element ) => {
						const rect = element.getBoundingClientRect();
						return { left: rect.left, right: rect.right, width: rect.width, top: rect.top, bottom: rect.bottom, center: ( rect.left + rect.right ) / 2 };
					};
					return {
						container: box( container ), first: box( first ), wide: box( wide ), following: box( following ), contentMeasure, wideMeasure,
						viewport: document.documentElement.clientWidth, documentWidth: document.documentElement.scrollWidth
					};
				} );
				expect( report.first.width, JSON.stringify( report ) ).toBeLessThanOrEqual( report.contentMeasure + 1 );
				expect( report.wide.width, JSON.stringify( report ) ).toBeLessThanOrEqual( report.wideMeasure + 1 );
				expect( report.first.width, JSON.stringify( report ) ).toBeCloseTo( Math.min( report.container.width, report.contentMeasure ), 0 );
				expect( report.wide.width, JSON.stringify( report ) ).toBeCloseTo( Math.min( report.container.width, report.wideMeasure ), 0 );
				expect( report.following.width, JSON.stringify( report ) ).toBeCloseTo( report.first.width, 0 );
				for ( const block of [ report.first, report.wide, report.following ] ) {
					expect( block.center, JSON.stringify( report ) ).toBeCloseTo( report.container.center, 0 );
					expect( block.left, JSON.stringify( report ) ).toBeGreaterThanOrEqual( report.container.left - 1 );
					expect( block.right, JSON.stringify( report ) ).toBeLessThanOrEqual( report.container.right + 1 );
				}
				expect( report.wide.top, JSON.stringify( report ) ).toBeGreaterThanOrEqual( report.first.bottom - 1 );
				expect( report.following.top, JSON.stringify( report ) ).toBeGreaterThanOrEqual( report.wide.bottom - 1 );
				expect( report.documentWidth, JSON.stringify( report ) ).toBeLessThanOrEqual( report.viewport + 1 );
			} );
		}
	} );
}
