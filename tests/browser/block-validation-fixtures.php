<?php
/**
 * Export packaged markup and installed WordPress JavaScript for offline tests.
 *
 * English gettext and URL shims render patterns without loading wp-config.php
 * or wp-load.php. This CLI-only adapter does not connect to a database or read
 * credentials. Installed WordPress JavaScript validates the blocks.
 *
 * @package NTC_Block
 */

declare(strict_types=1);

if ( 'cli' !== PHP_SAPI ) {
	http_response_code( 404 );
	exit;
}

/** Escape fixture text and machine identifiers. */
function esc_html( string $text ): string {
	return htmlspecialchars( $text, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8' );
}

/** Escape fixture attribute values. */
function esc_attr( string $text ): string {
	return esc_html( $text );
}

/** Print escaped English text without loading translations or the database. */
function esc_html_e( string $text, string $domain ): void {
	echo esc_html( $text );
}

/** Print an escaped English attribute value. */
function esc_attr_e( string $text, string $domain ): void {
	esc_html_e( $text, $domain );
}

/** Return escaped English text; ignore the translation context. */
function esc_html_x( string $text, string $context, string $domain ): string {
	return esc_html( $text );
}

/** Return an escaped English attribute; ignore the translation context. */
function esc_attr_x( string $text, string $context, string $domain ): string {
	return esc_html_x( $text, $context, $domain );
}

/** Build a fixture URL without requesting it. */
function home_url( string $path = '' ): string {
	return 'https://example.test' . '/' . ltrim( $path, '/' );
}

/** Build a theme asset URL that matches saved image attributes. */
function get_theme_file_uri( string $path = '' ): string {
	return home_url( '/wp-content/themes/wordpress-theme-peppermint/' . ltrim( $path, '/' ) );
}

/** Escape trusted fixture URLs only; do not use as a runtime URL sanitizer. */
function esc_url( string $url ): string {
	return esc_attr( $url );
}

/**
 * Add a core package and its dependencies in the installed manifest's order.
 *
 * @param string               $handle         Script handle.
 * @param string               $wordpress_root WordPress root.
 * @param array<string, mixed> $packages       Core package manifest.
 * @param array<string, bool>  $visiting       Cycle detection.
 * @param array<string, string> $scripts       Ordered script paths.
 * @return void
 */
function ntc_validation_add_script( string $handle, string $wordpress_root, array $packages, array &$visiting, array &$scripts ): void {
	if ( isset( $scripts[ $handle ] ) ) {
		return;
	}
	if ( isset( $visiting[ $handle ] ) ) {
		throw new RuntimeException( 'Cyclic WordPress JavaScript dependency: ' . $handle );
	}
	$visiting[ $handle ] = true;
	$package_file       = str_starts_with( $handle, 'wp-' ) ? substr( $handle, 3 ) . '.js' : '';
	$package            = $packages[ $package_file ] ?? null;
	$dependencies       = is_array( $package ) ? ( $package['dependencies'] ?? array() ) : array();

	// Core vendor files do not have package entries. React's UMD companions
	// require React first; other vendors used by these packages are standalone.
	if ( in_array( $handle, array( 'react-dom', 'react-jsx-runtime' ), true ) ) {
		$dependencies = array( 'react' );
	}
	foreach ( $dependencies as $dependency ) {
		ntc_validation_add_script( $dependency, $wordpress_root, $packages, $visiting, $scripts );
	}
	$basename = is_array( $package ) ? substr( $package_file, 0, -3 ) : 'vendor/' . $handle;
	$path     = $wordpress_root . '/wp-includes/js/dist/' . $basename . '.js';
	if ( ! is_readable( $path ) ) {
		$path = $wordpress_root . '/wp-includes/js/dist/' . $basename . '.min.js';
	}
	if ( ! is_readable( $path ) ) {
		throw new RuntimeException( 'Missing installed WordPress JavaScript: ' . $handle );
	}
	$scripts[ $handle ] = $path;
	unset( $visiting[ $handle ] );
}

try {
	$theme_root     = dirname( __DIR__, 2 );
	$wordpress_root = realpath( getenv( 'NTC_WORDPRESS_ROOT' ) ?: dirname( $theme_root, 3 ) );
	if ( false === $wordpress_root || ! is_readable( $wordpress_root . '/wp-includes/assets/script-loader-packages.php' ) ) {
		throw new RuntimeException( 'Set NTC_WORDPRESS_ROOT to an installed WordPress root with editor JavaScript assets.' );
	}
	$packages = require $wordpress_root . '/wp-includes/assets/script-loader-packages.php';
	require $wordpress_root . '/wp-includes/version.php';
	$scripts  = array();
	$visiting = array();
	ntc_validation_add_script( 'wp-block-library', $wordpress_root, $packages, $visiting, $scripts );

	$custom_blocks  = array();
	$custom_scripts = array();
	foreach ( glob( $theme_root . '/blocks/*/block.json' ) ?: array() as $metadata_file ) {
		$metadata = json_decode( file_get_contents( $metadata_file ), true, 512, JSON_THROW_ON_ERROR );
		$custom_blocks[ $metadata['name'] ] = $metadata;
		foreach ( (array) ( $metadata['editorScript'] ?? array() ) as $script_reference ) {
			if ( ! str_starts_with( $script_reference, 'file:' ) ) {
				throw new RuntimeException( 'Validation requires an explicit local editorScript: ' . $metadata['name'] );
			}
			$script_path = realpath( dirname( $metadata_file ) . '/' . substr( $script_reference, 5 ) );
			if ( false === $script_path || ! is_readable( $script_path ) ) {
				throw new RuntimeException( 'Missing local editorScript: ' . $metadata['name'] );
			}
			$asset_path = substr( $script_path, 0, -3 ) . '.asset.php';
			if ( ! is_readable( $asset_path ) ) {
				throw new RuntimeException( 'Missing editorScript dependency manifest: ' . $metadata['name'] );
			}
			$asset = require $asset_path;
			foreach ( $asset['dependencies'] ?? array() as $dependency ) {
				ntc_validation_add_script( $dependency, $wordpress_root, $packages, $visiting, $scripts );
			}
			$custom_scripts[] = $script_path;
		}
	}

	$documents = array();
	foreach ( array( 'templates', 'parts' ) as $directory ) {
		foreach ( glob( $theme_root . '/' . $directory . '/*.html' ) ?: array() as $file ) {
			$documents[ $directory . '/' . basename( $file ) ] = file_get_contents( $file );
		}
	}
	foreach ( glob( $theme_root . '/patterns/*.php' ) ?: array() as $file ) {
		ob_start();
		try {
			include $file;
			$documents[ 'patterns/' . basename( $file ) ] = ob_get_contents();
		} finally {
			ob_end_clean();
		}
	}
	$documents['fixtures/pullquotes.html'] = '<!-- wp:pullquote --><figure class="wp-block-pullquote"><blockquote><p>Simple pullquote.</p><cite>Preview citation</cite></blockquote></figure><!-- /wp:pullquote -->'
		. '<!-- wp:pullquote {"className":"is-style-ntc-win95"} --><figure class="wp-block-pullquote is-style-ntc-win95"><blockquote><p>Windows 95 pullquote.</p><cite>Preview citation</cite></blockquote></figure><!-- /wp:pullquote -->'
		. '<!-- wp:pullquote {"className":"is-style-ntc-retro"} --><figure class="wp-block-pullquote is-style-ntc-retro"><blockquote><p>Retro DSA pullquote.</p><cite>Preview citation</cite></blockquote></figure><!-- /wp:pullquote -->'
		. '<!-- wp:pullquote {"className":"is-style-ntc-macos"} --><figure class="wp-block-pullquote is-style-ntc-macos"><blockquote><p>macOS pullquote.</p><cite>Preview citation</cite></blockquote></figure><!-- /wp:pullquote -->';
	ksort( $documents );

	echo json_encode(
		array(
			'wordpressVersion' => $wp_version,
			'coreScripts'      => $scripts,
			'customBlocks'     => $custom_blocks,
			'customScripts'    => $custom_scripts,
			'documents'        => $documents,
		),
		JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES
	);
} catch ( Throwable $error ) {
	fwrite( STDERR, 'Block validation fixture export failed: ' . $error->getMessage() . PHP_EOL );
	exit( 1 );
}
