<?php
/**
 * Seed the preview content that the browser tests expect.
 *
 * Run on a disposable test site: wp eval-file tests/fixtures/seed.php
 * Fixtures are matched by their _peppermint_fixture key, so running it again
 * updates them in place. It also sets pretty permalinks and the front page.
 *
 * @package Peppermint
 */

if ( ! defined( 'WP_CLI' ) || ! WP_CLI ) {
	exit;
}

require_once ABSPATH . 'wp-admin/includes/image.php';

// WP-CLI has no user, so kses would strip the embed iframes an administrator can save.
kses_remove_filters();

// WP-CLI includes this file inside a function, so share the manifest explicitly.
global $peppermint_manifest;
$peppermint_fixture_dir = __DIR__;
$peppermint_manifest    = json_decode( file_get_contents( $peppermint_fixture_dir . '/manifest.json' ), true, 512, JSON_THROW_ON_ERROR );

/**
 * Find a fixture post or attachment by key.
 *
 * @param string $key       Fixture key.
 * @param string $post_type Post type.
 * @return int Post ID, or 0.
 */
function peppermint_fixture_find( string $key, string $post_type ): int {
	$ids = get_posts(
		array(
			'post_type'      => $post_type,
			'post_status'    => 'any',
			'posts_per_page' => 1,
			'fields'         => 'ids',
			'meta_key'       => '_peppermint_fixture',
			'meta_value'     => $key,
		)
	);
	return $ids ? (int) $ids[0] : 0;
}

/**
 * Draw a diagonal gradient PNG, so the repository ships no media files.
 *
 * @param array<string, mixed> $spec Width, height, and from/to RGB colors.
 * @return string PNG bytes.
 */
function peppermint_fixture_png( array $spec ): string {
	$rows = '';
	for ( $y = 0; $y < $spec['height']; $y++ ) {
		$rows .= "\0";
		for ( $x = 0; $x < $spec['width']; $x++ ) {
			$mix = 0.6 * $x / $spec['width'] + 0.4 * $y / $spec['height'];
			foreach ( array( 0, 1, 2 ) as $channel ) {
				$rows .= chr( (int) round( $spec['from'][ $channel ] + ( $spec['to'][ $channel ] - $spec['from'][ $channel ] ) * $mix ) );
			}
		}
	}
	$chunk = static fn( string $type, string $data ): string => pack( 'N', strlen( $data ) ) . $type . $data . pack( 'N', crc32( $type . $data ) );
	return "\x89PNG\r\n\x1a\n"
		. $chunk( 'IHDR', pack( 'NNCCCCC', $spec['width'], $spec['height'], 8, 2, 0, 0, 0 ) )
		. $chunk( 'IDAT', gzcompress( $rows, 9 ) )
		. $chunk( 'IEND', '' );
}

/**
 * Import a fixture image once and return its attachment ID.
 *
 * @param string $file Image name from the manifest's images list.
 * @return int Attachment ID.
 */
function peppermint_fixture_image( string $file ): int {
	global $peppermint_manifest;
	$id = peppermint_fixture_find( 'image:' . $file, 'attachment' );
	if ( $id ) {
		return $id;
	}
	$upload = wp_upload_bits( $file, null, peppermint_fixture_png( $peppermint_manifest['images'][ $file ] ) );
	if ( $upload['error'] ) {
		WP_CLI::error( $upload['error'] );
	}
	$id = wp_insert_attachment(
		array(
			'post_title'     => pathinfo( $file, PATHINFO_FILENAME ),
			'post_mime_type' => wp_check_filetype( $file )['type'],
			'post_status'    => 'inherit',
		),
		$upload['file']
	);
	wp_update_attachment_metadata( $id, wp_generate_attachment_metadata( $id, $upload['file'] ) );
	update_post_meta( $id, '_peppermint_fixture', 'image:' . $file );
	return $id;
}

/**
 * Replace fixture placeholders with this site's URLs and IDs.
 *
 * @param string $markup Fixture markup.
 * @return string
 */
function peppermint_fixture_fill( string $markup ): string {
	return preg_replace_callback(
		'/\{\{(image|image-id|url|page-id|term):([^}]+)\}\}/',
		static function ( array $placeholder ): string {
			switch ( $placeholder[1] ) {
				case 'image':
					return wp_get_attachment_url( peppermint_fixture_image( $placeholder[2] ) );
				case 'image-id':
					return (string) peppermint_fixture_image( $placeholder[2] );
				case 'url':
					return home_url( $placeholder[2] );
				case 'page-id':
					return (string) peppermint_fixture_find( $placeholder[2], 'page' );
				default:
					return (string) get_term_by( 'slug', $placeholder[2], 'category' )->term_id;
			}
		},
		$markup
	);
}

update_option( 'permalink_structure', '/%postname%/' );

foreach ( $peppermint_manifest['categories'] as $peppermint_slug => $peppermint_name ) {
	if ( ! term_exists( $peppermint_slug, 'category' ) ) {
		wp_insert_term( $peppermint_name, 'category', array( 'slug' => $peppermint_slug ) );
	}
}

// Pages first, so children and links resolve to existing parents.
$peppermint_ids = array();
foreach ( $peppermint_manifest['posts'] as $peppermint_item ) {
	$peppermint_file    = $peppermint_fixture_dir . '/content/' . $peppermint_item['key'] . '.html';
	$peppermint_content = file_exists( $peppermint_file )
		? file_get_contents( $peppermint_file )
		: "<!-- wp:paragraph -->\n<p>This theme preview fixture stands in for the {$peppermint_item['title']} page.</p>\n<!-- /wp:paragraph -->";

	$peppermint_post = array(
		'ID'            => peppermint_fixture_find( $peppermint_item['key'], $peppermint_item['type'] ),
		'post_type'     => $peppermint_item['type'],
		'post_name'     => $peppermint_item['slug'],
		'post_title'    => $peppermint_item['title'],
		'post_content'  => peppermint_fixture_fill( $peppermint_content ),
		'post_status'   => 'publish',
		'post_parent'   => isset( $peppermint_item['parent'] ) ? $peppermint_ids[ $peppermint_item['parent'] ] : 0,
		'page_template' => $peppermint_item['template'] ?? '',
		'meta_input'    => array( '_peppermint_fixture' => $peppermint_item['key'] ),
	);
	if ( isset( $peppermint_item['age'] ) ) {
		// Fixed dates keep Query order stable; lower ages are newer.
		$peppermint_post['post_date'] = gmdate( 'Y-m-d H:i:s', strtotime( '2026-01-31 12:00:00' ) - DAY_IN_SECONDS * $peppermint_item['age'] );
	}

	$peppermint_id = wp_insert_post( wp_slash( $peppermint_post ), true );
	if ( is_wp_error( $peppermint_id ) ) {
		WP_CLI::error( $peppermint_item['key'] . ': ' . $peppermint_id->get_error_message() );
	}
	$peppermint_ids[ $peppermint_item['key'] ] = $peppermint_id;

	if ( 'post' === $peppermint_item['type'] ) {
		wp_set_post_terms( $peppermint_id, array_map( static fn( $slug ) => get_term_by( 'slug', $slug, 'category' )->term_id, $peppermint_item['categories'] ?? array() ), 'category' );
		if ( isset( $peppermint_item['image'] ) ) {
			set_post_thumbnail( $peppermint_id, peppermint_fixture_image( $peppermint_item['image'] ) );
		} else {
			delete_post_thumbnail( $peppermint_id );
		}
	}
	WP_CLI::log( sprintf( '%s %s', $peppermint_item['type'], get_permalink( $peppermint_id ) ) );
}

update_option( 'show_on_front', 'page' );
update_option( 'page_on_front', $peppermint_ids[ $peppermint_manifest['frontPage'] ] );

// The header Navigation block has no saved menu, so it falls back to the newest one.
$peppermint_links = '';
foreach ( $peppermint_manifest['navigation']['links'] as $peppermint_path ) {
	$peppermint_page   = get_page_by_path( trim( $peppermint_path, '/' ) );
	$peppermint_links .= sprintf(
		'<!-- wp:navigation-link {"label":"%s","type":"page","id":%d,"url":"%s","kind":"post-type"} /-->',
		esc_attr( $peppermint_page->post_title ),
		$peppermint_page->ID,
		esc_url( home_url( $peppermint_path ) )
	);
}
wp_insert_post(
	array(
		'ID'           => peppermint_fixture_find( 'navigation', 'wp_navigation' ),
		'post_type'    => 'wp_navigation',
		'post_title'   => $peppermint_manifest['navigation']['title'],
		'post_content' => $peppermint_links,
		'post_status'  => 'publish',
		'meta_input'   => array( '_peppermint_fixture' => 'navigation' ),
	)
);

flush_rewrite_rules();
WP_CLI::success( sprintf( 'Seeded %d fixtures.', count( $peppermint_ids ) ) );
