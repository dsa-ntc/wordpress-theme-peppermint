<?php
/**
 * Compare two Peppermint theme source trees without modifying either tree.
 *
 * Usage: php compare-theme-trees.php <active-theme-root> <git-mirror-root>
 */

declare(strict_types=1);

if ( 3 !== $argc ) {
	fwrite( STDERR, "Usage: php compare-theme-trees.php <active-theme-root> <git-mirror-root>\n" );
	exit( 2 );
}

$left_root  = realpath( $argv[1] );
$right_root = realpath( $argv[2] );

if ( false === $left_root || ! is_dir( $left_root ) ) {
	fwrite( STDERR, "The active theme root does not exist.\n" );
	exit( 2 );
}

if ( false === $right_root || ! is_dir( $right_root ) ) {
	fwrite( STDERR, "The Git mirror root does not exist.\n" );
	exit( 2 );
}

if ( $left_root === $right_root ) {
	fwrite( STDERR, "Provide two different theme roots.\n" );
	exit( 2 );
}

/**
 * Decide whether a relative path is generated or machine-local.
 *
 * @param string $relative Forward-slash relative path.
 * @return bool
 */
function peppermint_skill_is_excluded( string $relative ): bool {
	$segments = explode( '/', $relative );
	$ignored_directories = array(
		'.git', '.local',
		'vendor',
		'node_modules',
		'artifacts',
		'playwright-report',
		'test-results',
	);

	foreach ( $segments as $segment ) {
		if ( in_array( $segment, $ignored_directories, true ) ) {
			return true;
		}
	}

	$basename = basename( $relative );
	if ( in_array( $basename, array( '.phpcs-cache', '.phpunit.result.cache', '.DS_Store', 'Thumbs.db', 'debug.log' ), true ) ) {
		return true;
	}

	return str_ends_with( strtolower( $relative ), '.log' ) || str_ends_with( strtolower( $relative ), '.zip' ) || str_ends_with( strtolower( $relative ), '.tar.gz' );
}

/**
 * Collect SHA-256 hashes keyed by normalized relative path.
 *
 * @param string $root Absolute source root.
 * @return array<string, string>
 */
function peppermint_skill_collect_hashes( string $root ): array {
	$hashes   = array();
	$iterator = new RecursiveIteratorIterator(
		new RecursiveCallbackFilterIterator(
			new RecursiveDirectoryIterator( $root, FilesystemIterator::SKIP_DOTS ),
			static function ( SplFileInfo $file ) use ( $root ): bool {
				// Reject before descent: ignored reports may disappear during a run.
				// Never follow linked files/directories outside the intended tree.
				$relative = str_replace( '\\', '/', substr( $file->getPathname(), strlen( $root ) + 1 ) );
				return ! $file->isLink() && ! peppermint_skill_is_excluded( $relative );
			}
		)
	);

	foreach ( $iterator as $file ) {
		if ( ! $file->isFile() || $file->isLink() ) {
			continue;
		}

		$absolute = $file->getPathname();
		$relative = str_replace( '\\', '/', substr( $absolute, strlen( $root ) + 1 ) );
		if ( peppermint_skill_is_excluded( $relative ) ) {
			continue;
		}

		$hash = hash_file( 'sha256', $absolute );
		if ( false === $hash ) {
			fwrite( STDERR, "Unable to hash: {$absolute}\n" );
			exit( 2 );
		}

		$hashes[ $relative ] = $hash;
	}

	ksort( $hashes );
	return $hashes;
}

$left_hashes  = peppermint_skill_collect_hashes( $left_root );
$right_hashes = peppermint_skill_collect_hashes( $right_root );
$paths        = array_unique( array_merge( array_keys( $left_hashes ), array_keys( $right_hashes ) ) );
sort( $paths );

$differences = array();
foreach ( $paths as $path ) {
	if ( ! isset( $left_hashes[ $path ] ) ) {
		$differences[] = "ONLY GIT MIRROR: {$path}";
		continue;
	}

	if ( ! isset( $right_hashes[ $path ] ) ) {
		$differences[] = "ONLY ACTIVE THEME: {$path}";
		continue;
	}

	if ( $left_hashes[ $path ] !== $right_hashes[ $path ] ) {
		$differences[] = "CONTENT DIFFERS: {$path}";
	}
}

if ( array() !== $differences ) {
	echo "Theme trees differ:\n";
	foreach ( $differences as $difference ) {
		echo "- {$difference}\n";
	}
	echo sprintf( "\n%d difference(s). No files were changed.\n", count( $differences ) );
	exit( 1 );
}

echo sprintf( "Theme trees match: %d intended source files have identical SHA-256 hashes.\n", count( $left_hashes ) );
exit( 0 );
