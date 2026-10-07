<?php
/**
 * Theme setup for NTC Block.
 *
 * @package NTC_Block
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Register translations, editor styles, and flexible logo support.
 */
function ntc_block_setup(): void {
	load_theme_textdomain( 'ntc-block', get_template_directory() . '/languages' );

	add_theme_support( 'editor-styles' );
	add_editor_style( 'style.css' );
	add_theme_support(
		'custom-logo',
		array(
			'height'      => 180,
			'width'       => 180,
			'flex-height' => true,
			'flex-width'  => true,
		)
	);
}
add_action( 'after_setup_theme', 'ntc_block_setup' );

/**
 * Load the front-end stylesheet after global block styles.
 */
function ntc_block_enqueue_styles(): void {
	wp_enqueue_style(
		'ntc-block',
		get_stylesheet_uri(),
		array(),
		(string) filemtime( get_stylesheet_directory() . '/style.css' )
	);
}
add_action( 'wp_enqueue_scripts', 'ntc_block_enqueue_styles' );

/**
 * Apply the visitor's saved appearance before the browser paints the page.
 *
 * Load the script in the document head to avoid an appearance flash.
 * Without JavaScript, CSS still applies the site or system default.
 */
function ntc_block_enqueue_theme_switcher(): void {
	$script_path = get_theme_file_path( 'assets/js/theme-switcher.js' );

	if ( ! is_readable( $script_path ) ) {
		return;
	}

	wp_enqueue_script(
		'ntc-block-theme-switcher',
		get_theme_file_uri( 'assets/js/theme-switcher.js' ),
		array(),
		(string) filemtime( $script_path ),
		false
	);
}
add_action( 'wp_enqueue_scripts', 'ntc_block_enqueue_theme_switcher' );

/**
 * Keep light/dark palette indicators legible in the Site Editor UI.
 */
function ntc_block_enqueue_editor_assets(): void {
	$style_path = get_theme_file_path( 'assets/css/editor.css' );

	if ( ! is_readable( $style_path ) ) {
		return;
	}

	wp_enqueue_style(
		'ntc-block-editor',
		get_theme_file_uri( 'assets/css/editor.css' ),
		array(),
		(string) filemtime( $style_path )
	);
}
add_action( 'enqueue_block_editor_assets', 'ntc_block_enqueue_editor_assets' );

/**
 * Show each framed Cover's first heading in its editor title bar.
 */
function ntc_block_enqueue_window_titles(): void {
	$script_path = get_theme_file_path( 'assets/js/window-titles.js' );

	if ( ! is_readable( $script_path ) ) {
		return;
	}

	wp_enqueue_script(
		'ntc-block-window-titles',
		get_theme_file_uri( 'assets/js/window-titles.js' ),
		array( 'wp-block-editor', 'wp-compose', 'wp-data', 'wp-element', 'wp-hooks', 'wp-rich-text' ),
		(string) filemtime( $script_path ),
		true
	);
}
add_action( 'enqueue_block_editor_assets', 'ntc_block_enqueue_window_titles' );

/**
 * Show a framed Cover's first heading in its title bar.
 *
 * The Windows 95, Retro DSA, and macOS frames draw their title bar in CSS.
 * This filter copies the text of the Cover's first Heading block into an
 * attribute that the CSS displays. The saved markup does not change.
 * assets/js/window-titles.js applies the same rule in the editor.
 *
 * @param string $block_content Rendered Cover markup.
 * @return string Cover markup with a data-ntc-window-title attribute when the Cover has a heading.
 */
function ntc_block_add_window_title( string $block_content ): string {
	$cover = new WP_HTML_Tag_Processor( $block_content );
	if ( ! $cover->next_tag()
		|| ! ( $cover->has_class( 'is-style-ntc-win95' ) || $cover->has_class( 'is-style-ntc-retro' ) || $cover->has_class( 'is-style-ntc-macos' ) )
	) {
		return $block_content;
	}

	$heading = new WP_HTML_Tag_Processor( $block_content );
	$level   = '';
	$title   = '';
	while ( $heading->next_token() ) {
		$token = $heading->get_token_name();
		if ( '' === $level ) {
			if ( preg_match( '/^H[1-6]$/', (string) $token ) && $heading->has_class( 'wp-block-heading' ) ) {
				$level = $token;
			}
		} elseif ( '#text' === $token ) {
			$title .= $heading->get_modifiable_text();
		} elseif ( 'BR' === $token ) {
			$title .= ' ';
		} elseif ( $level === $token && $heading->is_tag_closer() ) {
			break;
		}
	}

	$title = trim( (string) preg_replace( '/\s+/u', ' ', $title ) );
	if ( '' === $title ) {
		return $block_content;
	}

	$cover->set_attribute( 'data-ntc-window-title', $title );
	return $cover->get_updated_html();
}
add_filter( 'render_block_core/cover', 'ntc_block_add_window_title' );

/**
 * Register the dynamic appearance control used by the header template part.
 */
function ntc_block_register_blocks(): void {
	$block_path = get_theme_file_path( 'blocks/theme-switcher' );

	if ( is_readable( $block_path . '/block.json' ) ) {
		register_block_type( $block_path );
	}
}
add_action( 'init', 'ntc_block_register_blocks' );

/**
 * Register styles for core blocks.
 *
 * Core block styles retain WordPress content and editing controls.
 * Section styles register separately from the JSON files in /styles.
 */
function ntc_block_register_block_styles(): void {
	foreach ( array( 'core/image', 'core/post-featured-image' ) as $media_block ) {
		register_block_style(
			$media_block,
			array(
				'name'  => 'ntc-contained-media',
				'label' => __( 'Contained artwork (no upscale)', 'ntc-block' ),
			)
		);
	}

	register_block_style(
		'core/cover',
		array(
			'name'  => 'ntc-red-tile',
			'label' => __( 'NTC Red Tile', 'ntc-block' ),
		)
	);

	register_block_style(
		'core/cover',
		array(
			'name'  => 'ntc-win95',
			'label' => __( 'Windows 95 Frame', 'ntc-block' ),
		)
	);

	register_block_style(
		'core/pullquote',
		array(
			'name'       => 'ntc-simple',
			'label'      => __( 'Simple Surface', 'ntc-block' ),
			'is_default' => true,
		)
	);

	register_block_style(
		'core/pullquote',
		array(
			'name'  => 'ntc-win95',
			'label' => __( 'Windows 95 Frame', 'ntc-block' ),
		)
	);

	register_block_style(
		'core/pullquote',
		array(
			'name'  => 'ntc-retro',
			'label' => __( 'Retro DSA Frame', 'ntc-block' ),
		)
	);

	register_block_style(
		'core/pullquote',
		array(
			'name'  => 'ntc-macos',
			'label' => __( 'macOS Frame', 'ntc-block' ),
		)
	);

	register_block_style(
		'core/cover',
		array(
			'name'  => 'ntc-retro',
			'label' => __( 'Retro DSA Frame', 'ntc-block' ),
		)
	);

	register_block_style(
		'core/cover',
		array(
			'name'  => 'ntc-macos',
			'label' => __( 'macOS Frame', 'ntc-block' ),
		)
	);

	register_block_style(
		'core/group',
		array(
			'name'  => 'ntc-media-action-card',
			'label' => __( 'Image + Button Card', 'ntc-block' ),
		)
	);

	register_block_style(
		'core/group',
		array(
			'name'  => 'ntc-signal-hero',
			'label' => __( 'Signal Hero', 'ntc-block' ),
		)
	);

	foreach ( array( 'core/heading', 'core/paragraph' ) as $block_name ) {
		register_block_style(
			$block_name,
			array(
				'name'  => 'ntc-signal-rail',
				'label' => __( 'Signal Rail', 'ntc-block' ),
			)
		);
	}

	$board_styles = array(
		'ntc-board-cork'      => __( 'Corkboard', 'ntc-block' ),
		'ntc-board-dsa'       => __( 'DSA Noticeboard', 'ntc-block' ),
		'ntc-board-technical' => __( 'Windows 95 Desktop', 'ntc-block' ),
	);
	foreach ( $board_styles as $name => $label ) {
		register_block_style(
			'core/group',
			array(
				'name'  => $name,
				'label' => $label,
			)
		);
	}
}
add_action( 'init', 'ntc_block_register_block_styles' );

/**
 * Load block-specific CSS when WordPress renders the associated core block.
 */
function ntc_block_enqueue_block_styles(): void {
	$block_styles = array(
		'core/group'         => array(
			'file'   => 'assets/css/blocks/skills-board.css',
			'handle' => 'ntc-block-skills-board',
		),
		'core/cover'         => array(
			'file'   => 'assets/css/blocks/cover.css',
			'handle' => 'ntc-block-cover',
		),
		'core/query'         => array(
			'file'   => 'assets/css/blocks/query.css',
			'handle' => 'ntc-block-query',
		),
		'core/post-template' => array(
			'file'   => 'assets/css/blocks/query.css',
			'handle' => 'ntc-block-query',
		),
		'core/pullquote'     => array(
			'file'   => 'assets/css/blocks/pullquote.css',
			'handle' => 'ntc-block-pullquote',
		),
	);

	foreach ( $block_styles as $block_name => $stylesheet ) {
		$style_path = get_theme_file_path( $stylesheet['file'] );

		if ( ! is_readable( $style_path ) ) {
			continue;
		}

		wp_enqueue_block_style(
			$block_name,
			array(
				'handle' => $stylesheet['handle'],
				'path'   => $style_path,
				'src'    => get_theme_file_uri( $stylesheet['file'] ),
				'ver'    => (string) filemtime( $style_path ),
			)
		);
	}
}
add_action( 'init', 'ntc_block_enqueue_block_styles', 20 );
