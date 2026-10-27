<?php
/**
 * Theme setup for Peppermint.
 *
 * @package Peppermint
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Register translations, editor styles, and flexible logo support.
 */
function peppermint_setup(): void {
	load_theme_textdomain( 'peppermint', get_template_directory() . '/languages' );

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
add_action( 'after_setup_theme', 'peppermint_setup' );

/**
 * Load the front-end stylesheet after global block styles.
 */
function peppermint_enqueue_styles(): void {
	wp_enqueue_style(
		'peppermint',
		get_stylesheet_uri(),
		array(),
		(string) filemtime( get_stylesheet_directory() . '/style.css' )
	);
}
add_action( 'wp_enqueue_scripts', 'peppermint_enqueue_styles' );

/**
 * Style Action Network form embeds to match the site.
 *
 * Loads only on pages that render an Action Network widget. Any block can hold one,
 * including classic content, so every rendered block is checked until one is found.
 *
 * @param string $block_content Rendered block.
 * @return string Unchanged block content.
 */
function peppermint_enqueue_action_network_styles( string $block_content ): string {
	if ( wp_style_is( 'peppermint-action-network' ) || ! str_contains( $block_content, 'actionnetwork.org/widgets/' ) ) {
		return $block_content;
	}

	wp_enqueue_style(
		'peppermint-action-network',
		get_theme_file_uri( 'assets/css/action-network.css' ),
		array( 'peppermint' ),
		(string) filemtime( get_theme_file_path( 'assets/css/action-network.css' ) )
	);
	wp_add_inline_style( 'peppermint-action-network', wp_strip_all_tags( peppermint_action_network_global_styles() ) );

	return $block_content;
}
add_filter( 'render_block', 'peppermint_enqueue_action_network_styles' );

/**
 * Apply the site's Global Styles for headings, links, and buttons to Action Network forms.
 *
 * @return string CSS rules.
 */
function peppermint_action_network_global_styles(): string {
	$styles = peppermint_without_style_refs( wp_get_global_styles() );
	$scope  = '.can_embed #can_embed_form';
	$css    = '';

	$heading = $styles['elements']['heading'] ?? array();
	foreach ( array( 'h1', 'h2', 'h3', 'h4', 'h5', 'h6' ) as $level ) {
		$css .= peppermint_style_rules( "{$scope} {$level}", array_replace_recursive( $heading, $styles['elements'][ $level ] ?? array() ) );
	}

	$css .= peppermint_style_rules( "{$scope} a", $styles['elements']['link'] ?? array() );

	// The Button block adds its own states on top of the button element styles.
	$button = array_replace_recursive( $styles['elements']['button'] ?? array(), $styles['blocks']['core/button'] ?? array() );
	$css   .= peppermint_style_rules( "{$scope} input[type=\"submit\"], {$scope} button[type=\"submit\"]", $button );

	return $css;
}

/**
 * Compile Global Styles and their interactive states into CSS for a selector list.
 *
 * @param string $selector Comma-separated selector list.
 * @param array  $style    Global Styles for one element or block.
 * @return string CSS rules.
 */
function peppermint_style_rules( string $selector, array $style ): string {
	$css = '';

	foreach ( array( '', ':hover', ':focus', ':focus-visible', ':active' ) as $state ) {
		$rules = '' === $state ? $style : ( $style[ $state ] ?? array() );
		if ( ! is_array( $rules ) ) {
			continue;
		}

		$rules = array_filter(
			$rules,
			static fn( $key ): bool => ! str_starts_with( (string) $key, ':' ),
			ARRAY_FILTER_USE_KEY
		);
		if ( ! $rules ) {
			continue;
		}

		$selectors = implode( ', ', array_map( static fn( string $part ): string => trim( $part ) . $state, explode( ',', $selector ) ) );
		$compiled  = wp_style_engine_get_styles( $rules, array( 'selector' => $selectors ) );
		$css      .= $compiled['css'] ?? '';
	}

	return $css;
}

/**
 * Remove Global Styles values that point at other values, which the style engine cannot compile.
 *
 * The Site Editor does not create these references; theme authors can.
 *
 * @param array $styles Global Styles.
 * @return array Global Styles without references.
 */
function peppermint_without_style_refs( array $styles ): array {
	foreach ( $styles as $key => $value ) {
		if ( ! is_array( $value ) ) {
			continue;
		}
		if ( isset( $value['ref'] ) ) {
			unset( $styles[ $key ] );
			continue;
		}
		$styles[ $key ] = peppermint_without_style_refs( $value );
	}

	return $styles;
}

/**
 * Apply the visitor's saved appearance before the browser paints the page.
 *
 * Load the script in the document head to avoid an appearance flash.
 * Without JavaScript, CSS still applies the site or system default.
 */
function peppermint_enqueue_theme_switcher(): void {
	$script_path = get_theme_file_path( 'assets/js/theme-switcher.js' );

	if ( ! is_readable( $script_path ) ) {
		return;
	}

	wp_enqueue_script(
		'peppermint-theme-switcher',
		get_theme_file_uri( 'assets/js/theme-switcher.js' ),
		array(),
		(string) filemtime( $script_path ),
		false
	);
}
add_action( 'wp_enqueue_scripts', 'peppermint_enqueue_theme_switcher' );

/**
 * Keep light/dark palette indicators legible in the Site Editor UI.
 */
function peppermint_enqueue_editor_assets(): void {
	$style_path = get_theme_file_path( 'assets/css/editor.css' );

	if ( ! is_readable( $style_path ) ) {
		return;
	}

	wp_enqueue_style(
		'peppermint-editor',
		get_theme_file_uri( 'assets/css/editor.css' ),
		array(),
		(string) filemtime( $style_path )
	);
}
add_action( 'enqueue_block_editor_assets', 'peppermint_enqueue_editor_assets' );

/**
 * Show each framed Cover's first heading in its editor title bar.
 */
function peppermint_enqueue_window_titles(): void {
	$script_path = get_theme_file_path( 'assets/js/window-titles.js' );

	if ( ! is_readable( $script_path ) ) {
		return;
	}

	wp_enqueue_script(
		'peppermint-window-titles',
		get_theme_file_uri( 'assets/js/window-titles.js' ),
		array( 'wp-block-editor', 'wp-compose', 'wp-data', 'wp-element', 'wp-hooks', 'wp-rich-text' ),
		(string) filemtime( $script_path ),
		true
	);
}
add_action( 'enqueue_block_editor_assets', 'peppermint_enqueue_window_titles' );

/**
 * Show a framed Cover's first heading in its title bar.
 *
 * The Windows 95, Retro DSA, and macOS frames draw their title bar in CSS.
 * This filter copies the text of the Cover's first Heading block into an
 * attribute that the CSS displays. The saved markup does not change.
 * assets/js/window-titles.js applies the same rule in the editor.
 *
 * @param string $block_content Rendered Cover markup.
 * @return string Cover markup with a data-peppermint-window-title attribute when the Cover has a heading.
 */
function peppermint_add_window_title( string $block_content ): string {
	$cover = new WP_HTML_Tag_Processor( $block_content );
	if ( ! $cover->next_tag()
		|| ! ( $cover->has_class( 'is-style-peppermint-win95' ) || $cover->has_class( 'is-style-peppermint-retro' ) || $cover->has_class( 'is-style-peppermint-macos' ) )
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

	$cover->set_attribute( 'data-peppermint-window-title', $title );
	return $cover->get_updated_html();
}
add_filter( 'render_block_core/cover', 'peppermint_add_window_title' );

/**
 * Register the dynamic appearance control used by the header template part.
 */
function peppermint_register_blocks(): void {
	$block_path = get_theme_file_path( 'blocks/theme-switcher' );

	if ( is_readable( $block_path . '/block.json' ) ) {
		register_block_type( $block_path );
	}
}
add_action( 'init', 'peppermint_register_blocks' );

/**
 * Register styles for core blocks.
 *
 * Core block styles retain WordPress content and editing controls.
 * Section styles register separately from the JSON files in /styles.
 */
function peppermint_register_block_styles(): void {
	foreach ( array( 'core/image', 'core/post-featured-image' ) as $media_block ) {
		register_block_style(
			$media_block,
			array(
				'name'  => 'peppermint-contained-media',
				'label' => __( 'Contained artwork (no upscale)', 'peppermint' ),
			)
		);
	}

	register_block_style(
		'core/cover',
		array(
			'name'  => 'peppermint-red-tile',
			'label' => __( 'Red Tile', 'peppermint' ),
		)
	);

	register_block_style(
		'core/cover',
		array(
			'name'  => 'peppermint-win95',
			'label' => __( 'Windows 95 Frame', 'peppermint' ),
		)
	);

	register_block_style(
		'core/pullquote',
		array(
			'name'       => 'peppermint-simple',
			'label'      => __( 'Simple Surface', 'peppermint' ),
			'is_default' => true,
		)
	);

	register_block_style(
		'core/pullquote',
		array(
			'name'  => 'peppermint-win95',
			'label' => __( 'Windows 95 Frame', 'peppermint' ),
		)
	);

	register_block_style(
		'core/pullquote',
		array(
			'name'  => 'peppermint-retro',
			'label' => __( 'Retro DSA Frame', 'peppermint' ),
		)
	);

	register_block_style(
		'core/pullquote',
		array(
			'name'  => 'peppermint-macos',
			'label' => __( 'macOS Frame', 'peppermint' ),
		)
	);

	register_block_style(
		'core/cover',
		array(
			'name'  => 'peppermint-retro',
			'label' => __( 'Retro DSA Frame', 'peppermint' ),
		)
	);

	register_block_style(
		'core/cover',
		array(
			'name'  => 'peppermint-macos',
			'label' => __( 'macOS Frame', 'peppermint' ),
		)
	);

	register_block_style(
		'core/group',
		array(
			'name'  => 'peppermint-media-action-card',
			'label' => __( 'Image + Button Card', 'peppermint' ),
		)
	);

	register_block_style(
		'core/group',
		array(
			'name'  => 'peppermint-signal-hero',
			'label' => __( 'Signal Hero', 'peppermint' ),
		)
	);

	foreach ( array( 'core/heading', 'core/paragraph' ) as $block_name ) {
		register_block_style(
			$block_name,
			array(
				'name'  => 'peppermint-signal-rail',
				'label' => __( 'Signal Rail', 'peppermint' ),
			)
		);
	}

	$board_styles = array(
		'peppermint-board-cork'      => __( 'Corkboard', 'peppermint' ),
		'peppermint-board-dsa'       => __( 'DSA Noticeboard', 'peppermint' ),
		'peppermint-board-technical' => __( 'Windows 95 Desktop', 'peppermint' ),
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

	// Printed-paper surfaces work over any background color a site picks.
	$paper_styles = array(
		'peppermint-paper'       => __( 'Paper', 'peppermint' ),
		'peppermint-paper-heavy' => __( 'Crumpled paper', 'peppermint' ),
		'peppermint-paper-torn'  => __( 'Paper, torn edge', 'peppermint' ),
	);
	foreach ( array( 'core/group', 'core/cover', 'core/columns' ) as $block_name ) {
		foreach ( $paper_styles as $name => $label ) {
			register_block_style(
				$block_name,
				array(
					'name'  => $name,
					'label' => $label,
				)
			);
		}
	}

	register_block_style(
		'core/heading',
		array(
			'name'  => 'peppermint-paper-strip',
			'label' => __( 'Torn paper strip', 'peppermint' ),
		)
	);

	register_block_style(
		'core/button',
		array(
			'name'  => 'peppermint-paper-torn',
			'label' => __( 'Torn paper', 'peppermint' ),
		)
	);

	register_block_style(
		'core/button',
		array(
			'name'  => 'peppermint-paper-layered',
			'label' => __( 'Torn paper, layered', 'peppermint' ),
		)
	);
}
add_action( 'init', 'peppermint_register_block_styles' );

/**
 * Load block-specific CSS when WordPress renders the associated core block.
 */
function peppermint_enqueue_block_styles(): void {
	$block_styles = array(
		'core/group'         => array(
			'file'   => 'assets/css/blocks/skills-board.css',
			'handle' => 'peppermint-skills-board',
		),
		'core/cover'         => array(
			'file'   => 'assets/css/blocks/cover.css',
			'handle' => 'peppermint-cover',
		),
		'core/query'         => array(
			'file'   => 'assets/css/blocks/query.css',
			'handle' => 'peppermint-query',
		),
		'core/post-template' => array(
			'file'   => 'assets/css/blocks/query.css',
			'handle' => 'peppermint-query',
		),
		'core/pullquote'     => array(
			'file'   => 'assets/css/blocks/pullquote.css',
			'handle' => 'peppermint-pullquote',
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
add_action( 'init', 'peppermint_enqueue_block_styles', 20 );
