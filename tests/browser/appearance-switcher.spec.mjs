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
	const toggle = page.getByRole( 'button', { exact: true, name: 'Dark mode' } );
	await expect( toggle ).toBeVisible();
	return toggle;
}

const html = ( page ) => page.locator( 'html' );
const stored = ( page ) => page.evaluate( ( key ) => localStorage.getItem( key ), storageKey );

test( 'follows the device until toggled, and toggling back resumes following it', async ( { page } ) => {
	const toggle = await openPage( page, 'dark' );
	await expect( html( page ) ).toHaveAttribute( 'data-ntc-resolved-scheme', 'dark' );
	await expect( toggle ).toHaveAttribute( 'aria-pressed', 'true' );
	await page.emulateMedia( { colorScheme: 'light' } );
	await expect( html( page ) ).toHaveAttribute( 'data-ntc-resolved-scheme', 'light' );
	await expect( toggle ).toHaveAttribute( 'aria-pressed', 'false' );

	await toggle.click();
	await expect( html( page ) ).toHaveAttribute( 'data-ntc-color-scheme', 'dark' );
	await expect( toggle ).toHaveAttribute( 'aria-pressed', 'true' );
	expect( await stored( page ) ).toBe( 'dark' );

	await page.reload( { waitUntil: 'domcontentloaded' } );
	await expect( html( page ) ).toHaveAttribute( 'data-ntc-resolved-scheme', 'dark' );
	await page.emulateMedia( { colorScheme: 'dark' } );
	await page.emulateMedia( { colorScheme: 'light' } );
	await expect( html( page ) ).toHaveAttribute( 'data-ntc-resolved-scheme', 'dark' );

	// Light now matches the device, so the override is cleared.
	await toggle.click();
	await expect( html( page ) ).not.toHaveAttribute( 'data-ntc-color-scheme' );
	expect( await stored( page ) ).toBeNull();
	await page.emulateMedia( { colorScheme: 'dark' } );
	await expect( html( page ) ).toHaveAttribute( 'data-ntc-resolved-scheme', 'dark' );
} );

test( 'native button toggles from the keyboard', async ( { page } ) => {
	const toggle = await openPage( page );
	await toggle.focus();
	await page.keyboard.press( 'Enter' );
	await expect( toggle ).toHaveAttribute( 'aria-pressed', 'true' );
	await page.keyboard.press( 'Space' );
	await expect( toggle ).toHaveAttribute( 'aria-pressed', 'false' );
	await expect( toggle ).toBeFocused();
} );

for ( const scheme of [ 'light', 'dark' ] ) {
	test( `${ scheme } toggle is accessible and at least 44px`, async ( { page } ) => {
		const toggle = await openPage( page, scheme );
		const box = await toggle.boundingBox();
		expect( box.width ).toBeGreaterThanOrEqual( 43.5 );
		expect( box.height ).toBeGreaterThanOrEqual( 43.5 );
		const results = await new AxeBuilder( { page } )
			.include( controlSelector )
			.withTags( [ 'wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa' ] )
			.analyze();
		expect( results.violations.map( ( violation ) => ( { id: violation.id, nodes: violation.nodes.map( ( node ) => node.target ) } ) ) ).toEqual( [] );
	} );

	test( `${ scheme } site default replaces the device setting as the automatic appearance`, async ( { page } ) => {
		const opposite = 'dark' === scheme ? 'light' : 'dark';
		const toggle = await openPage( page, opposite );
		// Model an editor-selected Light or Dark style without changing saved Global Styles.
		await page.addStyleTag( { content: `:root:not([data-ntc-color-scheme]) { color-scheme: ${ scheme }; }` } );
		await toggle.click();
		await expect( html( page ) ).toHaveAttribute( 'data-ntc-color-scheme', opposite );
		await toggle.click();
		await expect( html( page ) ).not.toHaveAttribute( 'data-ntc-color-scheme' );
		await expect( html( page ) ).toHaveAttribute( 'data-ntc-resolved-scheme', scheme );
		expect( await html( page ).evaluate( ( element ) => getComputedStyle( element ).colorScheme ) ).toBe( scheme );
	} );
}

test( 'toggle works when storage is unavailable', async ( { page } ) => {
	const errors = [];
	page.on( 'pageerror', ( error ) => errors.push( error.message ) );
	await page.addInitScript( () => {
		Object.defineProperty( window, 'localStorage', {
			get() {
				throw new DOMException( 'Storage is blocked for this test.', 'SecurityError' );
			}
		} );
	} );
	const toggle = await openPage( page );
	await toggle.click();
	await expect( html( page ) ).toHaveAttribute( 'data-ntc-resolved-scheme', 'dark' );
	await toggle.click();
	await expect( html( page ) ).toHaveAttribute( 'data-ntc-resolved-scheme', 'light' );
	expect( errors ).toEqual( [] );
} );

test( 'unknown stored values follow the device', async ( { page } ) => {
	await page.addInitScript( ( key ) => localStorage.setItem( key, 'unrecognized-value' ), storageKey );
	await openPage( page, 'dark' );
	await expect( html( page ) ).not.toHaveAttribute( 'data-ntc-color-scheme' );
	await expect( html( page ) ).toHaveAttribute( 'data-ntc-resolved-scheme', 'dark' );
} );

test( 'appearance updates across tabs including removal of the stored override', async ( { context, page } ) => {
	const toggle = await openPage( page );
	const otherPage = await context.newPage();
	await openPage( otherPage );
	await toggle.click();
	await expect( html( otherPage ) ).toHaveAttribute( 'data-ntc-resolved-scheme', 'dark' );
	await toggle.click();
	await expect( html( otherPage ) ).not.toHaveAttribute( 'data-ntc-color-scheme' );
	await expect( html( otherPage ) ).toHaveAttribute( 'data-ntc-resolved-scheme', 'light' );
	await toggle.click();
	await page.evaluate( () => localStorage.clear() );
	await expect( html( otherPage ) ).toHaveAttribute( 'data-ntc-resolved-scheme', 'light' );
	await otherPage.close();
} );

test( 'toggle stays visible and operable in forced colors', async ( { page } ) => {
	await page.emulateMedia( { forcedColors: 'active', reducedMotion: 'reduce' } );
	const toggle = await openPage( page );
	await toggle.click();
	await expect( toggle ).toHaveAttribute( 'aria-pressed', 'true' );
} );

test.describe( 'CSS-only appearance', () => {
	test.use( { javaScriptEnabled: false } );

	for ( const scheme of [ 'light', 'dark' ] ) {
		test( `${ scheme } honors the device while the inactive toggle stays hidden`, async ( { page } ) => {
			await page.emulateMedia( { colorScheme: scheme } );
			await page.goto( route, { waitUntil: 'domcontentloaded' } );
			await expect( page.locator( '[data-ntc-theme-switcher]' ) ).toBeHidden();
			const initialColor = await page.locator( 'body' ).evaluate( ( element ) => getComputedStyle( element ).backgroundColor );
			await page.emulateMedia( { colorScheme: 'light' === scheme ? 'dark' : 'light' } );
			await expect.poll( () => page.locator( 'body' ).evaluate( ( element ) => getComputedStyle( element ).backgroundColor ) ).not.toBe( initialColor );
		} );
	}
} );
