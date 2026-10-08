import assert from 'node:assert/strict';
import test from 'node:test';
import { buildProfile, componentNames, narrowingVariables, parseProfileArguments } from './profile-options.mjs';

const environment = { PEPPERMINT_TEST_BASE_URL: 'http://example.test/', PATH: 'unchanged', CI: 'true' };
const standardProjects = [ 'small-phone-chromium', 'tablet-chromium', 'wide-desktop-chromium' ];

test( 'smoke checks five representative routes with axe and geometry at three viewports', () => {
	const plan = buildProfile( [ 'smoke' ], environment );
	assert.deepEqual( plan.projects, standardProjects );
	assert.deepEqual( plan.files, [ 'responsive.spec.mjs', 'accessibility.spec.mjs' ] );
	assert.equal( plan.routes.length, 5 );
	assert.ok( plan.routes.includes( '/' ) );
	assert.equal( plan.environment.PEPPERMINT_TEST_PATHS, plan.environment.PEPPERMINT_RESPONSIVE_TEST_PATHS );
	assert.ok( plan.args.includes( '--workers=2' ) );
} );

test( 'shared uses every spec at three viewports; full preserves the entire configured matrix', () => {
	const shared = buildProfile( [ 'shared' ], environment );
	const full = buildProfile( [ 'full' ], environment );
	assert.deepEqual( shared.projects, standardProjects );
	assert.deepEqual( shared.files, [] );
	assert.equal( shared.routes, null );
	assert.equal( full.projects, null );
	assert.equal( full.routes, null );
	assert.deepEqual( full.files, [] );
	assert.equal( full.args.some( ( argument ) => argument.startsWith( '--project=' ) ), false );
} );

const expectedComponents = {
	cards: { files: [ 'card-titles.spec.mjs' ], routes: 2, extra: 'narrow-three-column-chromium' },
	hero: { files: [ 'landing-hero.spec.mjs' ], routes: 1 },
	quotes: { files: [ 'pullquote.spec.mjs' ], routes: 1 },
	boards: { files: [ 'skills-board.spec.mjs' ], routes: 2 },
	signal: { files: [ 'signal-rail.spec.mjs' ], routes: 1 },
	appearance: { files: [ 'appearance-switcher.spec.mjs' ], routes: 1, extra: 'mobile-chromium' },
	query: { files: [ 'content-resilience.spec.mjs', 'design-system.spec.mjs' ], routes: 7, extra: 'narrow-three-column-chromium' },
	layout: { files: [ 'content-resilience.spec.mjs', 'design-system.spec.mjs' ], routes: 12 }
};

test( 'every component has an explicit reviewed mapping', () => {
	assert.deepEqual( [ ...componentNames ].sort(), Object.keys( expectedComponents ).sort() );
} );

for ( const [ component, expected ] of Object.entries( expectedComponents ) ) {
	test( `${ component } retains its entire component contract plus affected-route axe and geometry`, () => {
		const plan = buildProfile( [ 'component', component ], environment );
		assert.deepEqual( plan.files, [ ...expected.files, 'responsive.spec.mjs', 'accessibility.spec.mjs' ] );
		assert.equal( plan.routes.length, expected.routes );
		assert.equal( new Set( plan.routes ).size, plan.routes.length );
		assert.ok( plan.routes.every( ( route ) => route.startsWith( '/' ) && ! route.startsWith( '//' ) ) );
		assert.deepEqual( plan.projects, [ ...standardProjects, ...( expected.extra ? [ expected.extra ] : [] ) ] );
		assert.equal( plan.environment.PEPPERMINT_TEST_PATHS, plan.routes.join( ',' ) );
		assert.equal( plan.environment.PEPPERMINT_RESPONSIVE_TEST_PATHS, plan.routes.join( ',' ) );
		assert.equal( plan.environment.PEPPERMINT_RESPONSIVE_SCHEMES, 'light,dark' );
	} );
}

for ( const profile of [ 'smoke', 'shared', 'full', ...componentNames.map( ( name ) => `component ${ name }` ) ] ) {
	test( `${ profile } resets every inherited route and appearance narrowing override`, () => {
		const inherited = { ...environment };
		for ( const key of narrowingVariables ) {
			inherited[ key ] = key.endsWith( 'SCHEMES' ) ? 'dark' : '/old-route/';
			inherited[ key.toLowerCase() ] = 'mixed-case-stale-value';
		}
		const before = { ...inherited };
		const plan = buildProfile( profile.split( ' ' ), inherited );
		assert.deepEqual( inherited, before, 'Do not change the calling process environment.' );
		assert.equal( plan.environment.PEPPERMINT_TEST_BASE_URL, environment.PEPPERMINT_TEST_BASE_URL );
		assert.equal( plan.environment.PATH, environment.PATH );
		assert.equal( plan.environment.CI, environment.CI );
		for ( const key of narrowingVariables ) {
			assert.equal( plan.environment[ key.toLowerCase() ], undefined );
			const expected = key === 'PEPPERMINT_RESPONSIVE_SCHEMES' ? 'light,dark'
				: [ 'PEPPERMINT_TEST_PATHS', 'PEPPERMINT_RESPONSIVE_TEST_PATHS' ].includes( key ) && plan.routes ? plan.routes.join( ',' ) : undefined;
			assert.equal( plan.environment[ key ], expected );
		}
	} );
}

test( 'list, headed, and positive worker arguments are passed explicitly', () => {
	const plan = buildProfile( [ 'component', 'quotes', '--list', '--headed', '--workers', '1' ], environment );
	assert.ok( plan.args.includes( '--list' ) );
	assert.ok( plan.args.includes( '--headed' ) );
	assert.ok( plan.args.includes( '--workers=1' ) );
	assert.equal( parseProfileArguments( [ 'full', '--workers=3' ] ).workers, 3 );
} );

test( 'unknown, ambiguous, empty, and coverage-narrowing arguments fail closed', () => {
	for ( const args of [
		[], [ 'unknown' ], [ 'component' ], [ 'component', '' ], [ 'component', 'typo' ],
		[ 'component', '__proto__' ], [ 'component', 'toString' ],
		[ 'smoke', 'cards' ], [ 'full', '--grep', 'nothing' ], [ 'shared', '--project=desktop-chromium' ],
		[ 'full', '--pass-with-no-tests' ], [ 'full', '--only-changed' ],
		[ 'full', '--workers=0' ], [ 'full', '--workers=-1' ], [ 'full', '--workers=1.5' ],
		[ 'full', '--workers=50%' ], [ 'full', '--workers=' ], [ 'full', '--workers' ],
		[ 'full', '--workers=99999999999999999999' ],
		[ 'full', '--list', '--list' ], [ 'full', '--workers=1', '--workers=2' ]
	] ) {
		assert.throws( () => buildProfile( args, environment ), undefined, JSON.stringify( args ) );
	}
} );

test( 'plans are independent: changing a returned list cannot alter a future profile', () => {
	const first = buildProfile( [ 'component', 'cards' ], environment );
	first.routes.length = 0;
	first.projects.length = 0;
	first.files.length = 0;
	const next = buildProfile( [ 'component', 'cards' ], environment );
	assert.equal( next.routes.length, 2 );
	assert.equal( next.projects.length, 4 );
	assert.equal( next.files.length, 3 );
} );
