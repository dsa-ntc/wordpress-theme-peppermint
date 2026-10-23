import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';

const fixtureExporter = fileURLToPath( new URL( './block-validation-fixtures.php', import.meta.url ) );
const phpBinary = process.env.PEPPERMINT_PHP_BINARY || 'php';
const fixtures = JSON.parse( execFileSync( phpBinary, [ '-n', fixtureExporter ], {
	encoding: 'utf8',
	maxBuffer: 8 * 1024 * 1024,
	windowsHide: true
} ) );

// Check exported post or template markup without a database or editor session.
if ( process.env.PEPPERMINT_BLOCK_VALIDATION_CONTENT ) {
	const extraDocuments = JSON.parse( readFileSync( process.env.PEPPERMINT_BLOCK_VALIDATION_CONTENT, 'utf8' ).replace( /^\uFEFF/, '' ) );
	if ( ! extraDocuments || typeof extraDocuments !== 'object' || Array.isArray( extraDocuments ) || ! Object.keys( extraDocuments ).length ) {
		throw new Error( 'PEPPERMINT_BLOCK_VALIDATION_CONTENT must contain a nonempty JSON object of label-to-block-markup strings.' );
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
	await validationPage.goto( 'https://peppermint-validation.test/' );
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
	// WordPress loads editor filters before the first editor mounts. withFilters
	// caches the filtered component at that mount, so load the filter here too.
	await validationPage.addScriptTag( { path: fileURLToPath( new URL( '../../assets/js/window-titles.js', import.meta.url ) ) } );
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

const customHTMLControl = '<!-- wp:html --><div class="peppermint-responsive-embed">\n\t<iframe title="Dashboard &amp; proposals" src="https://dashboard.example.invalid/view?embed=true&amp;mode=read" loading="lazy"></iframe>\n\t<p>Keep  intentional   spaces &amp; entities.</p>\n</div><!-- /wp:html -->';

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
	const truncated = '<!-- wp:html --><div class="peppermint-responsive-embed"></div><!-- /wp:html -->';
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

test( 'Appearance Switcher editor preview toggles inside an iframe without changing visitor preference', async () => {
	consoleErrors.length = 0;
	const themeCSS = readFileSync( new URL( '../../style.css', import.meta.url ), 'utf8' );
	const readState = () => validationPage.evaluate( () => {
		const canvas = document.getElementById( 'peppermint-appearance-editor-test' ).contentDocument.documentElement;
		return {
			storage: localStorage.getItem( 'peppermint-color-scheme' ),
			outer: document.documentElement.getAttribute( 'data-peppermint-color-scheme' ),
			canvas: canvas.getAttribute( 'data-peppermint-color-scheme' ),
			serialized: window.peppermintAppearanceEditorTest.serialized
		};
	} );
	await validationPage.evaluate( ( css ) => {
		const frame = document.createElement( 'iframe' );
		frame.id = 'peppermint-appearance-editor-test';
		frame.title = 'Appearance block editor test';
		frame.style.cssText = 'width: 900px; height: 650px; border: 0';
		document.body.append( frame );
		const doc = frame.contentDocument;
		const style = doc.createElement( 'style' );
		style.textContent = css;
		doc.head.append( style );
		doc.body.innerHTML = '<main style="max-width: 600px; margin: 3rem auto"><div id="editor"></div></main>';
		const previousPreference = localStorage.getItem( 'peppermint-color-scheme' );
		localStorage.setItem( 'peppermint-color-scheme', 'dark' );
		doc.documentElement.setAttribute( 'data-peppermint-color-scheme', 'dark' );
		const { createElement: el, createRoot, useState } = window.wp.element;
		const initialBlocks = [ window.wp.blocks.createBlock( 'peppermint/theme-switcher' ) ];
		window.peppermintAppearanceEditorTest = { previousPreference, serialized: window.wp.blocks.serialize( initialBlocks ) };
		function Editor() {
			const [ blocks, setBlocks ] = useState( initialBlocks );
			window.peppermintAppearanceEditorTest.serialized = window.wp.blocks.serialize( blocks );
			return el( window.wp.blockEditor.BlockEditorProvider, {
				value: blocks,
				onInput: setBlocks,
				onChange: setBlocks,
				settings: { allowedBlockTypes: [ 'peppermint/theme-switcher' ], hasFixedToolbar: true }
			}, el( window.wp.blockEditor.BlockList ) );
		}
		window.peppermintAppearanceEditorTestRoot = createRoot( doc.getElementById( 'editor' ) );
		window.peppermintAppearanceEditorTestRoot.render( el( Editor ) );
	}, themeCSS );
	try {
		const initial = await readState();
		const button = validationPage.frameLocator( '#peppermint-appearance-editor-test' ).getByRole( 'button', { exact: true, name: 'Dark mode' } );
		await expect( button ).toHaveAttribute( 'aria-pressed', 'false' );
		await button.click();
		await expect( button ).toHaveAttribute( 'aria-pressed', 'true' );
		await button.press( 'Enter' );
		await expect( button ).toHaveAttribute( 'aria-pressed', 'false' );
		expect( await readState(), 'The preview must not change visitor appearance or saved block content.' ).toEqual( initial );
	} finally {
		await validationPage.evaluate( () => {
			window.peppermintAppearanceEditorTestRoot?.unmount();
			delete window.peppermintAppearanceEditorTestRoot;
			const previous = window.peppermintAppearanceEditorTest?.previousPreference ?? null;
			if ( previous === null ) {
				localStorage.removeItem( 'peppermint-color-scheme' );
			} else {
				localStorage.setItem( 'peppermint-color-scheme', previous );
			}
			delete window.peppermintAppearanceEditorTest;
			document.getElementById( 'peppermint-appearance-editor-test' )?.remove();
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
function add_filter( ...$arguments ) {}
function __( $text, $domain ) { return $text; }
function register_block_style( $block, $properties ) {
	global $registrations;
	$registrations[] = array( 'block' => $block, 'properties' => $properties );
}
require $argv[1];
peppermint_register_block_styles();
echo json_encode( $registrations, JSON_THROW_ON_ERROR );
`, fileURLToPath( new URL( '../../functions.php', import.meta.url ) ) ], {
		encoding: 'utf8', windowsHide: true
	} ) ).filter( ( registration ) => registration.block === 'core/group' && registration.properties.name.startsWith( 'peppermint-board-' ) );
	const expectedStyles = [ 'peppermint-board-cork', 'peppermint-board-dsa', 'peppermint-board-technical' ];
	expect( registrations.map( ( registration ) => registration.properties.name ).sort() ).toEqual( [ ...expectedStyles ].sort() );
	for ( const { properties } of registrations ) {
		expect( properties.label.trim() ).not.toBe( '' );
	}
	expect( registrations.find( ( registration ) => registration.properties.name === 'peppermint-board-technical' ).properties.label ).toBe( 'Windows 95 Desktop' );
	const coreCSSRoot = resolve( dirname( fixtures.coreScripts[ 'wp-block-library' ] ), '../../css/dist' );
	const css = [
		readFileSync( resolve( coreCSSRoot, 'block-library/style.css' ), 'utf8' ),
		readFileSync( resolve( coreCSSRoot, 'block-editor/style.css' ), 'utf8' ),
		readFileSync( new URL( '../../assets/css/blocks/skills-board.css', import.meta.url ), 'utf8' )
	].join( '\n' );
	await validationPage.evaluate( ( { markup, registrations, css } ) => {
		const frame = document.createElement( 'iframe' );
		frame.id = 'peppermint-skills-editor-test';
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
		const board = initialBlocks.find( ( block ) => block.name === 'core/group' && block.attributes.className?.split( /\s+/ ).includes( 'peppermint-skills-board' ) );
		if ( ! board ) {
			throw new Error( 'The skills-board pattern must contain its editable outer Group.' );
		}
		window.peppermintSkillsBoardEditorTest = { boardId: board.clientId, serialized: '', innerSerialized: '', baseClass: board.attributes.className.replace( /\bis-style-peppermint-board-\S+/g, '' ).trim() };
		function Canvas() {
			window.peppermintSkillsBoardEditorTest.actions = window.wp.data.useDispatch( window.wp.blockEditor.store );
			return el( window.wp.blockEditor.BlockList );
		}
		function Editor() {
			const [ blocks, setBlocks ] = useState( initialBlocks );
			const current = blocks.find( ( block ) => block.clientId === board.clientId );
			window.peppermintSkillsBoardEditorTest.serialized = window.wp.blocks.serialize( blocks );
			window.peppermintSkillsBoardEditorTest.innerSerialized = window.wp.blocks.serialize( current.innerBlocks );
			return el( window.wp.blockEditor.BlockEditorProvider, {
				value: blocks, onInput: setBlocks, onChange: setBlocks,
				settings: { allowedBlockTypes: [ 'core/group', 'core/heading', 'core/paragraph' ], hasFixedToolbar: true }
			}, el( Canvas ) );
		}
		window.peppermintSkillsBoardEditorTestRoot = createRoot( doc.getElementById( 'editor' ) );
		window.peppermintSkillsBoardEditorTestRoot.render( el( Editor ) );
	}, { markup, registrations, css } );
	try {
		const frame = validationPage.frameLocator( '#peppermint-skills-editor-test' );
		const board = frame.locator( '.peppermint-skills-board' );
		await expect( board ).toHaveCount( 1 );
		const registered = await validationPage.evaluate( () => window.wp.data.select( 'core/blocks' ).getBlockStyles( 'core/group' ).filter( ( style ) => style.name.startsWith( 'peppermint-board-' ) ).map( ( style ) => style.name ) );
		expect( registered.sort() ).toEqual( [ ...expectedStyles ].sort() );
		for ( const name of expectedStyles ) {
			const previousContent = await validationPage.evaluate( ( name ) => {
				const state = window.peppermintSkillsBoardEditorTest;
				const previous = state.innerSerialized;
				state.actions.updateBlockAttributes( state.boardId, { className: `${ state.baseClass } is-style-${ name }` } );
				return previous;
			}, name );
			await expect( board ).toHaveClass( new RegExp( `\\bis-style-${ name }\\b` ) );
			expect( await validationPage.evaluate( () => window.peppermintSkillsBoardEditorTest.innerSerialized ), 'Changing the style must not replace or lock the inner blocks.' ).toBe( previousContent );
			await expect( board.locator( '.peppermint-skills-board__note h3[contenteditable="true"]' ) ).toHaveCount( 3 );
			await expect( board.locator( '.peppermint-skills-board__note p[contenteditable="true"]' ) ).toHaveCount( 3 );
			const taskbar = board.locator( '.peppermint-skills-board__taskbar' );
			await expect( taskbar ).toHaveCount( 1 );
			if ( name === 'peppermint-board-technical' ) {
				await expect( taskbar ).toBeVisible();
				await expect( taskbar.locator( 'p[contenteditable="true"]' ) ).toHaveCount( 1 );
				await expect( taskbar.locator( 'p.peppermint-skills-board__start' ) ).toHaveText( '🌹 Organize' );
				await expect( taskbar.locator( 'a, button, .peppermint-skills-board__task' ) ).toHaveCount( 0 );
				await expect( taskbar.locator( 'span[aria-hidden="true"]' ) ).toHaveText( '🌹' );
				await expect( taskbar.locator( 'span[aria-hidden="true"]' ) ).toHaveClass( /\bwp-exclude-emoji\b/ );
			} else {
				await expect( taskbar ).toBeHidden();
			}
			const note = board.locator( '.peppermint-skills-board__note' ).first();
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
			await expect.poll( () => validationPage.evaluate( () => window.peppermintSkillsBoardEditorTest.serialized ) ).toContain( edited );
			const currentMarkup = await validationPage.evaluate( () => window.peppermintSkillsBoardEditorTest.serialized );
			expect( ( await inspectMarkup( currentMarkup ) ).failures ).toEqual( [] );
		}
		const taskLabel = board.locator( '.peppermint-skills-board__start[contenteditable="true"]' );
		await taskLabel.focus();
		// macOS has no Control+End document shortcut.
		await taskLabel.press( process.platform === 'darwin' ? 'Meta+ArrowDown' : 'Control+End' );
		await taskLabel.pressSequentially( ' together' );
		await expect( taskLabel ).toHaveText( '🌹 Organize together' );
		await expect( taskLabel.locator( 'span[aria-hidden="true"]' ) ).toHaveText( '🌹' );
		await expect.poll( () => validationPage.evaluate( () => window.peppermintSkillsBoardEditorTest.serialized ) ).toContain( 'Organize together' );
		expect( ( await inspectMarkup( await validationPage.evaluate( () => window.peppermintSkillsBoardEditorTest.serialized ) ) ).failures ).toEqual( [] );
	} finally {
		await validationPage.evaluate( ( names ) => {
			window.peppermintSkillsBoardEditorTestRoot?.unmount();
			delete window.peppermintSkillsBoardEditorTestRoot;
			delete window.peppermintSkillsBoardEditorTest;
			document.getElementById( 'peppermint-skills-editor-test' )?.remove();
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

test( 'Window frames name their title bars after the first heading on the front end and in the editor', async () => {
	consoleErrors.length = 0;
	// Run the real render_block filter with core's HTML API and no database.
	const includes = resolve( dirname( fixtures.coreScripts[ 'wp-block-library' ] ), '../..' );
	const cover = ( style, inner ) => `<div class="wp-block-cover ${ style }"><div class="wp-block-cover__inner-container">${ inner }</div></div>`;
	const cases = {
		nested: cover( 'is-style-peppermint-win95', '<h2 class="wp-block-post-title">Post title</h2><div class="wp-block-group"><h3 class="wp-block-heading"><a href="/team/">O&#039;Brien &amp;<br>Co </a></h3></div><h2 class="wp-block-heading">Second</h2>' ),
		retro: cover( 'is-style-peppermint-retro', '<h2 class="wp-block-heading">Formations</h2>' ),
		untitled: cover( 'is-style-peppermint-macos', '<p>No heading.</p>' ),
		unframed: cover( 'is-style-peppermint-red-tile', '<h2 class="wp-block-heading">Engagement</h2>' )
	};
	const rendered = JSON.parse( execFileSync( phpBinary, [ '-n', '-r', `
define( 'ABSPATH', dirname( $argv[1] ) . '/' );
define( 'WPINC', 'wp-includes' );
foreach ( array( 'compat.php', 'utf8.php', 'class-wp-token-map.php', 'html-api/html5-named-character-references.php', 'html-api/class-wp-html-decoder.php', 'html-api/class-wp-html-attribute-token.php', 'html-api/class-wp-html-span.php', 'html-api/class-wp-html-text-replacement.php', 'html-api/class-wp-html-tag-processor.php' ) as $file ) {
	require_once $argv[1] . '/' . $file;
}
function add_action( ...$arguments ) {}
function add_filter( ...$arguments ) {}
function wp_kses_uri_attributes() { return array( 'href' ); }
require $argv[2];
echo json_encode( array_map( 'peppermint_add_window_title', json_decode( file_get_contents( 'php://stdin' ), true ) ), JSON_THROW_ON_ERROR );
`, includes, fileURLToPath( new URL( '../../functions.php', import.meta.url ) ) ], {
		encoding: 'utf8', input: JSON.stringify( cases ), windowsHide: true
	} ) );
	const titles = await validationPage.evaluate( ( rendered ) => Object.fromEntries( Object.entries( rendered ).map( ( [ key, html ] ) => [
		key, new DOMParser().parseFromString( html, 'text/html' ).body.firstElementChild.getAttribute( 'data-peppermint-window-title' )
	] ) ), rendered );
	expect( titles, 'Only framed Covers take the text of their first Heading block.' ).toEqual( { nested: 'O\'Brien & Co', retro: 'Formations', untitled: null, unframed: null } );
	expect( rendered.untitled ).toBe( cases.untitled );
	expect( rendered.unframed ).toBe( cases.unframed );

	// The editor script gives the editor canvas the same title without saving it.
	// The pattern ships plain tiles. Frame the second and third to test their titles.
	const frames = [ 'red-tile', 'red-tile', 'retro', 'retro', 'win95', 'win95' ];
	let frame = 0;
	const markup = fixtures.documents[ 'patterns/subcommittee-tiles.php' ].replace( /is-style-peppermint-red-tile/g, () => `is-style-peppermint-${ frames[ frame++ ] }` );
	const coreCSSRoot = resolve( dirname( fixtures.coreScripts[ 'wp-block-library' ] ), '../../css/dist' );
	const css = [
		readFileSync( resolve( coreCSSRoot, 'block-library/style.css' ), 'utf8' ),
		readFileSync( new URL( '../../assets/css/blocks/cover.css', import.meta.url ), 'utf8' )
	].join( '\n' );
	// Cover editing asks the REST API for post types. Answer offline.
	await validationPage.route( '**/wp/v2/**', route => route.fulfill( { json: {} } ) );
	await validationPage.evaluate( ( { markup, css } ) => {
		const frame = document.createElement( 'iframe' );
		frame.id = 'peppermint-window-title-editor-test';
		frame.title = 'Window title editor test';
		frame.style.cssText = 'width: 1100px; height: 700px; border: 0';
		document.body.append( frame );
		const doc = frame.contentDocument;
		const style = doc.createElement( 'style' );
		style.textContent = css;
		doc.head.append( style );
		doc.body.innerHTML = '<main class="editor-styles-wrapper"><div id="editor"></div></main>';
		const { createElement: el, createRoot, useState } = window.wp.element;
		const initialBlocks = window.wp.blocks.parse( markup );
		const headings = [];
		const collect = ( blocks ) => blocks.forEach( ( block ) => {
			if ( block.name === 'core/heading' && block.attributes.className === 'subcommittee-tile__title' ) {
				headings.push( block.clientId );
			}
			collect( block.innerBlocks );
		} );
		collect( initialBlocks );
		window.peppermintWindowTitleEditorTest = { headings, serialized: '' };
		function Canvas() {
			window.peppermintWindowTitleEditorTest.actions = window.wp.data.useDispatch( window.wp.blockEditor.store );
			return el( window.wp.blockEditor.BlockList );
		}
		function Editor() {
			const [ blocks, setBlocks ] = useState( initialBlocks );
			window.peppermintWindowTitleEditorTest.serialized = window.wp.blocks.serialize( blocks );
			return el( window.wp.blockEditor.BlockEditorProvider, {
				value: blocks, onInput: setBlocks, onChange: setBlocks, settings: { hasFixedToolbar: true }
			}, el( Canvas ) );
		}
		window.peppermintWindowTitleEditorTestRoot = createRoot( doc.getElementById( 'editor' ) );
		window.peppermintWindowTitleEditorTestRoot.render( el( Editor ) );
	}, { markup, css } );
	try {
		const tiles = validationPage.frameLocator( '#peppermint-window-title-editor-test' ).locator( '.wp-block-cover.subcommittee-tile' );
		await expect( tiles ).toHaveCount( 3 );
		await expect( tiles.nth( 0 ) ).not.toHaveAttribute( 'data-peppermint-window-title' );
		await expect( tiles.nth( 1 ) ).toHaveAttribute( 'data-peppermint-window-title', 'Group two' );
		await expect( tiles.nth( 2 ) ).toHaveAttribute( 'data-peppermint-window-title', 'Group three' );
		expect( await tiles.nth( 1 ).evaluate( ( tile ) => getComputedStyle( tile, '::before' ).content ) ).toBe( '"Group two" / ""' );
		await validationPage.evaluate( () => {
			const state = window.peppermintWindowTitleEditorTest;
			state.actions.updateBlockAttributes( state.headings[ 1 ], { content: '<a href="/groups/">Local <em>Group</em></a>' } );
		} );
		await expect( tiles.nth( 1 ) ).toHaveAttribute( 'data-peppermint-window-title', 'Local Group' );
		await expect.poll( () => validationPage.evaluate( () => window.peppermintWindowTitleEditorTest.serialized ) ).toContain( 'Local <em>Group</em>' );
		expect( await validationPage.evaluate( () => window.peppermintWindowTitleEditorTest.serialized ), 'The editor title must not reach saved markup.' ).not.toContain( 'data-peppermint-window-title' );
	} finally {
		await validationPage.evaluate( () => {
			window.peppermintWindowTitleEditorTestRoot?.unmount();
			delete window.peppermintWindowTitleEditorTestRoot;
			delete window.peppermintWindowTitleEditorTest;
			document.getElementById( 'peppermint-window-title-editor-test' )?.remove();
		} );
		await validationPage.unroute( '**/wp/v2/**' );
	}
	expect( runtimeErrors, 'Window titles must not raise runtime errors.' ).toEqual( [] );
	expect( consoleErrors, 'Window titles must not emit console errors.' ).toEqual( [] );
} );
