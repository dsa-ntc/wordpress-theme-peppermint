import { expect, test } from '@playwright/test';

const boardRoute = '/theme-preview/project-skills-boards/';
const interestRoute = '/theme-preview/project-skills-interest/';
const boardStyles = [ 'cork', 'dsa', 'technical' ];
const roleNames = [ 'PHP developers', 'Linux administrators', 'Project managers' ];
const boardSelector = '.peppermint-skills-board';
const noteSelector = '.peppermint-skills-board__note';
const taskbarSelector = '.peppermint-skills-board__taskbar';
const browserErrors = new WeakMap();
const browserRequests = new WeakMap();

test.beforeEach( async ( { page } ) => {
	const errors = [];
	const requests = [];
	browserErrors.set( page, errors );
	browserRequests.set( page, requests );
	page.on( 'request', ( request ) => requests.push( request.url() ) );
	page.on( 'pageerror', ( error ) => errors.push( error.message ) );
	page.on( 'console', ( message ) => {
		if ( message.type() === 'error' ) {
			errors.push( message.text() );
		}
	} );
} );

test.afterEach( async ( { page } ) => {
	expect( browserErrors.get( page ), 'Board interactions must not emit browser errors.' ).toEqual( [] );
} );

async function settle( page ) {
	await page.evaluate( () => document.fonts.ready );
	await page.evaluate( () => new Promise( ( resolve ) => requestAnimationFrame( () => requestAnimationFrame( resolve ) ) ) );
}

async function open( page, scheme = 'light' ) {
	await page.addInitScript( ( appearance ) => localStorage.setItem( 'peppermint-color-scheme', appearance ), scheme );
	const response = await page.goto( boardRoute, { waitUntil: 'domcontentloaded' } );
	expect( response, `No document response for ${ boardRoute }` ).not.toBeNull();
	expect( response.status(), `Missing skills-board comparison at ${ boardRoute }` ).toBe( 200 );
	await settle( page );
	await expect( page.locator( 'html' ) ).toHaveAttribute( 'data-peppermint-resolved-scheme', scheme );
	await expect( page.locator( boardSelector ) ).toHaveCount( 3 );
}

async function report( page ) {
	return page.locator( boardSelector ).evaluateAll( ( boards ) => {
		// Canvas resolves CSS Color 4 values as well as rgb(), then backgrounds
		// are composited through the real ancestor chain before measuring text.
		const context = document.createElement( 'canvas' ).getContext( '2d', { willReadFrequently: true } );
		const rgba = ( color ) => {
			context.clearRect( 0, 0, 1, 1 );
			context.fillStyle = color;
			context.fillRect( 0, 0, 1, 1 );
			const channels = [ ...context.getImageData( 0, 0, 1, 1 ).data ];
			return [ ...channels.slice( 0, 3 ), channels[ 3 ] / 255 ];
		};
		const composite = ( foreground, background ) => foreground.slice( 0, 3 ).map( ( channel, index ) => (
			channel * foreground[ 3 ] + background[ index ] * ( 1 - foreground[ 3 ] )
		) );
		const background = ( element ) => {
			const ancestors = [];
			for ( let current = element; current; current = current.parentElement ) {
				ancestors.unshift( current );
			}
			return ancestors.reduce( ( result, ancestor ) => composite( rgba( getComputedStyle( ancestor ).backgroundColor ), result ), [ 255, 255, 255 ] );
		};
		const luminance = ( channels ) => channels.map( ( channel ) => channel / 255 ).map( ( channel ) => (
			channel <= 0.04045 ? channel / 12.92 : ( ( channel + 0.055 ) / 1.055 ) ** 2.4
		) ).reduce( ( total, channel, index ) => total + channel * [ 0.2126, 0.7152, 0.0722 ][ index ], 0 );
		const contrast = ( element ) => {
			const backdrop = background( element );
			const foreground = composite( rgba( getComputedStyle( element ).color ), backdrop );
			const values = [ luminance( foreground ), luminance( backdrop ) ].sort( ( first, second ) => second - first );
			return ( values[ 0 ] + 0.05 ) / ( values[ 1 ] + 0.05 );
		};
		const rect = ( element ) => {
			const bounds = element.getBoundingClientRect();
			return { left: bounds.left, right: bounds.right, top: bounds.top, bottom: bounds.bottom, width: bounds.width, height: bounds.height };
		};
		const clippedText = ( element, bounds ) => {
			const walker = document.createTreeWalker( element, NodeFilter.SHOW_TEXT );
			const clips = [];
			let node;
			while ( ( node = walker.nextNode() ) ) {
				if ( ! node.textContent.trim() ) {
					continue;
				}
				const range = document.createRange();
				range.selectNodeContents( node );
				for ( const fragment of range.getClientRects() ) {
					if ( fragment.width && fragment.height && ( fragment.left < bounds.left - 2 || fragment.right > bounds.right + 2
						|| fragment.top < bounds.top - 2 || fragment.bottom > bounds.bottom + 2 ) ) {
						clips.push( node.textContent.trim() );
					}
				}
			}
			return clips;
		};
		return {
			viewport: document.documentElement.clientWidth,
			documentWidth: document.documentElement.scrollWidth,
			boards: boards.map( ( board ) => ( {
				className: board.className,
				...rect( board ),
				overflow: board.scrollWidth > board.clientWidth + 1,
				taskbars: [ ...board.querySelectorAll( '.peppermint-skills-board__taskbar' ) ].filter( ( taskbar ) => taskbar.getClientRects().length ).map( ( taskbar ) => ( {
					...rect( taskbar ),
					overflow: taskbar.scrollWidth > taskbar.clientWidth + 1 || taskbar.scrollHeight > taskbar.clientHeight + 1,
					clippedText: clippedText( taskbar, rect( taskbar ) ),
					texts: [ ...taskbar.querySelectorAll( 'a, p' ) ].map( ( text ) => ( { text: text.textContent.trim(), contrast: contrast( text ) } ) )
				} ) ),
				notes: [ ...board.querySelectorAll( '.peppermint-skills-board__note' ) ].map( ( note ) => ( {
					...rect( note ),
					overflow: note.scrollWidth > note.clientWidth + 1 || note.scrollHeight > note.clientHeight + 1,
					clippedText: clippedText( note, rect( note ) ),
					texts: [ ...note.querySelectorAll( 'a, p, cite' ) ].map( ( text ) => ( { text: text.textContent.trim(), contrast: contrast( text ) } ) )
				} ) )
			} ) )
		};
	} );
}

function expectContained( result ) {
	const evidence = JSON.stringify( result, null, 2 );
	expect( result.documentWidth, evidence ).toBeLessThanOrEqual( result.viewport + 1 );
	expect( result.boards, evidence ).toHaveLength( 3 );
	for ( const board of result.boards ) {
		expect( board.left, evidence ).toBeGreaterThanOrEqual( -1 );
		expect( board.right, evidence ).toBeLessThanOrEqual( result.viewport + 1 );
		expect( board.overflow, evidence ).toBe( false );
		expect( board.notes, evidence ).toHaveLength( 3 );
		for ( const note of board.notes ) {
			expect( note.left, evidence ).toBeGreaterThanOrEqual( board.left - 1 );
			expect( note.right, evidence ).toBeLessThanOrEqual( board.right + 1 );
			expect( note.top, evidence ).toBeGreaterThanOrEqual( board.top - 1 );
			expect( note.bottom, evidence ).toBeLessThanOrEqual( board.bottom + 1 );
			expect( note.overflow, evidence ).toBe( false );
			expect( note.clippedText, evidence ).toEqual( [] );
		}
		for ( const [ index, note ] of board.notes.entries() ) {
			for ( const other of board.notes.slice( index + 1 ) ) {
				const overlap = Math.min( note.right, other.right ) - Math.max( note.left, other.left ) > 1
					&& Math.min( note.bottom, other.bottom ) - Math.max( note.top, other.top ) > 1;
				expect( overlap, 'Growing notes must not cover another window or its link.' ).toBe( false );
			}
		}
		for ( const taskbar of board.taskbars ) {
			expect( taskbar.left, evidence ).toBeGreaterThanOrEqual( board.left - 1 );
			expect( taskbar.right, evidence ).toBeLessThanOrEqual( board.right + 1 );
			expect( taskbar.top, evidence ).toBeGreaterThanOrEqual( Math.max( ...board.notes.map( ( note ) => note.bottom ) ) );
			expect( taskbar.bottom, evidence ).toBeLessThanOrEqual( board.bottom + 1 );
			expect( taskbar.overflow, evidence ).toBe( false );
			expect( taskbar.clippedText, evidence ).toEqual( [] );
		}
	}
}

async function corkDetails( page ) {
	return page.locator( `${ boardSelector }.is-style-peppermint-board-cork` ).evaluate( ( board ) => {
		const surface = ( element ) => {
			const style = getComputedStyle( element );
			return { background: style.backgroundColor, texture: style.backgroundImage, shadow: style.boxShadow };
		};
		return {
			...surface( board ),
			notes: [ ...board.querySelectorAll( '.peppermint-skills-board__note' ) ].map( ( note ) => {
				const bounds = note.getBoundingClientRect();
				const style = getComputedStyle( note );
				const fragments = [];
				const walker = document.createTreeWalker( note, NodeFilter.SHOW_TEXT );
				let node;
				while ( ( node = walker.nextNode() ) ) {
					if ( node.textContent.trim() ) {
						const range = document.createRange();
						range.selectNodeContents( node );
						fragments.push( ...range.getClientRects() );
					}
				}
				return {
					...surface( note ),
					unrotated: [ note, ...note.querySelectorAll( 'h3, a, p' ) ].every( ( element ) => {
						const computed = getComputedStyle( element );
						return computed.transform === 'none' && [ 'none', '0deg' ].includes( computed.rotate );
					} ),
					decorations: [ '::before', '::after' ].map( ( pseudo ) => {
						const decoration = getComputedStyle( note, pseudo );
						const number = ( property ) => Number.parseFloat( decoration[ property ] ) || 0;
						const width = number( 'width' ) + ( decoration.boxSizing === 'border-box' ? 0
							: number( 'paddingLeft' ) + number( 'paddingRight' ) + number( 'borderLeftWidth' ) + number( 'borderRightWidth' ) );
						const height = number( 'height' ) + ( decoration.boxSizing === 'border-box' ? 0
							: number( 'paddingTop' ) + number( 'paddingBottom' ) + number( 'borderTopWidth' ) + number( 'borderBottomWidth' ) );
						const left = bounds.left + Number.parseFloat( style.borderLeftWidth ) + number( 'left' );
						const top = bounds.top + Number.parseFloat( style.borderTopWidth ) + number( 'top' );
						const rounded = [ 'TopLeft', 'TopRight', 'BottomLeft', 'BottomRight' ].every( ( corner ) => {
							const radius = decoration[ `border${ corner }Radius` ];
							return Number.parseFloat( radius ) >= ( radius.includes( '%' ) ? 50 : Math.min( width, height ) / 2 );
						} );
						return {
							pseudo, width, height, rounded, content: decoration.content, display: decoration.display,
							pointerEvents: decoration.pointerEvents,
							occludesText: fragments.some( ( fragment ) => fragment.width && fragment.height
								&& Math.min( left + width, fragment.right ) - Math.max( left, fragment.left ) > 1
								&& Math.min( top + height, fragment.bottom ) - Math.max( top, fragment.top ) > 1 )
						};
					} )
				};
			} )
		};
	} );
}

function expectCorkDecorations( result ) {
	for ( const note of result.notes ) {
		expect( note.unrotated, 'Playful paper must not rotate note text or its link target.' ).toBe( true );
		for ( const decoration of note.decorations ) {
			expect( decoration.content, 'Pins and paper curls are empty CSS decoration, not extra controls or labels.' ).toBe( '""' );
			expect( decoration.display ).not.toBe( 'none' );
			expect( decoration.pointerEvents ).toBe( 'none' );
			expect( decoration.width ).toBeGreaterThan( 0 );
			expect( decoration.height ).toBeGreaterThan( 0 );
			expect( decoration.occludesText, JSON.stringify( decoration ) ).toBe( false );
		}
		const pin = note.decorations[ 0 ];
		expect( pin.rounded, 'The cork style uses a round pushpin instead of the previous tape strip.' ).toBe( true );
		expect( pin.width ).toBeCloseTo( pin.height, 1 );
	}
}

for ( const scheme of [ 'light', 'dark' ] ) {
	test( `${ scheme } cork decorations preserve readable paper and author-selected backgrounds`, async ( { page } ) => {
		await open( page, scheme );
		const material = await corkDetails( page );
		expect( material.texture, 'The default cork surface should have a CSS-only texture.' ).not.toBe( 'none' );
		expect( material.texture ).not.toContain( 'url(' );
		expect( material.shadow, 'The frame should visibly separate cork from its surrounding page.' ).not.toBe( 'none' );
		expectCorkDecorations( material );
		await page.locator( `${ boardSelector }.is-style-peppermint-board-cork` ).evaluate( ( board ) => {
			for ( const element of [ board, ...board.querySelectorAll( '.peppermint-skills-board__note' ) ] ) {
				element.classList.add( 'has-background' );
				element.style.backgroundColor = '#dfe9e4';
			}
		} );
		const customized = await corkDetails( page );
		for ( const surface of [ customized, ...customized.notes ] ) {
			expect( surface.background ).toBe( 'rgb(223, 233, 228)' );
			expect( surface.texture, 'An author-selected solid background must not retain the default texture.' ).toBe( 'none' );
		}
		expectContained( await report( page ) );
	} );

	test( `${ scheme } skills boards retain readable, contained notes and real destinations`, async ( { page, request } ) => {
		await open( page, scheme );
		for ( const style of boardStyles ) {
			const board = page.locator( `${ boardSelector }.is-style-peppermint-board-${ style }` );
			await expect( board ).toHaveCount( 1 );
			await expect( board.locator( 'h2' ) ).toHaveCount( 1 );
			await expect( board.locator( '.peppermint-skills-board__notes' ) ).toHaveCount( 1 );
			await expect( board.locator( `${ noteSelector } h3.peppermint-skills-board__title` ) ).toHaveCount( 3 );
			await expect( board.locator( taskbarSelector ) ).toHaveCount( 1 );
			if ( style === 'technical' ) {
				await expect( board.locator( taskbarSelector ) ).toBeVisible();
			} else {
				await expect( board.locator( taskbarSelector ) ).toBeHidden();
			}
			for ( const name of roleNames ) {
				const link = board.getByRole( 'link', { name, exact: true } );
				await expect( link ).toHaveCount( 1 );
				await expect( link ).toHaveAccessibleName( name );
				const semantics = await link.evaluate( ( element ) => ( {
					tag: element.tagName, role: element.getAttribute( 'role' ), pathname: new URL( element.href ).pathname
				} ) );
				expect( semantics ).toEqual( { tag: 'A', role: null, pathname: interestRoute } );
			}
		}
		const result = await report( page );
		expectContained( result );
		for ( const board of result.boards ) {
			for ( const note of board.notes ) {
				expect( note.texts.length ).toBeGreaterThanOrEqual( 2 );
				for ( const text of note.texts ) {
					expect( text.contrast, JSON.stringify( { scheme, ...text } ) ).toBeGreaterThanOrEqual( 4.5 );
				}
			}
			for ( const taskbar of board.taskbars ) {
				for ( const text of taskbar.texts ) {
					expect( text.contrast, JSON.stringify( { scheme, ...text } ) ).toBeGreaterThanOrEqual( 4.5 );
				}
			}
		}
		const destination = await request.get( interestRoute );
		expect( destination.status(), 'Demo notes must not send visitors to a missing page.' ).toBe( 200 );
	} );
}

test( 'Windows 95 taskbar is a decorative Organize label outside keyboard navigation', async ( { page } ) => {
	await open( page );
	const desktop = page.locator( `${ boardSelector }.is-style-peppermint-board-technical` );
	const taskbar = desktop.locator( taskbarSelector );
	await expect( taskbar ).toBeVisible();
	const label = taskbar.locator( 'p.peppermint-skills-board__start' );
	await expect( label ).toHaveCount( 1 );
	await expect( label ).toHaveText( '🌹 Organize' );
	await expect( taskbar.locator( 'p' ) ).toHaveCount( 1 );
	await expect( taskbar.locator( '.peppermint-skills-board__task' ) ).toHaveCount( 0 );
	await expect( taskbar.locator( 'a, button, [role], input, select, textarea, [tabindex]' ) ).toHaveCount( 0 );
	await expect( label.locator( 'span[aria-hidden="true"]' ) ).toHaveText( '🌹' );
	await expect( label.locator( 'span[aria-hidden="true"]' ) ).toHaveClass( /\bwp-exclude-emoji\b/ );
	await expect( label.locator( 'img' ) ).toHaveCount( 0 );
	const accessible = await taskbar.ariaSnapshot();
	expect( accessible ).toContain( 'paragraph: Organize' );
	expect( accessible, 'The decorative rose must not be announced as additional taskbar content.' ).not.toContain( '🌹' );
	await expect( desktop.locator( 'button, [role="button"], input, select, textarea' ) ).toHaveCount( 0 );
	const readAffordance = () => label.evaluate( ( element ) => {
		const style = getComputedStyle( element );
		return Object.fromEntries( [ 'cursor', 'backgroundColor', 'color', 'borderColor', 'boxShadow', 'textDecorationLine', 'transform' ].map( ( property ) => [ property, style[ property ] ] ) );
	} );
	await page.mouse.move( 0, 0 );
	const beforeHover = await readAffordance();
	expect( beforeHover.cursor ).not.toBe( 'pointer' );
	await label.hover();
	await settle( page );
	expect( await readAffordance(), 'Decorative taskbar text must not present a button-like hover action.' ).toEqual( beforeHover );
	await label.click();
	expect( new URL( page.url() ).pathname, 'The Organize decoration must not navigate.' ).toBe( boardRoute );
	expect( browserRequests.get( page ).filter( ( request ) => /\/emoji\/.*\/1f339\./.test( new URL( request ).pathname ) ), 'The native rose must not request a WordPress emoji CDN asset.' ).toEqual( [] );
	const chrome = await desktop.locator( noteSelector ).evaluateAll( ( notes ) => notes.map( ( note ) => {
		const style = getComputedStyle( note );
		return {
			edges: [ 'Top', 'Right', 'Bottom', 'Left' ].map( ( side ) => ( { width: Number.parseFloat( style[ `border${ side }Width` ] ), style: style[ `border${ side }Style` ], color: style[ `border${ side }Color` ] } ) ),
			decorations: [ '::before', '::after' ].map( ( pseudo ) => {
				const decoration = getComputedStyle( note, pseudo );
				return { content: decoration.content, pointerEvents: decoration.pointerEvents, display: decoration.display, width: Number.parseFloat( decoration.width ), height: Number.parseFloat( decoration.height ), background: decoration.backgroundColor };
			} )
		};
	} ) );
	for ( const window of chrome ) {
		for ( const edge of window.edges ) {
			expect( edge.width, JSON.stringify( window ) ).toBeGreaterThanOrEqual( 1 );
			expect( [ 'none', 'hidden' ] ).not.toContain( edge.style );
			expect( edge.color ).not.toBe( 'rgba(0, 0, 0, 0)' );
		}
		for ( const decoration of window.decorations ) {
			expect( decoration.content, 'Decorative window chrome must not generate labels or pretend to be a working control.' ).toBe( '""' );
			expect( decoration.pointerEvents ).toBe( 'none' );
			expect( decoration.display ).not.toBe( 'none' );
			expect( decoration.width ).toBeGreaterThan( 0 );
			expect( decoration.height ).toBeGreaterThan( 0 );
			expect( decoration.background ).not.toBe( 'rgba(0, 0, 0, 0)' );
		}
	}
	await page.mouse.move( 0, 0 );
	await desktop.locator( `${ noteSelector } h3 a` ).first().focus();
	for ( const name of roleNames.slice( 1 ) ) {
		await page.keyboard.press( 'Tab' );
		await expect( desktop.getByRole( 'link', { name, exact: true } ) ).toBeFocused();
	}
	await page.keyboard.press( 'Tab' );
	expect( await desktop.evaluate( ( board ) => board.contains( document.activeElement ) ), 'Tab after the last note must bypass the decorative taskbar.' ).toBe( false );

	// Existing unsynced pattern copies do not gain new taskbar blocks on update.
	await desktop.locator( taskbarSelector ).evaluate( ( element ) => element.remove() );
	expectContained( await report( page ) );
	const legacy = await desktop.evaluate( ( board ) => {
		const style = getComputedStyle( board );
		const noteEnd = Math.max( ...[ ...board.querySelectorAll( '.peppermint-skills-board__note' ) ].map( ( note ) => note.getBoundingClientRect().bottom ) );
		return {
			padding: Number.parseFloat( style.paddingBlockEnd ),
			gutter: board.getBoundingClientRect().bottom - Number.parseFloat( style.borderBottomWidth ) - noteEnd
		};
	} );
	expect( legacy.padding, 'An older board without taskbar blocks must retain its bottom breathing room.' ).toBeGreaterThan( 0 );
	expect( legacy.gutter, JSON.stringify( legacy ) ).toBeGreaterThanOrEqual( legacy.padding - 1 );
} );

test( 'notes are full-card native links with visible keyboard focus and usable targets', async ( { page } ) => {
	await open( page );
	for ( const note of await page.locator( noteSelector ).all() ) {
		const link = note.locator( 'h3 a' );
		await expect( link ).toHaveCount( 1 );
		await expect( link, 'Post-it titles must remain underline-free while retaining a real link.' ).toHaveCSS( 'text-decoration-line', 'none' );
		await expect( note.locator( 'a, button, input, select, textarea, [tabindex="0"]' ) ).toHaveCount( 1 );
		await note.scrollIntoViewIfNeeded();
		const target = await note.evaluate( ( element ) => {
			const bounds = element.getBoundingClientRect();
			const link = element.querySelector( 'h3 a' );
			const positions = [ [ 8, 8 ], [ bounds.width - 8, 8 ], [ 8, bounds.height - 8 ], [ bounds.width - 8, bounds.height - 8 ], [ bounds.width / 2, bounds.height / 2 ] ];
			return {
				width: bounds.width,
				height: bounds.height,
				hits: positions.map( ( [ left, top ] ) => document.elementFromPoint( bounds.left + left, bounds.top + top )?.closest( 'a' ) === link )
			};
		} );
		expect( target.width, JSON.stringify( target ) ).toBeGreaterThanOrEqual( 24 );
		expect( target.height, JSON.stringify( target ) ).toBeGreaterThanOrEqual( 24 );
		expect( target.hits, 'A point in the note body or padding must hit the heading link.' ).toEqual( [ true, true, true, true, true ] );
		await page.mouse.move( 0, 0 );
		await link.focus();
		await page.keyboard.press( 'Tab' );
		await page.keyboard.press( 'Shift+Tab' );
		await expect( link ).toBeFocused();
		const focus = await link.evaluate( ( element ) => {
			const note = element.closest( '.peppermint-skills-board__note' );
			const indicators = [ getComputedStyle( element ), getComputedStyle( element, '::after' ), getComputedStyle( note ) ];
			return {
				visible: element.matches( ':focus-visible' ),
				painted: indicators.some( ( style ) => ! [ 'none', 'hidden' ].includes( style.outlineStyle ) && Number.parseFloat( style.outlineWidth ) >= 2 && style.outlineColor !== 'rgba(0, 0, 0, 0)' )
			};
		} );
		expect( focus ).toEqual( { visible: true, painted: true } );
		await expect( link ).toHaveCSS( 'text-decoration-line', 'none' );
	}
	await page.locator( `${ noteSelector } h3 a` ).first().focus();
	await Promise.all( [ page.waitForURL( ( url ) => url.pathname === interestRoute ), page.keyboard.press( 'Enter' ) ] );
} );

test( 'notes grow for RTL translations, unbroken words, 200 percent text, and WCAG spacing', async ( { page } ) => {
	await open( page, 'dark' );
	await page.locator( boardSelector ).evaluateAll( ( boards ) => {
		document.documentElement.dir = 'rtl';
		document.documentElement.lang = 'ar';
		const titles = [ 'مطورو تطبيقات مجتمعية وأدوات مفتوحة المصدر', '地域社会の技術基盤を一緒に構築する開発者', 'Infrastrukturzusammenarbeitskoordination' ];
		for ( const board of boards ) {
			board.querySelector( 'h2' ).textContent = 'لجنة تطوير المواقع الإلكترونية — WordPress-Kommission';
			const label = board.querySelector( '.peppermint-skills-board__start' );
			// Preserve the decorative rose while expanding only translated text.
			const labelText = [ ...label.childNodes ].find( ( node ) => node.nodeType === Node.TEXT_NODE && node.textContent.trim() );
			labelText.textContent = ' التنظيم والعمل المشترك — Projectopportunitiesinfrastructurecollaboration';
			[ ...board.querySelectorAll( '.peppermint-skills-board__note' ) ].forEach( ( note, index ) => {
				note.querySelector( 'h3 a' ).textContent = titles[ index ];
				note.querySelector( 'p' ).textContent = 'نرحب بالجميع للمشاركة في تطوير أدوات المجتمع. 長い説明でも内容を省略しない。 '.repeat( index + 1 ) + 'extraordinarilylongunbrokentechnicalspecialization';
			} );
			// Snapshot first so inherited enlargement never doubles a child twice.
			const text = [ ...board.querySelectorAll( 'h2, h3, p' ) ].map( ( element ) => ( { element, size: Number.parseFloat( getComputedStyle( element ).fontSize ) } ) );
			for ( const { element, size } of text ) {
				element.style.setProperty( 'font-size', `${ size * 2 }px`, 'important' );
				element.style.setProperty( 'line-height', '1.5', 'important' );
				element.style.setProperty( 'letter-spacing', '0.12em', 'important' );
				element.style.setProperty( 'word-spacing', '0.16em', 'important' );
				if ( element.tagName === 'P' ) {
					element.style.setProperty( 'margin-block-end', '2em', 'important' );
				}
			}
		}
	} );
	await settle( page );
	await expect( page.locator( 'html' ) ).toHaveAttribute( 'dir', 'rtl' );
	expectContained( await report( page ) );
	expectCorkDecorations( await corkDetails( page ) );
} );

test( 'hover and keyboard feedback keep every note stationary and underline-free', async ( { page } ) => {
	const state = ( note ) => note.evaluate( ( element ) => {
		const style = getComputedStyle( element );
		const link = element.querySelector( 'h3 a' );
		const bounds = element.getBoundingClientRect();
		const indicator = getComputedStyle( link, '::after' );
		return {
			style: [ 'cork', 'dsa', 'technical' ].find( ( name ) => element.closest( `.is-style-peppermint-board-${ name }` ) ),
			shadow: style.boxShadow,
			titlebar: getComputedStyle( element, '::before' ).backgroundColor,
			foreground: getComputedStyle( link ).color,
			background: style.backgroundColor,
			texture: style.backgroundImage,
			underline: getComputedStyle( link ).textDecorationLine,
			focused: link.matches( ':focus-visible' ),
			focusPainted: ! [ 'none', 'hidden' ].includes( indicator.outlineStyle ) && Number.parseFloat( indicator.outlineWidth ) >= 2 && indicator.outlineColor !== 'rgba(0, 0, 0, 0)',
			x: bounds.left + scrollX, y: bounds.top + scrollY, width: bounds.width, height: bounds.height,
			moving: [ element, ...element.querySelectorAll( '*' ) ].some( ( node ) => node.getAnimations().some( ( animation ) => {
				const keyframes = animation.effect?.getKeyframes() || [];
				return keyframes.some( ( frame ) => [ 'transform', 'translate', 'rotate', 'scale', 'top', 'left', 'width', 'height' ].some( ( property ) => property in frame ) );
			} ) )
		};
	} );
	const stable = ( before, after ) => {
		for ( const dimension of [ 'x', 'y', 'width', 'height' ] ) {
			expect( after[ dimension ], `${ before.style }: ${ dimension } moved during interaction` ).toBeCloseTo( before[ dimension ], 1 );
		}
		for ( const property of [ 'foreground', 'background', 'texture' ] ) {
			expect( after[ property ], 'Feedback must not change the readable paper or text colors.' ).toBe( before[ property ] );
		}
		expect( after.underline ).toBe( 'none' );
		expect( after.moving, 'Feedback must not animate note geometry.' ).toBe( false );
	};
	for ( const scheme of [ 'light', 'dark' ] ) {
		await open( page, scheme );
		for ( const reducedMotion of [ 'no-preference', 'reduce' ] ) {
			await page.emulateMedia( { reducedMotion } );
			for ( const note of await page.locator( noteSelector ).all() ) {
				await note.scrollIntoViewIfNeeded();
				await page.mouse.move( 0, 0 );
				const before = await state( note );
				expect( before.underline ).toBe( 'none' );
				await note.hover();
				await settle( page );
				const hovered = await state( note );
				stable( before, hovered );
				if ( before.style === 'dsa' ) {
					expect( hovered.shadow ).toBe( before.shadow );
					expect( hovered.titlebar ).toBe( before.titlebar );
				} else {
					expect( hovered.shadow, 'Cork and Windows 95 notes must provide visible stationary hover feedback.' ).not.toBe( before.shadow );
				}
				if ( before.style === 'technical' ) {
					expect( hovered.titlebar, 'Windows 95 feedback must also activate its decorative title bar.' ).not.toBe( before.titlebar );
				}
				for ( const board of ( await report( page ) ).boards ) {
					for ( const paper of board.notes ) {
						for ( const text of paper.texts ) {
							expect( text.contrast, `${ scheme }: ${ text.text }` ).toBeGreaterThanOrEqual( 4.5 );
						}
					}
				}
				await page.mouse.move( 0, 0 );
				const link = note.locator( 'h3 a' );
				await link.focus();
				await page.keyboard.press( 'Tab' );
				await page.keyboard.press( 'Shift+Tab' );
				await expect( link ).toBeFocused();
				const focused = await state( note );
				stable( before, focused );
				expect( focused.focused ).toBe( true );
				expect( focused.focusPainted, 'Removing the underline must not remove the whole-note keyboard outline.' ).toBe( true );
				expect( focused.shadow, 'Keyboard users must get the same material feedback as hover.' ).toBe( hovered.shadow );
				expect( focused.titlebar ).toBe( hovered.titlebar );
			}
		}
	}
} );

test( 'forced colors retain board and note boundaries', async ( { page }, testInfo ) => {
	test.skip( ! [ 'small-phone-chromium', 'wide-desktop-chromium' ].includes( testInfo.project.name ),
		'Forced-colors coverage runs at the smallest and widest configured viewports.' );
	await page.emulateMedia( { colorScheme: 'dark', forcedColors: 'active' } );
	await open( page, 'dark' );
	expect( await page.evaluate( () => matchMedia( '(forced-colors: active)' ).matches ) ).toBe( true );
	expectContained( await report( page ) );
	for ( const surface of await page.locator( `${ boardSelector }, ${ noteSelector }, ${ taskbarSelector }:visible, .peppermint-skills-board__start:visible` ).all() ) {
		const edges = await surface.evaluate( ( element ) => {
			const style = getComputedStyle( element );
			return [ 'Top', 'Right', 'Bottom', 'Left' ].map( ( side ) => ( {
				width: Number.parseFloat( style[ `border${ side }Width` ] ), style: style[ `border${ side }Style` ], color: style[ `border${ side }Color` ], background: style.backgroundColor
			} ) );
		} );
		for ( const edge of edges ) {
			expect( edge.width, JSON.stringify( edges ) ).toBeGreaterThanOrEqual( 1 );
			expect( [ 'none', 'hidden' ] ).not.toContain( edge.style );
			expect( edge.color, JSON.stringify( edges ) ).not.toBe( edge.background );
		}
	}
	await expect( page.locator( `${ taskbarSelector } a, ${ taskbarSelector } button, ${ taskbarSelector } [tabindex]` ) ).toHaveCount( 0 );
	const cork = await corkDetails( page );
	for ( const surface of [ cork, ...cork.notes ] ) {
		expect( surface.texture, 'Forced colors must remove material textures.' ).toBe( 'none' );
		expect( surface.shadow, 'Forced colors must use real borders instead of shadows.' ).toBe( 'none' );
	}
	for ( const note of cork.notes ) {
		for ( const decoration of note.decorations ) {
			expect( decoration.display, 'Forced colors must remove decorative pins and curls.' ).toBe( 'none' );
		}
	}
	for ( const note of await page.locator( noteSelector ).all() ) {
		const link = note.locator( 'h3 a' );
		await note.hover();
		await expect( note, 'Forced-color hover must retain solid boundaries without material shadows.' ).toHaveCSS( 'box-shadow', 'none' );
		await expect( link ).toHaveCSS( 'text-decoration-line', 'none' );
		await page.mouse.move( 0, 0 );
		await link.focus();
		await page.keyboard.press( 'Tab' );
		await page.keyboard.press( 'Shift+Tab' );
		await expect( link ).toBeFocused();
		await expect( note ).toHaveCSS( 'box-shadow', 'none' );
		await expect( link ).toHaveCSS( 'text-decoration-line', 'none' );
	}
} );
