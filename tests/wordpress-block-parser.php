<?php
/**
 * Minimal loader for the WordPress block parser and serializer.
 *
 * Load only the files needed for block round trips. Avoid wp-load.php,
 * which requires a live database connection.
 *
 * @package NTC_Block
 */

declare(strict_types=1);

if ( ! function_exists( 'wp_json_encode' ) ) {
	/**
	 * Supply the JSON wrapper required by serialize_blocks().
	 *
	 * The suite has already validated block-attribute JSON. Native encoding
	 * therefore suffices without core's second-pass sanity check.
	 *
	 * @param mixed $value Value to encode.
	 * @param int   $flags JSON encoding flags.
	 * @param int   $depth Maximum nesting depth.
	 * @return string|false
	 */
	function wp_json_encode( $value, $flags = 0, $depth = 512 ) { // phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedFunctionFound -- Required core shim.
		return json_encode( $value, $flags, $depth );
	}
}

/**
 * Load WordPress' parser and serializer without bootstrapping the database.
 *
 * @param string $wordpress_root Absolute WordPress installation path.
 * @return string Empty on success, otherwise a human-readable reason.
 */
function ntc_block_tests_load_wordpress_block_parser( string $wordpress_root ): string {
	$includes_dir = rtrim( $wordpress_root, '/\\' ) . DIRECTORY_SEPARATOR . 'wp-includes';
	$parser_file  = $includes_dir . DIRECTORY_SEPARATOR . 'class-wp-block-parser.php';
	$blocks_file  = $includes_dir . DIRECTORY_SEPARATOR . 'blocks.php';

	if ( ! is_readable( $parser_file ) || ! is_readable( $blocks_file ) ) {
		return 'wp-includes/class-wp-block-parser.php and wp-includes/blocks.php were not found';
	}

	if ( ! class_exists( 'WP_Block_Parser', false ) ) {
		require_once $parser_file;
	}

	if ( ! function_exists( 'serialize_blocks' ) ) {
		require_once $blocks_file;
	}

	if ( ! class_exists( 'WP_Block_Parser', false ) || ! function_exists( 'serialize_blocks' ) ) {
		return 'WordPress block parser APIs could not be loaded';
	}

	return '';
}
