import { expect, test } from '@playwright/test';

const routes = ( process.env.PEPPERMINT_RESPONSIVE_TEST_PATHS || [
	'/',
	'/theme-preview/',
	'/theme-preview/cards-and-frames/',
	'/theme-preview/landing-hero/',
	'/theme-preview/text-intro/',
	'/theme-preview/media-left/',
	'/theme-preview/media-right/',
	'/theme-preview/project-starter/',
	'/theme-preview/section-styles/',
	'/theme-preview/query-components/',
	'/theme-preview/project-skills-boards/',
	'/theme-preview/project-skills-interest/',
	'/theme-preview/chapter-patterns/',
	'/theme-preview-posts/',
	'/theme-preview-accessibility/',
	'/theme-preview-interoperability/',
	'/theme-preview-federation-tools/',
	'/theme-preview-long-project-title/',
	'/theme-preview-member-services-infrastructure/',
	'/theme-preview-missing-image-state/',
	'/theme-preview-grid-alignment/',
	'/theme-preview-dark-mode/',
	'/theme-preview-editorial-block-sampler/',
	'/theme-preview-deployment-pipeline/',
	'/theme-preview-internationalization/',
	'/theme-preview-long-token/',
	'/category/theme-preview/',
	'/category/blog/',
	'/our-work/',
	'/about/',
	'/join-us/',
	'/openslides/',
	'/con-dashboard/',
	'/wordpress/',
	'/formations/',
	'/engagement/',
	'/member-services/',
	'/?s=Theme%20Preview',
	'/?s=peppermint-preview-guaranteed-no-match&post_type=post',
	'/theme-preview-guaranteed-missing-route/'
].join( ',' ) )
	.split( ',' )
	.map( ( route ) => route.trim() )
	.filter( Boolean );

const notFoundRoutes = ( process.env.PEPPERMINT_EXPECTED_404_PATHS || '/theme-preview-guaranteed-missing-route/' )
	.split( ',' ).map( ( route ) => route.trim() ).filter( Boolean );

const schemes = ( process.env.PEPPERMINT_RESPONSIVE_SCHEMES || 'light,dark' )
	.split( ',' )
	.map( ( scheme ) => scheme.trim() )
	.filter( Boolean );

function stringifyReport( report ) {
	return JSON.stringify( report, null, 2 );
}

for ( const route of routes ) {
	for ( const scheme of schemes ) {
		test( `${ scheme } responsive geometry: ${ route }`, async ( { page } ) => {
			await page.addInitScript( ( requestedScheme ) => {
				window.localStorage.setItem( 'peppermint-color-scheme', requestedScheme );
			}, scheme );

			const response = await page.goto( route, { waitUntil: 'domcontentloaded' } );
			expect( response, `No document response for ${ route }` ).not.toBeNull();
			expect( response.status(), `Missing or unexpected fixture at ${ route }` ).toBe( notFoundRoutes.includes( route ) ? 404 : 200 );
			await expect( page.locator( 'html' ) ).toHaveAttribute( 'data-peppermint-resolved-scheme', scheme );
			await page.evaluate( () => document.fonts.ready );
			await page.evaluate( () => new Promise( ( resolve ) => requestAnimationFrame( () => requestAnimationFrame( resolve ) ) ) );

			const report = await page.evaluate( () => {
				const viewportWidth = document.documentElement.clientWidth;
				const describe = ( element ) => {
					const id = element.id ? `#${ element.id }` : '';
					const classes = [ ...element.classList ].slice( 0, 3 ).map( ( className ) => `.${ className }` ).join( '' );
					return `${ element.tagName.toLowerCase() }${ id }${ classes }`;
				};
				const isVisible = ( element ) => {
					const style = getComputedStyle( element );
					const rect = element.getBoundingClientRect();
					return style.display !== 'none'
						&& style.visibility !== 'hidden'
						&& Number.parseFloat( style.opacity ) !== 0
						&& rect.width > 0
						&& rect.height > 0;
				};

				const horizontalOverflow = document.documentElement.scrollWidth - viewportWidth;
				const leakingElements = horizontalOverflow > 1
					? [ ...document.body.querySelectorAll( '*' ) ]
						.filter( isVisible )
						.map( ( element ) => ( { element, rect: element.getBoundingClientRect() } ) )
						.filter( ( { rect } ) => rect.left < -1 || rect.right > viewportWidth + 1 )
						.slice( 0, 20 )
						.map( ( { element, rect } ) => ( {
							bottom: Math.round( rect.bottom ),
							left: Math.round( rect.left ),
							right: Math.round( rect.right ),
							selector: describe( element ),
							top: Math.round( rect.top ),
							width: Math.round( rect.width )
						} ) )
					: [];

				const clippedText = [ ...document.querySelectorAll( 'h1, h2, h3, h4, h5, h6, .wp-block-button__link, .wp-block-query-pagination a, .footer-contact' ) ]
					.filter( isVisible )
					.filter( ( element ) => {
						const style = getComputedStyle( element );
						return [ 'clip', 'hidden' ].includes( style.overflowX )
							&& element.scrollWidth > element.clientWidth + 1;
					} )
					.map( ( element ) => ( {
						clientWidth: element.clientWidth,
						scrollWidth: element.scrollWidth,
						selector: describe( element ),
						text: element.textContent.trim().slice( 0, 120 )
					} ) );

				const cardTitleLeaks = [ ...document.querySelectorAll( '.subcommittee-tile__title a' ) ]
					.map( ( link ) => {
						const card = link.closest( '.subcommittee-tile' );
						const cardRect = card.getBoundingClientRect();
						const range = document.createRange();
						range.selectNodeContents( link );
						const textRect = range.getBoundingClientRect();
						return {
							cardRect,
							leaks: textRect.left < cardRect.left - 1
								|| textRect.right > cardRect.right + 1
								|| textRect.top < cardRect.top - 1
								|| textRect.bottom > cardRect.bottom + 1,
							text: link.textContent.trim(),
							textRect
						};
					} )
					.filter( ( item ) => item.leaks )
					.map( ( item ) => ( {
						card: {
							bottom: Math.round( item.cardRect.bottom ),
							left: Math.round( item.cardRect.left ),
							right: Math.round( item.cardRect.right ),
							top: Math.round( item.cardRect.top )
						},
						text: item.text,
						textBounds: {
							bottom: Math.round( item.textRect.bottom ),
							left: Math.round( item.textRect.left ),
							right: Math.round( item.textRect.right ),
							top: Math.round( item.textRect.top )
						}
					} ) );

				const invalidFrameGaps = [ ...document.querySelectorAll( '.subcommittee-tile.is-style-peppermint-win95, .subcommittee-tile.is-style-peppermint-retro, .subcommittee-tile.is-style-peppermint-macos' ) ]
					.map( ( card ) => {
						const media = card.querySelector( '.wp-block-cover__background' );
						const cardRect = card.getBoundingClientRect();
						const mediaRect = media.getBoundingClientRect();
						const style = getComputedStyle( card );
						return {
							borderBottom: Number.parseFloat( style.borderBottomWidth ),
							borderRight: Number.parseFloat( style.borderRightWidth ),
							bottom: cardRect.bottom - mediaRect.bottom,
							left: mediaRect.left - cardRect.left,
							right: cardRect.right - mediaRect.right,
							selector: describe( card ),
							top: mediaRect.top - cardRect.top
						};
					} )
					.filter( ( gaps ) => gaps.borderBottom < 1
						|| gaps.borderRight < 1
						|| gaps.bottom < 3
						|| gaps.left < 3
						|| gaps.right < 3
						|| gaps.top < 3 );

				const undersizedTargets = [ ...document.querySelectorAll( '.peppermint-theme-switcher, .wp-block-query-pagination a, .wp-block-navigation__responsive-container-open, .wp-block-navigation__responsive-container-close' ) ]
					.filter( isVisible )
					.map( ( element ) => ( {
						rect: element.getBoundingClientRect(),
						selector: describe( element )
					} ) )
					.filter( ( { rect } ) => rect.width < 43.5 || rect.height < 43.5 )
					.map( ( { rect, selector } ) => ( {
						height: Math.round( rect.height ),
						selector,
						width: Math.round( rect.width )
					} ) );

				const footer = document.querySelector( '.wp-site-blocks > footer' );
				const footerRect = footer.getBoundingClientRect();
				const shortPageFooterGap = document.documentElement.scrollHeight <= window.innerHeight + 1
					? Math.max( 0, window.innerHeight - footerRect.bottom )
					: 0;

				return {
					cardTitleLeaks,
					clippedText,
					horizontalOverflow,
					invalidFrameGaps,
					leakingElements,
					shortPageFooterGap,
					undersizedTargets,
					viewportWidth
				};
			} );

			expect( report.horizontalOverflow, stringifyReport( report ) ).toBeLessThanOrEqual( 1 );
			expect( report.leakingElements, stringifyReport( report ) ).toEqual( [] );
			expect( report.clippedText, stringifyReport( report ) ).toEqual( [] );
			expect( report.cardTitleLeaks, stringifyReport( report ) ).toEqual( [] );
			expect( report.invalidFrameGaps, stringifyReport( report ) ).toEqual( [] );
			expect( report.undersizedTargets, stringifyReport( report ) ).toEqual( [] );
			expect( report.shortPageFooterGap, stringifyReport( report ) ).toBeLessThanOrEqual( 1 );
		} );
	}
}
