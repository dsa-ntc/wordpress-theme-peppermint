import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const route = process.env.NTC_APPEARANCE_TEST_PATH || '/';
const storageKey = 'ntc-color-scheme';
const controlSelector = '.wp-block-ntc-block-theme-switcher';

async function openPage( page, scheme = 'light' ) {
	await page.emulateMedia( { colorScheme: scheme } );
	const response = await page.goto( route, { waitUntil: 'domcontentloaded' } );
	expect( response, `No response for ${ route }` ).not.toBeNull();
	expect( response.status(), `Unexpected response for ${ route }` ).toBe( 200 );
	await page.evaluate( () => document.fonts.ready );
	await expect( page.locator( '[data-ntc-theme-switcher]' ) ).toBeVisible();
}

async function openChoices( page ) {
	const button = page.locator( '[data-ntc-theme-switcher]' );
	if ( 'true' !== await button.getAttribute( 'aria-expanded' ) ) {
		await button.click();
	}
	await expect( button ).toHaveAttribute( 'aria-expanded', 'true' );
	return page.locator( `${ controlSelector } fieldset` );
}

test( 'explicit choices persist and System restores live device preference', async ( { page } ) => {
	await openPage( page, 'dark' );
	await expect( page.locator( 'html' ) ).toHaveAttribute( 'data-ntc-resolved-scheme', 'dark' );
	const choices = await openChoices( page );
	await expect( choices.getByRole( 'radio', { exact: true, name: 'System' } ) ).toBeChecked();
	await choices.getByRole( 'radio', { exact: true, name: 'Light' } ).check();
	await expect( page.locator( 'html' ) ).toHaveAttribute( 'data-ntc-color-scheme', 'light' );
	expect( await page.evaluate( ( key ) => localStorage.getItem( key ), storageKey ) ).toBe( 'light' );

	await page.reload( { waitUntil: 'domcontentloaded' } );
	await expect( page.locator( 'html' ) ).toHaveAttribute( 'data-ntc-resolved-scheme', 'light' );
	await page.emulateMedia( { colorScheme: 'light' } );
	await page.emulateMedia( { colorScheme: 'dark' } );
	await expect( page.locator( 'html' ) ).toHaveAttribute( 'data-ntc-resolved-scheme', 'light' );

	await openChoices( page );
	await page.getByRole( 'radio', { exact: true, name: 'Dark' } ).check();
	await expect( page.locator( 'html' ) ).toHaveAttribute( 'data-ntc-color-scheme', 'dark' );
	await page.getByRole( 'radio', { exact: true, name: 'System' } ).check();
	expect( await page.evaluate( ( key ) => localStorage.getItem( key ), storageKey ) ).toBeNull();
	await expect( page.locator( 'html' ) ).not.toHaveAttribute( 'data-ntc-color-scheme' );
	await expect( page.locator( 'html' ) ).toHaveAttribute( 'data-ntc-resolved-scheme', 'dark' );
	await page.emulateMedia( { colorScheme: 'light' } );
	await expect( page.locator( 'html' ) ).toHaveAttribute( 'data-ntc-resolved-scheme', 'light' );
} );

test( 'native radios and disclosure support keyboard selection and dismissal', async ( { page } ) => {
	await openPage( page );
	const button = page.locator( '[data-ntc-theme-switcher]' );
	await expect( button ).not.toHaveAttribute( 'aria-pressed' );
	await button.focus();
	await page.keyboard.press( 'Enter' );
	const automatic = page.getByRole( 'radio', { exact: true, name: 'System' } );
	await expect( automatic ).toBeFocused();
	await page.keyboard.press( 'ArrowDown' );
	await expect( page.getByRole( 'radio', { exact: true, name: 'Light' } ) ).toBeChecked();
	await page.keyboard.press( 'ArrowDown' );
	await expect( page.getByRole( 'radio', { exact: true, name: 'Dark' } ) ).toBeChecked();
	await expect( button ).toHaveAttribute( 'aria-expanded', 'true' );
	await page.keyboard.press( 'Escape' );
	await expect( button ).toHaveAttribute( 'aria-expanded', 'false' );
	await expect( button ).toBeFocused();
	await expect( page.locator( '[data-ntc-theme-panel]' ) ).toBeHidden();
	await page.keyboard.press( 'Space' );
	await page.keyboard.press( 'Tab' );
	await expect( button ).toHaveAttribute( 'aria-expanded', 'false' );
	await openChoices( page );
	await page.keyboard.press( 'Shift+Tab' );
	await expect( button ).toBeFocused();
	await expect( button ).toHaveAttribute( 'aria-expanded', 'true' );
	await page.keyboard.press( 'Shift+Tab' );
	await expect( button ).toHaveAttribute( 'aria-expanded', 'false' );
	await openChoices( page );
	await page.locator( '[data-ntc-appearance-help]' ).click();
	await expect( button ).toHaveAttribute( 'aria-expanded', 'true' );
	await page.keyboard.press( 'Tab' );
	await expect( button ).toHaveAttribute( 'aria-expanded', 'false' );
	await openChoices( page );
	await page.locator( 'main' ).click( { position: { x: 8, y: 8 } } );
	await expect( button ).toHaveAttribute( 'aria-expanded', 'false' );
} );

for ( const scheme of [ 'light', 'dark' ] ) {
	test( `${ scheme } full option labels activate by text and trailing padding`, async ( { page, isMobile } ) => {
		await openPage( page, scheme );
		const choices = await openChoices( page );
		const button = page.locator( '[data-ntc-theme-switcher]' );
		await page.evaluate( () => {
			window.ntcAppearanceLabelEvents = [];
			document.documentElement.addEventListener( 'ntc:color-scheme-change', ( event ) => window.ntcAppearanceLabelEvents.push( event.detail.scheme ) );
		} );

		for ( const [ value, target ] of [ [ 'dark', 'text' ], [ 'light', 'padding' ], [ 'system', 'text' ], [ 'dark', 'padding' ] ] ) {
			const label = choices.locator( 'label' ).filter( { has: page.locator( `input[value="${ value }"]` ) } );
			const radio = label.getByRole( 'radio' );
			if ( 'text' === target ) {
				if ( isMobile ) {
					await label.locator( 'span' ).tap();
				} else {
					await label.locator( 'span' ).click();
				}
			} else {
				const box = await label.boundingBox();
				expect( box ).not.toBeNull();
				const position = { x: box.width - 4, y: box.height / 2 };
				if ( isMobile ) {
					await label.tap( { position } );
				} else {
					// Split the press/release to catch menus that hide before label activation.
					await page.mouse.move( box.x + position.x, box.y + position.y );
					await page.mouse.down();
					await expect( button ).toHaveAttribute( 'aria-expanded', 'true' );
					await page.mouse.up();
				}
			}
			await expect( radio ).toBeChecked();
			await expect( radio ).toBeFocused();
			await expect( button ).toHaveAttribute( 'aria-expanded', 'true' );
			await expect( page.locator( 'html' ) ).toHaveAttribute( 'data-ntc-resolved-scheme', 'system' === value ? scheme : value );
			expect( await page.evaluate( ( key ) => localStorage.getItem( key ), storageKey ) ).toBe( 'system' === value ? null : value );
		}
		expect( await page.evaluate( () => window.ntcAppearanceLabelEvents ) ).toEqual( [ 'dark', 'light', 'system', 'dark' ] );
	} );

	test( `${ scheme } open appearance choices remain accessible and within the viewport`, async ( { page } ) => {
		await openPage( page, scheme );
		await openChoices( page );
		const panel = page.locator( '[data-ntc-theme-panel]' );
		const geometry = await panel.evaluate( ( element ) => {
			const rect = element.getBoundingClientRect();
			return {
				left: rect.left,
				right: rect.right,
				viewport: document.documentElement.clientWidth,
				rows: [ ...element.querySelectorAll( 'label' ) ].map( ( label ) => label.getBoundingClientRect().height )
			};
		} );
		expect( geometry.left ).toBeGreaterThanOrEqual( 0 );
		expect( geometry.right ).toBeLessThanOrEqual( geometry.viewport );
		for ( const height of geometry.rows ) {
			expect( height ).toBeGreaterThanOrEqual( 43.5 );
		}
		const results = await new AxeBuilder( { page } )
			.include( controlSelector )
			.withTags( [ 'wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa' ] )
			.analyze();
		expect( results.violations.map( ( violation ) => ( { id: violation.id, nodes: violation.nodes.map( ( node ) => node.target ) } ) ) ).toEqual( [] );
	} );

	test( `${ scheme } site default is preserved when clearing a visitor override`, async ( { page } ) => {
		await openPage( page, 'dark' === scheme ? 'light' : 'dark' );
		// Model the editor-selected default without changing saved Global Styles.
		await page.addStyleTag( { content: `:root:not([data-ntc-color-scheme]) { color-scheme: ${ scheme }; }` } );
		await openChoices( page );
		await expect( page.getByRole( 'radio', { exact: true, name: 'Site default' } ) ).toBeChecked();
		await page.getByRole( 'radio', { exact: true, name: 'dark' === scheme ? 'Light' : 'Dark' } ).check();
		await page.getByText( 'Site default', { exact: true } ).click();
		await expect( page.getByRole( 'radio', { exact: true, name: 'Site default' } ) ).toBeChecked();
		await expect( page.locator( 'html' ) ).not.toHaveAttribute( 'data-ntc-color-scheme' );
		await expect( page.locator( 'html' ) ).toHaveAttribute( 'data-ntc-resolved-scheme', scheme );
		expect( await page.locator( 'html' ).evaluate( ( element ) => getComputedStyle( element ).colorScheme ) ).toBe( scheme );
	} );
}

test( 'appearance remains usable when storage is unavailable', async ( { page } ) => {
	const errors = [];
	page.on( 'pageerror', ( error ) => errors.push( error.message ) );
	await page.addInitScript( () => {
		Object.defineProperty( window, 'localStorage', {
			get() {
				throw new DOMException( 'Storage is blocked for this test.', 'SecurityError' );
			}
		} );
	} );
	await openPage( page );
	await openChoices( page );
	await page.getByRole( 'radio', { exact: true, name: 'Dark' } ).check();
	await expect( page.locator( 'html' ) ).toHaveAttribute( 'data-ntc-resolved-scheme', 'dark' );
	await page.getByRole( 'radio', { exact: true, name: 'System' } ).check();
	await expect( page.locator( 'html' ) ).toHaveAttribute( 'data-ntc-resolved-scheme', 'light' );
	expect( errors ).toEqual( [] );
} );

test( 'unknown stored values use System and change events describe the explicit selection', async ( { page } ) => {
	await page.addInitScript( ( key ) => localStorage.setItem( key, 'unrecognized-value' ), storageKey );
	await openPage( page );
	await expect( page.locator( 'html' ) ).not.toHaveAttribute( 'data-ntc-color-scheme' );
	await page.evaluate( () => {
		window.ntcAppearanceTestEvents = [];
		document.documentElement.addEventListener( 'ntc:color-scheme-change', ( event ) => window.ntcAppearanceTestEvents.push( event.detail ) );
	} );
	await openChoices( page );
	await page.getByRole( 'radio', { exact: true, name: 'Dark' } ).check();
	await page.getByRole( 'radio', { exact: true, name: 'System' } ).check();
	expect( await page.evaluate( () => window.ntcAppearanceTestEvents ) ).toEqual( [
		{ resolvedScheme: 'dark', scheme: 'dark' },
		{ resolvedScheme: 'light', scheme: 'system' }
	] );
} );

test( 'appearance updates across tabs including removal of the stored override', async ( { context, page } ) => {
	await openPage( page );
	const otherPage = await context.newPage();
	await openPage( otherPage );
	await openChoices( page );
	await page.getByRole( 'radio', { exact: true, name: 'Dark' } ).check();
	await expect( otherPage.locator( 'html' ) ).toHaveAttribute( 'data-ntc-resolved-scheme', 'dark' );
	await page.getByRole( 'radio', { exact: true, name: 'System' } ).check();
	await expect( otherPage.locator( 'html' ) ).not.toHaveAttribute( 'data-ntc-color-scheme' );
	await expect( otherPage.locator( 'html' ) ).toHaveAttribute( 'data-ntc-resolved-scheme', 'light' );
	await page.getByRole( 'radio', { exact: true, name: 'Dark' } ).check();
	await expect( otherPage.locator( 'html' ) ).toHaveAttribute( 'data-ntc-resolved-scheme', 'dark' );
	await page.evaluate( () => localStorage.clear() );
	await expect( otherPage.locator( 'html' ) ).not.toHaveAttribute( 'data-ntc-color-scheme' );
	await expect( otherPage.locator( 'html' ) ).toHaveAttribute( 'data-ntc-resolved-scheme', 'light' );
	await otherPage.close();
} );

test( 'right-to-left appearance choices keep native labels, focus, and viewport containment', async ( { page } ) => {
	await openPage( page );
	await page.locator( 'html' ).evaluate( ( element ) => { element.dir = 'rtl'; } );
	await openChoices( page );
	await expect( page.getByRole( 'radio', { exact: true, name: 'System' } ) ).toBeFocused();
	await page.keyboard.press( 'ArrowDown' );
	await expect( page.getByRole( 'radio', { exact: true, name: 'Light' } ) ).toBeChecked();
	await page.getByText( 'Dark', { exact: true } ).click();
	await expect( page.getByRole( 'radio', { exact: true, name: 'Dark' } ) ).toBeChecked();
	await expect( page.locator( '[data-ntc-theme-switcher]' ) ).toHaveAttribute( 'aria-expanded', 'true' );
	const geometry = await page.locator( '[data-ntc-theme-panel]' ).evaluate( ( panel ) => {
		const rect = panel.getBoundingClientRect();
		return { direction: getComputedStyle( panel ).direction, left: rect.left, right: rect.right, viewport: document.documentElement.clientWidth };
	} );
	expect( geometry.direction ).toBe( 'rtl' );
	expect( geometry.left ).toBeGreaterThanOrEqual( 0 );
	expect( geometry.right ).toBeLessThanOrEqual( geometry.viewport );
} );

test( 'expanded translated choices remain readable at 200% text in forced colors', async ( { page } ) => {
	await page.emulateMedia( { forcedColors: 'active', reducedMotion: 'reduce' } );
	await openPage( page );
	await openChoices( page );
	await page.locator( '[data-ntc-theme-panel]' ).evaluate( ( panel ) => {
		document.documentElement.style.fontSize = '200%';
		panel.querySelectorAll( 'label span' ).forEach( ( label ) => {
			label.textContent = `${ label.textContent } — Erweiterte Darstellungseinstellung`;
		} );
	} );
	const report = await page.locator( '[data-ntc-theme-panel]' ).evaluate( ( panel ) => {
		const rect = panel.getBoundingClientRect();
		return {
			left: rect.left,
			right: rect.right,
			viewport: document.documentElement.clientWidth,
			overflow: panel.scrollWidth - panel.clientWidth,
			clippedLabels: [ ...panel.querySelectorAll( 'label' ) ].filter( ( label ) => label.scrollHeight > label.clientHeight + 1 || label.scrollWidth > label.clientWidth + 1 ).length
		};
	} );
	expect( report.left, JSON.stringify( report ) ).toBeGreaterThanOrEqual( 0 );
	expect( report.right, JSON.stringify( report ) ).toBeLessThanOrEqual( report.viewport );
	expect( report.overflow, JSON.stringify( report ) ).toBeLessThanOrEqual( 1 );
	expect( report.clippedLabels, JSON.stringify( report ) ).toBe( 0 );
	await page.getByText( 'Light — Erweiterte Darstellungseinstellung', { exact: true } ).click();
	await expect( page.getByRole( 'radio', { exact: true, name: 'Light — Erweiterte Darstellungseinstellung' } ) ).toBeChecked();
	await expect( page.locator( '[data-ntc-theme-switcher]' ) ).toHaveAttribute( 'aria-expanded', 'true' );
	await page.keyboard.press( 'Escape' );
	await expect( page.locator( '[data-ntc-theme-switcher]' ) ).toBeFocused();
} );

test.describe( 'CSS-only appearance', () => {
	test.use( { javaScriptEnabled: false } );

	for ( const scheme of [ 'light', 'dark' ] ) {
		test( `${ scheme } honors the device while the inactive control stays hidden`, async ( { page } ) => {
			await page.emulateMedia( { colorScheme: scheme } );
			await page.goto( route, { waitUntil: 'domcontentloaded' } );
			await expect( page.locator( '[data-ntc-theme-switcher]' ) ).toBeHidden();
			await expect( page.locator( '[data-ntc-theme-panel]' ) ).toBeHidden();
			const initialColor = await page.locator( 'body' ).evaluate( ( element ) => getComputedStyle( element ).backgroundColor );
			await page.emulateMedia( { colorScheme: 'light' === scheme ? 'dark' : 'light' } );
			await expect.poll( () => page.locator( 'body' ).evaluate( ( element ) => getComputedStyle( element ).backgroundColor ) ).not.toBe( initialColor );
		} );
	}
} );
