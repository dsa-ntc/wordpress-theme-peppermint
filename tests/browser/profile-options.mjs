// Explicit profiles cover served PHP/CSS that a JavaScript import graph cannot map.
const standardProjects = [ 'small-phone-chromium', 'tablet-chromium', 'wide-desktop-chromium' ];
const gridProjects = [ ...standardProjects, 'narrow-three-column-chromium' ];
const touchProjects = [ ...standardProjects, 'mobile-chromium' ];
const routeChecks = [ 'responsive.spec.mjs', 'accessibility.spec.mjs' ];
const smokeRoutes = [
	'/',
	'/theme-preview/landing-hero/',
	'/theme-preview/cards-and-frames/',
	'/theme-preview-editorial-block-sampler/',
	'/theme-preview/project-skills-boards/'
];

const components = {
	cards: {
		files: [ 'card-titles.spec.mjs' ], projects: gridProjects,
		routes: [ '/', '/theme-preview/cards-and-frames/' ]
	},
	hero: {
		files: [ 'landing-hero.spec.mjs' ],
		routes: [ '/theme-preview/landing-hero/' ]
	},
	quotes: {
		files: [ 'pullquote.spec.mjs' ],
		routes: [ '/theme-preview-editorial-block-sampler/' ]
	},
	boards: {
		files: [ 'skills-board.spec.mjs' ],
		routes: [ '/theme-preview/project-skills-boards/', '/theme-preview/project-skills-interest/' ]
	},
	signal: {
		files: [ 'signal-rail.spec.mjs' ],
		routes: [ '/theme-preview/section-styles/' ]
	},
	appearance: {
		files: [ 'appearance-switcher.spec.mjs' ], projects: touchProjects,
		routes: [ '/' ]
	},
	query: {
		files: [ 'content-resilience.spec.mjs', 'design-system.spec.mjs' ], projects: gridProjects,
		routes: [
			'/', '/theme-preview-posts/', '/theme-preview/query-components/', '/category/theme-preview/',
			'/theme-preview-missing-image-state/', '/?s=Theme%20Preview',
			'/?s=ntc-preview-guaranteed-no-match&post_type=post'
		]
	},
	layout: {
		files: [ 'content-resilience.spec.mjs', 'design-system.spec.mjs' ],
		routes: [
			'/', '/theme-preview/landing-hero/', '/theme-preview/text-intro/',
			'/theme-preview/media-left/', '/theme-preview/media-right/', '/theme-preview/project-starter/',
			'/theme-preview/section-styles/', '/about/', '/theme-preview-interoperability/',
			'/openslides/', '/con-dashboard/', '/?s=ntc-preview-guaranteed-no-match&post_type=post'
		]
	}
};

export const componentNames = Object.freeze( Object.keys( components ) );
export const narrowingVariables = Object.freeze( [
	'NTC_TEST_PATHS', 'NTC_RESPONSIVE_TEST_PATHS', 'NTC_RESPONSIVE_SCHEMES',
	'NTC_EXPECTED_404_PATHS', 'NTC_CARD_TEST_PATH', 'NTC_LANDING_HERO_TEST_PATH',
	'NTC_SIGNAL_RAIL_TEST_PATH', 'NTC_APPEARANCE_TEST_PATH', 'NTC_PULLQUOTE_TEST_PATH'
] );

export function parseProfileArguments( argv ) {
	const [ profile, ...rest ] = argv;
	if ( ! [ 'smoke', 'component', 'shared', 'full' ].includes( profile ) ) {
		throw new Error( 'Choose smoke, component NAME, shared, or full.' );
	}
	const component = profile === 'component' ? rest.shift() : undefined;
	if ( profile === 'component' && ! Object.hasOwn( components, component ) ) {
		throw new Error( `Choose one component: ${ componentNames.join( ', ' ) }.` );
	}
	const options = { profile, component, list: false, headed: false, workers: 2 };
	const supplied = new Set();
	for ( let index = 0; index < rest.length; index++ ) {
		const argument = rest[ index ];
		let key;
		if ( argument === '--list' || argument === '--headed' ) {
			key = argument.slice( 2 );
			options[ key ] = true;
		} else if ( argument === '--workers' || argument.startsWith( '--workers=' ) ) {
			key = 'workers';
			const value = argument === '--workers' ? rest[ ++index ] : argument.slice( '--workers='.length );
			if ( ! /^[1-9]\d*$/u.test( value || '' ) || ! Number.isSafeInteger( Number( value ) ) ) {
				throw new Error( '--workers must be a positive integer.' );
			}
			options.workers = Number( value );
		} else {
			throw new Error( `Unsupported profile argument: ${ argument }. Allowed: --list, --headed, --workers=N.` );
		}
		if ( supplied.has( key ) ) {
			throw new Error( `Do not repeat --${ key }.` );
		}
		supplied.add( key );
	}
	return options;
}

export function buildProfile( argv, inheritedEnvironment = process.env ) {
	const options = parseProfileArguments( argv );
	const environment = { ...inheritedEnvironment };
	// Windows environment names are case-insensitive; do not retain mixed-case overrides.
	for ( const key of Object.keys( environment ) ) {
		if ( narrowingVariables.includes( key.toUpperCase() ) ) {
			delete environment[ key ];
		}
	}

	let files = [];
	let routes = null;
	let projects = options.profile === 'full' ? null : [ ...standardProjects ];
	if ( options.profile === 'smoke' ) {
		files = [ ...routeChecks ];
		routes = [ ...smokeRoutes ];
	} else if ( options.profile === 'component' ) {
		const component = components[ options.component ];
		files = [ ...component.files, ...routeChecks ];
		routes = [ ...component.routes ];
		projects = [ ...( component.projects || standardProjects ) ];
	}
	if ( routes !== null ) {
		if ( routes.length === 0 || new Set( routes ).size !== routes.length
			|| routes.some( ( route ) => ! route.startsWith( '/' ) || route.startsWith( '//' ) || /[\s\\]/u.test( route ) ) ) {
			throw new Error( 'A named profile must have nonempty, unique site-relative routes.' );
		}
		environment.NTC_TEST_PATHS = routes.join( ',' );
		environment.NTC_RESPONSIVE_TEST_PATHS = routes.join( ',' );
	}
	// Explicitly retain both appearances even when an earlier shell run selected one.
	environment.NTC_RESPONSIVE_SCHEMES = 'light,dark';
	const args = [ 'test', '--config=playwright.config.mjs', ...files, `--workers=${ options.workers }` ];
	if ( projects ) {
		args.push( ...projects.map( ( project ) => `--project=${ project }` ) );
	}
	if ( options.list ) { args.push( '--list' ); }
	if ( options.headed ) { args.push( '--headed' ); }
	return { ...options, args, environment, files, projects, routes };
}
