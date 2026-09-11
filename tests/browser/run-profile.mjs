import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { buildProfile } from './profile-options.mjs';

try {
	const plan = buildProfile( process.argv.slice( 2 ) );
	const require = createRequire( import.meta.url );
	const cli = require.resolve( '@playwright/test/cli' );
	console.log( `Peppermint ${ plan.profile }${ plan.component ? `: ${ plan.component }` : '' }` );
	console.log( `Projects: ${ plan.projects?.join( ', ' ) || 'all configured projects' }` );
	console.log( `Routes: ${ plan.routes?.join( ', ' ) || 'configured suite defaults' }; Light and Dark.` );
	console.log( 'Inherited route filters cleared. Static and required editor checks run separately.' );
	const result = spawnSync( process.execPath, [ cli, ...plan.args ], {
		cwd: fileURLToPath( new URL( '.', import.meta.url ) ),
		env: plan.environment,
		shell: false,
		stdio: 'inherit'
	} );
	if ( result.error ) { throw result.error; }
	if ( result.signal ) { throw new Error( `Playwright stopped with signal ${ result.signal }.` ); }
	process.exitCode = result.status ?? 1;
} catch ( error ) {
	console.error( error.message );
	process.exitCode = 1;
}
