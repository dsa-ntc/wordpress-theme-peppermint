import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';

const fixtureExporter = fileURLToPath( new URL( './block-validation-fixtures.php', import.meta.url ) );
const phpBinary = process.env.NTC_PHP_BINARY || 'php';
const fixtures = JSON.parse( execFileSync( phpBinary, [ '-n', fixtureExporter ], {
	encoding: 'utf8',
	maxBuffer: 8 * 1024 * 1024,
	windowsHide: true
} ) );

// Check exported post or template markup without a database or editor session.
if ( process.env.NTC_BLOCK_VALIDATION_CONTENT ) {
	const extraDocuments = JSON.parse( readFileSync( process.env.NTC_BLOCK_VALIDATION_CONTENT, 'utf8' ).replace( /^\uFEFF/, '' ) );
	if ( ! extraDocuments || typeof extraDocuments !== 'object' || Array.isArray( extraDocuments ) || ! Object.keys( extraDocuments ).length ) {
		throw new Error( 'NTC_BLOCK_VALIDATION_CONTENT must contain a nonempty JSON object of label-to-block-markup strings.' );
	}
	for ( const [ label, markup ] of Object.entries( extraDocuments ) ) {
		if ( typeof markup !== 'string' ) {
			throw new Error( `Block validation content must be a string: ${ label }` );
		}
		fixtures.documents[ `exported-content/${ label }` ] = markup;
	}
}

let validationContext;
let validationPage;
const runtimeErrors = [];
const consoleErrors = [];

test.beforeAll( async ( { browser } ) => {
	validationContext = await browser.newContext();
	// Block network requests and serve an in-memory page with a stable origin.
	// Core's preference store needs localStorage, which about:blank cannot provide.
	await validationContext.route( '**/*', route => route.request().isNavigationRequest()
		? route.fulfill( {
			contentType: 'text/html',
			body: '<!doctype html><html lang="en"><head><meta charset="utf-8"></head><body></body></html>'
		} )
		: route.abort() );
	validationPage = await validationContext.newPage();
	runtimeErrors.length = 0;
	consoleErrors.length = 0;
	validationPage.on( 'pageerror', error => runtimeErrors.push( error.message ) );
	validationPage.on( 'console', message => {
		if ( message.type() === 'error' ) {
			consoleErrors.push( message.text() );
		}
	} );
	await validationPage.goto( 'https://ntc-block-validation.test/' );
	for ( const [ handle, path ] of Object.entries( fixtures.coreScripts ) ) {
		await validationPage.addScriptTag( { path } );
		if ( handle === 'lodash' ) {
			await validationPage.evaluate( () => { window.lodash = window._.noConflict(); } );
		}
	}
	await validationPage.evaluate( customBlocks => {
		window.wp.blocks.unstable__bootstrapServerSideBlockDefinitions( customBlocks );
		window.wp.blockLibrary.registerCoreBlocks();
	}, fixtures.customBlocks );
	for ( const path of fixtures.customScripts ) {
		await validationPage.addScriptTag( { path } );
	}
	expect( runtimeErrors, 'The installed WordPress editor packages must load cleanly.' ).toEqual( [] );
	expect( consoleErrors, 'Core package startup must not emit console errors.' ).toEqual( [] );
	console.log( `Validating ${ Object.keys( fixtures.documents ).length } documents with installed WordPress ${ fixtures.wordpressVersion } JavaScript.` );
} );

test.afterAll( async () => {
	await validationContext?.close();
} );

/**
 * Validate each block with core's parser and persistence rules.
 * WordPress 7.1 skips save validation for core/html: save()
 * returns null, while parser/serializer preserve static innerContent fragments.
 * https://make.wordpress.org/core/2026/07/23/editable-blocks-inside-the-custom-html-block/
 * The optional override injects a fault to test the preservation check.
 */
async function inspectMarkup( content, htmlRoundTripOverride = null ) {
	return validationPage.evaluate( ( { markup, roundTripOverride } ) => {
		const { blocks, blockSerializationDefaultParser } = window.wp;
		const unknown = [];
		const failures = [];
		const rawHTML = [];
		let count = 0;
		let htmlCount = 0;

		const inspectRaw = ( rawBlocks, parent = '' ) => rawBlocks.forEach( ( block, index ) => {
			const path = `${ parent }/${ index }:${ block.blockName || 'freeform' }`;
			if ( block.blockName && ! blocks.getBlockType( block.blockName ) ) {
				unknown.push( path );
			} else if ( ! block.blockName && block.innerHTML.trim() ) {
				unknown.push( `${ path } (unwrapped markup)` );
			}
			if ( block.blockName === 'core/html' ) {
				rawHTML.push( block );
			}
			inspectRaw( block.innerBlocks || [], path );
		} );
		inspectRaw( blockSerializationDefaultParser.parse( markup ) );

		// Ignore only core's delimiter newline and outer trimming. Preserve internal
		// whitespace, HTML bytes, and null child-slot markers exactly.
		const contentFragments = ( fragments ) => {
			if ( ! Array.isArray( fragments ) ) {
				return null;
			}
			const result = [ ...fragments ];
			if ( typeof result[ 0 ] === 'string' ) {
				result[ 0 ] = result[ 0 ].trimStart();
			}
			if ( typeof result.at( -1 ) === 'string' ) {
				result[ result.length - 1 ] = result.at( -1 ).trimEnd();
			}
			return result.length === 1 && result[ 0 ] === '' ? [] : result;
		};
		const equal = ( first, second ) => JSON.stringify( first ) === JSON.stringify( second );

		const inspectParsed = ( parsedBlocks, parent = '' ) => parsedBlocks.forEach( ( block, index ) => {
			count++;
			const path = `${ parent }/${ index }:${ block.name }`;
			if ( block.name === 'core/html' ) {
				const source = rawHTML[ htmlCount++ ];
				const serialized = roundTripOverride ?? blocks.serialize( block );
				const reparsed = blocks.parse( serialized );
				const restored = reparsed.length === 1 && reparsed[ 0 ].name === 'core/html' ? reparsed[ 0 ] : null;
				const fragmentsValid = Array.isArray( block.innerContent )
					&& block.innerContent.every( ( fragment ) => fragment === null || typeof fragment === 'string' )
					&& block.innerContent.filter( ( fragment ) => fragment === null ).length === block.innerBlocks.length;
				const checks = {
					'Custom HTML must be valid according to the core parser': block.isValid === true,
					'Custom HTML needs exact static fragments and one null marker per child': fragmentsValid,
					'Parsing must preserve the original raw innerContent exactly': Boolean( source ) && equal( source.innerContent, block.innerContent ),
					'Serialization must preserve one valid Custom HTML block': restored?.isValid === true,
					'Static HTML bytes and child-slot positions must survive serialize/parse': Boolean( restored ) && equal( contentFragments( block.innerContent ), contentFragments( restored.innerContent ) ),
					'Nested editable blocks must survive in the same order': Boolean( restored ) && equal( block.innerBlocks.map( ( child ) => blocks.serialize( child ) ), restored.innerBlocks.map( ( child ) => blocks.serialize( child ) ) ),
					'Custom HTML serialization must be stable after its first round trip': Boolean( restored ) && serialized === blocks.serialize( restored )
				};
				const issues = Object.entries( checks ).filter( ( [ , passed ] ) => ! passed ).map( ( [ message ] ) => ( { message, arguments: [] } ) );
				if ( issues.length ) {
					failures.push( { path, className: '', issues, original: block.innerContent, generated: restored?.innerContent ?? serialized } );
				}
			} else {
				const [ valid, issues ] = blocks.validateBlock( block );
				if ( ! block.isValid || ! valid ) {
					failures.push( {
						path,
						className: block.attributes.className || '',
						issues: issues.map( issue => ( {
							message: issue.args?.[ 0 ] || issue.log?.name || 'Validation mismatch',
							arguments: ( issue.args || [] ).slice( 1 ).filter( arg => typeof arg !== 'object' )
						} ) ),
						original: block.originalContent,
						generated: blocks.getSaveContent( block.name, block.attributes, block.innerBlocks )
					} );
				}
			}
			// The Custom HTML exception never exempts its editable child blocks.
			inspectParsed( block.innerBlocks || [], path );
		} );
		inspectParsed( blocks.parse( markup ) );
		return { count, htmlCount, failures, unknown };
	}, { markup: content, roundTripOverride: htmlRoundTripOverride } );
}

for ( const [ path, content ] of Object.entries( fixtures.documents ) ) {
	test( `current core save validation: ${ path }`, async () => {
		consoleErrors.length = 0;
		const result = await inspectMarkup( content );
		expect( result.count, `${ path } must contain actual registered blocks.` ).toBeGreaterThan( 0 );
		expect( result.unknown, 'Unknown blocks must not silently become valid HTML fallbacks.' ).toEqual( [] );
		expect( result.failures, 'Saved blocks must match core save output; Custom HTML must preserve its static content.' ).toEqual( [] );
		expect( consoleErrors, 'Parsing saved content must not emit editor console errors.' ).toEqual( [] );
		expect( runtimeErrors ).toEqual( [] );
	} );
}

test( 'negative control: a missing Button border class is rejected', async () => {
	const valid = await validationPage.evaluate( () => window.wp.blocks.serialize(
		window.wp.blocks.createBlock( 'core/button', {
			text: 'Validation control',
			className: 'is-style-outline',
			style: { border: { color: 'var:preset|color|accent-contrast', width: '2px' } }
		} )
	) );
	expect( ( await inspectMarkup( valid ) ).failures ).toEqual( [] );
	expect( valid ).toContain( 'has-border-color' );
	const invalid = valid.replace( ' has-border-color', '' );
	expect( ( await inspectMarkup( invalid ) ).failures.some( failure => failure.path.endsWith( ':core/button' ) ) ).toBe( true );
} );

test( 'negative control: a missing Group border color is rejected', async () => {
	const valid = await validationPage.evaluate( () => window.wp.blocks.serialize(
		window.wp.blocks.createBlock( 'core/group', {
			style: { border: { color: 'var:preset|color|line', width: '1px' } }
		} )
	) );
	expect( ( await inspectMarkup( valid ) ).failures ).toEqual( [] );
	expect( valid ).toContain( 'border-color:var(--wp--preset--color--line)' );
	const invalid = valid.replace( 'border-color:var(--wp--preset--color--line);', '' );
	expect( ( await inspectMarkup( invalid ) ).failures.some( failure => failure.path.endsWith( ':core/group' ) ) ).toBe( true );
} );

const customHTMLControl = '<!-- wp:html --><div class="ntc-responsive-embed">\n\t<iframe title="Dashboard &amp; proposals" src="https://dashboard.example.invalid/view?embed=true&amp;mode=read" loading="lazy"></iframe>\n\t<p>Keep  intentional   spaces &amp; entities.</p>\n</div><!-- /wp:html -->';

test( 'Custom HTML iframe preserves exact static content without calling its null save output', async () => {
	consoleErrors.length = 0;
	const result = await inspectMarkup( customHTMLControl );
	expect( result.count ).toBe( 1 );
	expect( result.htmlCount ).toBe( 1 );
	expect( result.unknown ).toEqual( [] );
	expect( result.failures ).toEqual( [] );
	expect( consoleErrors ).toEqual( [] );
	expect( runtimeErrors ).toEqual( [] );
} );

test( 'Custom HTML preserves static fragments around a valid editable child', async () => {
	consoleErrors.length = 0;
	const markup = '<!-- wp:html --><section><p>Static  before.</p>\n<!-- wp:paragraph --><p>Editable child.</p><!-- /wp:paragraph -->\n<footer>Static  after.</footer></section><!-- /wp:html -->';
	const result = await inspectMarkup( markup );
	expect( result.count ).toBe( 2 );
	expect( result.htmlCount ).toBe( 1 );
	expect( result.unknown ).toEqual( [] );
	expect( result.failures ).toEqual( [] );
	expect( consoleErrors ).toEqual( [] );
} );

test( 'negative control: losing a Custom HTML fragment is rejected even when the parser calls it valid', async () => {
	const truncated = '<!-- wp:html --><div class="ntc-responsive-embed"></div><!-- /wp:html -->';
	const result = await inspectMarkup( customHTMLControl, truncated );
	expect( result.failures.some( ( failure ) => failure.path.endsWith( ':core/html' )
		&& failure.issues.some( ( issue ) => issue.message === 'Static HTML bytes and child-slot positions must survive serialize/parse' ) ) ).toBe( true );
} );

test( 'negative control: an invalid Button inside Custom HTML is still rejected', async () => {
	const button = await validationPage.evaluate( () => window.wp.blocks.serialize( window.wp.blocks.createBlock( 'core/button', {
		text: 'Nested validation control',
		className: 'is-style-outline',
		style: { border: { color: 'var:preset|color|accent-contrast', width: '2px' } }
	} ) ) );
	expect( button ).toContain( 'has-border-color' );
	const invalid = button.replace( ' has-border-color', '' );
	const result = await inspectMarkup( `<!-- wp:html --><section>${ invalid }</section><!-- /wp:html -->` );
	expect( result.htmlCount ).toBe( 1 );
	expect( result.failures.some( ( failure ) => failure.path.endsWith( ':core/button' ) ) ).toBe( true );
} );

test( 'Appearance Switcher editor labels work inside an iframe without changing visitor preference', async () => {
	consoleErrors.length = 0;
	const themeCSS = readFileSync( new URL( '../../style.css', import.meta.url ), 'utf8' );
	const visitorState = await validationPage.evaluate( ( css ) => {
		const frame = document.createElement( 'iframe' );
		frame.id = 'ntc-appearance-editor-test';
		frame.title = 'Appearance block editor test';
		frame.style.cssText = 'width: 900px; height: 650px; border: 0';
		document.body.append( frame );
		const outsideEditor = document.createElement( 'button' );
		outsideEditor.id = 'ntc-outside-editor-test';
		outsideEditor.type = 'button';
		outsideEditor.textContent = 'Editor sidebar control';
		document.body.append( outsideEditor );
		const doc = frame.contentDocument;
		const style = doc.createElement( 'style' );
		style.textContent = css;
		doc.head.append( style );
		doc.body.innerHTML = '<main style="max-width: 600px; margin: 3rem auto"><div id="editor"></div><button id="outside" type="button">Outside the switcher</button><p id="outside-text">Outside nonfocusable text.</p></main>';
		const previousPreference = localStorage.getItem( 'ntc-color-scheme' );
		localStorage.setItem( 'ntc-color-scheme', 'dark' );
		doc.documentElement.setAttribute( 'data-ntc-color-scheme', 'dark' );
		doc.documentElement.setAttribute( 'data-ntc-resolved-scheme', 'dark' );
		const readAppearance = ( element ) => ( {
			preference: element.getAttribute( 'data-ntc-color-scheme' ),
			resolved: element.getAttribute( 'data-ntc-resolved-scheme' )
		} );
		const { createElement: el, createRoot, useState } = window.wp.element;
		const initialBlocks = [ window.wp.blocks.createBlock( 'ntc-block/theme-switcher' ) ];
		window.ntcAppearanceEditorTest = {
			previousPreference,
			serialized: window.wp.blocks.serialize( initialBlocks )
		};
		function Editor() {
			const [ blocks, setBlocks ] = useState( initialBlocks );
			window.ntcAppearanceEditorTest.serialized = window.wp.blocks.serialize( blocks );
			return el( window.wp.blockEditor.BlockEditorProvider, {
				value: blocks,
				onInput: setBlocks,
				onChange: setBlocks,
				settings: { allowedBlockTypes: [ 'ntc-block/theme-switcher' ], hasFixedToolbar: true }
			}, el( window.wp.blockEditor.BlockList ) );
		}
		window.ntcAppearanceEditorTestRoot = createRoot( doc.getElementById( 'editor' ) );
		window.ntcAppearanceEditorTestRoot.render( el( Editor ) );
		return {
			storage: localStorage.getItem( 'ntc-color-scheme' ),
			outer: readAppearance( document.documentElement ),
			canvas: readAppearance( doc.documentElement ),
			serialized: window.wp.blocks.serialize( initialBlocks )
		};
	}, themeCSS );
	try {
		const frame = validationPage.frameLocator( '#ntc-appearance-editor-test' );
		const button = frame.getByRole( 'button', { name: 'Preview appearance choices' } );
		const panel = frame.locator( '.ntc-theme-switcher__panel' );
		const option = ( value ) => frame.locator( `.ntc-theme-switcher__option:has(input[value="${ value }"])` );
		const expectPreview = async ( value ) => {
			await expect( option( value ).getByRole( 'radio' ) ).toBeChecked();
			await expect( option( value ).getByRole( 'radio' ) ).toBeFocused();
			await expect( button ).toHaveAttribute( 'aria-expanded', 'true' );
			await expect( panel ).toBeVisible();
			const current = await validationPage.evaluate( () => {
				const readAppearance = ( element ) => ( {
					preference: element.getAttribute( 'data-ntc-color-scheme' ),
					resolved: element.getAttribute( 'data-ntc-resolved-scheme' )
				} );
				return {
					storage: localStorage.getItem( 'ntc-color-scheme' ),
					outer: readAppearance( document.documentElement ),
					canvas: readAppearance( document.getElementById( 'ntc-appearance-editor-test' ).contentDocument.documentElement ),
					serialized: window.ntcAppearanceEditorTest.serialized
				};
			} );
			expect( current, 'Preview choices must not change visitor appearance or saved block content.' ).toEqual( visitorState );
		};
		await expect( button ).toBeVisible();
		await button.click();
		await expectPreview( 'system' );
		await option( 'dark' ).locator( 'span' ).click();
		await expectPreview( 'dark' );

		// Press the empty trailing label area, not the associated input. Keeping
		// the pointer down checks dismissal before native label activation.
		const padding = await option( 'light' ).evaluate( ( label ) => {
			const rect = label.getBoundingClientRect();
			const inset = parseFloat( getComputedStyle( label ).paddingRight ) / 2;
			return { x: rect.width - inset, y: rect.height / 2 };
		} );
		const labelBox = await option( 'light' ).boundingBox();
		expect( labelBox ).not.toBeNull();
		await validationPage.mouse.move( labelBox.x + padding.x, labelBox.y + padding.y );
		await validationPage.mouse.down();
		await expect( panel ).toBeVisible();
		await validationPage.mouse.up();
		await expectPreview( 'light' );
		await option( 'system' ).locator( 'span' ).click();
		await expectPreview( 'system' );
		await validationPage.keyboard.press( 'ArrowDown' );
		await expectPreview( 'light' );
		await validationPage.keyboard.press( 'Escape' );
		await expect( panel ).toBeHidden();
		await expect( button ).toBeFocused();

		await validationPage.keyboard.press( 'Enter' );
		await expectPreview( 'light' );
		await validationPage.keyboard.press( 'Tab' );
		await expect( panel ).toBeHidden();
		await expect( button ).toHaveAttribute( 'aria-expanded', 'false' );

		await button.click();
		await frame.locator( '#outside-text' ).click();
		await expect( panel ).toBeHidden();
		await button.click();
		await frame.locator( '.ntc-theme-switcher__help' ).click();
		await expect( panel ).toBeVisible();
		await frame.getByRole( 'button', { name: 'Outside the switcher' } ).focus();
		await expect( panel ).toBeHidden();
		await expect( button ).toHaveAttribute( 'aria-expanded', 'false' );

		await button.click();
		await validationPage.getByRole( 'button', { name: 'Editor sidebar control' } ).click();
		await expect( panel ).toBeHidden();
		await expect( validationPage.getByRole( 'button', { name: 'Editor sidebar control' } ) ).toBeFocused();
	} finally {
		await validationPage.mouse.up();
		await validationPage.evaluate( () => {
			window.ntcAppearanceEditorTestRoot?.unmount();
			delete window.ntcAppearanceEditorTestRoot;
			const previous = window.ntcAppearanceEditorTest.previousPreference;
			if ( previous === null ) {
				localStorage.removeItem( 'ntc-color-scheme' );
			} else {
				localStorage.setItem( 'ntc-color-scheme', previous );
			}
			delete window.ntcAppearanceEditorTest;
			document.getElementById( 'ntc-appearance-editor-test' )?.remove();
			document.getElementById( 'ntc-outside-editor-test' )?.remove();
		} );
	}
	expect( runtimeErrors, 'The mounted editor and its cleanup must not raise runtime errors.' ).toEqual( [] );
	expect( consoleErrors, 'The mounted editor and its cleanup must not emit console errors.' ).toEqual( [] );
} );

test( 'Skills board styles preserve editable core notes without frontend link overlays in the editor', async () => {
	consoleErrors.length = 0;
	const markup = fixtures.documents[ 'patterns/project-skills-board.php' ];
	expect( markup, 'The reusable skills-board pattern must be included in the core fixture export.' ).toEqual( expect.any( String ) );
	// Run the real registration callback without booting WordPress or touching
	// the database. The output is what PHP supplies to the editor style registry.
	const registrations = JSON.parse( execFileSync( phpBinary, [ '-n', '-r', `
define( 'ABSPATH', '/' );
$registrations = array();
function add_action( ...$arguments ) {}
function __( $text, $domain ) { return $text; }
function register_block_style( $block, $properties ) {
	global $registrations;
	$registrations[] = array( 'block' => $block, 'properties' => $properties );
}
require $argv[1];
ntc_block_register_block_styles();
echo json_encode( $registrations, JSON_THROW_ON_ERROR );
`, fileURLToPath( new URL( '../../functions.php', import.meta.url ) ) ], {
		encoding: 'utf8', windowsHide: true
	} ) ).filter( ( registration ) => registration.block === 'core/group' && registration.properties.name.startsWith( 'ntc-board-' ) );
	const expectedStyles = [ 'ntc-board-cork', 'ntc-board-dsa', 'ntc-board-technical' ];
	expect( registrations.map( ( registration ) => registration.properties.name ).sort() ).toEqual( [ ...expectedStyles ].sort() );
	for ( const { properties } of registrations ) {
		expect( properties.label.trim() ).not.toBe( '' );
	}
	expect( registrations.find( ( registration ) => registration.properties.name === 'ntc-board-technical' ).properties.label ).toBe( 'Windows 95 Desktop' );
	const coreCSSRoot = resolve( dirname( fixtures.coreScripts[ 'wp-block-library' ] ), '../../css/dist' );
	const css = [
		readFileSync( resolve( coreCSSRoot, 'block-library/style.css' ), 'utf8' ),
		readFileSync( resolve( coreCSSRoot, 'block-editor/style.css' ), 'utf8' ),
		readFileSync( new URL( '../../assets/css/blocks/skills-board.css', import.meta.url ), 'utf8' )
	].join( '\n' );
	await validationPage.evaluate( ( { markup, registrations, css } ) => {
		const frame = document.createElement( 'iframe' );
		frame.id = 'ntc-skills-editor-test';
		frame.title = 'Skills board editing test';
		frame.style.cssText = 'width: 960px; height: 850px; border: 0';
		document.body.append( frame );
		const doc = frame.contentDocument;
		const style = doc.createElement( 'style' );
		style.textContent = css;
		doc.head.append( style );
		doc.body.innerHTML = '<main class="editor-styles-wrapper" style="padding: 32px"><div id="editor"></div></main>';
		for ( const { block, properties } of registrations ) {
			window.wp.blocks.registerBlockStyle( block, properties );
		}
		const { createElement: el, createRoot, useState } = window.wp.element;
		const initialBlocks = window.wp.blocks.parse( markup );
		const board = initialBlocks.find( ( block ) => block.name === 'core/group' && block.attributes.className?.split( /\s+/ ).includes( 'ntc-skills-board' ) );
		if ( ! board ) {
			throw new Error( 'The skills-board pattern must contain its editable outer Group.' );
		}
		window.ntcSkillsBoardEditorTest = { boardId: board.clientId, serialized: '', innerSerialized: '', baseClass: board.attributes.className.replace( /\bis-style-ntc-board-\S+/g, '' ).trim() };
		function Canvas() {
			window.ntcSkillsBoardEditorTest.actions = window.wp.data.useDispatch( window.wp.blockEditor.store );
			return el( window.wp.blockEditor.BlockList );
		}
		function Editor() {
			const [ blocks, setBlocks ] = useState( initialBlocks );
			const current = blocks.find( ( block ) => block.clientId === board.clientId );
			window.ntcSkillsBoardEditorTest.serialized = window.wp.blocks.serialize( blocks );
			window.ntcSkillsBoardEditorTest.innerSerialized = window.wp.blocks.serialize( current.innerBlocks );
			return el( window.wp.blockEditor.BlockEditorProvider, {
				value: blocks, onInput: setBlocks, onChange: setBlocks,
				settings: { allowedBlockTypes: [ 'core/group', 'core/heading', 'core/paragraph' ], hasFixedToolbar: true }
			}, el( Canvas ) );
		}
		window.ntcSkillsBoardEditorTestRoot = createRoot( doc.getElementById( 'editor' ) );
		window.ntcSkillsBoardEditorTestRoot.render( el( Editor ) );
	}, { markup, registrations, css } );
	try {
		const frame = validationPage.frameLocator( '#ntc-skills-editor-test' );
		const board = frame.locator( '.ntc-skills-board' );
		await expect( board ).toHaveCount( 1 );
		const registered = await validationPage.evaluate( () => window.wp.data.select( 'core/blocks' ).getBlockStyles( 'core/group' ).filter( ( style ) => style.name.startsWith( 'ntc-board-' ) ).map( ( style ) => style.name ) );
		expect( registered.sort() ).toEqual( [ ...expectedStyles ].sort() );
		for ( const name of expectedStyles ) {
			const previousContent = await validationPage.evaluate( ( name ) => {
				const state = window.ntcSkillsBoardEditorTest;
				const previous = state.innerSerialized;
				state.actions.updateBlockAttributes( state.boardId, { className: `${ state.baseClass } is-style-${ name }` } );
				return previous;
			}, name );
			await expect( board ).toHaveClass( new RegExp( `\\bis-style-${ name }\\b` ) );
			expect( await validationPage.evaluate( () => window.ntcSkillsBoardEditorTest.innerSerialized ), 'Changing the style must not replace or lock the inner blocks.' ).toBe( previousContent );
			await expect( board.locator( '.ntc-skills-board__note h3[contenteditable="true"]' ) ).toHaveCount( 3 );
			await expect( board.locator( '.ntc-skills-board__note p[contenteditable="true"]' ) ).toHaveCount( 3 );
			const taskbar = board.locator( '.ntc-skills-board__taskbar' );
			await expect( taskbar ).toHaveCount( 1 );
			if ( name === 'ntc-board-technical' ) {
				await expect( taskbar ).toBeVisible();
				await expect( taskbar.locator( 'p[contenteditable="true"]' ) ).toHaveCount( 1 );
				await expect( taskbar.locator( 'p.ntc-skills-board__start' ) ).toHaveText( '🌹 Organize' );
				await expect( taskbar.locator( 'a, button, .ntc-skills-board__task' ) ).toHaveCount( 0 );
				await expect( taskbar.locator( 'span[aria-hidden="true"]' ) ).toHaveText( '🌹' );
				await expect( taskbar.locator( 'span[aria-hidden="true"]' ) ).toHaveClass( /\bwp-exclude-emoji\b/ );
			} else {
				await expect( taskbar ).toBeHidden();
			}
			const note = board.locator( '.ntc-skills-board__note' ).first();
			await note.scrollIntoViewIfNeeded();
			const hit = await note.evaluate( ( element ) => {
				const bounds = element.getBoundingClientRect();
				const paragraph = element.querySelector( 'p' );
				const paragraphBounds = paragraph.getBoundingClientRect();
				const samples = [ [ bounds.right - 8, bounds.bottom - 8 ], [ paragraphBounds.left + paragraphBounds.width / 2, paragraphBounds.top + paragraphBounds.height / 2 ] ];
				return samples.map( ( [ x, y ] ) => {
					const target = element.ownerDocument.elementFromPoint( x, y );
					return { found: Boolean( target ), linkIntercepted: Boolean( target?.closest( 'a' ) ) };
				} );
			} );
			expect( hit, 'The note overlay must not intercept clicks intended to edit another inner block.' ).toEqual( [ { found: true, linkIntercepted: false }, { found: true, linkIntercepted: false } ] );
			const edited = `Editable skills description in ${ name }.`;
			await note.locator( 'p[contenteditable="true"]' ).fill( edited );
			await expect.poll( () => validationPage.evaluate( () => window.ntcSkillsBoardEditorTest.serialized ) ).toContain( edited );
			const currentMarkup = await validationPage.evaluate( () => window.ntcSkillsBoardEditorTest.serialized );
			expect( ( await inspectMarkup( currentMarkup ) ).failures ).toEqual( [] );
		}
		const taskLabel = board.locator( '.ntc-skills-board__start[contenteditable="true"]' );
		await taskLabel.focus();
		await taskLabel.press( 'Control+End' );
		await taskLabel.pressSequentially( ' together' );
		await expect( taskLabel ).toHaveText( '🌹 Organize together' );
		await expect( taskLabel.locator( 'span[aria-hidden="true"]' ) ).toHaveText( '🌹' );
		await expect.poll( () => validationPage.evaluate( () => window.ntcSkillsBoardEditorTest.serialized ) ).toContain( 'Organize together' );
		expect( ( await inspectMarkup( await validationPage.evaluate( () => window.ntcSkillsBoardEditorTest.serialized ) ) ).failures ).toEqual( [] );
	} finally {
		await validationPage.evaluate( ( names ) => {
			window.ntcSkillsBoardEditorTestRoot?.unmount();
			delete window.ntcSkillsBoardEditorTestRoot;
			delete window.ntcSkillsBoardEditorTest;
			document.getElementById( 'ntc-skills-editor-test' )?.remove();
			for ( const name of names ) {
				window.wp.blocks.unregisterBlockStyle( 'core/group', name );
			}
		}, expectedStyles );
	}
	expect( runtimeErrors, 'Core board editing and cleanup must not raise runtime errors.' ).toEqual( [] );
	expect( consoleErrors, 'Core board editing and cleanup must not emit console errors.' ).toEqual( [] );
} );

test( 'Media patterns start empty and preserve native media replacement through save and reload', async () => {
	consoleErrors.length = 0;
	const names = [ 'landing-hero', 'subcommittee-tiles', 'image-action-card', 'featured-project', 'media-text-intro-image-left', 'media-text-intro-image-right' ];
	for ( const name of names ) {
		const markup = fixtures.documents[ `patterns/${ name }.php` ];
		expect( markup, `${ name } must not ship demonstration photographs or interface images.` ).not.toContain( 'assets/images/' );
		expect( markup, `${ name } must not ship demonstration icon images.` ).not.toContain( 'assets/icons/' );
		const result = await validationPage.evaluate( ( markup ) => {
			const api = window.wp.blocks;
			const parsed = api.parse( markup );
			const media = [];
			const collect = ( blocks ) => blocks.forEach( ( block ) => {
				if ( [ 'core/image', 'core/media-text', 'core/cover' ].includes( block.name ) ) {
					media.push( block );
				}
				collect( block.innerBlocks );
			} );
			collect( parsed );
			const before = media.map( ( block ) => ( {
				name: block.name,
				url: block.attributes.url || block.attributes.mediaUrl || '',
				hasNativeEditor: typeof api.getBlockType( block.name ).edit === 'function',
				locked: Boolean( block.attributes.lock?.move || block.attributes.lock?.remove || block.attributes.templateLock ),
				colorOnly: block.name !== 'core/cover' || Boolean( block.attributes.overlayColor ) && block.attributes.dimRatio === 100
			} ) );
			for ( const block of media ) {
				const imageURL = `https://editor-media.test/${ block.name.split( '/' )[ 1 ] }.png`;
				const updates = block.name === 'core/media-text'
					? { mediaUrl: imageURL, mediaType: 'image', mediaAlt: 'An editor-selected project image.' }
					: { url: imageURL, alt: block.name === 'core/cover' ? '' : 'An editor-selected project image.' };
				Object.assign( block.attributes, updates );
			}
			const saved = api.serialize( parsed );
			const restored = api.parse( saved );
			media.length = 0;
			collect( restored );
			return {
				before,
				saved,
				after: media.map( ( block ) => ( { name: block.name, url: block.attributes.url || block.attributes.mediaUrl, valid: block.isValid } ) ),
				imageSources: new DOMParser().parseFromString( markup, 'text/html' ).querySelectorAll( 'img[src]' ).length
			};
		}, markup );
		expect( result.before.length, `${ name } must retain native media blocks for authors.` ).toBeGreaterThan( 0 );
		expect( result.imageSources, 'No image URL may load before an author selects media; no empty src attribute may request the current page.' ).toBe( 0 );
		for ( const block of result.before ) {
			expect( block ).toMatchObject( { url: '', hasNativeEditor: true, locked: false, colorOnly: true } );
		}
		for ( const block of result.after ) {
			expect( block ).toMatchObject( { url: `https://editor-media.test/${ block.name.split( '/' )[ 1 ] }.png`, valid: true } );
		}
		expect( ( await inspectMarkup( result.saved ) ).failures, 'Author-supplied media must persist as valid core block content.' ).toEqual( [] );
	}
	expect( runtimeErrors, 'Empty-media validation must not raise runtime errors.' ).toEqual( [] );
	expect( consoleErrors, 'Empty-media validation must not emit console errors.' ).toEqual( [] );
} );
