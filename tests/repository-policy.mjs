import { execFileSync } from 'node:child_process';

// Check the index so ignored files already tracked by Git cannot slip through.
const files = execFileSync( 'git', [ 'ls-files', '-z' ], { encoding: 'utf8' } ).split( '\0' ).filter( Boolean );
const forbidden = files.filter( file =>
	( /\.md$/i.test( file ) && ! [ 'AGENTS.md', 'readme.md' ].includes( file ) ) ||
	/(^|\/)(?:\.local|\.agents|\.codex|node_modules|vendor|artifacts|test-results|playwright-report|migration|uploads)(\/|$)/.test( file ) ||
	/(^|\/)\.env[^/]*$|\.(?:log|zip|sql|pem|key)$|\.tar\.gz$/i.test( file ) ||
	/^assets\/(?:fonts|images|icons)\//.test( file )
);
if ( forbidden.length ) {
	console.error( 'Remove these local or generated files from Git:\n' + forbidden.join( '\n' ) );
	process.exitCode = 1;
} else {
	console.log( `Repository policy passed for ${ files.length } tracked files.` );
}
