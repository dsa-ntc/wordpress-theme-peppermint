import { copyFileSync, existsSync, lstatSync, mkdirSync, readlinkSync, realpathSync, renameSync, symlinkSync } from 'node:fs';
import { dirname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const source = dirname( fileURLToPath( import.meta.url ) );
const local = resolve( source, '../../.local/browser' );
const dependencies = resolve( local, 'node_modules' );
const link = resolve( source, 'node_modules' );

if ( ! process.env.npm_execpath ) {
	throw new Error( 'Run npm --prefix tests/browser run setup.' );
}

mkdirSync( local, { recursive: true } );
const theme = realpathSync( resolve( source, '../..' ) );
if ( ! realpathSync( local ).startsWith( theme + sep ) ) {
	throw new Error( 'The local dependency folder must remain inside the theme.' );
}
const entry = lstatSync( link, { throwIfNoEntry: false } );
if ( entry ) {
	if ( entry.isSymbolicLink() ) {
		if ( resolve( source, readlinkSync( link ) ) !== dependencies ) {
			throw new Error( 'The browser dependency link points somewhere else.' );
		}
	} else {
		if ( existsSync( dependencies ) ) {
			throw new Error( 'Both dependency folders exist. Resolve them before setup.' );
		}
		renameSync( link, dependencies );
	}
}

// npm installs from copies so generated files stay inside .local.
for ( const name of [ 'package.json', 'package-lock.json' ] ) {
	copyFileSync( resolve( source, name ), resolve( local, name ) );
}
const result = spawnSync( process.execPath, [ process.env.npm_execpath, 'ci', '--prefix', local ], {
	stdio: 'inherit',
	windowsHide: true
} );
if ( result.error ) { throw result.error; }
if ( result.status !== 0 ) { process.exit( result.status || 1 ); }
if ( ! existsSync( link ) ) {
	symlinkSync( dependencies, link, process.platform === 'win32' ? 'junction' : 'dir' );
}
console.log( 'Browser dependencies are installed in .local/browser/node_modules.' );
